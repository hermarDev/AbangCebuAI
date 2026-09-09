import landmarksData from "./cebu-landmarks.json";

export type LandmarkCategory =
  | "College"
  | "University"
  | "Business Hub"
  | "Commercial"
  | "Landmark"
  | "Downtown";

export interface LandmarkFixture {
  id: string;
  name: string;
  aliases: string[];
  category: LandmarkCategory;
  city: string;
  barangay: string;
  coordinates: [longitude: number, latitude: number];
  displayName: string;
}

export const CEBU_LANDMARKS: LandmarkFixture[] = landmarksData as LandmarkFixture[];

/**
 * Helper to match user text queries (case-insensitive) against landmark names and aliases.
 */
export function findLandmarksByQuery(query: string): LandmarkFixture[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CEBU_LANDMARKS.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.aliases.some((alias) => alias.toLowerCase().includes(q)) ||
      l.city.toLowerCase().includes(q) ||
      l.barangay.toLowerCase().includes(q)
  );
}

/**
 * Resolves a landmark query to candidate matches for the FinderAgent resolve_landmark tool.
 */
export function resolveLandmarkCandidates(query: string): {
  outcome: "matched" | "clarification_needed" | "not_found";
  candidates: LandmarkFixture[];
} {
  const matches = findLandmarksByQuery(query);
  if (matches.length === 0) {
    return { outcome: "not_found", candidates: [] };
  }
  if (matches.length === 1) {
    return { outcome: "matched", candidates: matches };
  }
  // If exact name matches one perfectly, return matched
  const exact = matches.find(
    (m) =>
      m.name.toLowerCase() === query.toLowerCase() ||
      m.aliases.some((a) => a.toLowerCase() === query.toLowerCase())
  );
  if (exact) {
    return { outcome: "matched", candidates: [exact] };
  }
  return { outcome: "clarification_needed", candidates: matches };
}
