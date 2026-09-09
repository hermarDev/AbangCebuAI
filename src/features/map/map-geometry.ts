import type { Map as MapLibreMap } from "maplibre-gl";
import type { Coordinate, MapView } from "@/contracts/preview";
import { circleGeoJSON, distanceMeters } from "@/features/search/preview-search";

/** The shell gives the map its own exposed rectangle, outside the rail/sheet. */
export function readMapView(map: Pick<MapLibreMap, "getContainer" | "unproject" | "project" | "getZoom">): MapView {
  const { clientWidth: width, clientHeight: height } = map.getContainer();
  const inset = 24;
  const centerPoint = map.unproject([width / 2, height / 2]);
  const center: Coordinate = [centerPoint.lng, centerPoint.lat];
  const westNorth = map.unproject([0, 0]);
  const eastSouth = map.unproject([width, height]);
  const edgePoints: [number, number][] = [
    [inset, height / 2], [width - inset, height / 2],
    [width / 2, inset], [width / 2, height - inset],
  ];
  const fittingDistance = width <= inset * 2 || height <= inset * 2 ? 0 : Math.min(...edgePoints.map((point) => {
    const edge = map.unproject(point);
    return distanceMeters(center, [edge.lng, edge.lat]);
  }));
  let radiusMeters = Math.min(10000, Math.floor(fittingDistance / 100) * 100);
  // A ground circle projects asymmetrically in Mercator. Verify the whole ring,
  // not just the midpoint estimate, before publishing the exact query radius.
  while (radiusMeters > 0) {
    const ring = circleGeoJSON(center, radiusMeters).geometry.coordinates[0];
    const fits = ring.every((coordinate) => {
      const point = map.project(coordinate as Coordinate);
      return point.x >= inset && point.x <= width - inset && point.y >= inset && point.y <= height - inset;
    });
    if (fits) break;
    radiusMeters -= 100;
  }
  return {
    center,
    radiusMeters,
    bounds: { west: westNorth.lng, north: westNorth.lat, east: eastSouth.lng, south: eastSouth.lat },
    zoom: map.getZoom(),
  };
}
