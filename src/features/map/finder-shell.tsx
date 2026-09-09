"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MapFocus, MapView, RentalResult, SearchScope } from "@/contracts/preview";
import type { PlaceResult } from "@/contracts/places";
import { DEFAULT_RENTAL_FILTERS, type RentalFilters } from "@/contracts/rental-filters";
import { SAMPLE_RENTALS } from "@/features/listings/preview-rentals";
import { searchPreviewRentals } from "@/features/search/preview-search";
import { closePreviewRental, openPreviewRental } from "@/features/search/preview-url";
import { useRentalQuery, writeRentalQuery } from "@/features/search/rental-filter-url";
import { ChatLauncher } from "@/features/chat/chat-launcher";
import {
  FinderAccountDialog, FinderDetailsDialog, FinderDrawer, FinderFilterPanel,
  FinderMapSection, FinderQuickFilters, FinderResultsRail, FinderSearchBar,
} from "./components";

export function FinderShell() {
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const query = useRentalQuery();
  const { scope, filters } = query;

  const [pendingScope, setPendingScope] = useState<SearchScope | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);

  // Compute available sample rentals based on current scope and filters
  const rentals: RentalResult[] = useMemo(() => {
    try {
      return searchPreviewRentals(scope, filters);
    } catch {
      return [];
    }
  }, [scope, filters]);

  // Active rental for the details modal
  const activeRental = useMemo(() => {
    if (!query.rentalId) return null;
    return SAMPLE_RENTALS.find((r) => r.id === query.rentalId) ?? null;
  }, [query.rentalId]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== null && filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) count++;
    if (filters.propertyTypes && filters.propertyTypes.length > 0) count++;
    if (filters.occupants !== null && filters.occupants !== undefined) count++;
    if (filters.bathroom) count++;
    if (filters.tenantPolicy && filters.tenantPolicy !== "any") count++;
    if (filters.cookingAllowed === true) count++;
    if (filters.laundryAllowed === true) count++;
    if (filters.curfewType) count++;
    if (filters.wifiAvailable === true) count++;
    if (filters.aircon === true) count++;
    if (filters.waterIncluded === true) count++;
    if (filters.electricityIncluded === true) count++;
    if (filters.motorcycleParking === true) count++;
    if (filters.carParking === true) count++;
    if (filters.verifiedOnly === true) count++;
    if (filters.directLandlordOnly === true) count++;
    return count;
  }, [filters]);

  const handleHoverRental = useCallback((id: string | null) => {
    setHoveredId(id);
    if (id) {
      document.getElementById(`rental-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  // Map view change callback from MapLibre
  const handleViewChange = useCallback((view: MapView, userInitiated: boolean) => {
    if (userInitiated && scope.mode !== "place-radius") {
      setPendingScope({ mode: "map-radius", center: view.center, radiusMeters: view.radiusMeters, label: "Map view" });
    }
  }, [scope.mode]);

  // Commit pending search area
  const handleCommitPendingArea = useCallback(() => {
    if (!pendingScope || (pendingScope.mode !== "viewport" && pendingScope.radiusMeters < 100)) return;
    setPendingScope(null);
    writeRentalQuery(pendingScope, filters);
  }, [pendingScope, filters]);

  // Select place from top bar dropdown / search
  const handleSelectPlace = useCallback((place: PlaceResult) => {
    const label = (place.id.startsWith("osm-") && place.detail ? `${place.name}, ${place.detail}` : place.name).slice(0, 80);
    const radiusMeters = scope.mode === "viewport" ? 2000 : scope.radiusMeters;
    const nextScope: SearchScope = { mode: "place-radius", center: place.coordinates, radiusMeters, label };
    setPendingScope(null);
    setMapFocus({ center: place.coordinates, radiusMeters, revision: Date.now() });
    writeRentalQuery(nextScope, filters);
  }, [filters, scope]);

  // Select a rental
  const handleSelectRental = useCallback((id: string) => {
    setSelectedId(id);
    const rental = SAMPLE_RENTALS.find((r) => r.id === id);
    if (rental) setMapFocus({ center: rental.coordinates, zoom: 15.5, revision: Date.now() });
  }, []);

  // Filter application & reset
  const handleApplyFilters = useCallback((nextFilters: RentalFilters) => {
    setFilterDialogOpen(false);
    writeRentalQuery(scope, nextFilters);
  }, [scope]);

  const handleResetFilters = useCallback(() => {
    setFilterDialogOpen(false);
    writeRentalQuery(scope, DEFAULT_RENTAL_FILTERS);
  }, [scope]);

  // Quick filter toggle handler (category chips)
  const handleToggleQuickFilter = useCallback((key: "budget2500" | "room" | "bedspace" | "wifi") => {
    const nextFilters: RentalFilters = { ...filters };
    if (key === "budget2500") nextFilters.maxPrice = filters.maxPrice === 2500 ? null : 2500;
    else if (key === "room") {
      const hasRoom = filters.propertyTypes.includes("private_room");
      nextFilters.propertyTypes = hasRoom ? [] : ["private_room"];
    } else if (key === "bedspace") {
      const hasBed = filters.propertyTypes.includes("bedspace");
      nextFilters.propertyTypes = hasBed ? [] : ["bedspace"];
    } else if (key === "wifi") {
      nextFilters.wifiAvailable = !filters.wifiAvailable;
    }
    writeRentalQuery(scope, nextFilters);
  }, [filters, scope]);

  // Re-center the map on the active search geometry.
  const handleRecenterMap = useCallback(() => {
    const center: MapFocus["center"] = scope.mode === "viewport"
      ? [(scope.bounds.west + scope.bounds.east) / 2, (scope.bounds.south + scope.bounds.north) / 2]
      : scope.center;
    setPendingScope(null);
    setMapFocus({ center, radiusMeters: scope.mode === "viewport" ? undefined : scope.radiusMeters, revision: Date.now() });
  }, [scope]);

  const handleApplyRadius = useCallback((radiusMeters: number, mode: "place-radius" | "map-radius") => {
    const center: MapFocus["center"] = scope.mode === "viewport"
      ? [(scope.bounds.west + scope.bounds.east) / 2, (scope.bounds.south + scope.bounds.north) / 2]
      : scope.center;
    const label = scope.mode === "place-radius" ? scope.label : "Chosen map center";
    setPendingScope(null);
    writeRentalQuery({ mode, center, radiusMeters, label }, filters);
    setMapFocus({ center, radiusMeters, revision: Date.now() });
  }, [scope, filters]);

  return (
    <div className="finder-app" data-search-mode={scope.mode} data-mobile-expanded={mobileExpanded}>
      <header className="site-header" data-location-open={locationPopoverOpen}>
        <div className="header-left">
          <FinderDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onOpenAccount={() => setAccountDialogOpen(true)}
          />
          <Link className="brand" href="/" aria-label="AbangCebu home">
            <Image src="/icons/logo_Only.png" alt="AbangCebu" width={34} height={34} priority className="brand-logo-mark" />
            <Image src="/icons/main_Logo.png" alt="AbangCebu" width={124} height={36} priority className="brand-logo-full" />
          </Link>
        </div>

        <FinderSearchBar
          scope={scope}
          filters={filters}
          locationPopoverOpen={locationPopoverOpen}
          setLocationPopoverOpen={setLocationPopoverOpen}
          onSelectPlace={handleSelectPlace}
        />

        <div className="header-right">
          <Button
            ref={profileButtonRef}
            variant="outline"
            size="sm"
            className="profile-button"
            aria-label="Sign in"
            onClick={() => setAccountDialogOpen(true)}
          >
            <User size={17} aria-hidden="true" />
            <span className="profile-label">Sign in</span>
          </Button>
        </div>
      </header>

      <FinderQuickFilters
        scope={scope}
        filters={filters}
        activeFilterCount={activeFilterCount}
        filterButtonRef={filterButtonRef}
        onToggleQuickFilter={handleToggleQuickFilter}
        onOpenFilters={() => setFilterDialogOpen(true)}
        onApplyRadius={handleApplyRadius}
      />

      <FinderFilterPanel
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filters={filters}
        scope={scope}
        returnFocusRef={filterButtonRef}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <FinderAccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        returnFocusRef={profileButtonRef}
      />

      <FinderDetailsDialog rental={activeRental} onClose={closePreviewRental} />

      <main id="main-content" className="explore-layout">
        <FinderResultsRail
          rentals={rentals}
          scope={scope}
          selectedId={selectedId}
          hoveredId={hoveredId}
          mobileExpanded={mobileExpanded}
          onToggleMobileExpanded={setMobileExpanded}
          onSelectRental={handleSelectRental}
          onOpenDetails={openPreviewRental}
          onHoverRental={handleHoverRental}
          onResetFilters={handleResetFilters}
        />

        <FinderMapSection
          rentals={rentals}
          scope={scope}
          pendingScope={pendingScope}
          selectedId={selectedId}
          hoveredId={hoveredId}
          mapFocus={mapFocus}
          onSelectRental={handleSelectRental}
          onHoverRental={handleHoverRental}
          onViewChange={handleViewChange}
          onCommitPendingArea={handleCommitPendingArea}
          onRecenterMap={handleRecenterMap}
        />
      </main>

      <ChatLauncher onSelectRental={handleSelectRental} />
    </div>
  );
}
