import { expect, type Locator, type Page, test } from "@playwright/test";

// D-121 (2): nothing instant. The Faces search results move (FLIP: cards that stay glide, ones that drop out fade,
// new ones fade in), the Changelog filters swap the entries as the Faces chips do (Smooth tab), Request a face's list
// moves on a kind chip, and Submit's attribute-group chips scroll to their group. Keyboard picks (other than typing a
// search, which Chime asked for) change at once; reduced motion keeps the fades and drops the movement.
// Preview only: the sample faces, changelog entries and requests are drafts.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview pages");

/** The properties each running Web Animation under `root` animates. */
const moving = (root: Locator) =>
  root.evaluate((el) =>
    el
      .getAnimations({ subtree: true })
      .filter((a) => !(a instanceof CSSTransition))
      .map((a) => (a.effect as KeyframeEffect).getKeyframes().flatMap((k) => Object.keys(k).filter((p) => !["offset", "easing", "composite", "computedOffset"].includes(p))))
      .map((p) => [...new Set(p)].sort().join(",")),
  );
const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));

test("Faces search: typing glides the cards that stay, fades the ones that drop out and those that come back", async ({ page }) => {
  await page.goto("/faces");
  const results = page.locator("main");
  await page.getByTestId("search-input").fill("ronaldo");
  const out = await moving(results);
  // The cards that left fade (and shrink a little) in the layer; the ones that stayed glide (translate).
  expect(out).toContain("opacity,scale");
  expect(out).toContain("translate");
  await settle(page);
  await page.getByTestId("search-input").fill("");
  expect(await moving(results)).toContain("opacity,scale"); // the four coming back fade in
  await settle(page);
  await expect(page.locator('[data-testid^="face-card-"]')).toHaveCount(5);
  // The copies are gone once they have faded: nothing extra is left on the page.
  expect(await results.locator("[aria-hidden=true] [data-flip]").count()).toBe(0);
});

test("Faces search that finds nothing: the cards fade where they were while the no-results card fades in", async ({ page }) => {
  await page.goto("/faces");
  await page.getByTestId("search-input").fill("Zidane");
  expect(await moving(page.locator("main"))).toContain("opacity,scale");
  await expect(page.getByTestId("faces-empty")).toBeVisible();
});

test("Faces search with reduced motion: cards only fade, nothing moves or scales", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/faces");
  const results = page.locator("main");
  await page.getByTestId("search-input").fill("ronaldo");
  const out = await moving(results);
  expect(out.length).toBeGreaterThan(0);
  for (const p of out) expect(p).toBe("opacity");
});

test("Changelog: a filter swaps the entries with a crossfade, the new ones 12 px in from the chip's side", async ({ page }) => {
  await page.goto("/changelog");
  await page.getByTestId("filter-chip-3").click();
  const anims = await page.evaluate(() =>
    document.getAnimations().map((a) => (a.effect as KeyframeEffect).getKeyframes().map((k) => String(k.transform ?? ""))),
  );
  expect(anims.some((k) => k[0] === "translateX(12px)")).toBe(true);
});

test("Request a face: a kind chip glides the rows that stay and fades the rest; from the keyboard it doesn't", async ({ page }) => {
  await page.goto("/submit/request");
  const list = page.getByRole("region", { name: "Most requested" }).or(page.locator("section[aria-labelledby=most-requested]"));
  const kinds = page.getByTestId("request-kind");
  await kinds.nth(1).click();
  expect((await moving(list)).length).toBeGreaterThan(0);
  await settle(page);
  await kinds.nth(0).focus();
  await page.keyboard.press("Enter");
  expect((await moving(list)).filter((p) => p === "translate" || p === "opacity,scale")).toEqual([]);
});

test("Submit: an attribute-group chip scrolls to its group smoothly; from the keyboard at once", async ({ page }) => {
  await page.goto("/submit?state=attributes");
  const nav = page.getByRole("navigation", { name: "Attribute groups" });
  await nav.getByRole("button", { name: "PHY" }).click();
  const early = await page.evaluate(() => window.scrollY);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(early);
  await page.evaluate(() => window.scrollTo(0, 0));
  await nav.getByRole("button", { name: "DEF" }).focus();
  await page.keyboard.press("Enter");
  // At once: already at the group on the next frame.
  const y = await page.evaluate(() => new Promise<number>((r) => requestAnimationFrame(() => r(window.scrollY))));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(y);
});
