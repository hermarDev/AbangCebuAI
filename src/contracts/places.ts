import { z } from "zod";

// Metro Cebu preview envelope, not an administrative boundary or inventory claim.
export const PLACE_BOUNDS = { west: 123.75, south: 10.18, east: 124.05, north: 10.5 };
export const placeSchema = z.object({
  id: z.string().max(100),
  name: z.string().min(1).max(180),
  detail: z.string().max(240),
  coordinates: z.tuple([z.number().min(PLACE_BOUNDS.west).max(PLACE_BOUNDS.east), z.number().min(PLACE_BOUNDS.south).max(PLACE_BOUNDS.north)]),
  category: z.string().max(60).optional(),
});
export const placesResponseSchema = z.object({ places: z.array(placeSchema).max(8) });
export type PlaceResult = z.infer<typeof placeSchema>;

const photonSchema = z.object({ features: z.array(z.object({
  geometry: z.object({ type: z.literal("Point"), coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    osm_id: z.number(), osm_type: z.string(), name: z.string().optional(),
    street: z.string().optional(), housenumber: z.string().optional(), district: z.string().optional(),
    city: z.string().optional(), countrycode: z.string().optional(), osm_value: z.string().optional(),
  }),
})) });

export function parsePhotonPlaces(data: unknown): PlaceResult[] {
  const { features } = photonSchema.parse(data);
  const seen = new Set<string>();
  return features.flatMap(({ geometry, properties: p }) => {
    const id = `osm-${p.osm_type}-${p.osm_id}`;
    if (p.countrycode?.toLowerCase() !== "ph" || seen.has(id)) return [];
    const name = p.name || [p.housenumber, p.street].filter(Boolean).join(" ");
    const result = placeSchema.safeParse({
      id, name: name.slice(0, 180),
      detail: [...new Set([p.street, p.district, p.city].filter((part) => part && part !== name))].join(", ").slice(0, 240),
      coordinates: geometry.coordinates,
      category: p.osm_value === "university" ? "University" : p.osm_value === "college" || p.osm_value === "school" ? "College"
        : p.osm_value === "city" || p.osm_value === "town" ? "City"
        : ["suburb", "neighbourhood", "quarter", "village"].includes(p.osm_value ?? "") ? "Neighborhood" : "Landmark",
    });
    if (!result.success) return [];
    seen.add(id);
    return [result.data];
  }).slice(0, 8);
}
