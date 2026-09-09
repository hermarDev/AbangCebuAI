"use client";

import type { RefObject } from "react";
import { SlidersHorizontal, Wifi } from "lucide-react";
import type { SearchFilters, SearchScope } from "@/contracts/preview";
import type { RentalFilters } from "@/contracts/rental-filters";
import { RadiusControl } from "@/features/search/radius-control";

export interface FinderQuickFiltersProps {
  scope: SearchScope;
  filters: RentalFilters | SearchFilters;
  activeFilterCount: number;
  filterButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleQuickFilter: (key: "budget2500" | "room" | "bedspace" | "wifi") => void;
  onOpenFilters: () => void;
  onApplyRadius: (radiusMeters: number, mode: "place-radius" | "map-radius") => void;
}

export function FinderQuickFilters({
  scope,
  filters,
  activeFilterCount,
  filterButtonRef,
  onToggleQuickFilter,
  onOpenFilters,
  onApplyRadius,
}: FinderQuickFiltersProps) {
  const activeFilterSummary = `${activeFilterCount} active ${
    activeFilterCount === 1 ? "filter" : "filters"
  }`;
  const isBudget2500 = filters.maxPrice === 2500;
  const isRoom =
    "propertyTypes" in filters && filters.propertyTypes
      ? filters.propertyTypes.includes("private_room")
      : "type" in filters && filters.type === "room";
  const isBedspace =
    "propertyTypes" in filters && filters.propertyTypes
      ? filters.propertyTypes.includes("bedspace")
      : "type" in filters && filters.type === "bedspace";
  const isWifi =
    ("wifi" in filters && filters.wifi) ||
    ("wifiAvailable" in filters && filters.wifiAvailable === true);

  return (
    <div className="quick-filters-bar" role="toolbar" aria-label="Quick filters">
      <div className="quick-filters-scroll" role="group" aria-label="Quick rental filters">
        <RadiusControl scope={scope} onApply={onApplyRadius} />
        <button
          type="button"
          className={`quick-filter-chip ${isBudget2500 ? "is-active" : ""}`}
          onClick={() => onToggleQuickFilter("budget2500")}
          aria-pressed={isBudget2500}
        >
          <span>≤ ₱2,500/mo</span>
        </button>
        <button
          type="button"
          className={`quick-filter-chip ${isRoom ? "is-active" : ""}`}
          onClick={() => onToggleQuickFilter("room")}
          aria-pressed={isRoom}
        >
          <span>Private room</span>
        </button>
        <button
          type="button"
          className={`quick-filter-chip ${isBedspace ? "is-active" : ""}`}
          onClick={() => onToggleQuickFilter("bedspace")}
          aria-pressed={isBedspace}
        >
          <span>Bedspace</span>
        </button>
        <button
          type="button"
          className={`quick-filter-chip ${isWifi ? "is-active" : ""}`}
          onClick={() => onToggleQuickFilter("wifi")}
          aria-pressed={isWifi}
        >
          <Wifi size={13} aria-hidden="true" />
          <span>Wi-Fi</span>
        </button>
      </div>

      <button
        ref={filterButtonRef}
        type="button"
        className={`quick-filter-chip quick-filter-all-btn ${
          activeFilterCount > 0 ? "is-active" : ""
        }`}
        onClick={onOpenFilters}
        aria-label="All filters"
        aria-describedby={activeFilterCount > 0 ? "active-filter-summary" : undefined}
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        <span className="quick-filter-all-label-desktop">All filters</span>
        <span className="quick-filter-all-label-mobile">Filters</span>
        {activeFilterCount > 0 && (
          <span className="filter-badge" aria-hidden="true">
            {activeFilterCount}
          </span>
        )}
      </button>
      {activeFilterCount > 0 && (
        <span id="active-filter-summary" className="sr-only" aria-live="polite">
          {activeFilterSummary}
        </span>
      )}
    </div>
  );
}
