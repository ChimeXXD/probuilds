import { expect, type Page, test } from "@playwright/test";

// The Stance stage's picks without a drag (D-121 (3)): an arrow, a tap on a side card and the emblem rail move the
// cards on the same settle spring a throw uses; the keyboard moves nothing (D-120 (2)); reduced motion only fades.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

/** Records a card's centre (relative to the stage's centre) on every frame for `ms`. */
async function record(page: Page, id: string, ms = 700) {
  await page.evaluate(
    ({ id, ms }) => {
      const w = window as unknown as { __track: number[] };
      w.__track = [];
      const t0 = performance.now();
      requestAnimationFrame(function f(now) {
        const el = document.querySelector(`[data-testid="stance-card-${id}"]`);
        if (el) {
          const s = el.parentElement!.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          w.__track.push(r.x + r.width / 2 - (s.x + s.width / 2));
        }
        if (now - t0 < ms) requestAnimationFrame(f);
      });
    },
    { id, ms },
  );
}
const track = (page: Page) => page.evaluate(() => (window as unknown as { __track: number[] }).__track);
const centre = (page: Page, id: string) =>
  page.getByTestId(`stance-card-${id}`).evaluate((el) => {
    const s = el.parentElement!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return r.x + r.width / 2 - (s.x + s.width / 2);
  });

test("deck: Next moves the cards on the settle spring a throw uses: the new card flies in and settles past centre", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#boss");
  await page.waitForTimeout(500);
  const ease = await page.getByTestId("stance-card-marauder").evaluate((el) => getComputedStyle(el).transitionTimingFunction);
  expect(ease).toMatch(/^linear\(/);
  await record(page, "marauder");
  await page.getByRole("button", { name: "Next archetype" }).click();
  await page.waitForTimeout(750);
  const frames = await track(page);
  // From the right-hand slot, through the values between (a flight), a small overshoot past centre, then home.
  expect(frames[0]).toBeGreaterThan(100);
  expect(frames.filter((x) => x > 10 && x < 150).length).toBeGreaterThan(3);
  expect(Math.min(...frames)).toBeLessThan(-3);
  expect(Math.abs(await centre(page, "marauder"))).toBeLessThan(1);
});

test("deck: a jump on the rail carries the old card out and brings the new one in from the side it lies", async ({ page }) => {
  await page.goto("/builds#boss");
  await page.waitForTimeout(500);
  await record(page, "finisher");
  await page.getByTestId("emblem-finisher").click();
  await page.waitForTimeout(750);
  const frames = await track(page);
  // Finisher lies after Boss, so it comes in from the right and travels to centre (not a pop in place).
  expect(frames[0]).toBeGreaterThan(50);
  expect(frames.filter((x) => x > 5 && x < frames[0]! - 5).length).toBeGreaterThan(3);
  expect(Math.abs(await centre(page, "finisher"))).toBeLessThan(1);
  // The old front's window is gone once the flight is over.
  await expect(page.getByTestId("stance-card-boss")).toHaveCount(0);
});

test("deck: an arrow from the keyboard changes the cards at once, and the ring doesn't fly", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#boss");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Next archetype" }).focus();
  await record(page, "marauder", 300);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("emblem-marauder")).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(350);
  const frames = await track(page);
  // Every frame after the change already has the card home.
  const after = frames.slice(frames.findIndex((x) => Math.abs(x) < 1));
  expect(after.length).toBeGreaterThan(3);
  expect(after.every((x) => Math.abs(x) < 1)).toBe(true);
  // No frame between its side slot (165 px) and centre: it never travelled.
  expect(frames.filter((x) => Math.abs(x) > 1 && Math.abs(x) < 150)).toEqual([]);
  expect(await page.getByTestId("rubber-dock").evaluate((el) => el.hasAttribute("data-flying"))).toBe(false);
});

test("deck with reduced motion: an arrow only fades the cards; they don't travel", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#boss");
  await page.waitForTimeout(500);
  expect(await page.getByTestId("stance-card-marauder").evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("opacity");
  await page.getByRole("button", { name: "Next archetype" }).click();
  await page.waitForTimeout(50);
  expect(Math.abs(await centre(page, "marauder"))).toBeLessThan(1);
});

test("deck: a page opened on a linked archetype puts its card in place without a flight", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __xs: number[] };
    w.__xs = [];
    requestAnimationFrame(function f() {
      const el = document.querySelector('[data-testid="stance-card-sweeper-keeper"]');
      if (el) {
        const s = el.parentElement!.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        w.__xs.push(r.x + r.width / 2 - (s.x + s.width / 2));
      }
      if (performance.now() < 2500) requestAnimationFrame(f);
    });
  });
  await page.goto("/builds#sweeper-keeper");
  await page.waitForTimeout(900);
  const xs = await page.evaluate(() => (window as unknown as { __xs: number[] }).__xs);
  // From its side slot (246.5 px on a phone) straight to centre: never anywhere between.
  expect(xs.filter((x) => Math.abs(x) > 2 && Math.abs(x) < 240)).toEqual([]);
  expect(Math.abs(xs.at(-1)!)).toBeLessThan(1);
});

// D-121 (3): "If you click the card, it should take you to the build section".
test("deck: tapping the front card opens that archetype's builds, the same page as its See builds button", async ({ page }) => {
  await page.goto("/builds#finisher");
  await page.waitForTimeout(400);
  const href = await page.getByRole("link", { name: "See Finisher builds" }).getAttribute("href");
  await page.getByTestId("stance-card-finisher").click();
  await expect(page).toHaveURL(new RegExp(`${href}/?$`));
});

test("deck: a drag on the front card still swipes and never opens it; a tap on a side card still picks it", async ({ page }) => {
  await page.goto("/builds#boss");
  await page.waitForTimeout(400);
  const box = (await page.getByTestId("stance-stage").boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 90, y, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByTestId("emblem-marauder")).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(700); // let the thrown card land: a tap that catches a card in flight is a catch, not a pick
  await expect(page).toHaveURL(/#marauder$/);
  // The side card left of Marauder is Boss: a tap on its visible edge picks it; it doesn't open it.
  await page.mouse.click(box.x + 12, y);
  await expect(page.getByTestId("emblem-boss")).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/#boss$/);
});
