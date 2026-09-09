import { NextResponse } from "next/server";
import type { SearchScope } from "@/contracts/preview";
import type { BathroomType, CurfewType, PropertyType, RentalFilters, TenantPolicy } from "@/contracts/rental-filters";
import { queryRentalsServer } from "@/server/rentals/query-rentals";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Parse Scope
    const mode = searchParams.get("scope");
    let scope: SearchScope = {
      mode: "map-radius",
      center: [123.907, 10.328],
      radiusMeters: 2000,
      label: "Lahug, Cebu City",
    };

    if (mode === "viewport") {
      const west = Number(searchParams.get("west"));
      const south = Number(searchParams.get("south"));
      const east = Number(searchParams.get("east"));
      const north = Number(searchParams.get("north"));
      if ([west, south, east, north].every(Number.isFinite)) {
        scope = {
          mode: "viewport",
          bounds: { west, south, east, north },
          label: searchParams.get("place") || "Cebu area",
        };
      }
    } else if (mode === "place-radius" || mode === "map-radius") {
      const lng = Number(searchParams.get("lng"));
      const lat = Number(searchParams.get("lat"));
      const radius = Number(searchParams.get("radius"));
      if ([lng, lat, radius].every(Number.isFinite)) {
        scope = {
          mode,
          center: [lng, lat],
          radiusMeters: radius,
          label: searchParams.get("place") || "Cebu area",
        };
      }
    }

    // 2. Parse Canonical Filters
    const num = (k: string) => (searchParams.has(k) ? Number(searchParams.get(k)) : null);
    const bool = (k: string) => (searchParams.get(k) === "1" ? true : searchParams.get(k) === "0" ? false : null);

    const typeParam = searchParams.get("type");
    const propertyTypes: PropertyType[] = typeParam
      ? (typeParam.split(",").filter(Boolean) as PropertyType[])
      : [];

    const filters: RentalFilters = {
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice") ?? num("max"),
      propertyTypes,
      occupants: num("occupants"),
      bathroom: (searchParams.get("bathroom") as BathroomType) || null,
      tenantPolicy: (searchParams.get("tenant") as TenantPolicy) || null,
      cookingAllowed: bool("cook"),
      laundryAllowed: bool("laundry"),
      curfewType: (searchParams.get("curfew") as CurfewType) || null,
      wifiAvailable: bool("wifi"),
      aircon: bool("aircon"),
      motorcycleParking: bool("motorParking"),
      carParking: bool("carParking"),
      waterIncluded: bool("waterIncluded"),
      electricityIncluded: bool("powerIncluded"),
      verifiedOnly: bool("verified"),
      directLandlordOnly: bool("direct"),
      furnishingTypes: [],
    };

    const results = await queryRentalsServer(scope, filters);
    return NextResponse.json({ rentals: results, count: results.length });
  } catch (err) {
    console.error("Rentals API search error:", err);
    return NextResponse.json({ error: "Failed to search rentals" }, { status: 500 });
  }
}
