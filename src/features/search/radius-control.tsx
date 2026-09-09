"use client";

import { useState } from "react";
import { CircleDashed, MapPin, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SearchScope } from "@/contracts/preview";
import { formatDistance } from "./preview-search";

type RadiusMode = "place-radius" | "map-radius";

export function RadiusControl({ scope, onApply }: { scope: SearchScope; onApply: (radius: number, mode: RadiusMode) => void }) {
  const [open, setOpen] = useState(false);
  const [radius, setRadius] = useState(2000);
  const [mode, setMode] = useState<RadiusMode>("place-radius");
  const currentRadius = scope.mode === "viewport" ? 2000 : scope.radiusMeters;
  const choices = [...new Set([500, 1000, 2000, 5000, 10000, currentRadius])].sort((a, b) => a - b);
  const compactValue = scope.mode === "viewport" ? "Visible" : formatDistance(scope.radiusMeters);
  const fullValue = scope.mode === "viewport"
    ? "visible map area"
    : `${scope.mode === "place-radius" ? "fixed within" : "map radius"} ${formatDistance(scope.radiusMeters)}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setRadius(currentRadius);
          setMode(scope.mode === "map-radius" ? "map-radius" : "place-radius");
        }
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="quick-filter-chip radius-chip has-value" aria-label={`Search area, ${fullValue}`}>
          <span className="quick-filter-label"><CircleDashed size={13} aria-hidden="true" />Area</span>
          <span className="quick-filter-value">{compactValue}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="quick-choice-dialog radius-dialog">
        <DialogHeader>
          <DialogTitle>Search area</DialogTitle>
          <DialogDescription>
            Choose whether this search stays near its current center or follows the map.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onApply(radius, mode);
            setOpen(false);
          }}
        >
          <fieldset className="quick-choice-fieldset search-mode-fieldset">
            <legend>How should the area behave?</legend>
            <div className="search-mode-cards">
              <label className="search-mode-card">
                <input
                  type="radio"
                  name="search-area-mode"
                  value="place-radius"
                  checked={mode === "place-radius"}
                  onChange={() => setMode("place-radius")}
                />
                <MapPin size={20} aria-hidden="true" />
                <span>
                  <strong>Keep this center</strong>
                  <small>The circle stays in place while you browse the map.</small>
                </span>
              </label>
              <label className="search-mode-card">
                <input
                  type="radio"
                  name="search-area-mode"
                  value="map-radius"
                  checked={mode === "map-radius"}
                  onChange={() => setMode("map-radius")}
                />
                <Move size={20} aria-hidden="true" />
                <span>
                  <strong>Follow the map</strong>
                  <small>Pan or zoom, then use Search this area to update results.</small>
                </span>
              </label>
            </div>
          </fieldset>

          {mode === "place-radius" ? (
            <fieldset className="quick-choice-fieldset radius-distance-fieldset">
              <legend>Distance from the center</legend>
              <div className="radius-choice-grid">
                {choices.map((value) => (
                  <label className="radius-choice" key={value}>
                    <input
                      type="radio"
                      name="search-radius"
                      value={value}
                      checked={radius === value}
                      onChange={() => setRadius(value)}
                    />
                    <span>{formatDistance(value)}</span>
                  </label>
                ))}
              </div>
              <p className="radius-field-hint">Straight-line distance. Supported range: 100 m–10 km.</p>
            </fieldset>
          ) : (
            <div className="radius-mode-note">
              <CircleDashed size={18} aria-hidden="true" />
              <p>The dashed circle previews the map area. Results change only after you choose <strong>Search this area</strong>.</p>
            </div>
          )}

          <div className="quick-choice-actions">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Apply search area</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
