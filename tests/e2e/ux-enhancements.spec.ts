import { expect, test } from "@playwright/test";

const sharedPlace = "/?scope=place-radius&lng=123.907&lat=10.328&radius=10000&place=Lahug";
const focusedPlace = "/?scope=place-radius&lng=123.907&lat=10.328&radius=1000&place=Lahug";

test.beforeEach(async ({ page }) => {
  // Mock tiles for offline deterministic execution
  await page.route("https://tiles.openfreemap.org/**", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      version: 8,
      sources: {},
      layers: [{ id: "background", type: "background", paint: { "background-color": "#eef4fa" } }],
    }),
  }));
});

test("entire rental card is clickable and opens rental details modal", async ({ page, isMobile }) => {
  await page.goto(sharedPlace);

  const card = page.locator(".rental-card[data-listing-id]").first();
  await expect(card).toBeVisible();
  const listingId = await card.getAttribute("data-listing-id");
  expect(listingId).toBeTruthy();

  // On mobile, ensure card is visible
  if (isMobile) {
    await card.scrollIntoViewIfNeeded();
  }

  // Click directly on the rental-summary text area inside the card
  const summary = card.locator(".rental-summary");
  await expect(summary).toBeVisible();
  await summary.click();

  // Verify details dialog modal opens
  const dialog = page.locator(".details-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`rental=${listingId}`));

  // Verify modal content shows description and pricing
  await expect(dialog.locator(".details-price")).toBeVisible();
  await expect(dialog.locator(".details-description")).toBeVisible();

  // Press Escape to dismiss details modal and verify URL cleanup
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page).not.toHaveURL(/rental=/);
});

test("price formatting displays ₱ amount followed by / mo on listing cards and map markers", async ({ page }) => {
  await page.goto(focusedPlace);
  await expect(page.locator('[data-map-state="ready"]')).toBeVisible({ timeout: 15000 });

  // 1. Verify listing cards price formatting
  const cards = page.locator(".rental-card");
  await expect(cards.first()).toBeVisible();
  const cardCount = await cards.count();
  expect(cardCount).toBeGreaterThan(0);

  for (let i = 0; i < Math.min(cardCount, 5); i++) {
    const cardPrice = cards.nth(i).locator(".rental-price");
    await expect(cardPrice).toBeVisible();
    const text = await cardPrice.innerText();
    expect(text).toMatch(/^₱[\d,]+\s*\/\s*mo$/);
  }

  // 2. Verify map markers price formatting
  const pricePins = page.locator(".map-canvas .price-pin");
  await expect(pricePins.first()).toBeVisible({ timeout: 10000 });
  const pinCount = await pricePins.count();
  expect(pinCount).toBeGreaterThan(0);

  for (let i = 0; i < Math.min(pinCount, 3); i++) {
    const pinText = await pricePins.nth(i).innerText();
    expect(pinText).toMatch(/^₱[\d,]+\s*\/\s*mo$/);
  }
});

test("dynamic filter button computes and displays Show X rentals as modal filters change", async ({ page, isMobile }) => {
  await page.goto(sharedPlace);

  // Open filter dialog
  await page.getByRole("button", { name: "All filters", exact: true }).click();

  const dialog = page.locator(".filter-dialog");
  await expect(dialog).toBeVisible();

  if (isMobile) {
    const viewport = page.viewportSize();
    const dialogBox = await dialog.boundingBox();
    expect(viewport).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport!.height);
    await expect(dialog).toBeFocused();
  }

  // Initial count: Show 16 rentals
  const applyBtn = dialog.getByRole("button", { name: /Show \d+ rentals?/ });
  await expect(applyBtn).toBeVisible();
  await expect(applyBtn).toHaveText("Show 16 rentals");

  // Step 1: Change max rent to ₱2,500/mo -> computes 4 rentals
  await dialog.getByLabel("Maximum monthly rent", { exact: true }).selectOption("2500");
  await expect(applyBtn).toHaveText("Show 4 rentals");

  // Step 2: Change rental type to bedspace -> computes 3 rentals
  await dialog.getByLabel("Rental type", { exact: true }).selectOption("bedspace");
  await expect(applyBtn).toHaveText("Show 3 rentals");

  // Step 3: Check Wi-Fi amenity -> computes 2 rentals
  await dialog.getByRole("checkbox", { name: "Wi-Fi", exact: true }).check();
  await expect(applyBtn).toHaveText("Show 2 rentals");

  // Step 4: Change rental type to room -> computes 0 rentals (no room <= ₱2,500 with Wi-Fi)
  await dialog.getByLabel("Rental type", { exact: true }).selectOption("room");
  await expect(applyBtn).toHaveText("Show 0 rentals");

  // Step 5: Reset filters inside modal
  await dialog.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test("navigation drawer displays EXPLORE, FOR LANDLORDS, SUPPORT sections and guest footer card", async ({ page }) => {
  await page.goto("/");

  const menuBtn = page.getByRole("button", { name: "Open menu", exact: true });
  await expect(menuBtn).toBeVisible();
  await menuBtn.click();

  const drawer = page.locator(".drawer-dialog");
  await expect(drawer).toBeVisible();

  // Verify EXPLORE section and links
  await expect(drawer.getByText("EXPLORE", { exact: true })).toBeVisible();
  const findRentals = drawer.getByRole("link", { name: "Find rentals" });
  await expect(findRentals).toBeVisible();
  await expect(findRentals).toHaveAttribute("href", "/");

  const savedRentals = drawer.getByRole("button", { name: "Saved rentals" });
  await expect(savedRentals).toBeVisible();

  // Verify FOR LANDLORDS section and links
  await expect(drawer.getByText("FOR LANDLORDS", { exact: true })).toBeVisible();
  const listProperty = drawer.getByRole("button", { name: "List your property" });
  await expect(listProperty).toBeVisible();

  await expect(drawer.getByRole("link", { name: "Landlord workspace" })).toHaveCount(0);

  // Verify SUPPORT section and links
  await expect(drawer.getByText("SUPPORT", { exact: true })).toBeVisible();
  const helpFaqs = drawer.getByRole("link", { name: "Help & FAQs" });
  await expect(helpFaqs).toBeVisible();
  await expect(helpFaqs).toHaveAttribute("href", "/");

  // Verify Footer Account Card
  const guestCard = drawer.locator(".drawer-guest-card");
  await expect(guestCard).toBeVisible();
  await expect(guestCard.getByText("Guest account")).toBeVisible();

  const signInBtn = guestCard.getByRole("button", { name: "Sign in / Create account" });
  await expect(signInBtn).toBeVisible();

  // Click Sign in / Create account from drawer to verify unified auth modal flow
  await signInBtn.click();
  await expect(drawer).toHaveCount(0);

  const accountDialog = page.locator(".account-dialog");
  await expect(accountDialog).toBeVisible();
  await expect(accountDialog.getByText("Welcome to AbangCebu")).toBeVisible();
  await expect(accountDialog.getByText("Continue with Google")).toBeVisible();
  await expect(accountDialog.getByRole("link", { name: "Continue with email" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(accountDialog).toHaveCount(0);
});

test("bi-directional hover sync highlights map marker on card hover and card on map marker hover", async ({ page, isMobile }) => {
  // Bi-directional hover sync is a desktop pointer interaction
  if (isMobile) {
    // On mobile touch devices, verify tapping a card selects and marks active state
    await page.goto(focusedPlace);
    const card = page.locator(".rental-card[data-listing-id]").first();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect(card).toHaveClass(/selected/);
    return;
  }

  await page.goto(focusedPlace);
  await expect(page.locator('[data-map-state="ready"]')).toBeVisible({ timeout: 15000 });

  // Locate first card and its corresponding map marker
  const firstCard = page.locator(".rental-card[data-listing-id]").first();
  await expect(firstCard).toBeVisible();
  const listingId = await firstCard.getAttribute("data-listing-id");
  expect(listingId).toBeTruthy();

  const marker = page.locator(`.map-canvas .price-pin[data-listing-id="${listingId}"]`);
  await expect(marker).toBeVisible({ timeout: 10000 });

  // 1. Card -> Map marker hover sync:
  // Hovering card applies .is-hovered to map marker
  await firstCard.hover();
  await expect(marker).toHaveClass(/is-hovered/);

  // Moving mouse away removes hover highlight
  await page.mouse.move(0, 0);
  await expect(marker).not.toHaveClass(/is-hovered/);

  // 2. Map marker -> Card hover sync:
  // Hovering map marker applies .is-hovered to card
  await marker.hover();
  await expect(firstCard).toHaveClass(/is-hovered/);

  // Moving mouse away removes hover highlight
  await page.mouse.move(0, 0);
  await expect(firstCard).not.toHaveClass(/is-hovered/);
});

test("interactive controls meet WCAG minimum 44px touch target requirement", async ({ page, isMobile }) => {
  await page.goto("/");

  // 1. Header menu button (hamburger) >= 44x44
  const menuBtn = page.getByRole("button", { name: "Open menu", exact: true });
  await expect(menuBtn).toBeVisible();
  const menuBox = await menuBtn.boundingBox();
  expect(menuBox).not.toBeNull();
  expect(menuBox!.width).toBeGreaterThanOrEqual(44);
  expect(menuBox!.height).toBeGreaterThanOrEqual(44);

  // 2. Filter button >= 44px height and width
  const filterBtn = page.getByRole("button", { name: "All filters", exact: true });
  await expect(filterBtn).toBeVisible();
  const filterBox = await filterBtn.boundingBox();
  expect(filterBox).not.toBeNull();
  expect(filterBox!.width).toBeGreaterThanOrEqual(44);
  expect(filterBox!.height).toBeGreaterThanOrEqual(44);

  // 3. Locate me button >= 44x44
  const locateBtn = page.getByRole("button", { name: "Re-center map on search area", exact: true });
  await expect(locateBtn).toBeVisible();
  const locateBox = await locateBtn.boundingBox();
  expect(locateBox).not.toBeNull();
  expect(locateBox!.width).toBeGreaterThanOrEqual(44);
  expect(locateBox!.height).toBeGreaterThanOrEqual(44);

  // 4. Chat launcher button >= 44x44 (56px)
  const chatLauncher = page.getByRole("button", { name: "Ask AbangCebu", exact: true });
  await expect(chatLauncher).toBeVisible();
  const chatBox = await chatLauncher.boundingBox();
  expect(chatBox).not.toBeNull();
  expect(chatBox!.width).toBeGreaterThanOrEqual(44);
  expect(chatBox!.height).toBeGreaterThanOrEqual(44);

  // 5. Account/sign-in button >= 44px on desktop and mobile
  const profileBtn = page.getByRole("button", { name: "Sign in", exact: true });
  await expect(profileBtn).toBeVisible();
  const profileBox = await profileBtn.boundingBox();
  expect(profileBox).not.toBeNull();

  expect(profileBox!.width).toBeGreaterThanOrEqual(44);
  expect(profileBox!.height).toBeGreaterThanOrEqual(44);

  if (isMobile) {
    // 6. Mobile quick filter chips >= 44px height
    const chip = page.locator(".quick-filter-chip").first();
    await expect(chip).toBeVisible();
    const chipBox = await chip.boundingBox();
    expect(chipBox).not.toBeNull();
    expect(chipBox!.height).toBeGreaterThanOrEqual(44);
  }

  // 7. Navigation drawer touch targets
  await menuBtn.click();
  const drawer = page.locator(".drawer-dialog");
  await expect(drawer).toBeVisible();

  const navItems = drawer.locator(".drawer-nav-item");
  const navCount = await navItems.count();
  expect(navCount).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < navCount; i++) {
    const itemBox = await navItems.nth(i).boundingBox();
    expect(itemBox).not.toBeNull();
    expect(itemBox!.height).toBeGreaterThanOrEqual(44);
  }

  // 8. Drawer Sign in button >= 44px
  const drawerSignInBtn = drawer.locator(".drawer-signin-btn");
  const signinBox = await drawerSignInBtn.boundingBox();
  expect(signinBox).not.toBeNull();
  expect(signinBox!.height).toBeGreaterThanOrEqual(44);
  expect(signinBox!.width).toBeGreaterThanOrEqual(44);

  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);

  // 9. Rental card interactive elements >= 44px
  const card = page.locator(".rental-card").first();
  await expect(card).toBeVisible();

  const cardSelect = card.locator(".rental-select");
  const selectBox = await cardSelect.boundingBox();
  expect(selectBox).not.toBeNull();
  expect(selectBox!.height).toBeGreaterThanOrEqual(44);

  const cardDetailsBtn = card.locator(".card-meta button");
  const detailsBox = await cardDetailsBtn.boundingBox();
  expect(detailsBox).not.toBeNull();
  expect(detailsBox!.height).toBeGreaterThanOrEqual(44);
});
