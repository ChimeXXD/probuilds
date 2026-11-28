import { expect, type Locator, type Page, test } from "@playwright/test";

// D-121 (1): every clickable thing says so on hover, with a mouse or trackpad only (DESIGN.md: hover inside
// (hover: hover) and (pointer: fine)); presses scale. These run as a computer (no touch, a fine pointer).

const style = (el: Locator, prop: string) => el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop);

/** The property's value at rest and once the pointer is over `target` (the hover transition has finished). */
async function hoverChanges(page: Page, el: Locator, prop: string, target: Locator = el) {
  await page.mouse.move(0, 0);
  await expect.poll(() => style(el, prop)).toBeTruthy();
  const rest = await style(el, prop);
  await target.hover();
  await expect.poll(() => style(el, prop)).not.toBe(rest);
  return rest;
}

test.describe("computer: hover and press", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false });

  test("top bar: section links, the season chip (to the Changelog), theme and search", async ({ page }) => {
    await page.goto("/about");
    const bar = page.getByTestId("top-bar");
    await hoverChanges(page, bar.getByRole("link", { name: "Faces" }), "color");
    const chip = page.getByTestId("season-chip");
    await expect(chip).toHaveAttribute("href", "/changelog");
    await hoverChanges(page, chip, "border-color");
    await hoverChanges(page, bar.getByRole("button", { name: /mode/i }), "background-color");
    await hoverChanges(page, bar.getByRole("button", { name: "Search" }), "background-color");
    await chip.click();
    await expect(page).toHaveURL(/\/changelog\/?$/);
  });

  test("footer links turn text/primary", async ({ page }) => {
    await page.goto("/about");
    const footer = page.getByRole("navigation", { name: "Site" });
    await hoverChanges(page, footer.getByRole("link", { name: "Takedown" }), "color");
  });

  test("buttons: primary steps its fill, secondary its fill and border, and the arrow nudges", async ({ page }) => {
    await page.goto("/takedown");
    await hoverChanges(page, page.getByTestId("takedown-email"), "background-color");
    const copy = page.getByRole("button", { name: "Copy" });
    await hoverChanges(page, copy, "background-color");
    await hoverChanges(page, copy, "border-color");
    await page.goto("/not-found-page");
    await hoverChanges(page, page.locator("main").getByRole("link", { name: "Faces" }), "background-color");
  });

  test("a press scales a button to 0.97", async ({ page }) => {
    await page.goto("/takedown");
    const copy = page.getByRole("button", { name: "Copy" });
    const box = await copy.boundingBox();
    if (!box) throw new Error("no Copy button");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect.poll(() => style(copy, "scale")).toBe("0.97");
    await page.mouse.up();
    await expect.poll(() => style(copy, "scale")).toBe("none");
  });

  test("About's questions: the row's fill and chevron", async ({ page }) => {
    await page.goto("/about");
    const summary = page.locator("main summary").first();
    await hoverChanges(page, summary, "background-color");
  });

  test("Changelog: an entry's head fills the card; filter chips answer", async ({ page }) => {
    test.skip(process.env.PROBUILDS_DRAFTS !== "1", "the changelog's entries are drafts");
    await page.goto("/changelog");
    const entry = page.getByTestId("changelog-entry-1");
    await hoverChanges(page, entry, "background-color", entry.locator("summary"));
    const chip = page.getByTestId("filter-chip-2");
    await hoverChanges(page, chip, "border-color");
  });
});

test.describe("preview: cards and tiles", () => {
  test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview pages");
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false });

  test("Home: face posters, build cards, See all", async ({ page }) => {
    await page.goto("/");
    await hoverChanges(page, page.getByTestId("face-picture").first(), "border-color");
    await hoverChanges(page, page.getByTestId("build-preview-1"), "background-color");
    await hoverChanges(page, page.getByTestId("home-faces").getByRole("link", { name: "See all" }), "text-decoration-line");
  });

  test("Faces: the Missing a face tile and the search field", async ({ page }) => {
    await page.goto("/faces");
    await hoverChanges(page, page.getByTestId("missing-face-tile"), "background-color");
    await hoverChanges(page, page.getByTestId("search-field"), "border-color");
    // The arrow in "Request a face" nudges towards where it goes.
    const button = page.getByTestId("request-face-link");
    await hoverChanges(page, button.locator("span:has(> .icon-mask)"), "translate", button);
  });
});

test("phone: a tap leaves no hover behind", async ({ page }) => {
  await page.goto("/about");
  const footer = page.getByRole("navigation", { name: "Site" });
  const link = footer.getByRole("link", { name: "Takedown" });
  const rest = await style(link, "color");
  await link.hover();
  await page.waitForTimeout(200);
  expect(await style(link, "color")).toBe(rest);
});
