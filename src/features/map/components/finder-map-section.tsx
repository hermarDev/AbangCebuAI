"use client";

import dynamic from "next/dynamic";
import { Crosshair, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CebuMapProps,
  MapFocus,
  MapView,
  RentalResult,
  SearchScope,
} from "@/contracts/preview";
import { formatDistance } from "@/features/search/preview-search";

const CebuMap = dynamic<CebuMapProps>(() => import("../cebu-map"), {
  ssr: false,
  loading: () => (
    <div className="map-surface map-placeholder" role="status">
      Opening Cebu’s map…
    </div>
  ),
});

export interface FinderMapSectionProps {
  rentals: RentalResult[];
  scope: SearchScope;
  pendingScope: SearchScope | null;
  selectedId: string | null;
  hoveredId: string | null;
  mapFocus: MapFocus | null;
  onSelectRental: (id: string) => void;
  onHoverRental: (id: string | null) => void;
  onViewChange: (view: MapView, userInitiated: boolean) => void;
  onCommitPendingArea: () => void;
  onRecenterMap: () => void;
}

export function FinderMapSection({
  rentals,
  scope,
  pendingScope,
  selectedId,
  hoveredId,
  mapFocus,
  onSelectRental,
  onHoverRental,
  onViewChange,
  onCommitPendingArea,
  onRecenterMap,
}: FinderMapSectionProps) {
  const canCommitPendingArea = Boolean(
    pendingScope &&
      (pendingScope.mode === "viewport" || pendingScope.radiusMeters >= 100)
  );
  const pendingAreaDetail = pendingScope
    ? pendingScope.mode === "viewport"
      ? "Visible map"
      : `Within ${formatDistance(pendingScope.radiusMeters)}`
    : "";
  const recenterLabel = pendingScope
    ? "Return to current search area"
    : "Re-center map on search area";

  return (
    <section className="map-wrapper" aria-label="Map view">
      {pendingScope && (
        <div className="search-this-area-overlay">
          <span className="sr-only" aria-live="polite">
            Map moved. {canCommitPendingArea
              ? `New search area: ${pendingAreaDetail}.`
              : "Zoom out to search at least 100 metres."}
          </span>
          <Button
            className="search-this-area-btn"
            onClick={onCommitPendingArea}
            disabled={!canCommitPendingArea}
            aria-label={canCommitPendingArea
              ? `Search this area, ${pendingAreaDetail}`
              : "Zoom out to search at least 100 metres"}
            title={canCommitPendingArea
              ? "Update the rental results to this map area"
              : "Zoom out until the map can fit a 100 metre search area"}
          >
            <Search size={16} aria-hidden="true" />
            <span className="search-this-area-label">
              {canCommitPendingArea ? "Search this area" : "Zoom out to search"}
            </span>
            <span className="search-this-area-detail" aria-hidden="true">
              {canCommitPendingArea ? pendingAreaDetail : "Minimum 100 m"}
            </span>
          </Button>
        </div>
      )}

      {/* Floating map action aligned with the accessible zoom controls. */}
      <div className="map-floating-actions">
        <button
          type="button"
          className="map-action-btn map-locate-btn"
          onClick={onRecenterMap}
          aria-label={recenterLabel}
          title={recenterLabel}
        >
          <Crosshair size={18} aria-hidden="true" />
        </button>
      </div>

      <CebuMap
        rentals={rentals}
        scope={scope}
        pendingScope={pendingScope}
        selectedId={selectedId}
        hoveredId={hoveredId}
        focus={mapFocus}
        onSelect={onSelectRental}
        onHover={onHoverRental}
        onViewChange={onViewChange}
      />
    </section>
  );
}
