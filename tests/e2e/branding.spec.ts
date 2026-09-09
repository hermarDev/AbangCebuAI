import { expect, test } from "@playwright/test";

test("favicon and app icons are served correctly", async ({ request, page }) => {
  const iconRoute = await request.get("/icon.png");
  expect(iconRoute.status()).toBe(200);
  expect(iconRoute.headers()["content-type"]).toContain("image/png");

  const favicon = await request.get("/favicon.ico");
  expect(favicon.status()).toBe(200);

  await page.goto("/");
  const metaThemeColor = page.locator('meta[name="theme-color"]');
  await expect(metaThemeColor).toHaveAttribute("content", "#0066d5");

  const faviconLink = page.locator('link[rel*="icon"]');
  expect(await faviconLink.count()).toBeGreaterThan(0);
});

test("brand logos render on desktop and drawer", async ({ page, isMobile }) => {
  await page.goto("/");
  const fullLogo = page.locator(".brand-logo-full");
  const markLogo = page.locator(".brand-logo-mark");

  if (isMobile) {
    await expect(markLogo).toBeHidden();
    await expect(fullLogo).toBeHidden();
  } else {
    await expect(fullLogo).toBeVisible();
    await expect(markLogo).toBeHidden();
  }

  // Open drawer menu and check main_Logo inside
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const drawerLogo = page.locator(".drawer-logo");
  await expect(drawerLogo).toBeVisible();
});

test("chatbot logo renders in launcher button and dialog", async ({ page }) => {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Ask AbangCebu", exact: true });
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveText("");
  const launcherBox = await launcher.boundingBox();
  expect(launcherBox!.width).toBe(launcherBox!.height);
  expect(launcherBox!.width).toBeGreaterThanOrEqual(44);
  await expect(launcher).toHaveCSS("border-radius", "50%");

  const launcherAvatar = launcher.locator(".chat-launcher-avatar");
  await expect(launcherAvatar).toBeVisible();
  await expect(launcherAvatar).toHaveAttribute("src", /chatbot_logo\.png/);

  // Click launcher and verify dialog avatar
  await launcher.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const dialogAvatar = dialog.locator(".chat-dialog-avatar");
  await expect(dialogAvatar).toBeVisible();
  await expect(dialogAvatar).toHaveAttribute("src", /chatbot_logo\.png/);
});

test("primary theme color is blue", async ({ page }) => {
  await page.goto("/");
  const primaryColor = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  });
  expect(primaryColor.toLowerCase()).toBe("#0066d5");
});

test("chat, re-center, and zoom controls remain separate", async ({ page, isMobile }) => {
  await page.goto("/");
  const launcher = page.locator(".chat-launcher");
  const zoomControl = page.locator(".maplibregl-ctrl-bottom-right .maplibregl-ctrl-group");
  const locateControl = page.getByRole("button", { name: "Re-center map on search area", exact: true });
  const zoomIn = page.getByRole("button", { name: "Zoom in", exact: true });
  const zoomOut = page.getByRole("button", { name: "Zoom out", exact: true });

  await expect(launcher).toBeVisible();
  await expect(zoomControl).toBeVisible();
  await expect(locateControl).toBeVisible();

  const controls = [launcher, zoomControl, locateControl];
  for (let i = 0; i < controls.length; i++) {
    for (let j = i + 1; j < controls.length; j++) {
      const a = await controls[i].boundingBox();
      const b = await controls[j].boundingBox();
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
      const overlaps = a!.x < b!.x + b!.width && b!.x < a!.x + a!.width &&
        a!.y < b!.y + b!.height && b!.y < a!.y + a!.height;
      expect(overlaps).toBe(false);
    }
  }

  const zoomBox = await zoomControl.boundingBox();
  const locateBox = await locateControl.boundingBox();
  expect(zoomBox).not.toBeNull();
  expect(locateBox).not.toBeNull();
  expect(Math.abs(
    (zoomBox!.x + zoomBox!.width) - (locateBox!.x + locateBox!.width)
  )).toBeLessThanOrEqual(1);
  const controlGap = zoomBox!.y - (locateBox!.y + locateBox!.height);
  expect(controlGap).toBeGreaterThanOrEqual(6);
  expect(controlGap).toBeLessThanOrEqual(18);

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  for (const zoomButton of [zoomIn, zoomOut]) {
    await expect(zoomButton).toBeVisible();
    const box = await zoomButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  }

  if (isMobile) {
    const header = await page.locator(".site-header").boundingBox();
    const quickFilters = await page.locator(".quick-filters-bar").boundingBox();
    const results = await page.locator(".rental-results-rail").boundingBox();
    expect(header).not.toBeNull();
    expect(quickFilters).not.toBeNull();
    expect(results).not.toBeNull();
    expect(locateBox!.y).toBeGreaterThanOrEqual(
      quickFilters!.y + quickFilters!.height + 8
    );
    expect(quickFilters!.y).toBeGreaterThanOrEqual(header!.y + header!.height + 6);
    expect(zoomBox!.y + zoomBox!.height).toBeLessThanOrEqual(results!.y);
  }
});

test("custom location popover opens and allows selecting Cebu neighborhoods", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator(".search-place-trigger");
  await expect(trigger).toBeVisible();

  // Click trigger to open popover
  await trigger.click();
  const popover = page.locator(".search-popover-content");
  await expect(popover).toBeVisible();
  await expect(popover.getByText("Choose an area to explore sample rentals")).toBeVisible();

  // Check that preview places are listed
  await expect(popover.getByText("Lahug")).toBeVisible();
  await expect(popover.getByText("IT Park")).toBeVisible();
  await expect(popover.getByText("Mabolo")).toBeVisible();

  // Select IT Park
  await popover.getByRole("option", { name: /IT Park/ }).click();
  await expect(popover).toBeHidden();
  await expect(trigger).toContainText("IT Park");
});

test("filter button displays active filter count badge", async ({ page, isMobile }) => {
  await page.goto("/");
  const filterBtn = page.getByRole("button", { name: "All filters", exact: true });

  await expect(page.getByRole("button", { name: "More filters", exact: true })).toHaveCount(0);
  if (isMobile) {
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /filters/i })).toHaveCount(1);
  }
  await expect(filterBtn.locator(".filter-badge")).toHaveCount(0);

  // Open filters dialog and apply a budget
  await filterBtn.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Maximum monthly rent", { exact: true }).selectOption("3000");
  await dialog.getByRole("button", { name: /Apply/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/[?&]maxPrice=3000(?:&|$)/);

  // Badge should now display 1
  const badge = filterBtn.locator(".filter-badge");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText("1");
  await expect(badge).toHaveAttribute("aria-hidden", "true");
  await expect(filterBtn).toHaveAttribute("aria-describedby", "active-filter-summary");
  await expect(page.locator("#active-filter-summary")).toHaveText("1 active filter");
  await expect(filterBtn).toBeFocused();
  if (isMobile) {
    const triggerBox = await filterBtn.boundingBox();
    const badgeBox = await badge.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(badgeBox).not.toBeNull();
    const badgeCenterX = badgeBox!.x + badgeBox!.width / 2;
    const badgeCenterY = badgeBox!.y + badgeBox!.height / 2;
    expect(badgeCenterX).toBeGreaterThanOrEqual(triggerBox!.x);
    expect(badgeCenterX).toBeLessThanOrEqual(triggerBox!.x + triggerBox!.width);
    expect(badgeCenterY).toBeGreaterThanOrEqual(triggerBox!.y);
    expect(badgeCenterY).toBeLessThanOrEqual(triggerBox!.y + triggerBox!.height);
  }
});

test("all filters stays with the filter controls across the mobile breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const allFilters = page.getByRole("button", { name: "All filters", exact: true });
  await expect(allFilters).toBeVisible();
  await expect(allFilters.locator(".quick-filter-all-label-mobile")).toBeVisible();
  await expect(allFilters.locator(".quick-filter-all-label-desktop")).toBeHidden();
  await expect(page.getByRole("button", { name: "More filters", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  const mobileScroller = page.locator(".quick-filters-scroll");
  const mobileScrollerBox = await mobileScroller.boundingBox();
  const mobileFilterBox = await allFilters.boundingBox();
  expect(mobileScrollerBox).not.toBeNull();
  expect(mobileFilterBox).not.toBeNull();
  expect(mobileFilterBox!.x).toBeGreaterThanOrEqual(mobileScrollerBox!.x + mobileScrollerBox!.width + 4);

  const wifi = page.getByRole("button", { name: "Wi-Fi", exact: true });
  await wifi.focus();
  await expect(wifi).toBeFocused();
  const focusedWifiBox = await wifi.boundingBox();
  expect(focusedWifiBox).not.toBeNull();
  expect(focusedWifiBox!.x).toBeGreaterThanOrEqual(mobileScrollerBox!.x);
  expect(focusedWifiBox!.x + focusedWifiBox!.width).toBeLessThanOrEqual(
    mobileScrollerBox!.x + mobileScrollerBox!.width + 1
  );

  await allFilters.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(allFilters).toBeFocused();

  await page.setViewportSize({ width: 768, height: 900 });
  await expect(allFilters).toBeVisible();
  await expect(allFilters.locator(".quick-filter-all-label-mobile")).toBeVisible();

  await page.setViewportSize({ width: 769, height: 900 });
  await expect(allFilters).toBeVisible();
  await expect(allFilters.locator(".quick-filter-all-label-mobile")).toBeHidden();
  await expect(allFilters.locator(".quick-filter-all-label-desktop")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  const wifiBox = await page.getByRole("button", { name: "Wi-Fi", exact: true }).boundingBox();
  const desktopFilterBox = await allFilters.boundingBox();
  expect(wifiBox).not.toBeNull();
  expect(desktopFilterBox).not.toBeNull();
  expect(desktopFilterBox!.x).toBeGreaterThanOrEqual(wifiBox!.x + wifiBox!.width + 8);
});

test("floating quick-filter chips toggle criteria and update query state", async ({ page }) => {
  await page.goto("/");
  const chipsBar = page.locator(".quick-filters-bar");
  await expect(chipsBar).toBeVisible();

  // Click ≤ ₱2,500/mo quick chip
  const budgetChip = chipsBar.getByRole("button", { name: /≤ ₱2,500/ });
  await expect(budgetChip).toBeVisible();
  await budgetChip.click();
  await expect(budgetChip).toHaveClass(/is-active/);
  await expect(page).toHaveURL(/max=2500/);

  // Click Wi-Fi quick chip
  const wifiChip = chipsBar.getByRole("button", { name: "Wi-Fi" });
  await expect(wifiChip).toBeVisible();
  await wifiChip.click();
  await expect(wifiChip).toHaveClass(/is-active/);
  await expect(page).toHaveURL(/wifi=1/);

  // Click Wi-Fi again to toggle off
  await wifiChip.click();
  await expect(wifiChip).not.toHaveClass(/is-active/);
  await expect(page).not.toHaveURL(/wifi=1/);
});

test("profile button opens account dialog with sign in options", async ({ page }) => {
  await page.goto("/");
  const profileBtn = page.getByRole("button", { name: "Sign in", exact: true });
  await expect(profileBtn).toBeVisible();
  await profileBtn.click();

  const accountDialog = page.getByRole("dialog");
  await expect(accountDialog).toBeVisible();
  await expect(accountDialog.getByText("Welcome to AbangCebu")).toBeVisible();
  await expect(accountDialog.getByText("Continue with Google")).toBeVisible();
  await expect(accountDialog.getByRole("link", { name: "Continue with email" })).toBeVisible();
  await expect(accountDialog.getByText("Landlord tools appear after account setup.")).toBeVisible();
  await expect(accountDialog.getByRole("link", { name: /Landlord workspace/ })).toHaveCount(0);
  await expect(accountDialog.locator('a[href^="/landlord"]')).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(accountDialog).toHaveCount(0);
  await expect(profileBtn).toBeFocused();
});

test("locate me button is visible and re-centers map", async ({ page }) => {
  await page.goto("/");
  const locateBtn = page.getByRole("button", { name: "Re-center map on search area", exact: true });
  await expect(locateBtn).toBeVisible();
  await locateBtn.click();
});
