import { expect, test } from "@playwright/test";
import { parsePhotonPlaces } from "../../src/contracts/places";

test.beforeEach(async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#eef4fa" } }] }),
  }));
});

test("typing retains focus, categories narrow places, and the compact list scrolls", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Search Cebu area" });
  await input.click();
  await input.pressSequentially("USC");
  await expect(input).toBeFocused();
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: /USC Talamban/ })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/place=USC\+Main/);
  await expect(input).toBeFocused();
  await page.getByRole("button", { name: "Browse Cebu locations" }).click();
  await page.getByRole("button", { name: "Schools", exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(4);
  await page.getByRole("button", { name: "All", exact: true }).click();
  const panel = page.locator(".search-popover-content");
  expect((await panel.boundingBox())!.height).toBeLessThanOrEqual(441);
  expect(await page.getByRole("listbox").evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await page.getByRole("option", { name: /SM City Cebu/ }).click();
  await expect(page).toHaveURL(/place=SM\+City\+Cebu/);
});

test("online search needs an explicit choice and preserves radius and budget", async ({ page }) => {
  await page.route("**/api/places?*", (route) => route.fulfill({ json: { places: [{
    id: "osm-W-119432766", name: "SM Seaside City Cebu", detail: "Mambaling, Cebu City", category: "Landmark", coordinates: [123.8795782, 10.28127],
  }] } }));
  await page.goto("/?scope=place-radius&lng=123.907&lat=10.328&radius=5000&place=Lahug&max=2500");
  const input = page.getByRole("combobox", { name: "Search Cebu area" });
  await input.fill("SM Seaside");
  await input.press("Enter");
  await expect(page.getByRole("option", { name: /SM Seaside City Cebu/ })).toBeVisible();
  await expect(page).toHaveURL(/place=Lahug/);
  await page.getByRole("option", { name: /SM Seaside City Cebu/ }).click();
  await expect(page).toHaveURL(/lng=123.8795782&lat=10.28127&radius=5000/);
  await expect(page).toHaveURL(/max=2500/);
  await expect(input).toHaveAttribute("placeholder", "SM Seaside City Cebu, Mambaling, Cebu City");
  await expect(page.getByRole("button", { name: /Search area/ })).toContainText("5 km");
});

test("failed online search keeps preset browsing and does not move the search", async ({ page }) => {
  await page.route("**/api/places?*", (route) => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Search Cebu area" });
  await input.fill("Lahug");
  await input.press("Enter");
  await expect(page.locator(".search-popover-content").getByRole("alert")).toContainText("Place search is unavailable");
  await expect(page.getByRole("option", { name: /^Lahug/ })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("an online campus with a preset name retains its chosen address and coordinates", async ({ page }) => {
  await page.route("**/api/places?*", (route) => route.fulfill({ json: { places: [{
    id: "osm-N-999", name: "ACLC College", detail: "Test campus, Cebu City", category: "College", coordinates: [123.88, 10.31],
  }] } }));
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Search Cebu area" });
  await input.fill("ACLC");
  await input.press("Enter");
  await page.getByRole("option", { name: /Test campus/ }).click();
  await expect(input).toHaveAttribute("placeholder", "ACLC College, Test campus, Cebu City");
  await expect(page).toHaveURL(/lng=123.88&lat=10.31&radius=2000/);
});

test("a superseded lookup cannot replace the user's new query", async ({ page }) => {
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => { finish = resolve; });
  await page.route("**/api/places?*", async (route) => {
    await gate;
    await route.fulfill({ json: { places: [{ id: "old", name: "Old result", detail: "Cebu City", coordinates: [123.9, 10.3] }] } });
  });
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Search Cebu area" });
  await input.fill("Seaside");
  const request = page.waitForRequest("**/api/places?*");
  await input.press("Enter");
  await request;
  await input.fill("USC");
  finish();
  await expect(page.getByRole("option", { name: /USC/ })).toHaveCount(2);
  await expect(page.getByRole("option", { name: /Old result/ })).toHaveCount(0);
  await expect(input).toBeFocused();
});

test("fixed radius survives map movement; map mode commits only on request", async ({ page }) => {
  await page.goto("/?scope=place-radius&lng=123.907&lat=10.328&radius=1249&place=Chosen+point&max=2500");
  await expect(page.locator('[data-map-state="ready"]')).toBeVisible();
  const radius = page.getByRole("button", { name: /Search area/ });
  await expect(radius).toContainText("1.249 km");
  await radius.click();
  await expect(page.getByRole("dialog").locator("select")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "1.249 km" })).toBeChecked();
  await page.getByRole("radio", { name: "5 km" }).check();
  await page.getByRole("button", { name: "Apply search area" }).click();
  await expect(page).toHaveURL(/radius=5000/);
  const map = page.locator(".maplibregl-canvas");
  await map.focus();
  await map.press("ArrowRight");
  await expect(page.getByRole("button", { name: /Search this area/ })).toHaveCount(0);
  await expect(page).toHaveURL(/lng=123.907&lat=10.328&radius=5000/);
  await radius.click();
  await page.getByRole("radio", { name: /Follow the map/ }).check();
  await expect(page.getByRole("radio", { name: "5 km" })).toHaveCount(0);
  await page.getByRole("button", { name: "Apply search area" }).click();
  await expect(page).toHaveURL(/scope=map-radius/);
  await map.focus();
  await map.press("ArrowLeft");
  const commit = page.getByRole("button", { name: /Search this area/ });
  await expect(commit).toBeVisible();
  await expect(page).toHaveURL(/radius=5000/);
  const label = await commit.innerText();
  await commit.click();
  const committedRadius = Number(new URL(page.url()).searchParams.get("radius"));
  expect(label).toContain(committedRadius < 1000 ? `${committedRadius} m` : `${committedRadius / 1000} km`);
  await expect(page).toHaveURL(/max=2500/);
});

test("pending map search stays clear, reachable, and separate from map controls", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page.locator('[data-map-state="ready"]')).toBeVisible();

  const map = page.locator(".maplibregl-canvas");
  await map.focus();
  await map.press("ArrowLeft");

  const commit = page.getByRole("button", { name: /Search this area, Within/ });
  const recenter = page.getByRole("button", { name: "Return to current search area" });
  await expect(commit).toBeVisible();
  await expect(commit).toContainText("Search this area");
  await expect(commit).toContainText("Within");
  await expect(recenter).toBeVisible();

  const commitBox = await commit.boundingBox();
  const recenterBox = await recenter.boundingBox();
  const quickFiltersBox = await page.locator(".quick-filters-bar").boundingBox();
  expect(commitBox).not.toBeNull();
  expect(recenterBox).not.toBeNull();
  expect(quickFiltersBox).not.toBeNull();
  expect(commitBox!.height).toBeGreaterThanOrEqual(44);
  expect(commitBox!.y).toBeGreaterThanOrEqual(quickFiltersBox!.y + quickFiltersBox!.height + 8);

  if (isMobile) {
    expect(commitBox!.x + commitBox!.width).toBeLessThanOrEqual(recenterBox!.x - 8);
    expect(Math.abs(commitBox!.y - recenterBox!.y)).toBeLessThanOrEqual(1);
  } else {
    const resultsBox = await page.locator(".rental-results-rail").boundingBox();
    expect(resultsBox).not.toBeNull();
    expect(commitBox!.x).toBeGreaterThanOrEqual(resultsBox!.x + resultsBox!.width + 16);
  }

  await commit.focus();
  await expect(commit).toBeFocused();
  await recenter.click();
  await expect(commit).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Re-center map on search area" })).toBeVisible();
});

test("geocoder normalization excludes other countries, invalid coordinates, and duplicates", () => {
  const feature = (osm_id: number, coordinates: number[], countrycode = "PH") => ({
    geometry: { type: "Point", coordinates }, properties: { osm_id, osm_type: "N", countrycode, name: "Test place" },
  });
  const places = parsePhotonPlaces({ features: [feature(1, [123.9, 10.3]), feature(1, [123.9, 10.3]), feature(2, [10.3, 123.9]), feature(3, [123.9, 10.3], "DE"), feature(4, [121, 14])] });
  expect(places).toHaveLength(1);
  expect(places[0].coordinates).toEqual([123.9, 10.3]);
});

test("place endpoint validates input without calling the provider", async ({ request }) => {
  expect((await request.get("/api/places?q=ab")).status()).toBe(400);
  expect((await request.get(`/api/places?q=${"a".repeat(121)}`)).status()).toBe(400);
});
