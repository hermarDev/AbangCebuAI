"use client";

import { useId, useState } from "react";
import { CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { SearchScope } from "@/contracts/preview";
import { formatDistance } from "./preview-search";

export function RadiusControl({ scope, onApply }: { scope: SearchScope; onApply: (radius: number, mode: "place-radius" | "map-radius") => void }) {
  const [open, setOpen] = useState(false);
  const [radius, setRadius] = useState(2000);
  const [mode, setMode] = useState<"place-radius" | "map-radius">("place-radius");
  const radiusId = useId();
  const modeId = useId();
  const currentRadius = scope.mode === "viewport" ? 2000 : scope.radiusMeters;
  const choices = [...new Set([500, 1000, 2000, 5000, 10000, currentRadius])].sort((a, b) => a - b);
  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { setRadius(currentRadius); setMode(scope.mode === "map-radius" ? "map-radius" : "place-radius"); } }}>
      <DialogTrigger asChild>
        <button type="button" className="quick-filter-chip radius-chip" aria-label="Change search radius">
          <CircleDashed size={14} aria-hidden="true" />
          {scope.mode === "viewport" ? "Map area" : `Within ${formatDistance(scope.radiusMeters)}`}
        </button>
      </DialogTrigger>
      <DialogContent className="radius-dialog">
        <DialogHeader>
          <DialogTitle>How far from here?</DialogTitle>
          <DialogDescription>
            Search around {scope.mode === "place-radius" ? scope.label : "the search center"}.
            Distances are in a straight line, not walking distance.
          </DialogDescription>
        </DialogHeader>
        <div className="radius-field">
          <label htmlFor={modeId}>Search area behavior</label>
          <select id={modeId} value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
            <option value="place-radius">Keep this center and radius</option>
            <option value="map-radius">Follow the map view</option>
          </select>
        </div>
        <div className="radius-field">
          <label htmlFor={radiusId}>Search radius</label>
          <select id={radiusId} value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
            {choices.map((value) => <option key={value} value={value}>{formatDistance(value)}</option>)}
          </select>
        </div>
        <p className="radius-explanation">
          The solid blue circle shows the active search. A fixed search stays in
          place when you pan. In map-view mode, the dashed circle previews a new
          area; choose “Search this area” to apply it. Supported radius: 100 m–10 km.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { onApply(radius, mode); setOpen(false); }}>Apply radius</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
