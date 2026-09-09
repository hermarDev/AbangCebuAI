"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RentalResult, SearchScope } from "@/contracts/preview";
import { RentalCard } from "@/features/listings/rental-card";
import { scopeLabel } from "@/features/search/preview-search";

export interface FinderResultsRailProps {
  rentals: RentalResult[];
  scope: SearchScope;
  selectedId: string | null;
  hoveredId: string | null;
  mobileExpanded: boolean;
  onToggleMobileExpanded: (expanded: boolean) => void;
  onSelectRental: (id: string) => void;
  onOpenDetails: (id: string) => void;
  onHoverRental: (id: string | null) => void;
  onResetFilters: () => void;
}

export function FinderResultsRail({
  rentals,
  scope,
  selectedId,
  hoveredId,
  mobileExpanded,
  onToggleMobileExpanded,
  onSelectRental,
  onOpenDetails,
  onHoverRental,
  onResetFilters,
}: FinderResultsRailProps) {
  return (
    <aside className={`rental-results-rail ${mobileExpanded ? "is-mobile-expanded" : ""}`}>
      <div className="results-header">
        <div className="results-title-group">
          <span className="results-eyebrow">
            <span className="status-dot" aria-hidden="true" /> AVAILABLE IN CEBU
          </span>
          <h2>Sample rentals</h2>
          <p className="results-count">
            {rentals.length} {rentals.length === 1 ? "sample listing" : "sample listings"} found
          </p>
        </div>

        <div className="results-scope-badge" title={scopeLabel(scope)}>
          <MapPin size={13} aria-hidden="true" />
          <span>{scopeLabel(scope)}</span>
        </div>

        {/* Mobile Sheet Toggle */}
        <div className="mobile-sheet-controls">
          {mobileExpanded ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleMobileExpanded(false)}
            >
              Show map
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleMobileExpanded(true)}
            >
              Expand results
            </Button>
          )}
        </div>
      </div>

      <div className="results-list" role="feed" aria-label="Sample rental listings">
        {rentals.length > 0 ? (
          rentals.map((rental) => (
            <RentalCard
              key={rental.id}
              rental={rental}
              selected={selectedId === rental.id}
              isHovered={hoveredId === rental.id}
              onSelect={() => onSelectRental(rental.id)}
              onDetails={() => onOpenDetails(rental.id)}
              onMouseEnter={() => onHoverRental(rental.id)}
              onMouseLeave={() => onHoverRental(null)}
            />
          ))
        ) : (
          <div className="no-matches-notice">
            <p className="no-matches-title">No sample rentals match</p>
            <p className="no-matches-desc">
              Try adjusting your budget, changing room type, or clearing active filters to see available listings in this area.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
