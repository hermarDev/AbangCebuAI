"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import {
  ChevronDown,
  Minus,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SearchFilters, SearchScope } from "@/contracts/preview";
import {
  BathroomType,
  CurfewType,
  DEFAULT_RENTAL_FILTERS,
  PropertyType,
  RentalFilters,
} from "@/contracts/rental-filters";
import { searchPreviewRentals } from "@/features/search/preview-search";

export interface FinderFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RentalFilters | SearchFilters;
  scope: SearchScope;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onApply: (filters: RentalFilters) => void;
  onReset: () => void;
}

const PROPERTY_TYPE_OPTIONS: { id: PropertyType; label: string }[] = [
  { id: "bedspace", label: "Bedspace" },
  { id: "boarding_house", label: "Boarding house" },
  { id: "private_room", label: "Private room" },
  { id: "shared_room", label: "Shared room" },
  { id: "studio", label: "Studio" },
  { id: "apartment", label: "Apartment" },
  { id: "condo", label: "Condo" },
  { id: "house", label: "House" },
];

function normalizeToRentalFilters(f: RentalFilters | SearchFilters): RentalFilters {
  const base: RentalFilters = { ...DEFAULT_RENTAL_FILTERS };
  if ("minPrice" in f && f.minPrice !== undefined) base.minPrice = f.minPrice;
  if ("maxPrice" in f && f.maxPrice !== undefined) base.maxPrice = f.maxPrice;

  if ("propertyTypes" in f && Array.isArray(f.propertyTypes)) {
    base.propertyTypes = [...f.propertyTypes];
  } else if ("type" in f && f.type !== "all" && f.type !== undefined) {
    if (f.type === "room") base.propertyTypes = ["private_room"];
    else if (f.type === "boarding-house") base.propertyTypes = ["boarding_house"];
    else base.propertyTypes = [f.type as PropertyType];
  }

  if ("wifi" in f) base.wifiAvailable = f.wifi;
  if ("wifiAvailable" in f && f.wifiAvailable !== undefined) base.wifiAvailable = f.wifiAvailable;
  if ("occupants" in f && f.occupants !== undefined) base.occupants = f.occupants;
  if ("bathroom" in f && f.bathroom !== undefined) base.bathroom = f.bathroom;
  if ("tenantPolicy" in f && f.tenantPolicy !== undefined) base.tenantPolicy = f.tenantPolicy;
  if ("cookingAllowed" in f && f.cookingAllowed !== undefined) base.cookingAllowed = f.cookingAllowed;
  if ("laundryAllowed" in f && f.laundryAllowed !== undefined) base.laundryAllowed = f.laundryAllowed;
  if ("curfewType" in f && f.curfewType !== undefined) base.curfewType = f.curfewType;
  if ("waterIncluded" in f && f.waterIncluded !== undefined) base.waterIncluded = f.waterIncluded;
  if ("electricityIncluded" in f && f.electricityIncluded !== undefined) base.electricityIncluded = f.electricityIncluded;
  if ("motorcycleParking" in f && f.motorcycleParking !== undefined) base.motorcycleParking = f.motorcycleParking;
  if ("carParking" in f && f.carParking !== undefined) base.carParking = f.carParking;
  if ("verifiedOnly" in f && f.verifiedOnly !== undefined) base.verifiedOnly = f.verifiedOnly;
  if ("directLandlordOnly" in f && f.directLandlordOnly !== undefined) base.directLandlordOnly = f.directLandlordOnly;
  if ("aircon" in f && f.aircon !== undefined) base.aircon = f.aircon;

  return base;
}

export function FinderFilterPanel({
  open,
  onOpenChange,
  filters,
  scope,
  returnFocusRef,
  onApply,
  onReset,
}: FinderFilterPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  const [draftFilters, setDraftFilters] = useState<RentalFilters>(() =>
    normalizeToRentalFilters(filters)
  );

  // Sync draft filters whenever dialog opens
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraftFilters(normalizeToRentalFilters(filters));
    }
  }

  const draftMatchCount = useMemo(() => {
    try {
      return searchPreviewRentals(scope, draftFilters).length;
    } catch {
      return 0;
    }
  }, [scope, draftFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(draftFilters);
  };

  const handleReset = () => {
    setDraftFilters(DEFAULT_RENTAL_FILTERS);
    onReset();
  };

  const togglePropertyType = (pType: PropertyType) => {
    setDraftFilters((prev) => {
      const exists = prev.propertyTypes.includes(pType);
      const nextTypes = exists
        ? prev.propertyTypes.filter((t) => t !== pType)
        : [...prev.propertyTypes, pType];
      return { ...prev, propertyTypes: nextTypes };
    });
  };

  const handleOccupantsStep = (delta: number) => {
    setDraftFilters((prev) => {
      const current = prev.occupants ?? 1;
      const next = Math.max(1, Math.min(10, current + delta));
      return { ...prev, occupants: next };
    });
  };

  // Helper for single-select dropdown compatibility with existing tests
  const legacyTypeValue = useMemo(() => {
    if (draftFilters.propertyTypes.length === 0) return "all";
    if (draftFilters.propertyTypes.length === 1) {
      const t = draftFilters.propertyTypes[0];
      if (t === "private_room") return "room";
      if (t === "boarding_house") return "boarding-house";
      if (t === "bedspace") return "bedspace";
    }
    return "all";
  }, [draftFilters.propertyTypes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={dialogRef}
        className="filter-dialog"
        showCloseButton
        tabIndex={-1}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          dialogRef.current?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          window.requestAnimationFrame(() => returnFocusRef.current?.focus());
        }}
      >
        <DialogHeader>
          <div className="filter-header-badge">
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>Cebu Rental Filters</span>
          </div>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Find a place that fits your real living needs in Metro Cebu.
          </DialogDescription>
        </DialogHeader>

        <form className="filter-form" onSubmit={handleSubmit}>
          <div className="filter-scroll-body">
            {/* 1. Monthly Rent */}
            <section className="filter-group">
              <span className="filter-group-title">MONTHLY RENT</span>
              <div className="filter-budget-grid">
                <div className="filter-budget-input-wrapper">
                  <label htmlFor="min-rent-input">Min (₱)</label>
                  <input
                    id="min-rent-input"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="₱ Min"
                    className="filter-number-input"
                    value={draftFilters.minPrice ?? ""}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        minPrice: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  />
                </div>
                <div className="filter-budget-input-wrapper">
                  <label htmlFor="max-rent-input">Max (₱)</label>
                  <input
                    id="max-rent-input"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="₱ Max"
                    className="filter-number-input"
                    value={draftFilters.maxPrice ?? ""}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        maxPrice: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Accessible Quick Select Dropdown for Existing Tests & Convenience */}
              <div className="filter-select-wrapper mt-2">
                <select
                  id="max-rent-select"
                  aria-label="Maximum monthly rent"
                  className="filter-input-select"
                  value={draftFilters.maxPrice !== null && draftFilters.maxPrice !== undefined ? String(draftFilters.maxPrice) : ""}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      maxPrice: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                >
                  <option value="">Any budget</option>
                  <option value="2000">₱2,000 / month</option>
                  <option value="2500">₱2,500 / month</option>
                  <option value="3000">₱3,000 / month</option>
                  <option value="5000">₱5,000 / month</option>
                  <option value="7000">₱7,000 / month</option>
                  <option value="10000">₱10,000 / month</option>
                </select>
                <ChevronDown size={14} className="filter-select-chevron" aria-hidden="true" />
              </div>

              {/* Quick Budget Chips */}
              <div className="filter-chip-row mt-2" role="group" aria-label="Budget presets">
                {[
                  { label: "≤ ₱2.5k", val: 2500 },
                  { label: "≤ ₱3.5k", val: 3500 },
                  { label: "≤ ₱5k", val: 5000 },
                  { label: "≤ ₱8k", val: 8000 },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    type="button"
                    className={`filter-tag-chip ${draftFilters.maxPrice === val ? "is-selected" : ""}`}
                    onClick={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        maxPrice: prev.maxPrice === val ? null : val,
                      }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Property Type (Multi-Select Pills + Legacy Select) */}
            <section className="filter-group">
              <span className="filter-group-title">PROPERTY TYPE</span>
              <div className="filter-tag-cloud" role="group" aria-label="Property types">
                {PROPERTY_TYPE_OPTIONS.map((opt) => {
                  const selected = draftFilters.propertyTypes.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`filter-tag-chip ${selected ? "is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => togglePropertyType(opt.id)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Hidden/Synchronized Select for Existing Playwright Tests */}
              <div className="filter-select-wrapper mt-2">
                <select
                  id="rental-type-select"
                  aria-label="Rental type"
                  className="filter-input-select"
                  value={legacyTypeValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraftFilters((prev) => {
                      if (val === "all") return { ...prev, propertyTypes: [] };
                      if (val === "room") return { ...prev, propertyTypes: ["private_room"] };
                      if (val === "boarding-house") return { ...prev, propertyTypes: ["boarding_house"] };
                      if (val === "bedspace") return { ...prev, propertyTypes: ["bedspace"] };
                      return { ...prev, propertyTypes: [val as PropertyType] };
                    });
                  }}
                >
                  <option value="all">All types</option>
                  <option value="room">Private room</option>
                  <option value="bedspace">Bedspace</option>
                  <option value="boarding-house">Boarding house</option>
                </select>
                <ChevronDown size={14} className="filter-select-chevron" aria-hidden="true" />
              </div>
            </section>

            {/* 3. Occupancy */}
            <section className="filter-group">
              <div className="filter-group-header-row">
                <span className="filter-group-title">OCCUPANCY</span>
                <span className="filter-subtext">People staying</span>
              </div>
              <div className="filter-stepper-row">
                <div className="filter-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleOccupantsStep(-1)}
                    disabled={(draftFilters.occupants ?? 1) <= 1}
                    aria-label="Decrease occupants"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="stepper-value" aria-live="polite">
                    {draftFilters.occupants ? `${draftFilters.occupants} pax` : "Any pax"}
                  </span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleOccupantsStep(1)}
                    aria-label="Increase occupants"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="filter-chip-row">
                  {[
                    { label: "Solo", val: 1 },
                    { label: "2 pax", val: 2 },
                    { label: "3 pax", val: 3 },
                    { label: "4+ pax", val: 4 },
                  ].map(({ label, val }) => (
                    <button
                      key={val}
                      type="button"
                      className={`filter-tag-chip ${draftFilters.occupants === val ? "is-selected" : ""}`}
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          occupants: prev.occupants === val ? null : val,
                        }))
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Room & Bathroom */}
            <section className="filter-group">
              <span className="filter-group-title">BATHROOM & PRIVACY</span>
              <div className="filter-pill-grid">
                {[
                  { id: null, label: "Any CR" },
                  { id: "private", label: "Own / Private CR" },
                  { id: "shared", label: "Shared / Common CR" },
                ].map(({ id, label }) => {
                  const selected = draftFilters.bathroom === id;
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`filter-tag-chip ${selected ? "is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          bathroom: id as BathroomType | null,
                        }))
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 5. Daily Living & Rules */}
            <section className="filter-group">
              <span className="filter-group-title">DAILY LIVING</span>
              <div className="filter-checkbox-grid">
                <label className="checkbox-row" htmlFor="cooking-checkbox">
                  <input
                    type="checkbox"
                    id="cooking-checkbox"
                    checked={draftFilters.cookingAllowed === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        cookingAllowed: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Can cook</span>
                </label>

                <label className="checkbox-row" htmlFor="laundry-checkbox">
                  <input
                    type="checkbox"
                    id="laundry-checkbox"
                    checked={draftFilters.laundryAllowed === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        laundryAllowed: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Can do laundry</span>
                </label>
              </div>

              <div className="filter-pill-grid mt-2">
                {[
                  { id: null, label: "Any curfew" },
                  { id: "none", label: "No curfew" },
                  { id: "fixed", label: "Has curfew" },
                ].map(({ id, label }) => {
                  const selected = draftFilters.curfewType === id;
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`filter-tag-chip ${selected ? "is-selected" : ""}`}
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          curfewType: id as CurfewType | null,
                        }))
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 6. Utilities & Amenities */}
            <section className="filter-group">
              <span className="filter-group-title">UTILITIES & AMENITIES</span>
              <div className="filter-checkbox-grid">
                <label className="checkbox-row" htmlFor="wifi-checkbox">
                  <input
                    type="checkbox"
                    id="wifi-checkbox"
                    name="Wi-Fi"
                    aria-label="Wi-Fi"
                    checked={draftFilters.wifiAvailable === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        wifiAvailable: e.target.checked,
                      }))
                    }
                  />
                  <span>Wi-Fi</span>
                </label>

                <label className="checkbox-row" htmlFor="aircon-checkbox">
                  <input
                    type="checkbox"
                    id="aircon-checkbox"
                    checked={draftFilters.aircon === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        aircon: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Air conditioning</span>
                </label>

                <label className="checkbox-row" htmlFor="water-inc-checkbox">
                  <input
                    type="checkbox"
                    id="water-inc-checkbox"
                    checked={draftFilters.waterIncluded === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        waterIncluded: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Water included</span>
                </label>

                <label className="checkbox-row" htmlFor="power-inc-checkbox">
                  <input
                    type="checkbox"
                    id="power-inc-checkbox"
                    checked={draftFilters.electricityIncluded === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        electricityIncluded: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Electricity included</span>
                </label>
              </div>
            </section>

            {/* 7. Parking & Trust */}
            <section className="filter-group">
              <span className="filter-group-title">PARKING & TRUST</span>
              <div className="filter-checkbox-grid">
                <label className="checkbox-row" htmlFor="motorcycle-checkbox">
                  <input
                    type="checkbox"
                    id="motorcycle-checkbox"
                    checked={draftFilters.motorcycleParking === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        motorcycleParking: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Motorcycle parking</span>
                </label>

                <label className="checkbox-row" htmlFor="car-parking-checkbox">
                  <input
                    type="checkbox"
                    id="car-parking-checkbox"
                    checked={draftFilters.carParking === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        carParking: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Car parking</span>
                </label>

                <label className="checkbox-row" htmlFor="verified-checkbox">
                  <input
                    type="checkbox"
                    id="verified-checkbox"
                    checked={draftFilters.verifiedOnly === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        verifiedOnly: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Verified listings only</span>
                </label>

                <label className="checkbox-row" htmlFor="direct-landlord-checkbox">
                  <input
                    type="checkbox"
                    id="direct-landlord-checkbox"
                    checked={draftFilters.directLandlordOnly === true}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        directLandlordOnly: e.target.checked ? true : null,
                      }))
                    }
                  />
                  <span>Direct landlord</span>
                </label>
              </div>
            </section>
          </div>

          {draftMatchCount === 0 && (
            <div className="filter-zero-hint" role="status">
              <Sparkles size={14} />
              <span>No matches — try widening your budget or removing a filter.</span>
            </div>
          )}

          <DialogFooter className="filter-footer">
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw size={14} className="mr-1" />
              Reset
            </Button>
            <Button
              type="submit"
              aria-label={`Apply filters - Show ${draftMatchCount} ${
                draftMatchCount === 1 ? "rental" : "rentals"
              }`}
            >
              Show {draftMatchCount} {draftMatchCount === 1 ? "rental" : "rentals"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
