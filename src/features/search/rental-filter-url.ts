"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { SearchScope } from "@/contracts/preview";
import {
  type CurfewType,
  DEFAULT_RENTAL_FILTERS,
  type PropertyType,
  type RentalFilters,
  type TenantPolicy,
} from "@/contracts/rental-filters";

export const INITIAL_SCOPE: SearchScope = {
  mode: "map-radius",
  center: [123.907, 10.328],
  radiusMeters: 2000,
  label: "Lahug, Cebu City",
};

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("preview-navigation", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("preview-navigation", listener);
  };
}

/**
 * Parse URL search string into canonical RentalFilters and SearchScope.
 * Follows Section 32 of ABANGCEBU_AI_AGENT_REAL_RENTAL_FILTERS_SPEC.md.
 */
export function readRentalQuery(search: string): {
  scope: SearchScope;
  filters: RentalFilters;
  rentalId: string | null;
  invalid: boolean;
} {
  const params = new URLSearchParams(search);
  let scope: SearchScope = INITIAL_SCOPE;
  let invalid = false;

  const number = (key: string) => {
    if (!params.has(key) || params.get(key) === "") return null;
    const val = Number(params.get(key));
    return Number.isFinite(val) ? val : null;
  };

  const boolean = (key: string) => {
    if (!params.has(key)) return null;
    const val = params.get(key);
    return val === "1" || val === "true";
  };

  // Scope parsing
  const mode = params.get("scope");
  if (mode) {
    const label = params.get("place")?.slice(0, 80) || "Shared map area";
    if (mode === "viewport") {
      const west = number("west");
      const south = number("south");
      const east = number("east");
      const north = number("north");
      if (
        west !== null &&
        south !== null &&
        east !== null &&
        north !== null &&
        west >= -180 &&
        east <= 180 &&
        south >= -85 &&
        north <= 85 &&
        west < east &&
        south < north
      ) {
        scope = { mode, bounds: { west, south, east, north }, label };
      } else {
        invalid = true;
      }
    } else if (mode === "map-radius" || mode === "place-radius") {
      const lng = number("lng");
      const lat = number("lat");
      const radiusMeters = number("radius");
      if (
        lng !== null &&
        lat !== null &&
        radiusMeters !== null &&
        Math.abs(lng) <= 180 &&
        Math.abs(lat) <= 85 &&
        radiusMeters >= 100 &&
        radiusMeters <= 10000
      ) {
        scope = { mode, center: [lng, lat], radiusMeters, label };
      } else {
        invalid = true;
      }
    } else {
      invalid = true;
    }
  }

  // Budget
  const minPrice = number("minPrice");
  const maxPrice = number("maxPrice") ?? number("max");

  // Property types (comma separated)
  const rawType = params.get("type");
  let propertyTypes: PropertyType[] = [];
  if (rawType && rawType !== "all") {
    const splitTypes = rawType.split(",").map((t) => {
      if (t === "room") return "private_room";
      if (t === "boarding-house") return "boarding_house";
      return t;
    });
    const validTypes: PropertyType[] = [
      "bedspace",
      "boarding_house",
      "private_room",
      "shared_room",
      "studio",
      "apartment",
      "condo",
      "house",
    ];
    propertyTypes = splitTypes.filter((t): t is PropertyType =>
      validTypes.includes(t as PropertyType)
    );
  }

  // Occupants
  const occupants = number("occupants");

  // Bathroom
  const rawBathroom = params.get("bathroom");
  const bathroom =
    rawBathroom === "private" || rawBathroom === "shared" ? rawBathroom : null;

  // Tenant policy
  const rawTenant = params.get("tenant");
  const tenantPolicy: TenantPolicy | null =
    rawTenant === "female_only" ||
    rawTenant === "male_only" ||
    rawTenant === "mixed" ||
    rawTenant === "any"
      ? rawTenant
      : null;

  // Daily living
  const cookingAllowed = boolean("cook");
  const laundryAllowed = boolean("laundry");

  // Curfew
  const rawCurfew = params.get("curfew");
  const curfewType: CurfewType | null =
    rawCurfew === "none" || rawCurfew === "fixed" || rawCurfew === "conditional"
      ? rawCurfew
      : null;

  // Wi-Fi
  const wifiAvailable = boolean("wifi");
  const aircon = boolean("aircon");

  // Parking
  const motorcycleParking = boolean("motorParking");
  const carParking = boolean("carParking");

  // Utilities
  const waterIncluded = boolean("waterIncluded");
  const electricityIncluded = boolean("powerIncluded");

  // Verification & Trust
  const verifiedOnly = boolean("verified");
  const directLandlordOnly = boolean("direct");

  const filters: RentalFilters = {
    ...DEFAULT_RENTAL_FILTERS,
    minPrice,
    maxPrice,
    propertyTypes,
    occupants,
    bathroom,
    tenantPolicy,
    cookingAllowed,
    laundryAllowed,
    curfewType,
    wifiAvailable,
    aircon,
    motorcycleParking,
    carParking,
    waterIncluded,
    electricityIncluded,
    verifiedOnly,
    directLandlordOnly,
  };

  return {
    scope: invalid ? INITIAL_SCOPE : scope,
    filters,
    rentalId: params.get("rental"),
    invalid,
  };
}

/**
 * Write canonical RentalFilters and SearchScope to the browser URL without full-page reloads.
 */
export function writeRentalQuery(scope: SearchScope, filters: RentalFilters) {
  const params = new URLSearchParams();

  // Scope parameters
  params.set("scope", scope.mode);
  params.set("place", scope.label);
  if (scope.mode === "viewport") {
    params.set("west", String(scope.bounds.west));
    params.set("south", String(scope.bounds.south));
    params.set("east", String(scope.bounds.east));
    params.set("north", String(scope.bounds.north));
  } else {
    params.set("lng", String(scope.center[0]));
    params.set("lat", String(scope.center[1]));
    params.set("radius", String(scope.radiusMeters));
  }

  // Canonical filter parameters (Section 32 readable query keys)
  if (filters.minPrice !== null && filters.minPrice !== undefined) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
    params.set("maxPrice", String(filters.maxPrice));
    // Also mirror `max` for backward compatibility with legacy checks
    params.set("max", String(filters.maxPrice));
  }

  if (filters.propertyTypes && filters.propertyTypes.length > 0) {
    params.set("type", filters.propertyTypes.join(","));
  }

  if (filters.occupants !== null && filters.occupants !== undefined) {
    params.set("occupants", String(filters.occupants));
  }

  if (filters.bathroom) {
    params.set("bathroom", filters.bathroom);
  }

  if (filters.tenantPolicy && filters.tenantPolicy !== "any") {
    params.set("tenant", filters.tenantPolicy);
  }

  if (filters.cookingAllowed === true) params.set("cook", "1");
  if (filters.laundryAllowed === true) params.set("laundry", "1");

  if (filters.curfewType) params.set("curfew", filters.curfewType);

  if (filters.wifiAvailable === true) params.set("wifi", "1");
  if (filters.aircon === true) params.set("aircon", "1");

  if (filters.motorcycleParking === true) params.set("motorParking", "1");
  if (filters.carParking === true) params.set("carParking", "1");

  if (filters.waterIncluded === true) params.set("waterIncluded", "1");
  if (filters.electricityIncluded === true) params.set("powerIncluded", "1");

  if (filters.verifiedOnly === true) params.set("verified", "1");
  if (filters.directLandlordOnly === true) params.set("direct", "1");

  // Update history state
  window.history.replaceState(window.history.state, "", `/?${params}`);
  window.dispatchEvent(new Event("preview-navigation"));
}

/**
 * Hook to read current query string reactive to navigation events.
 */
export function useRentalQuery() {
  const query = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => ""
  );
  return useMemo(() => readRentalQuery(query), [query]);
}
