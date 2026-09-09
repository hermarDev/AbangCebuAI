import "server-only";

import type { RentalResult, SearchScope } from "@/contracts/preview";
import type { PropertyType, RentalFilters } from "@/contracts/rental-filters";
import { distanceMeters } from "@/features/search/preview-search";
import { SAMPLE_RENTALS } from "@/features/listings/preview-rentals";
import { createRouteSupabaseClient } from "@/lib/supabase/server";

/**
 * Server-only rental search service.
 * Supports Supabase PostGIS queries with seamless offline fallback to the local dataset.
 * Implements strict "Unknown is not false" logic.
 */
export async function queryRentalsServer(
  scope: SearchScope,
  filters: RentalFilters
): Promise<RentalResult[]> {
  try {
    // Attempt database query if Supabase is configured
    const hasSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    );
    if (hasSupabase) {
      const supabase = await createRouteSupabaseClient();
      const centerLng = scope.mode === "viewport"
        ? (scope.bounds.west + scope.bounds.east) / 2
        : scope.center[0];
      const centerLat = scope.mode === "viewport"
        ? (scope.bounds.south + scope.bounds.north) / 2
        : scope.center[1];
      const radiusMeters = scope.mode === "viewport" ? 5000 : scope.radiusMeters;

      const { data, error } = await supabase.rpc("search_rentals", {
        p_center_lng: centerLng,
        p_center_lat: centerLat,
        p_radius_meters: radiusMeters,
        p_min_price: filters.minPrice ?? null,
        p_max_price: filters.maxPrice ?? null,
        p_property_types: filters.propertyTypes && filters.propertyTypes.length > 0 ? filters.propertyTypes : null,
        p_occupants: filters.occupants ?? null,
        p_bathroom_type: filters.bathroom ?? null,
        p_tenant_policy: filters.tenantPolicy ?? null,
        p_cooking_allowed: filters.cookingAllowed ?? null,
        p_laundry_allowed: filters.laundryAllowed ?? null,
        p_curfew_none: filters.curfewType === "none" ? true : null,
        p_wifi_available: filters.wifiAvailable ?? null,
        p_aircon: filters.aircon ?? null,
        p_motorcycle_parking: filters.motorcycleParking ?? null,
        p_car_parking: filters.carParking ?? null,
        p_water_included: filters.waterIncluded ?? null,
        p_power_included: filters.electricityIncluded ?? null,
        p_verified_only: filters.verifiedOnly ?? null,
        p_direct_landlord_only: filters.directLandlordOnly ?? null,
        p_limit: 100,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((item: Record<string, unknown>): RentalResult => ({
          id: String(item.id),
          title: String(item.title),
          locality: String(item.locality || "Cebu"),
          coordinates: [Number(item.longitude), Number(item.latitude)],
          price: Number(item.monthly_rent),
          type: String(item.property_type) as RentalResult["type"],
          basis: (item.basis as "room" | "bed") || "room",
          amenities: [
            item.wifi_available ? "Wi-Fi" : null,
            item.bathroom_type === "private" ? "Own bathroom" : null,
            item.aircon ? "Air conditioning" : null,
          ].filter(Boolean) as string[],
          description: String(item.description || ""),
          area: Number(item.area) || 15,
          tone: (item.tone as RentalResult["tone"]) || "sand",
          available: Boolean(item.available),
          distanceMeters: item.distance_meters !== null && item.distance_meters !== undefined ? Number(item.distance_meters) : null,
          propertyType: item.property_type as RentalFilters["propertyTypes"][number],
          bathroomType: item.bathroom_type as RentalResult["bathroomType"],
          minOccupants: item.min_occupants as number,
          maxOccupants: item.max_occupants as number,
          cookingAllowed: item.cooking_allowed as boolean,
          laundryAllowed: item.laundry_allowed as boolean,
          curfewType: item.curfew_type as RentalResult["curfewType"],
          wifiAvailable: item.wifi_available as boolean,
          waterPricingType: item.water_pricing_type as RentalResult["waterPricingType"],
          electricityPricingType: item.electricity_pricing_type as RentalResult["electricityPricingType"],
          advanceMonths: item.advance_months as number,
          depositMonths: item.deposit_months as number,
          verificationStatus: item.verification_status as RentalResult["verificationStatus"],
          directLandlord: item.direct_landlord as boolean,
        }));
      }
    }
  } catch (err) {
    console.warn("Database rental query failed, falling back to synthetic dataset:", err);
  }

  // Graceful offline fallback: evaluate filters against local SAMPLE_RENTALS
  return evaluateLocalRentalFilters(scope, filters);
}

/**
 * Local evaluator matching database logic for offline preview and Playwright testing.
 */
export function evaluateLocalRentalFilters(
  scope: SearchScope,
  filters: RentalFilters
): RentalResult[] {
  return SAMPLE_RENTALS.flatMap((rental): RentalResult[] => {
    // 1. Must be available
    if (!rental.available) return [];

    // 2. Budget range (inclusive)
    if (filters.minPrice !== null && filters.minPrice !== undefined && rental.price < filters.minPrice) return [];
    if (filters.maxPrice !== null && filters.maxPrice !== undefined && rental.price > filters.maxPrice) return [];

    // 3. Property Types (multi-select)
    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      const rentalPropType: PropertyType = rental.propertyType || (rental.type === "room" ? "private_room" : rental.type === "bedspace" ? "bedspace" : "boarding_house");
      if (!filters.propertyTypes.includes(rentalPropType)) return [];
    }

    // 4. Occupancy (listing.maxOccupants >= requestedOccupants)
    if (filters.occupants !== null && filters.occupants !== undefined && filters.occupants > 0) {
      const maxOcc = rental.maxOccupants ?? 1;
      if (maxOcc < filters.occupants) return [];
    }

    // 5. Bathroom Privacy
    if (filters.bathroom) {
      if (rental.bathroomType !== filters.bathroom) return [];
    }

    // 6. Tenant Policy
    if (filters.tenantPolicy && filters.tenantPolicy !== "any") {
      if (rental.tenantPolicy && rental.tenantPolicy !== "any" && rental.tenantPolicy !== "mixed" && rental.tenantPolicy !== filters.tenantPolicy) {
        return [];
      }
    }

    // 7. Daily Living (strict unknown is not false: must be explicitly true)
    if (filters.cookingAllowed === true && rental.cookingAllowed !== true) return [];
    if (filters.laundryAllowed === true && rental.laundryAllowed !== true) return [];

    // 8. Curfew
    if (filters.curfewType === "none" && rental.curfewType !== "none") return [];
    if (filters.curfewType === "fixed" && rental.curfewType !== "fixed") return [];

    // 9. Amenities & Wi-Fi
    if (filters.wifiAvailable === true) {
      const hasWifi = rental.wifiAvailable === true || rental.amenities.includes("Wi-Fi");
      if (!hasWifi) return [];
    }
    if (filters.aircon === true && rental.aircon !== true) return [];
    if (filters.terrace === true && rental.terrace !== true) return [];

    // 10. Utilities
    if (filters.waterIncluded === true && rental.waterPricingType !== "included") return [];
    if (filters.electricityIncluded === true && rental.electricityPricingType !== "included") return [];

    // 11. Parking
    if (filters.motorcycleParking === true && rental.motorcycleParking !== true) return [];
    if (filters.carParking === true && rental.carParking !== true) return [];

    // 12. Security & Verification
    if (filters.verifiedOnly === true && (!rental.verificationStatus || rental.verificationStatus === "unverified")) return [];
    if (filters.directLandlordOnly === true && rental.directLandlord !== true) return [];

    // 13. Geographic Scope
    if (scope.mode === "viewport") {
      const [longitude, latitude] = rental.coordinates;
      const { west, south, east, north } = scope.bounds;
      return longitude >= west && longitude <= east && latitude >= south && latitude <= north
        ? [{ ...rental, distanceMeters: null }]
        : [];
    }

    const distance = distanceMeters(scope.center, rental.coordinates);
    return distance <= scope.radiusMeters ? [{ ...rental, distanceMeters: distance }] : [];
  }).sort(
    (a, b) =>
      (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) ||
      a.price - b.price ||
      a.id.localeCompare(b.id)
  );
}
