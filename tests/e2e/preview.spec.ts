import { expect, test, type Page } from "@playwright/test";

const sharedPlace = "/?scope=place-radius&lng=123.907&lat=10.328&radius=10000&place=Lahug";
const cards = (page: Page) => page.locator("article[data-listing-id]");

// Keep the real MapLibre camera, projection, circles and markers while removing
// external tile availability from interaction tests. Live cartography is a
// separate browser smoke check against the actual provider.
async function localMap(page: Page) {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ version: 8, sources: {}, layers: [{ id: "test-background", type: "background", paint: { "background-color": "#e8ede8" } }] }),
  }));
}

test("map failure preserves honest sample browsing, details and chat focus", async ({ page }) => {
  await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto(sharedPlace);
  await expect(cards(page)).toHaveCount(16);
  await expect(page.getByText("The map couldn’t load.")).toBeVisible({ timeout: 25000 });
  await expect(page.getByRole("button", { name: "Retry map" })).toBeVisible();
  await expect(page.getByText("Sample rentals", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Unavailable sample room", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "View details for Garden room in Lahug", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Garden room in Lahug", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/rental=sample-lahug-01/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/rental=/);

  const launcher = page.getByRole("button", { name: "Ask AbangCebu", exact: true });
  await launcher.click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Your Cebu rental companion" })).toBeVisible();
  await expect(page.getByText("Preview conversation · no AI connected", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(launcher).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("filters use one result set and preserve the selected geographic scope", async ({ page }) => {
  await localMap(page);
  await page.goto(sharedPlace);
  await expect(cards(page)).toHaveCount(16);
  const openFilters = () => page.getByRole("button", {
    name: "All filters",
    exact: true,
  }).click();
  await openFilters();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Maximum monthly rent", { exact: true }).selectOption("2500");
  await dialog.getByLabel("Rental type", { exact: true }).selectOption("bedspace");
  await dialog.getByRole("checkbox", { name: "Wi-Fi", exact: true }).check();
  await dialog.getByRole("button", { name: /Apply/ }).click();
  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).filter({ hasText: "Sunny Lahug bedspace" })).toHaveCount(1);
  await expect(cards(page).filter({ hasText: "Mabolo shared room" })).toHaveCount(1);
  await expect(page.locator("[data-search-mode]")).toHaveAttribute("data-search-mode", "place-radius");
  await expect(page).toHaveURL(/radius=10000/);

  await openFilters();
  await page.getByRole("dialog").getByLabel("Rental type", { exact: true }).selectOption("room");
  await page.getByRole("dialog").getByRole("button", { name: /Apply/ }).click();
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByText("No sample rentals match", { exact: true })).toBeVisible();
});

test("drawer and mobile results controls preserve keyboard access", async ({ page, isMobile }) => {
  await localMap(page);
  await page.goto(sharedPlace);
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  await menu.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(menu).toBeFocused();
  if (isMobile) {
    await page.getByRole("button", { name: "Expand results", exact: true }).click();
    await expect(page.getByRole("button", { name: "Show map", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Show map", exact: true }).click();
    await expect(page.getByRole("button", { name: "Expand results", exact: true })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
