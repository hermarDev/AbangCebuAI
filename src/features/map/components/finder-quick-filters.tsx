"use client";

import { useState, type RefObject } from "react";
import { Home, SlidersHorizontal, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { SearchFilters, SearchScope } from "@/contracts/preview";
import type { PropertyType, RentalFilters } from "@/contracts/rental-filters";
import { RadiusControl } from "@/features/search/radius-control";

const BUDGET_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Any maximum" },
  { value: 2500, label: "Up to ₱2,500" },
  { value: 3500, label: "Up to ₱3,500" },
  { value: 5000, label: "Up to ₱5,000" },
  { value: 8000, label: "Up to ₱8,000" },
];

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string; shortLabel: string }[] = [
  { value: "private_room", label: "Private room", shortLabel: "Room" },
  { value: "bedspace", label: "Bedspace", shortLabel: "Bedspace" },
  { value: "boarding_house", label: "Boarding house", shortLabel: "Boarding" },
  { value: "shared_room", label: "Shared room", shortLabel: "Shared" },
  { value: "studio", label: "Studio", shortLabel: "Studio" },
  { value: "apartment", label: "Apartment", shortLabel: "Apartment" },
  { value: "condo", label: "Condo", shortLabel: "Condo" },
  { value: "house", label: "House", shortLabel: "House" },
];

function compactPeso(value: number) {
  if (value >= 1000 && value % 1000 === 0) return `₱${value / 1000}k`;
  if (value >= 1000) return `₱${(value / 1000).toFixed(1)}k`;
  return `₱${value.toLocaleString("en-PH")}`;
}

function BudgetControl({ value, onApply }: { value: number | null; onApply: (value: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<number | null>(value);
  const options = BUDGET_OPTIONS.some((option) => option.value === value)
    ? BUDGET_OPTIONS
    : [...BUDGET_OPTIONS, { value, label: `Up to ₱${value?.toLocaleString("en-PH")}` }];
  const summary = value === null ? "Any" : `≤ ${compactPeso(value)}`;

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setDraft(value); }}>
      <DialogTrigger asChild>
        <button type="button" className={`quick-filter-chip ${value !== null ? "has-value" : ""}`}
          aria-label={`Budget, ${value === null ? "any maximum" : `up to ${value.toLocaleString("en-PH")} pesos`}`}>
          <span className="quick-filter-label"><WalletCards size={13} aria-hidden="true" />Budget</span>
          <span className="quick-filter-value">{summary}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="quick-choice-dialog budget-choice-dialog">
        <DialogHeader>
          <DialogTitle>Maximum monthly rent</DialogTitle>
          <DialogDescription>Choose a quick ceiling. Set a full price range in All filters.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); onApply(draft); setOpen(false); }}>
          <fieldset className="quick-choice-fieldset">
            <legend className="sr-only">Maximum monthly rent</legend>
            <div className="quick-choice-list is-compact">
              {options.map((option) => (
                <label className="quick-choice-option" key={option.value ?? "any"}>
                  <input type="radio" name="quick-budget" value={option.value ?? ""}
                    checked={draft === option.value} onChange={() => setDraft(option.value)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="quick-choice-actions">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Apply budget</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TypeControl({ values, onApply }: { values: PropertyType[]; onApply: (values: PropertyType[]) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PropertyType[]>(values);
  const selected = PROPERTY_TYPE_OPTIONS.filter((option) => values.includes(option.value));
  const summary = selected.length === 0 ? "Any" : selected.length === 1 ? selected[0].shortLabel : `${selected.length} types`;

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setDraft(values); }}>
      <DialogTrigger asChild>
        <button type="button" className={`quick-filter-chip ${values.length > 0 ? "has-value" : ""}`}
          aria-label={`Property type, ${selected.length === 0 ? "any type" : selected.map((option) => option.label).join(", ")}`}>
          <span className="quick-filter-label"><Home size={13} aria-hidden="true" />Type</span>
          <span className="quick-filter-value">{summary}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="quick-choice-dialog type-choice-dialog">
        <DialogHeader>
          <DialogTitle>Property type</DialogTitle>
          <DialogDescription>Select one or more kinds of rental.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); onApply(draft); setOpen(false); }}>
          <fieldset className="quick-choice-fieldset">
            <div className="quick-choice-legend-row">
              <legend>Rental types</legend>
              <button type="button" className="quick-choice-clear" onClick={() => setDraft([])} disabled={draft.length === 0}>Clear</button>
            </div>
            <div className="quick-choice-grid">
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <label className="quick-choice-option is-checkbox" key={option.value}>
                  <input type="checkbox" value={option.value} checked={draft.includes(option.value)}
                    onChange={(event) => setDraft((current) => event.target.checked
                      ? [...current, option.value]
                      : current.filter((value) => value !== option.value))} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="quick-choice-actions">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Apply type</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface FinderQuickFiltersProps {
  scope: SearchScope;
  filters: RentalFilters | SearchFilters;
  additionalFilterCount: number;
  filterButtonRef: RefObject<HTMLButtonElement | null>;
  onApplyBudget: (maxPrice: number | null) => void;
  onApplyTypes: (propertyTypes: PropertyType[]) => void;
  onOpenFilters: () => void;
  onApplyRadius: (radiusMeters: number, mode: "place-radius" | "map-radius") => void;
}

export function FinderQuickFilters({
  scope, filters, additionalFilterCount, filterButtonRef,
  onApplyBudget, onApplyTypes, onOpenFilters, onApplyRadius,
}: FinderQuickFiltersProps) {
  const maxPrice = filters.maxPrice ?? null;
  const propertyTypes = "propertyTypes" in filters && filters.propertyTypes
    ? filters.propertyTypes
    : "type" in filters && filters.type !== "all"
      ? [filters.type === "room" ? "private_room" : filters.type === "boarding-house" ? "boarding_house" : filters.type as PropertyType]
      : [];

  return (
    <div className="quick-filters-bar" role="group" aria-label="Refine rental search">
      <div className="quick-filter-dock">
        <RadiusControl scope={scope} onApply={onApplyRadius} />
        <BudgetControl value={maxPrice} onApply={onApplyBudget} />
        <TypeControl values={propertyTypes} onApply={onApplyTypes} />
        <button ref={filterButtonRef} type="button"
          className={`quick-filter-chip quick-filter-all-btn ${additionalFilterCount > 0 ? "has-value" : ""}`}
          onClick={onOpenFilters}
          aria-label={`All filters${additionalFilterCount > 0 ? `, ${additionalFilterCount} more applied` : ""}`}>
          <span className="quick-filter-label"><SlidersHorizontal size={13} aria-hidden="true" />Filters</span>
          <span className="quick-filter-value">{additionalFilterCount > 0 ? `${additionalFilterCount} more` : "All"}</span>
          {additionalFilterCount > 0 && <span className="filter-badge" aria-hidden="true">{additionalFilterCount}</span>}
        </button>
      </div>
    </div>
  );
}
