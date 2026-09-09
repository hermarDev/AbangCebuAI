"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapMarker, Popup as MapPopup } from "maplibre-gl";
import { MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CebuMapProps, Coordinate, RentalResult, SearchScope } from "@/contracts/preview";
import { circleGeoJSON } from "@/features/search/preview-search";
import { readMapView } from "./map-geometry";

const emptyCollection = { type: "FeatureCollection" as const, features: [] };
const price = (rental: RentalResult) => `₱${rental.price.toLocaleString("en-PH")}`;

function circleData(scope: SearchScope | null) {
  return scope && scope.mode !== "viewport" && scope.radiusMeters > 0
    ? circleGeoJSON(scope.center, scope.radiusMeters)
    : emptyCollection;
}

export default function CebuMap(props: CebuMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const mapRef = useRef<MapLibreMap | null>(null);
  const syncRef = useRef<(() => void) | null>(null);
  const syncHoverRef = useRef<((id: string | null) => void) | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { latest.current = props; });

  useEffect(() => {
    let disposed = false;
    let ready = false;
    let map: MapLibreMap | undefined;
    let markers: MapMarker[] = [];
    let popup: MapPopup | undefined;
    let observer: ResizeObserver | undefined;
    let movedByUser = false;
    const timeout = window.setTimeout(() => {
      if (!disposed && !ready) setState("error");
    }, 20000);

    async function initialize() {
      try {
        const { Map, Marker, Popup, LngLatBounds, NavigationControl, AttributionControl, setWorkerUrl } = await import("maplibre-gl");
        if (disposed || !container.current) return;
        setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        const scope = latest.current.scope;
        const initialCenter: Coordinate = scope.mode === "viewport"
          ? [(scope.bounds.west + scope.bounds.east) / 2, (scope.bounds.south + scope.bounds.north) / 2]
          : scope.center;
        map = new Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: initialCenter,
          zoom: 13.4,
          minZoom: 8,
          maxZoom: 18,
          pitch: 0,
          bearing: 0,
          renderWorldCopies: false,
          dragRotate: false,
          touchPitch: false,
          attributionControl: false,
        });
        const liveMap = map;
        mapRef.current = liveMap;
        liveMap.touchZoomRotate.disableRotation();
        liveMap.keyboard.disableRotation();
        liveMap.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
        liveMap.addControl(new AttributionControl({ compact: true }), "bottom-left");
        const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (container.current.clientWidth > 100 && container.current.clientHeight > 100) {
          const initialBounds = scope.mode === "viewport"
            ? new LngLatBounds([scope.bounds.west, scope.bounds.south], [scope.bounds.east, scope.bounds.north])
            : circleGeoJSON(scope.center, scope.radiusMeters).geometry.coordinates[0].reduce(
              (bounds, coordinate) => bounds.extend(coordinate as Coordinate),
              new LngLatBounds(initialCenter, initialCenter),
            );
          liveMap.fitBounds(initialBounds, { padding: 32, duration: 0, maxZoom: 16 });
        }

        const renderMarkers = () => {
          const focusedId = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.listingId : undefined;
          markers.forEach((marker) => marker.remove());
          markers = [];
          const groups: { rentals: RentalResult[]; x: number; y: number }[] = [];
          const rentals = [...latest.current.rentals].sort((a, b) => Number(b.id === latest.current.selectedId) - Number(a.id === latest.current.selectedId));
          for (const rental of rentals) {
            const point = liveMap.project(rental.coordinates);
            const group = groups.find((candidate) => Math.abs(candidate.x - point.x) < 112 && Math.abs(candidate.y - point.y) < 46);
            if (group) group.rentals.push(rental);
            else groups.push({ rentals: [rental], x: point.x, y: point.y });
          }
          for (const group of groups) {
            const members = group.rentals;
            const first = members[0];
            const button = document.createElement("button");
            button.type = "button";
            const selected = members.some((rental) => rental.id === latest.current.selectedId);
            const isHovered = Boolean(latest.current.hoveredId && members.some((rental) => rental.id === latest.current.hoveredId));
            button.className = `${members.length > 1 ? "cluster-pin" : "price-pin"}${selected ? " is-selected" : ""}${isHovered ? " is-hovered" : ""}`;
            button.setAttribute("aria-pressed", String(selected));
            if (members.length === 1) {
              button.dataset.listingId = first.id;
              button.append(document.createTextNode(price(first)));
              const basis = document.createElement("span");
              basis.className = "price-pin-basis";
              basis.textContent = " / mo";
              button.append(basis);
              button.setAttribute("aria-label", `${first.title}, ${price(first)} per month. Show rental`);
              button.addEventListener("click", (event) => {
                event.stopPropagation();
                popup?.remove();
                latest.current.onSelect(first.id);
              });
              button.addEventListener("mouseenter", () => {
                latest.current.onHover?.(first.id);
              });
              button.addEventListener("mouseleave", () => {
                latest.current.onHover?.(null);
              });
            } else {
              button.dataset.memberIds = members.map((rental) => rental.id).join(",");
              button.textContent = String(members.length);
              button.setAttribute("aria-label", `${members.length} loaded sample rentals. ${liveMap.getZoom() >= 17.9 ? "Choose rental" : "Zoom to rentals"}`);
              button.addEventListener("mouseenter", () => {
                latest.current.onHover?.(first.id);
              });
              button.addEventListener("mouseleave", () => {
                latest.current.onHover?.(null);
              });
              button.addEventListener("click", (event) => {
                event.stopPropagation();
                popup?.remove();
                if (liveMap.getZoom() >= 17.9) {
                  const chooser = document.createElement("div");
                  chooser.className = "map-rental-chooser";
                  chooser.setAttribute("role", "group");
                  chooser.setAttribute("aria-label", "Rentals at this location");
                  const heading = document.createElement("strong");
                  heading.textContent = "Choose a sample rental";
                  chooser.append(heading);
                  members.forEach((rental) => {
                    const choice = document.createElement("button");
                    choice.type = "button";
                    choice.dataset.listingId = rental.id;
                    choice.textContent = `${rental.title} · ${price(rental)} / mo`;
                    choice.addEventListener("click", () => { popup?.remove(); latest.current.onSelect(rental.id); });
                    chooser.append(choice);
                  });
                  popup = new Popup({ closeButton: true, maxWidth: "280px", focusAfterOpen: true })
                    .setLngLat(first.coordinates).setDOMContent(chooser).addTo(liveMap);
                  popup.getElement().addEventListener("keydown", (keyEvent) => {
                    if (keyEvent.key === "Escape") { popup?.remove(); button.focus(); }
                  });
                } else {
                  const bounds = new LngLatBounds(first.coordinates, first.coordinates);
                  members.forEach((rental) => bounds.extend(rental.coordinates));
                  // Cluster exploration reveals loaded results and never commits a search.
                  movedByUser = false;
                  liveMap.fitBounds(bounds, { padding: 60, maxZoom: 18, duration: reduceMotion() ? 0 : 350 });
                }
              });
            }
            markers.push(new Marker({ element: button, anchor: "center" }).setLngLat(first.coordinates).addTo(liveMap));
            if (focusedId === first.id && members.length === 1) button.focus({ preventScroll: true });
          }
        };

        syncHoverRef.current = (hoveredId: string | null) => {
          for (const marker of markers) {
            const el = marker.getElement();
            const isHovered = Boolean(
              hoveredId && (
                el.dataset.listingId === hoveredId ||
                el.dataset.memberIds?.split(",").includes(hoveredId)
              )
            );
            el.classList.toggle("is-hovered", isHovered);
          }
        };

        const renderScope = () => {
          (liveMap.getSource("search-circle") as GeoJSONSource | undefined)?.setData(circleData(latest.current.scope));
          (liveMap.getSource("pending-circle") as GeoJSONSource | undefined)?.setData(circleData(latest.current.pendingScope));
          const active = latest.current.scope;
          (liveMap.getSource("search-center") as GeoJSONSource | undefined)?.setData(active.mode === "viewport" ? emptyCollection : {
            type: "Feature", properties: {}, geometry: { type: "Point", coordinates: active.center },
          });
        };
        syncRef.current = () => {
          if (!ready) return;
          popup?.remove();
          renderScope();
          renderMarkers();
        };

        liveMap.on("movestart", (event) => { movedByUser = Boolean(event.originalEvent); });
        liveMap.on("move", (event) => { if (event.originalEvent) movedByUser = true; });
        liveMap.on("moveend", () => {
          if (!ready || disposed) return;
          renderMarkers();
          latest.current.onViewChange(readMapView(liveMap), movedByUser);
          movedByUser = false;
        });
        liveMap.on("load", () => {
          if (disposed) return;
          window.clearTimeout(timeout);
          const beforeLabel = liveMap.getStyle().layers?.find((layer) => layer.type === "symbol")?.id;
          liveMap.addSource("search-circle", { type: "geojson", data: circleData(latest.current.scope) });
          liveMap.addSource("pending-circle", { type: "geojson", data: circleData(latest.current.pendingScope) });
          liveMap.addSource("search-center", { type: "geojson", data: emptyCollection });
          liveMap.addLayer({ id: "search-circle-fill", type: "fill", source: "search-circle", paint: { "fill-color": "#0066d5", "fill-opacity": 0.08 } }, beforeLabel);
          liveMap.addLayer({ id: "search-circle-line", type: "line", source: "search-circle", paint: { "line-color": "#0066d5", "line-width": 2 } }, beforeLabel);
          liveMap.addLayer({ id: "pending-circle-line", type: "line", source: "pending-circle", paint: { "line-color": "#0284c7", "line-width": 2, "line-dasharray": [3, 2] } }, beforeLabel);
          liveMap.addLayer({ id: "search-center-dot", type: "circle", source: "search-center", paint: { "circle-radius": 5, "circle-color": "#0066d5", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
          ready = true;
          setState("ready");
          renderScope();
          renderMarkers();
          latest.current.onViewChange(readMapView(liveMap), false);
          latest.current.onReady?.();
        });
        liveMap.on("error", (event) => {
          if (process.env.NODE_ENV === "development") console.warn("Map rendering failed:", event.error.message);
          if (!disposed && !ready) setState("error");
        });
        observer = new ResizeObserver(() => {
          if (disposed) return;
          movedByUser = false;
          liveMap.resize();
          if (ready) latest.current.onViewChange(readMapView(liveMap), false);
        });
        observer.observe(container.current);
      } catch {
        window.clearTimeout(timeout);
        if (!disposed) setState("error");
      }
    }

    void initialize();
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      observer?.disconnect();
      syncRef.current = null;
      syncHoverRef.current = null;
      mapRef.current = null;
      popup?.remove();
      markers.forEach((marker) => marker.remove());
      map?.remove();
    };
  }, [attempt]);

  useEffect(() => { syncRef.current?.(); }, [props.rentals, props.scope, props.pendingScope, props.selectedId]);
  useEffect(() => { syncHoverRef.current?.(props.hoveredId ?? null); }, [props.hoveredId]);

  useEffect(() => {
    if (!props.focus || state !== "ready") return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350;
    if (props.focus.radiusMeters) {
      const ring = circleGeoJSON(props.focus.center, props.focus.radiusMeters).geometry.coordinates[0];
      const lngs = ring.map((point) => point[0]);
      const lats = ring.map((point) => point[1]);
      mapRef.current?.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 32, duration, maxZoom: 16 });
    } else {
      mapRef.current?.easeTo({ center: props.focus.center, zoom: props.focus.zoom ?? mapRef.current.getZoom(), duration });
    }
  }, [props.focus, state]);

  return (
    <section className="map-surface" aria-label="Interactive map of Metro Cebu sample rentals" data-map-state={state}>
      <div className="map-canvas" ref={container} />
      {state !== "ready" && (
        <div className="map-status" role="status">
          <MapPin size={22} aria-hidden="true" />
          <p>{state === "loading" ? "Opening Cebu’s map…" : "The map couldn’t load."}</p>
          {state === "error" && (
            <>
              <span>You can still browse sample rentals in the list.</span>
              <Button variant="outline" onClick={() => { setState("loading"); setAttempt((value) => value + 1); }}>
                <RotateCcw aria-hidden="true" /> Retry map
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
