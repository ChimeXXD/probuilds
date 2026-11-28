import { expect, type Page, test } from "@playwright/test";

// D-125 (2): on a phone Submit keeps the bottom nav (both tabs, every step), and steps 1 to 3 keep their actions bar
// in reach: docked at the bottom of the screen, directly above the nav, never under it. It used to hide the nav (the
// nav "just disappears") and the bar, meant to stick, sat only at the end of the page. Preview only (D-105).
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview pages");

const box = async (page: Page, id: string) => (await page.getByTestId(id).boundingBox())!;

async function barAboveNav(page: Page) {
  const nav = await box(page, "bottom-nav");
  const next = await box(page, "submit-next");
  const height = page.viewportSize()!.height;
  // On screen, at the top of the page, and clear of the nav (8 px or more above it).
  expect(next.y).toBeGreaterThan(height / 2);
  expect(next.y + next.height).toBeLessThanOrEqual(nav.y - 8);
  // The bar's surface reaches down behind the nav, so the page doesn't show between the two.
  const bar = await box(page, "submit-actions");
  expect(bar.y + bar.height).toBeGreaterThanOrEqual(nav.y + nav.height);
}

for (const width of [360, 390, 430]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("the nav stays on every step, and the actions bar sits above it", async ({ page }) => {
      await page.goto("/submit");
      await expect(page.getByTestId("bottom-nav")).toBeVisible();
      await barAboveNav(page);
      // A tap on Next is a tap on Next, not on the nav (the nav is on top where they meet).
      await page.getByTestId("submit-next").tap();
      await expect(page.locator("[data-step='2']")).toBeVisible();
      await expect(page.getByTestId("bottom-nav")).toBeVisible();
      await barAboveNav(page);
      await page.getByTestId("submit-next").tap();
      await expect(page.locator("[data-step='3']")).toBeVisible();
      await barAboveNav(page);
      // Scrolled to the end, the bar settles above the footer and the nav still clears it.
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(page.getByTestId("bottom-nav")).toBeVisible();
      await page.getByTestId("submit-next").tap();
      await expect(page.locator("[data-step='4']")).toBeVisible();
      await expect(page.getByTestId("bottom-nav")).toBeVisible();
    });

    test("Request a face keeps the nav too", async ({ page }) => {
      await page.goto("/submit/request");
      await expect(page.getByTestId("bottom-nav")).toBeVisible();
      await expect(page.getByTestId("bottom-nav").getByRole("link", { name: "Submit" })).toHaveAttribute("aria-current", "page");
    });
  });
}
