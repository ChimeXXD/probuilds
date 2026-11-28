import { expect, test } from "@playwright/test";

// The Builds page (Figma 241:556 / 279:1399 / 276:1073, D-57, D-60). Preview only for now (D-105); emblems ship since D-106.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

test("builds: pick an archetype from the rail and see its card and facts", async ({ page }) => {
  await page.goto("/builds");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Builds");
  await expect(page.getByTestId("bottom-nav").getByRole("link", { name: "Builds" })).toHaveAttribute("aria-current", "page");
  const finisher = page.getByTestId("emblem-finisher");
  await finisher.click();
  await expect(finisher).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("emblem-shot-stopper")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("stance-card-finisher")).toBeVisible();
  // The specializations replace the Mastery line (D-121 (3)): Finisher's three, each with its PlayStyle+ and targets.
  const specs = page.getByTestId("specialization").filter({ visible: true });
  await expect(specs).toHaveCount(3);
  await expect(specs.nth(1)).toContainText("Presser");
  await expect(specs.nth(1)).toContainText("Relentless+");
  await expect(specs.nth(1)).toContainText("Stamina");
  await expect(page.getByText(/Mastery attributes/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "See Finisher builds" })).toHaveAttribute("href", "/builds/finisher");
  await expect(page).toHaveURL(/#finisher$/);
  // Each emblem is at least a 44 px target.
  const box = await finisher.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test("builds: a link with #target opens on Target, and the rail scrolls it into view", async ({ page }) => {
  await page.goto("/builds#target");
  const target = page.getByTestId("emblem-target");
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await expect(target).toBeInViewport();
  await expect(page.getByRole("link", { name: "See Target builds" })).toBeVisible();
});

test("builds: on Figma's 393 px phone the picked emblem sits where 241:556 draws it, and every archetype has its specializations", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/builds#finisher");
  await expect(page.getByTestId("emblem-finisher")).toHaveAttribute("aria-pressed", "true");
  // The centred box sits at 168.5 (half of 393 less half of 56); Chrome paints it from 169 at 1x, as Figma draws it.
  await expect.poll(async () => (await page.getByTestId("emblem-finisher").boundingBox())?.x).toBe(168.5);
  await page.getByTestId("emblem-spark").click();
  await expect(page.getByTestId("specialization").filter({ visible: true }).first()).toContainText("Spark+");
});

test("builds: swiping the card moves to the next archetype", async ({ page }) => {
  await page.goto("/builds#boss");
  const stage = page.getByTestId("stance-stage");
  const box = await stage.boundingBox();
  if (!box) throw new Error("no stage");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.45, y, { steps: 6 });
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByTestId("emblem-marauder")).toHaveAttribute("aria-pressed", "true");
});

test("builds: mid-drag only the front card follows the finger; its neighbours stay put (Chime, 28 Nov)", async ({ page }) => {
  await page.goto("/builds#boss");
  const stage = page.getByTestId("stance-stage");
  const box = await stage.boundingBox();
  if (!box) throw new Error("no stage");
  const xOf = (id: string) => page.getByTestId(`stance-card-${id}`).evaluate((el) => el.getBoundingClientRect().x);
  // The cards slide to Boss on load (250 ms); measure once they have stopped.
  await expect.poll(async () => { const a = await xOf("progressor"); await page.waitForTimeout(80); return Math.round(a) === Math.round(await xOf("progressor")); }).toBe(true);
  const before = { front: await xOf("boss"), prev: await xOf("progressor"), next: await xOf("marauder") };
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.6, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, y, { steps: 6 });
  expect(Math.round((await xOf("boss")) - before.front)).toBeLessThan(-40);
  expect(Math.round(await xOf("progressor"))).toBe(Math.round(before.prev));
  expect(Math.round(await xOf("marauder"))).toBe(Math.round(before.next));
  await page.mouse.up();
});

test("builds on desktop: each signature PlayStyle is centred under its badge", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#boss");
  const items = page.getByRole("heading", { name: "Signature PlayStyles" }).locator("xpath=following-sibling::ul[1]/li");
  await expect(items).toHaveCount(2);
  for (const li of await items.all()) {
    const centres = await li.evaluate((el) =>
      [...el.children].map((c) => { const r = c.getBoundingClientRect(); return Math.round(r.x + r.width / 2); }),
    );
    expect(new Set(centres).size, `centres ${centres.join(", ")}`).toBe(1);
  }
});

test("builds in light mode: PlayStyle badges are tinted by brightness, so dark-drawn symbols stay visible", async ({ page }) => {
  await page.goto("/builds#shot-stopper");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  const mode = await page.getByTestId("playstyle-art").first().evaluate((el) => getComputedStyle(el).maskMode);
  expect(mode).toBe("luminance");
});

test("builds on desktop: previous and next step through the 13, with the count", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#finisher");
  await expect(page.getByText("12 of 13", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next archetype" }).click();
  await expect(page.getByText("13 of 13", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next archetype" })).toBeDisabled();
  await page.getByRole("button", { name: "Previous archetype" }).click();
  await expect(page.getByTestId("emblem-finisher")).toHaveAttribute("aria-pressed", "true");
  // The title starts at the 120 px edge (D-59).
  expect((await page.getByRole("heading", { level: 1 }).boundingBox())?.x).toBe(120);
});

// Swipe deck (motion-bookmarks.pdf #1): tilt with the drag, a flick throws, a slow short drag springs back, a card in
// flight can be caught, and reduced motion swaps the cards with a fade only.
const front = (page: import("@playwright/test").Page, id: string) =>
  page.getByTestId(`stance-card-${id}`).evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    const stage = el.parentElement!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2 - (stage.x + stage.width / 2), angle: (Math.atan2(m.b, m.a) * 180) / Math.PI };
  });
async function settled(page: import("@playwright/test").Page, id: string) {
  await expect.poll(async () => { const a = (await front(page, id)).x; await page.waitForTimeout(60); return Math.abs(a - (await front(page, id)).x) < 0.5; }).toBe(true);
}
async function grab(page: import("@playwright/test").Page) {
  const box = await page.getByTestId("stance-stage").boundingBox();
  if (!box) throw new Error("no stage");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test("swipe deck: the front card tilts with the drag, x ÷ 20 degrees", async ({ page }) => {
  await page.goto("/builds#boss");
  await settled(page, "boss");
  const { x, y } = await grab(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 100, y, { steps: 8 });
  const { x: dx, angle } = await front(page, "boss");
  expect(dx).toBeLessThan(-90);
  expect(angle).toBeCloseTo(dx / 20, 0);
  await page.mouse.up();
});

test("swipe deck: a quick flick throws the card even when short; a slow short drag springs back", async ({ page }) => {
  await page.goto("/builds#boss");
  await settled(page, "boss");
  const { x, y } = await grab(page);
  // Slow: 30 px, then a pause before letting go (no speed left), so it springs back.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 30, y, { steps: 3 });
  await page.waitForTimeout(150);
  await page.mouse.up();
  await settled(page, "boss");
  await expect(page.getByTestId("emblem-boss")).toHaveAttribute("aria-pressed", "true");
  expect(Math.abs((await front(page, "boss")).x)).toBeLessThan(1);
  // Quick: the same 30 px in two fast moves, released at once: its projection passes 50 px, so it goes.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 15, y);
  await page.mouse.move(x - 30, y);
  await page.mouse.up();
  await expect(page.getByTestId("emblem-marauder")).toHaveAttribute("aria-pressed", "true");
});

test("swipe deck: the thrown card leaves the side it was thrown and the next one settles with the settle spring", async ({ page }) => {
  await page.goto("/builds#boss");
  await settled(page, "boss");
  const { x, y } = await grab(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 80, y, { steps: 4 });
  // Record the thrown card's place on every frame after release.
  await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[data-testid="stance-card-boss"]')!;
    const centre = () => { const s = el.parentElement!.getBoundingClientRect(); const r = el.getBoundingClientRect(); return r.x + r.width / 2 - (s.x + s.width / 2); };
    const w = window as unknown as { __frames: number[] };
    w.__frames = [];
    const t0 = performance.now();
    requestAnimationFrame(function f(now) { w.__frames.push(centre()); if (now - t0 < 700) requestAnimationFrame(f); });
  });
  await page.mouse.up();
  const ease = await page.getByTestId("stance-card-marauder").evaluate((el) => getComputedStyle(el).transitionTimingFunction);
  expect(ease).toMatch(/^linear\(/);
  await settled(page, "boss");
  const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames);
  // Frame by frame, the thrown card keeps going left from where it was let go to its neighbour slot, passing
  // through the values between (a flight, not a jump), and lands upright.
  const end = await front(page, "boss");
  expect(frames.filter((f) => f < -85 && f > end.x + 5).length).toBeGreaterThan(3);
  expect(Math.min(...frames)).toBeGreaterThan(end.x - 25);
  expect(Math.abs(end.angle)).toBeLessThan(0.5);
  expect(Math.abs((await front(page, "marauder")).x)).toBeLessThan(1);
});

test("swipe deck: a card springing back can be caught mid-flight without a jump", async ({ page }) => {
  await page.goto("/builds#boss");
  await settled(page, "boss");
  const { x, y } = await grab(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 40, y, { steps: 4 });
  await page.waitForTimeout(150);
  await page.mouse.up();
  await page.waitForTimeout(40);
  const before = (await front(page, "boss")).x;
  await page.mouse.down();
  const after = (await front(page, "boss")).x;
  expect(before).toBeLessThan(-5);
  expect(Math.abs(after - before)).toBeLessThan(12);
  await page.mouse.up();
});

test("swipe deck with reduced motion: the cards change places at once and only fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/builds#boss");
  const prop = await page.getByTestId("stance-card-boss").evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(prop).toBe("opacity");
  const { x, y } = await grab(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 80, y, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByTestId("emblem-marauder")).toHaveAttribute("aria-pressed", "true");
  // No flight: the old front is in its neighbour slot on the next frame.
  const a = (await front(page, "boss")).x;
  await page.waitForTimeout(100);
  expect(Math.abs((await front(page, "boss")).x - a)).toBeLessThan(0.5);
});

test("swipe deck: a tap that catches a card still sliding in never throws it back", async ({ page }) => {
  await page.goto("/builds#boss");
  await settled(page, "boss");
  const { x, y } = await grab(page);
  await page.getByTestId("emblem-marauder").click();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
  await settled(page, "marauder");
  await expect(page.getByTestId("emblem-marauder")).toHaveAttribute("aria-pressed", "true");
  expect(Math.abs((await front(page, "marauder")).x)).toBeLessThan(1);
});

// Morph tooltip (motion-bookmarks.pdf #24): the archetype's name over an emblem under a mouse, one tooltip that slides
// between emblems; the first after 500 ms, the next at once.
const tooltip = (page: import("@playwright/test").Page) =>
  page.getByTestId("morph-tooltip").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { open: el.hasAttribute("data-open"), text: el.textContent, centre: r.left + r.width / 2, bottom: r.bottom, transition: getComputedStyle(el).transitionProperty };
  });

test.describe("morph tooltip on a desktop with a mouse", () => {
  test.use({ hasTouch: false, isMobile: false });

  test("the first name waits 500 ms, then sits over its emblem; the next slides there at once", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/builds#boss");
    const finisher = (await page.getByTestId("emblem-finisher").boundingBox())!;
    await page.mouse.move(finisher.x + finisher.width / 2, finisher.y + finisher.height / 2);
    await page.waitForTimeout(250);
    expect((await tooltip(page)).open).toBe(false);
    await expect.poll(async () => (await tooltip(page)).open).toBe(true);
    const first = await tooltip(page);
    expect(first.text).toBe("Finisher");
    expect(Math.abs(first.centre - (finisher.x + finisher.width / 2))).toBeLessThan(1);
    expect(Math.abs(first.bottom - (finisher.y - 8))).toBeLessThan(1);
    // The neighbour: no wait, and it slides (transform) rather than appearing anew, even across the gap between them
    // (steps: a real mouse passes over the gap, where the tooltip closes for a moment).
    const target = (await page.getByTestId("emblem-target").boundingBox())!;
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
    const next = await tooltip(page);
    expect([next.open, next.text]).toEqual([true, "Target"]);
    expect(next.transition).toBe("transform, translate, scale, rotate");
    await expect.poll(async () => Math.round((await tooltip(page)).centre)).toBe(Math.round(target.x + target.width / 2));
    // Off the rail it goes, and a while later the next one waits again.
    await page.mouse.move(10, 900);
    await expect.poll(async () => (await tooltip(page)).open).toBe(false);
    await page.waitForTimeout(400);
    await page.mouse.move(finisher.x + finisher.width / 2, finisher.y + finisher.height / 2);
    await page.waitForTimeout(150);
    expect((await tooltip(page)).open).toBe(false);
  });

  for (const width of [834, 1280]) {
    test(`over the last emblem at ${width} it adds no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/builds#boss");
      const last = (await page.getByTestId("emblem-target").boundingBox())!;
      await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2);
      await expect.poll(async () => (await tooltip(page)).open).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }

  test("with reduced motion it only fades: it never slides", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/builds#boss");
    const a = (await page.getByTestId("emblem-finisher").boundingBox())!;
    const b = (await page.getByTestId("emblem-target").boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await expect.poll(async () => (await tooltip(page)).open).toBe(true);
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    expect((await tooltip(page)).transition).toBe("none");
  });
});

test("morph tooltip: no tooltip on a phone (no hover)", async ({ page }) => {
  await page.goto("/builds#boss");
  await page.getByTestId("emblem-finisher").hover();
  await page.waitForTimeout(700);
  expect((await tooltip(page)).open).toBe(false);
});
