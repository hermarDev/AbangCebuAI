import rentalsData from "./cebu-rentals.json";
import type { Coordinate, Rental, RentalType } from "@/contracts/preview";

export type TestRole =
  | "canonical-match"
  | "budget-exclusion"
  | "basis-distinction"
  | "radius-exclusion"
  | "unavailable-fixture"
  | "standard";

export interface ExtendedRentalFixture extends Rental {
  deposit?: { advanceMonths: number; depositMonths: number; utilityDeposit?: number };
  utilities?: {
    electricity: "inclusive" | "submetered" | "fixed";
    water: "inclusive" | "submetered" | "fixed";
    wifi: "free" | "shared" | "none";
  };
  curfew?: string;
  rules?: string[];
  landlord?: { name: string; contactChannel: "phone" | "messenger" | "email" };
  confirmedAt?: string;
  testRole?: TestRole;
}

export const CEBU_RENTALS: ExtendedRentalFixture[] = rentalsData as ExtendedRentalFixture[];

/**
 * Calculates geodesic distance between two [lng, lat] points using the Haversine formula (in meters).
 */
export function haversineDistanceMeters(
  [lon1, lat1]: Coordinate,
  [lon2, lat2]: Coordinate
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Filter fixtures based on proximity, budget, type, wifi, and availability.
 */
export function queryRentalFixtures({
  center,
  radiusMeters,
  maxPrice,
  type = "all",
  wifiOnly = false,
  onlyAvailable = true,
}: {
  center: Coordinate;
  radiusMeters: number;
  maxPrice?: number | null;
  type?: RentalType | "all";
  wifiOnly?: boolean;
  onlyAvailable?: boolean;
}): (ExtendedRentalFixture & { distanceMeters: number })[] {
  return CEBU_RENTALS.flatMap((rental) => {
    if (onlyAvailable && !rental.available) return [];
    if (maxPrice != null && rental.price > maxPrice) return [];
    if (type !== "all" && rental.type !== type) return [];
    if (wifiOnly && !rental.amenities.some((a) => a.toLowerCase().includes("wi-fi") || a.toLowerCase().includes("wifi"))) return [];

    const dist = Math.round(haversineDistanceMeters(center, rental.coordinates));
    if (dist > radiusMeters) return [];

    return [{ ...rental, distanceMeters: dist }];
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
}
