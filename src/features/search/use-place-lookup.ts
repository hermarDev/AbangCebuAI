"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { placesResponseSchema, type PlaceResult } from "@/contracts/places";

type Lookup = { status: "idle" | "loading" | "ready" | "error"; places: PlaceResult[]; error?: string };
export function usePlaceLookup() {
  const [lookup, setLookup] = useState<Lookup>({ status: "idle", places: [] });
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const reset = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setLookup({ status: "idle", places: [] });
  }, []);
  const search = useCallback(async (query: string) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLookup({ status: "loading", places: [] });
    try {
      const response = await fetch(`/api/places?${new URLSearchParams({ q: query.trim() })}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Place search is unavailable. Retry or choose a preset area.");
      const data = placesResponseSchema.parse(await response.json());
      if (active.current === controller) setLookup({ status: "ready", places: data.places });
    } catch {
      if (active.current === controller && !controller.signal.aborted) {
        setLookup({ status: "error", places: [], error: "Place search is unavailable. Retry or choose a preset area." });
      }
    }
  }, []);
  return { ...lookup, search, reset };
}
