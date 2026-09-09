import { expect, test } from "@playwright/test";
import type { Coordinate, SearchScope } from "../../src/contracts/preview";
import { SAMPLE_RENTALS } from "../../src/features/listings/preview-rentals";
import { circleGeoJSON, DEFAULT_FILTERS, distanceMeters, formatDistance, INITIAL_SCOPE, searchPreviewRentals } from "../../src/features/search/preview-search";

test("spherical distance uses longitude, latitude and rejects malformed coordinates", () => {
  expect(distanceMeters([123, 10], [123, 11])).toBeCloseTo(111195.08, 1);
  expect(distanceMeters([123, 10], [124, 10])).toBeCloseTo(109505.74, 1);
  expect(distanceMeters([123, 10], [123, 10])).toBe(0);
  expect(() => distanceMeters([10, 123], [10, 124])).toThrow(/longitude, latitude/);
  expect(() => distanceMeters([NaN, 10], [123, 10])).toThrow();
});

test("radius membership includes the center and exact boundary, but excludes points just outside", () => {
  const rental = SAMPLE_RENTALS[0];
  const center: Coordinate = [rental.coordinates[0], rental.coordinates[1] - 0.01];
  const boundary = distanceMeters(center, rental.coordinates);
  const search = (radiusMeters: number) => searchPreviewRentals({ mode: "place-radius", center, radiusMeters, label: "Test center" }, DEFAULT_FILTERS).map(({ id }) => id);
  expect(search(boundary)).toContain(rental.id);
  expect(search(boundary + 0.01)).toContain(rental.id);
  expect(search(boundary - 0.01)).not.toContain(rental.id);
  expect(searchPreviewRentals({ mode: "place-radius", center: rental.coordinates, radiusMeters: 100, label: "At sample pin" }, DEFAULT_FILTERS).find(({ id }) => id === rental.id)?.distanceMeters).toBe(0);
});

test("bounds include edge points and rectangular corners that a circle excludes", () => {
  const rental = SAMPLE_RENTALS[0];
  const [east, north] = rental.coordinates;
  const viewport: SearchScope = { mode: "viewport", bounds: { west: east - 0.02, south: north - 0.02, east, north }, label: "Test bounds" };
  const results = searchPreviewRentals(viewport, DEFAULT_FILTERS);
  expect(results.map(({ id }) => id)).toContain(rental.id);
  expect(results.every(({ distanceMeters }) => distanceMeters === null)).toBe(true);
  const circle: SearchScope = { mode: "map-radius", center: [east - 0.01, north - 0.01], radiusMeters: 1200, label: "Test circle" };
  expect(searchPreviewRentals(circle, DEFAULT_FILTERS).map(({ id }) => id)).not.toContain(rental.id);
  expect(searchPreviewRentals({ ...viewport, bounds: { ...viewport.bounds, east: east - 0.000001 } }, DEFAULT_FILTERS).map(({ id }) => id)).not.toContain(rental.id);
});

test("budget is inclusive and bedspace prices keep their basis", () => {
  const wideScope: SearchScope = { mode: "place-radius", center: [123.907, 10.328], radiusMeters: 10000, label: "Test area" };
  const budget = searchPreviewRentals(wideScope, { ...DEFAULT_FILTERS, maxPrice: 2500 });
  expect(budget.some(({ price }) => price === 2500)).toBe(true);
  expect(budget.every(({ price }) => price <= 2500)).toBe(true);
  expect(budget.map(({ id }) => id)).not.toContain("sample-fuente-02");
  expect(searchPreviewRentals(wideScope, { ...DEFAULT_FILTERS, maxPrice: 2501 }).map(({ id }) => id)).toContain("sample-fuente-02");
  const beds = searchPreviewRentals(wideScope, { maxPrice: 2500, type: "bedspace", wifi: true });
  expect(beds.length).toBeGreaterThan(0);
  expect(beds.every(({ type, basis, amenities }) => type === "bedspace" && basis === "bed" && amenities.includes("Wi-Fi"))).toBe(true);
  expect(beds.map(({ id }) => id)).not.toContain("sample-lahug-05");
});

test("unavailable fixtures never enter counts, cards or pins and order is stable", () => {
  const results = searchPreviewRentals(INITIAL_SCOPE, DEFAULT_FILTERS);
  expect(results.length).toBeGreaterThan(8);
  expect(results.every(({ available }) => available)).toBe(true);
  expect(results.map(({ id }) => id)).not.toContain("sample-unavailable-01");
  expect(results.map(({ id }) => id)).not.toContain("sample-unavailable-02");
  expect(results.map(({ id }) => id)).toEqual(searchPreviewRentals(INITIAL_SCOPE, DEFAULT_FILTERS).map(({ id }) => id));
  for (let index = 1; index < results.length; index++) {
    expect(results[index].distanceMeters!).toBeGreaterThanOrEqual(results[index - 1].distanceMeters!);
  }
});

test("ring is closed, geodesic, and scope labels do not round query geometry", () => {
  const center: Coordinate = [123.907, 10.328];
  const ring = circleGeoJSON(center, 1249).geometry.coordinates[0];
  expect(ring[0]).toEqual(ring[ring.length - 1]);
  for (const vertex of ring) expect(distanceMeters(center, vertex as Coordinate)).toBeCloseTo(1249, 5);
  expect(formatDistance(1249)).toBe("1.249 km");
  expect(() => circleGeoJSON(center, 99)).toThrow();
  expect(() => circleGeoJSON(center, 10001)).toThrow();
  expect(() => searchPreviewRentals({ mode: "map-radius", center, radiusMeters: Infinity, label: "Invalid" }, DEFAULT_FILTERS)).toThrow();
  expect(() => searchPreviewRentals({ mode: "viewport", bounds: { west: 124, east: 123, south: 10, north: 11 }, label: "Reversed" }, DEFAULT_FILTERS)).toThrow();
});
