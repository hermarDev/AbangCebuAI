import { expect, test } from "@playwright/test";

test("server liveness is uncached and unknown routes return 404", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["cache-control"]).toBe("no-store");
  expect(await health.json()).toEqual({ status: "ok", service: "abangcebu-ai" });
  for (const filename of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
    const asset = await request.get("/maplibre/" + filename);
    expect(asset.status()).toBe(200);
    expect(asset.headers()["content-type"]).toContain("javascript");
    expect(await asset.text()).not.toContain("<!DOCTYPE html>");
  }
  const missing = await request.get("/this-route-does-not-exist");
  expect(missing.status()).toBe(404);
});
