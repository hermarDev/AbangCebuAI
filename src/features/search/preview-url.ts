"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { SearchFilters, SearchScope } from "@/contracts/preview";
import { DEFAULT_FILTERS, INITIAL_SCOPE } from "./preview-search";

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("preview-navigation", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("preview-navigation", listener);
  };
}

export function readPreviewQuery(query: string) {
  const params = new URLSearchParams(query);
  let scope: SearchScope = INITIAL_SCOPE;
  let invalid = false;
  const mode = params.get("scope");
  const number = (key: string) => params.has(key) && params.get(key) !== "" ? Number(params.get(key)) : NaN;
  if (mode) {
    const label = params.get("place")?.slice(0, 80) || "Shared map area";
    if (mode === "viewport") {
      const [west, south, east, north] = ["west", "south", "east", "north"].map(number);
      if ([west, south, east, north].every(Number.isFinite) && west >= -180 && east <= 180 && south >= -85 && north <= 85 && west < east && south < north) {
        scope = { mode, bounds: { west, south, east, north }, label };
      } else invalid = true;
    } else if (mode === "map-radius" || mode === "place-radius") {
      const [lng, lat, radiusMeters] = ["lng", "lat", "radius"].map(number);
      if ([lng, lat, radiusMeters].every(Number.isFinite) && Math.abs(lng) <= 180 && Math.abs(lat) <= 85 && radiusMeters >= 100 && radiusMeters <= 10000) {
        scope = { mode, center: [lng, lat], radiusMeters, label };
      } else invalid = true;
    } else invalid = true;
  }
  const type = params.get("type") || "all";
  const max = params.has("max") ? number("max") : null;
  if (!["all", "room", "bedspace", "boarding-house"].includes(type) || (max !== null && (!Number.isFinite(max) || max < 0 || max > 50000))) invalid = true;
  const filters: SearchFilters = invalid ? DEFAULT_FILTERS : { type: type as SearchFilters["type"], maxPrice: max, wifi: params.get("wifi") === "1" };
  return { scope: invalid ? INITIAL_SCOPE : scope, filters, invalid, rentalId: params.get("rental") };
}

export function usePreviewQuery() {
  const query = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return useMemo(() => readPreviewQuery(query), [query]);
}

export function writePreviewQuery(scope: SearchScope, filters: SearchFilters) {
  const params = new URLSearchParams();
  params.set("scope", scope.mode);
  params.set("place", scope.label);
  if (scope.mode === "viewport") {
    Object.entries(scope.bounds).forEach(([key, value]) => params.set(key, String(value)));
  } else {
    params.set("lng", String(scope.center[0]));
    params.set("lat", String(scope.center[1]));
    params.set("radius", String(scope.radiusMeters));
  }
  if (filters.maxPrice !== null) params.set("max", String(filters.maxPrice));
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.wifi) params.set("wifi", "1");
  window.history.replaceState(window.history.state, "", `/?${params}`);
  window.dispatchEvent(new Event("preview-navigation"));
}

export function openPreviewRental(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("rental", id);
  window.history.pushState({ ...window.history.state, previewRental: true }, "", url);
  window.dispatchEvent(new Event("preview-navigation"));
}

export function closePreviewRental() {
  if (window.history.state?.previewRental) window.history.back();
  else {
    const url = new URL(window.location.href);
    url.searchParams.delete("rental");
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event("preview-navigation"));
  }
}
