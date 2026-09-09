import type { Feature, Polygon } from "geojson";
import type { Coordinate, RentalResult, SearchFilters, SearchScope } from "@/contracts/preview";
import type { PropertyType, RentalFilters } from "@/contracts/rental-filters";
import { SAMPLE_RENTALS } from "@/features/listings/preview-rentals";

export const INITIAL_SCOPE: SearchScope = {
  mode: "map-radius",
  center: [123.907, 10.328],
  radiusMeters: 2000,
  label: "Lahug, Cebu City",
};

export const DEFAULT_FILTERS: SearchFilters = {
  maxPrice: null,
  type: "all",
  wifi: false,
};

const EARTH_RADIUS_METERS = 6371008.8;
const radians = (degrees: number) => (degrees * Math.PI) / 180;
const degrees = (angle: number) => (angle * 180) / Math.PI;

function assertCoordinate(value: Coordinate) {
  if (
    value.length !== 2 ||
    !value.every(Number.isFinite) ||
    Math.abs(value[0]) > 180 ||
    Math.abs(value[1]) > 90
  ) {
    throw new RangeError("Use a valid [longitude, latitude] coordinate.");
  }
}

function assertRadius(radiusMeters: number) {
  if (!Number.isFinite(radiusMeters) || radiusMeters < 100 || radiusMeters > 10000) {
    throw new RangeError("Choose a preview radius from 100 m to 10 km.");
  }
}

export function distanceMeters(a: Coordinate, b: Coordinate): number {
  assertCoordinate(a);
  assertCoordinate(b);
  const deltaLat = radians(b[1] - a[1]);
  const deltaLng = radians(b[0] - a[0]);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))));
}

export function searchPreviewRentals(
  scope: SearchScope,
  filters: SearchFilters | RentalFilters
): RentalResult[] {
  // Validate budget
  if (
    filters.maxPrice !== null &&
    filters.maxPrice !== undefined &&
    (!Number.isFinite(filters.maxPrice) || filters.maxPrice < 0)
  ) {
    throw new RangeError("Use a non-negative monthly budget.");
  }
  if (
    "minPrice" in filters &&
    filters.minPrice !== null &&
    filters.minPrice !== undefined &&
    (!Number.isFinite(filters.minPrice) || filters.minPrice < 0)
  ) {
    throw new RangeError("Use a non-negative minimum budget.");
  }

  // Validate legacy type if provided
  if ("type" in filters && filters.type !== undefined) {
    const validLegacy = ["all", "room", "bedspace", "boarding-house", "private_room", "shared_room", "studio", "apartment", "condo", "house"];
    if (!validLegacy.includes(filters.type)) {
      throw new TypeError("Choose supported preview filters.");
    }
  }

  if (scope.mode === "viewport") {
    const { west, south, east, north } = scope.bounds;
    assertCoordinate([west, south]);
    assertCoordinate([east, north]);
    if (west > east || south > north) {
      throw new RangeError("Use ordered bounds for the Cebu preview.");
    }
  } else {
    assertCoordinate(scope.center);
    assertRadius(scope.radiusMeters);
  }

  return SAMPLE_RENTALS.flatMap((rental): RentalResult[] => {
    // 1. Must be available
    if (!rental.available) return [];

    // 2. Budget checks (inclusive)
    if ("minPrice" in filters && filters.minPrice !== null && filters.minPrice !== undefined) {
      if (rental.price < filters.minPrice) return [];
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      if (rental.price > filters.maxPrice) return [];
    }

    // 3. Property Type matching
    if ("propertyTypes" in filters && filters.propertyTypes && filters.propertyTypes.length > 0) {
      const pType: PropertyType = rental.propertyType || (rental.type === "room" ? "private_room" : rental.type === "bedspace" ? "bedspace" : "boarding_house");
      if (!filters.propertyTypes.includes(pType)) return [];
    } else if ("type" in filters && filters.type !== "all" && filters.type !== undefined) {
      const matchesType =
        rental.type === filters.type ||
        (filters.type === "room" && rental.propertyType === "private_room") ||
        (filters.type === "boarding-house" && rental.propertyType === "boarding_house");
      if (!matchesType) return [];
    }

    // 4. Wi-Fi
    const wantWifi = ("wifi" in filters && filters.wifi) || ("wifiAvailable" in filters && filters.wifiAvailable === true);
    if (wantWifi) {
      const hasWifi = rental.amenities.includes("Wi-Fi") || rental.wifiAvailable === true;
      if (!hasWifi) return [];
    }

    // 5. Occupancy (listing.maxOccupants >= requestedOccupants)
    if ("occupants" in filters && filters.occupants !== null && filters.occupants !== undefined && filters.occupants > 0) {
      const maxOcc = rental.maxOccupants ?? 1;
      if (maxOcc < filters.occupants) return [];
    }

    // 6. Bathroom
    if ("bathroom" in filters && filters.bathroom) {
      if (rental.bathroomType !== filters.bathroom) return [];
    }

    // 7. Daily living (cooking, laundry)
    if ("cookingAllowed" in filters && filters.cookingAllowed === true) {
      if (rental.cookingAllowed !== true) return [];
    }
    if ("laundryAllowed" in filters && filters.laundryAllowed === true) {
      if (rental.laundryAllowed !== true) return [];
    }

    // 8. Curfew
    if ("curfewType" in filters && filters.curfewType === "none") {
      if (rental.curfewType !== "none") return [];
    }

    // 9. Utilities
    if ("waterIncluded" in filters && filters.waterIncluded === true) {
      if (rental.waterPricingType !== "included") return [];
    }
    if ("powerIncluded" in filters && filters.powerIncluded === true) {
      if (rental.electricityPricingType !== "included") return [];
    }

    // 10. Parking
    const wantMotor = ("motorParking" in filters && filters.motorParking === true) || ("motorcycleParking" in filters && filters.motorcycleParking === true);
    if (wantMotor && rental.motorcycleParking !== true) return [];
    if ("carParking" in filters && filters.carParking === true && rental.carParking !== true) return [];

    // 11. Verification
    if ("verifiedOnly" in filters && filters.verifiedOnly === true) {
      if (!rental.verificationStatus || rental.verificationStatus === "unverified") return [];
    }
    if ("directLandlordOnly" in filters && filters.directLandlordOnly === true) {
      if (rental.directLandlord !== true) return [];
    }

    // 12. Spatial scope
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

/** Geographic ring for display; it does not decide search membership. */
export function circleGeoJSON(center: Coordinate, radiusMeters: number): Feature<Polygon> {
  assertCoordinate(center);
  assertRadius(radiusMeters);
  const lat = radians(center[1]);
  const lng = radians(center[0]);
  const arc = radiusMeters / EARTH_RADIUS_METERS;
  const coordinates: Coordinate[] = [];
  for (let step = 0; step < 96; step++) {
    const bearing = (2 * Math.PI * step) / 96;
    const destinationLat = Math.asin(
      Math.sin(lat) * Math.cos(arc) + Math.cos(lat) * Math.sin(arc) * Math.cos(bearing)
    );
    const destinationLng =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(arc) * Math.cos(lat),
        Math.cos(arc) - Math.sin(lat) * Math.sin(destinationLat)
      );
    coordinates.push([((degrees(destinationLng) + 540) % 360) - 180, degrees(destinationLat)]);
  }
  coordinates.push([...coordinates[0]]);
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coordinates] } };
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Number(meters.toFixed(3))} m`;
  return `${Number((meters / 1000).toFixed(6))} km`;
}

export function scopeLabel(scope: SearchScope): string {
  if (scope.mode === "viewport") return "Rentals in this map area";
  return `Within ${formatDistance(scope.radiusMeters)} of ${
    scope.mode === "map-radius" ? "map center" : scope.label
  }`;
}
