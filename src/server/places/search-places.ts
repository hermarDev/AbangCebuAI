import "server-only";
import { PLACE_BOUNDS, parsePhotonPlaces, type PlaceResult } from "@/contracts/places";

const cache = new Map<string, { expires: number; places: PlaceResult[] }>();
let nextRequestAt = 0;

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.places;
  // A small single-process preview guard. Revisit for a multi-instance release.
  if (Date.now() < nextRequestAt) throw new Error("Please wait a moment before searching again.");
  nextRequestAt = Date.now() + 1000;
  const url = new URL("https://photon.komoot.io/api/");
  url.search = new URLSearchParams({
    q: query, limit: "8", lang: "en",
    bbox: `${PLACE_BOUNDS.west},${PLACE_BOUNDS.south},${PLACE_BOUNDS.east},${PLACE_BOUNDS.north}`,
  }).toString();
  const response = await fetch(url, {
    headers: { "User-Agent": "AbangCebu-preview/0.1 (https://github.com/hermarDev/AbangCebuAI)" },
    signal: AbortSignal.timeout(8000), cache: "no-store",
  });
  if (!response.ok) throw new Error("Place search is temporarily unavailable. Try again or choose a preset area.");
  const places = parsePhotonPlaces(await response.json());
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 3600000, places });
  return places;
}
