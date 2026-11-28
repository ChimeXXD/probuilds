import { expect, type Locator, type Page, test } from "@playwright/test";

// D-125 (1): on a computer the share card tilts toward the pointer (the designbookmark "Parallax ticket" hover) and a
// click still flips it (D-117). The tilt layer wraps the flip, so it adds to whichever side shows. Touch and reduced
// motion get no tilt. Preview only: the sample build has the share sheet.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

const URL = "/builds/finisher/meta-finisher";

async function openSheet(page: Page) {
  await page.goto(URL);
  await page.getByRole("button", { name: "Share build" }).click();
  const card = page.getByRole("dialog", { name: "Share build" }).getByTestId("share-cards");
  // From tablet the dialog grows in from 0.96: measure once it has landed.
  await expect.poll(async () => Math.round((await card.boundingBox())?.width ?? 0)).toBe(311);
  return card;
}

const inline = (card: Locator, part: string, prop = "transform") =>
  card.locator(`[data-part=${part}]`).first().evaluate((el, p) => (el as HTMLElement).style.getPropertyValue(p), prop);
const turn = async (card: Locator) => {
  const t = await inline(card, "tilt");
  const m = /rotateX\((-?[\d.]+)deg\) rotateY\((-?[\d.]+)deg\)/.exec(t);
  return m ? { rx: Number(m[1]), ry: Number(m[2]) } : null;
};

/** Moves the mouse to (fx, fy) of the card (0…1 each), in a few steps so pointermove fires along the way. */
async function point(page: Page, card: Locator, fx: number, fy: number) {
  const b = await card.boundingBox();
  if (!b) throw new Error("no card");
  await page.mouse.move(b.x + b.width * fx, b.y + b.height * fy, { steps: 4 });
}

test.describe("computer", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false });
  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "phone-390", "sets its own viewport");
  });

  test("the card turns toward the pointer, its contents float and a light follows; it lands flat on leave", async ({ page }) => {
    const card = await openSheet(page);
    expect(await inline(card, "tilt")).toBe("");
    // Right edge, halfway down: the right side sinks away (rotateY +8°), no turn about X.
    await point(page, card, 0.98, 0.5);
    await expect.poll(async () => (await turn(card))?.ry ?? 0).toBeGreaterThan(7);
    expect(Math.abs((await turn(card))?.rx ?? 1)).toBeLessThan(0.5);
    // The contents slide toward the pointer (depth) and the light is on.
    await expect.poll(() => inline(card, "sheen", "opacity")).toBe("1");
    expect(await card.locator("figure").first().locator("> div").evaluate((el) => (el as HTMLElement).style.transform)).toMatch(/^translate3d\(5\.\d+px, -?0(\.\d+)?(px)?, 0(px)?\) scale\(var\(--s\)\)$/);
    // Top left: the top turns away (rotateX +) and the left (rotateY −).
    await point(page, card, 0.05, 0.05);
    await expect.poll(async () => (await turn(card))?.rx ?? 0).toBeGreaterThan(6);
    expect((await turn(card))?.ry ?? 0).toBeLessThan(-6);
    // Leave: it settles flat and hands the card back to its own styles.
    await page.mouse.move(20, 20, { steps: 4 });
    await expect.poll(() => inline(card, "tilt")).toBe("");
    await expect.poll(() => inline(card, "sheen", "opacity")).toBe("");
  });

  test("a click still flips the card while it is tilted, and the tilt carries on over the back", async ({ page }) => {
    const card = await openSheet(page);
    const flip = card.getByRole("button", { name: /Tap to flip/ });
    await point(page, card, 0.9, 0.2);
    await expect.poll(async () => (await turn(card))?.ry ?? 0).toBeGreaterThan(5);
    await page.mouse.down();
    await page.mouse.up();
    await expect(flip).toHaveAttribute("aria-pressed", "true");
    // The flip layer turns to 180° (its matrix's first value is cos 180° = −1) inside the tilt layer.
    const flipLayer = card.locator("[data-part=tilt] > div");
    await expect.poll(() => flipLayer.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m11)).toBeCloseTo(-1, 2);
    expect((await turn(card))?.ry ?? 0).toBeGreaterThan(5);
    // Still following on the back.
    await point(page, card, 0.1, 0.8);
    await expect.poll(async () => (await turn(card))?.ry ?? 0).toBeLessThan(-5);
    await page.keyboard.press("Enter");
    await expect(flip).toHaveAttribute("aria-pressed", "false");
  });

  test("reduced motion: no tilt, no light; a click still flips", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const card = await openSheet(page);
    await point(page, card, 0.95, 0.1);
    await point(page, card, 0.1, 0.9);
    await page.waitForTimeout(300);
    expect(await inline(card, "tilt")).toBe("");
    expect(await inline(card, "sheen", "opacity")).toBe("");
    await page.mouse.down();
    await page.mouse.up();
    await expect(card.getByRole("button", { name: /Tap to flip/ })).toHaveAttribute("aria-pressed", "true");
    expect(await inline(card, "tilt")).toBe("");
  });

  test("a sheet closed with the pointer on the card opens flat next time", async ({ page }) => {
    const card = await openSheet(page);
    await point(page, card, 0.9, 0.9);
    await expect.poll(async () => (await turn(card))?.rx ?? 0).toBeLessThan(-5);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Share build" }).click();
    expect(await inline(card, "tilt")).toBe("");
  });
});

test("touch: a tap flips the card with no tilt and no light", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "phone-390", "one phone is enough");
  await page.goto(URL);
  await page.getByRole("button", { name: "Share build" }).click();
  const card = page.getByRole("dialog", { name: "Share build" }).getByTestId("share-cards");
  const seen: string[] = [];
  await page.exposeFunction("record", (t: string) => seen.push(t));
  // Every transform the tilt layer is given during the tap.
  await card.locator("[data-part=tilt]").evaluate((el) => {
    new MutationObserver(() => (window as unknown as { record: (t: string) => void }).record((el as HTMLElement).style.transform)).observe(el, { attributes: true });
  });
  await card.getByRole("button", { name: /Tap to flip/ }).tap({ position: { x: 200, y: 60 } });
  await expect(card.getByRole("button", { name: /Tap to flip/ })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => inline(card, "tilt")).toBe("");
  // Only the press scale, never a turn.
  for (const t of seen.filter(Boolean)) expect(t).toMatch(/^rotateX\(0deg\) rotateY\(0deg\) scale\(/);
  expect(await inline(card, "sheen", "opacity")).toBe("");
});
