import { expect, test } from "@playwright/test";

// The Builds page's emblem rail ring (Rubber dock, RubberDock.tsx). Preview only for now (D-105).
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

// Rubber dock (motion-bookmarks.pdf #4): one lime ring that stretches from the old emblem to the new one and settles.
const dockSpan = (page: import("@playwright/test").Page) =>
  page.getByTestId("rubber-dock").evaluate((el) => {
    const [l, , r] = [...el.children].map((c) => c.getBoundingClientRect());
    return { left: l!.left, right: r!.right, top: l!.top, height: l!.height };
  });

test("rubber dock: the ring stretches on the way to the new emblem, then sits round it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#boss");
  const boss = await page.getByTestId("emblem-boss").boundingBox();
  await expect.poll(async () => Math.round((await dockSpan(page)).left)).toBe(Math.round(boss!.x));
  // The button hands its own ring to the dock once measured.
  await expect.poll(() => page.getByTestId("emblem-boss").evaluate((el) => getComputedStyle(el).borderTopColor)).toBe("rgba(0, 0, 0, 0)");
  await page.evaluate(() => {
    const w = window as unknown as { __spans: number[] };
    w.__spans = [];
    const dock = document.querySelector('[data-testid="rubber-dock"]')!;
    const t0 = performance.now();
    requestAnimationFrame(function f(now) {
      const [l, , r] = [...dock.children].map((c) => c.getBoundingClientRect());
      w.__spans.push(r!.right - l!.left);
      if (now - t0 < 600) requestAnimationFrame(f);
    });
  });
  await page.getByTestId("emblem-finisher").click();
  const finisher = await page.getByTestId("emblem-finisher").boundingBox();
  await expect.poll(async () => Math.round((await dockSpan(page)).left)).toBe(Math.round(finisher!.x));
  const end = await dockSpan(page);
  expect(Math.round(end.right - end.left)).toBe(Math.round(finisher!.width));
  await page.waitForTimeout(700);
  const spans = await page.evaluate(() => (window as unknown as { __spans: number[] }).__spans);
  // Mid-flight it was a pill well wider than one emblem.
  expect(Math.max(...spans)).toBeGreaterThan(finisher!.width * 2);
});

test("rubber dock with reduced motion: the ring fades in round the new emblem without travelling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#boss");
  await expect.poll(async () => page.getByTestId("rubber-dock").evaluate((el) => el.parentElement!.hasAttribute("data-docked"))).toBe(true);
  // Record the fade as it starts: a 150 ms animation may already be finished (and gone) by the time we look.
  await page.getByTestId("rubber-dock").evaluate((el) => {
    const w = window as unknown as { __fades: number[][] };
    w.__fades = [];
    const animate = el.animate.bind(el);
    el.animate = (frames, options) => {
      w.__fades.push((frames as Keyframe[]).map((k) => Number(k.opacity)));
      return animate(frames, options);
    };
  });
  await page.getByTestId("emblem-finisher").click();
  const finisher = await page.getByTestId("emblem-finisher").boundingBox();
  const span = await dockSpan(page);
  expect(Math.round(span.left)).toBe(Math.round(finisher!.x));
  expect(Math.round(span.right - span.left)).toBe(Math.round(finisher!.width));
  const fading = await page.evaluate(() => (window as unknown as { __fades: number[][] }).__fades);
  expect(fading).toEqual([[0, 1]]);
});

test("rubber dock: a page opened on a linked archetype puts the ring there without a flight", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    const w = window as unknown as { __maxSpan: number };
    w.__maxSpan = 0;
    requestAnimationFrame(function f() {
      const dock = document.querySelector('[data-testid="rubber-dock"]');
      if (dock?.parentElement?.hasAttribute("data-docked")) {
        const [l, , r] = [...dock.children].map((c) => c.getBoundingClientRect());
        w.__maxSpan = Math.max(w.__maxSpan, r!.right - l!.left);
      }
      if (performance.now() < 3000) requestAnimationFrame(f);
    });
  });
  await page.goto("/builds#finisher");
  await page.waitForTimeout(800);
  const size = (await page.getByTestId("emblem-finisher").boundingBox())!.width;
  expect(await page.evaluate(() => (window as unknown as { __maxSpan: number }).__maxSpan)).toBeLessThanOrEqual(size + 1);
});

/** The pixels of a screenshot, decoded in the page (no image library in the repo). */
async function pixels(page: import("@playwright/test").Page, png: Buffer) {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return [...ctx.getImageData(0, 0, img.width, img.height).data];
  }, png.toString("base64"));
}

for (const width of [390, 1440]) {
  test(`rubber dock at ${width}: at rest one whole ring sits round the picked emblem, with no seam (Chime, 28 Nov)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/builds#boss");
    const dock = page.getByTestId("rubber-dock");
    await expect.poll(() => dock.evaluate((el) => el.parentElement!.hasAttribute("data-docked"))).toBe(true);
    // Note when the flight starts, so the rest check below can't pass before the flight has begun.
    await dock.evaluate((el) => {
      const w = window as unknown as { __flew: boolean };
      w.__flew = false;
      new MutationObserver(() => (w.__flew ||= el.hasAttribute("data-flying"))).observe(el, { attributeFilter: ["data-flying"] });
    });
    await page.getByTestId("emblem-finisher").click();
    // In flight the stretch pieces show; once both edges are home the dock drops data-flying.
    await expect.poll(() => page.evaluate(() => (window as unknown as { __flew: boolean }).__flew)).toBe(true);
    await expect.poll(() => dock.evaluate((el) => el.hasAttribute("data-flying"))).toBe(false);
    await page.waitForTimeout(150); // the opacity swap is instant, but let a frame paint
    const layers = await dock.evaluate((el) => [...el.children].map((c) => getComputedStyle(c).opacity));
    // Three stretch pieces hidden, the whole ring shown.
    expect(layers).toEqual(["0", "0", "0", "1"]);
    const emblem = page.getByTestId("emblem-finisher");
    const box = (await emblem.boundingBox())!;
    const ring = (await page.getByTestId("rubber-dock-ring").boundingBox())!;
    expect(Math.abs(ring.x - box.x)).toBeLessThan(0.5);
    expect(Math.abs(ring.width - box.width)).toBeLessThan(0.5);
    // Pixel check: the docked ring must look like the ring the button draws itself (one CSS border, no seam). Take
    // the emblem with the dock's ring, then hand the ring back to the button and take it again.
    const clip = { x: box.x - 2, y: box.y - 2, width: box.width + 4, height: box.height + 4 };
    const docked = await pixels(page, await page.screenshot({ clip }));
    await page.evaluate(() => document.querySelector('[data-testid="rubber-dock"]')!.parentElement!.removeAttribute("data-docked"));
    await page.waitForTimeout(300); // the button's border colour fades in over 150 ms
    const own = await pixels(page, await page.screenshot({ clip }));
    let off = 0;
    for (let i = 0; i < docked.length; i += 4) {
      const d = Math.max(...[0, 1, 2].map((c) => Math.abs(docked[i + c]! - own[i + c]!)));
      if (d > 48) off++;
    }
    expect(off).toBeLessThan(6);
  });
}
