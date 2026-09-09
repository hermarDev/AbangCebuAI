"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Compass,
  GraduationCap,
  MapPin,
  Search,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import type { PlaceResult } from "@/contracts/places";
import type { SearchFilters, SearchScope } from "@/contracts/preview";
import type { RentalFilters } from "@/contracts/rental-filters";
import { PREVIEW_PLACES } from "@/features/listings/preview-rentals";
import { usePlaceLookup } from "@/features/search/use-place-lookup";

const PLACE_GROUPS = ["All", "Areas", "Schools", "Landmarks"] as const;
type PlaceGroup = (typeof PLACE_GROUPS)[number];

function placeGroup(category?: string): PlaceGroup {
  if (category === "College" || category === "University") return "Schools";
  if (["Neighborhood", "City", "Downtown"].includes(category ?? "")) return "Areas";
  return "Landmarks";
}

export interface FinderSearchBarProps {
  scope: SearchScope;
  filters?: SearchFilters | RentalFilters;
  locationPopoverOpen: boolean;
  setLocationPopoverOpen: (open: boolean) => void;
  onSelectPlace: (place: PlaceResult) => void;
}

export function FinderSearchBar({
  scope,
  locationPopoverOpen,
  setLocationPopoverOpen,
  onSelectPlace,
}: FinderSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationGroup, setLocationGroup] = useState<PlaceGroup>("All");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const placesListRef = useRef<HTMLDivElement>(null);
  const placesListId = useId();

  const { search: searchPlaces, reset: resetLookup, ...lookup } = usePlaceLookup();

  // Determine which place anchor is currently active, if any
  const currentPlaceId = useMemo(() => {
    if (scope.mode === "place-radius") {
      // Prioritize explicit scope label match
      if (scope.label) {
        const lowerLabel = scope.label.toLowerCase();
        const byExactName = PREVIEW_PLACES.find(
          (p) =>
            p.coordinates[0] === scope.center[0] &&
            p.coordinates[1] === scope.center[1] &&
            (lowerLabel === p.name.toLowerCase() ||
              lowerLabel === `${p.name}, ${p.detail}`.toLowerCase())
        );
        if (byExactName) return byExactName.id;
      }
    }
    return "custom";
  }, [scope]);

  const currentPlaceLabel = useMemo(() => {
    if (currentPlaceId !== "custom") {
      const place = PREVIEW_PLACES.find((p) => p.id === currentPlaceId);
      if (place) {
        return `${place.name}${place.detail ? `, ${place.detail}` : ""}`;
      }
    }
    return scope.mode === "viewport"
      ? "Current map area"
      : scope.mode === "map-radius"
      ? "Map center"
      : scope.label;
  }, [currentPlaceId, scope]);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const places = lookup.status === "ready" ? lookup.places : PREVIEW_PLACES;
    return places.filter(
      (p) =>
        (locationGroup === "All" || placeGroup(p.category) === locationGroup) &&
        (lookup.status === "ready" ||
          p.name.toLowerCase().includes(q) ||
          p.detail.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)))
    );
  }, [searchQuery, locationGroup, lookup.status, lookup.places]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setLocationPopoverOpen(true);
      if (searchQuery.trim().length >= 3) {
        setLocationGroup("All");
        void searchPlaces(searchQuery);
      }
    },
    [searchQuery, searchPlaces, setLocationPopoverOpen]
  );

  const handleItemSelect = useCallback(
    (place: PlaceResult) => {
      setSearchQuery("");
      resetLookup();
      setLocationPopoverOpen(false);
      searchInputRef.current?.focus();
      onSelectPlace(place);
    },
    [onSelectPlace, resetLookup, setLocationPopoverOpen]
  );

  return (
    <div className="search-bar" role="search">
      <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
        <PopoverAnchor asChild>
          <div
            className={`search-place-trigger ${locationPopoverOpen ? "is-open" : ""}`}
            onClick={() => setLocationPopoverOpen(true)}
          >
            <button
              type="button"
              className="search-trigger-pin-wrap"
              aria-label="Search Metro Cebu"
              onClick={() => {
                if (searchQuery.trim().length >= 3) {
                  setLocationGroup("All");
                  void searchPlaces(searchQuery);
                }
              }}
            >
              <Search size={15} className="search-pin-icon" aria-hidden="true" />
            </button>
            <form className="search-input-form" onSubmit={handleSearchSubmit}>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input-field"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetLookup();
                  if (!locationPopoverOpen) setLocationPopoverOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setLocationPopoverOpen(true);
                    requestAnimationFrame(() =>
                      placesListRef.current
                        ?.querySelector<HTMLButtonElement>("button")
                        ?.focus()
                    );
                  }
                }}
                placeholder={currentPlaceLabel || "Search Cebu areas, colleges, landmarks..."}
                maxLength={120}
                autoComplete="off"
                aria-label="Search Cebu area"
                role="combobox"
                aria-autocomplete="list"
                aria-controls={locationPopoverOpen ? placesListId : undefined}
                aria-expanded={locationPopoverOpen}
                aria-haspopup="listbox"
              />
            </form>
            <span className="search-trigger-text sr-only" title={currentPlaceLabel}>
              {currentPlaceLabel}
            </span>
            {searchQuery ? (
              <button
                type="button"
                className="search-clear-btn"
                aria-label="Clear search"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  resetLookup();
                  searchInputRef.current?.focus();
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="search-clear-btn"
                aria-label="Browse Cebu locations"
                aria-expanded={locationPopoverOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setLocationPopoverOpen(!locationPopoverOpen);
                }}
              >
                <ChevronDown
                  size={14}
                  className={`search-chevron ${locationPopoverOpen ? "is-open" : ""}`}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="search-popover-content"
          align="center"
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={() => searchInputRef.current?.focus()}
        >
          <div className="search-popover-header">
            <span className="search-popover-eyebrow">
              <span>Where in Cebu?</span>
            </span>
            <span className="search-popover-sub">
              {lookup.status === "loading"
                ? "Searching Metro Cebu…"
                : searchQuery
                ? `Matching "${searchQuery}" (${filteredPlaces.length} found)`
                : "Choose an area to explore sample rentals"}
            </span>
          </div>
          {searchQuery.trim().length >= 3 && (
            <button
              className="search-online-button"
              type="button"
              disabled={lookup.status === "loading"}
              onClick={() => {
                setLocationGroup("All");
                void searchPlaces(searchQuery);
              }}
            >
              <Search size={14} aria-hidden="true" />
              {lookup.status === "loading"
                ? "Searching…"
                : "Search Metro Cebu places & addresses"}
            </button>
          )}
          {lookup.status === "error" && (
            <p className="search-lookup-message" role="alert">
              {lookup.error}
            </p>
          )}
          <div
            className="search-location-groups"
            role="group"
            aria-label="Location categories"
          >
            {PLACE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                aria-pressed={locationGroup === group}
                onClick={() => {
                  setLocationGroup(group);
                  placesListRef.current?.scrollTo({ top: 0 });
                }}
              >
                {group}
              </button>
            ))}
          </div>
          <div
            ref={placesListRef}
            id={placesListId}
            className="search-popover-list"
            role="listbox"
            aria-label="Cebu areas"
            onKeyDown={(event) => {
              if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
                return;
              event.preventDefault();
              const options = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  "button[role=option]"
                )
              );
              const index = options.indexOf(
                document.activeElement as HTMLButtonElement
              );
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                  ? options.length - 1
                  : (index +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      options.length) %
                    options.length;
              options[next]?.focus();
            }}
          >
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((p) => {
                const isSelected = currentPlaceId === p.id;
                const PlaceIcon =
                  placeGroup(p.category) === "Schools"
                    ? GraduationCap
                    : placeGroup(p.category) === "Landmarks"
                    ? Building2
                    : MapPin;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`search-popover-item ${isSelected ? "is-active" : ""}`}
                    onClick={() => {
                      handleItemSelect(p);
                    }}
                  >
                    <div className="popover-item-icon">
                      <PlaceIcon size={17} aria-hidden="true" />
                    </div>
                    <div className="popover-item-info">
                      <div className="popover-item-name-row">
                        <span className="popover-item-name">{p.name}</span>
                      </div>
                      {p.detail && (
                        <span className="popover-item-detail">
                          {p.detail}
                          {p.category ? ` · ${p.category}` : ""}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="popover-item-check" aria-hidden="true">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="search-popover-empty">
                <p>
                  {searchQuery
                    ? `No locations match “${searchQuery}”`
                    : "No locations in this category"}
                </p>
                <span>
                  {lookup.status === "ready"
                    ? "Try a nearby landmark or a more specific address in Metro Cebu."
                    : "Try a different name, choose All, or search Metro Cebu above."}
                </span>
              </div>
            )}
            {currentPlaceId === "custom" &&
              !searchQuery &&
              locationGroup === "All" && (
                <div
                  className="search-popover-item is-active is-custom"
                  role="option"
                  aria-selected={true}
                >
                  <div className="popover-item-icon">
                    <Compass size={14} aria-hidden="true" />
                  </div>
                  <div className="popover-item-info">
                    <span className="popover-item-name">
                      {currentPlaceLabel}
                    </span>
                    <span className="popover-item-detail">Current search center</span>
                  </div>
                  <div className="popover-item-check" aria-hidden="true">
                    <Check size={14} />
                  </div>
                </div>
              )}
          </div>
          <div className="search-popover-footer">
            <span role="status">
              {filteredPlaces.length}{" "}
              {filteredPlaces.length === 1 ? "place" : "places"}
            </span>
            {lookup.status === "ready" ? (
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
              >
                © OpenStreetMap · Photon
              </a>
            ) : (
              <span>Choose a place to move the map</span>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {locationPopoverOpen && (
        <button
          type="button"
          className="search-mobile-close"
          aria-label="Close location search"
          onClick={() => {
            setLocationPopoverOpen(false);
            searchInputRef.current?.blur();
          }}
        >
          <X size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
