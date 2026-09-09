import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Mock tiles for offline deterministic execution
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#eef4fa" },
          },
        ],
      }),
    })
  );
});

test("chatbot launcher displays elevated container, online badge, and hides when open", async ({
  page,
}) => {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Ask AbangCebu", exact: true });
  await expect(launcher).toBeVisible();

  // Verify online status badge
  const statusBadge = launcher.locator(".chat-launcher-status-badge");
  await expect(statusBadge).toBeVisible();

  // Click launcher to open
  await launcher.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Verify launcher has data-chat-open="true" and is hidden (using locator since Radix marks background aria-hidden)
  const launcherEl = page.locator(".chat-launcher");
  await expect(launcherEl).toHaveAttribute("data-chat-open", "true");
  await expect(launcherEl).toHaveCSS("opacity", "0");

  // Close dialog and verify launcher returns
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(launcherEl).toHaveAttribute("data-chat-open", "false");
  await expect(launcherEl).toHaveCSS("opacity", "1");
});

test("chatbot opens with rich header, welcome greeting, and suggestion chips", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Ask AbangCebu", exact: true });
  await launcher.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Header verification
  await expect(dialog.getByRole("heading", { name: "Your Cebu rental companion" })).toBeVisible();
  await expect(dialog.locator(".chat-dialog-avatar")).toBeVisible();
  await expect(dialog.locator(".chat-status-indicator")).toBeVisible();

  // On mobile, drag handle should be visible
  if (isMobile) {
    const handle = dialog.locator(".chat-sheet-handle");
    await expect(handle).toBeVisible();
  }

  // Welcome message bubble
  await expect(dialog.getByText("Maayong adlaw! 👋")).toBeVisible();
  await expect(dialog.getByText("“A room around ₱2,500 near my college.”")).toBeVisible();

  // Suggestion chips
  const chips = dialog.locator(".chat-prompt-chip");
  await expect(chips).toHaveCount(4);
  await expect(chips.first()).toContainText("Rooms under ₱2,500");

  // Input composer & disclaimer
  const input = dialog.locator(".chat-composer-input");
  await expect(input).toBeVisible();
  await expect(dialog.getByText("Preview conversation · no AI connected")).toBeVisible();
});

test("clicking suggestion chip delivers recommendations with show on map action", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Ask AbangCebu", exact: true });
  await launcher.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Click suggestion chip
  const budgetChip = dialog.getByRole("button", { name: "Rooms under ₱2,500" });
  await budgetChip.click();

  // Verify user message appears
  const userMsg = dialog.locator(".chat-message-row.is-user");
  await expect(userMsg).toHaveCount(1);
  await expect(userMsg).toContainText("Rooms under ₱2,500");

  // Verify assistant response and recommendation cards
  const cards = dialog.locator(".chat-recommendation-card");
  await expect(cards.first()).toBeVisible({ timeout: 6000 });
  const cardCount = await cards.count();
  expect(cardCount).toBeGreaterThan(0);

  // Click Show on map
  const showBtn = cards.first().locator(".chat-show-on-map-btn");
  await expect(showBtn).toBeVisible();
  await showBtn.click();

  // On mobile, chat closes so the user can inspect the map
  if (isMobile) {
    await expect(dialog).toHaveCount(0);
  }
});

test("composer accepts custom query and reset button restores conversation", async ({
  page,
}) => {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Ask AbangCebu", exact: true });
  await launcher.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Type custom query
  const input = dialog.locator(".chat-composer-input");
  await input.fill("Lahug bedspace with Wi-Fi");

  const sendBtn = dialog.locator(".chat-composer-send-btn");
  await expect(sendBtn).toBeEnabled();
  await sendBtn.click();

  // Verify user message
  await expect(dialog.getByText("Lahug bedspace with Wi-Fi")).toBeVisible();

  // Verify recommendation appears
  const cards = dialog.locator(".chat-recommendation-card");
  await expect(cards.first()).toBeVisible({ timeout: 6000 });

  // Click reset conversation
  const resetBtn = dialog.locator(".chat-reset-btn");
  await resetBtn.click();

  // Verify conversation is back to 1 welcome message
  const userMsgsAfter = dialog.locator(".chat-message-row.is-user");
  await expect(userMsgsAfter).toHaveCount(0);
  await expect(dialog.getByText("Maayong adlaw! 👋")).toBeVisible();
});
