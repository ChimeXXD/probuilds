import { expect, type Page, test } from "@playwright/test";

// The face page's motion (motion-bookmarks #9 Step progress, #10 Checkbox list, #23 Morph popover;
// docs/design/motion-placement.md "Face page"). Preview only: Figma's sample recipe draws steps 1, 2 and 9 of 18.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

const URL = "/faces/cristiano-ronaldo-2008";
const KEY = "face:cristiano-ronaldo-2008:v1";

/** Each running animation under `selector`: its keyframe properties or transition property, and its CSS name. */
const animations = (page: Page, selector: string) =>
  page.locator(selector).evaluate((root) =>
    root.getAnimations({ subtree: true }).map((a) => {
      const effect = a.effect as KeyframeEffect;
      const props =
        "transitionProperty" in a ? [(a as CSSTransition).transitionProperty] : effect.getKeyframes().flatMap((k) => Object.keys(k));
      return {
        name: "animationName" in a ? (a as CSSAnimation).animationName : null,
        props: [...new Set(props)].filter((p) => !["offset", "easing", "composite", "computedOffset"].includes(p)),
        on: (effect.target as HTMLElement).getAttribute("data-testid") ?? (effect.target as HTMLElement).tagName.toLowerCase(),
      };
    }),
  );

test("Done, next: the step number rolls and the finished section pops; the section bar grows by transform", async ({ page }) => {
  await page.goto(URL);
  await page.getByRole("button", { name: "Done, next" }).click();
  const label = await animations(page, '[data-testid="face-progress"] p');
  expect(label.map((a) => a.name)).toEqual(expect.arrayContaining(["roll-in-up", "roll-out-up"]));
  const bar = await animations(page, '[data-testid="section-bar"]');
  // Preset (the first section) is done: its segment pops by transform; fills move by transform too.
  expect(bar.some((a) => a.props.includes("transform") && a.name === null && a.on === "span")).toBe(true);
  expect(bar.flatMap((a) => a.props).every((p) => p === "transform")).toBe(true);
  // Timed from the motion tokens as the minified CSS writes them (--dur-base: .22s), so 220 ms, not 0.22.
  const pop = await page.getByTestId("section-bar").evaluate((el) => el.children[0]?.getAnimations()[0]?.effect?.getComputedTiming());
  expect(pop).toMatchObject({ duration: 220, delay: 150 });
  await expect(page.getByTestId("face-progress")).toContainText("Step 2 of 18 · Skin");
});

test("arriving on a stored step: nothing rolls or pops", async ({ page }) => {
  await page.addInitScript(([key]) => localStorage.setItem(key as string, JSON.stringify({ step: 9 })), [KEY]);
  await page.goto(URL);
  await expect(page.getByTestId("face-progress")).toContainText("Step 9 of 18 · Sculpt");
  const label = await animations(page, '[data-testid="face-progress"] p');
  expect(label).toEqual([]);
  const pops = (await animations(page, '[data-testid="section-bar"]')).filter((a) => a.props.includes("transform") && a.on === "span");
  // Only the fills' own transitions (CSS), never a pop (a Web Animation on the segment).
  expect(pops.every((a) => a.name === null && a.props.length === 1)).toBe(true);
  expect(await page.getByTestId("section-bar").evaluate((el) => [...el.children].flatMap((c) => c.getAnimations()).length)).toBe(0);
});

test("All steps: a tick pops and its check draws in by clip-path; the row dims without a strike-through", async ({ page }) => {
  await page.goto(URL);
  await page.getByRole("button", { name: "All steps" }).click();
  const dialog = page.getByRole("dialog", { name: "All steps" });
  await expect(dialog).toBeVisible();
  await dialog.getByTestId("step-tick-2").click();
  const ticks = await animations(page, "dialog[open]");
  // Steps 1 and 2 are marked done by the one tap: both pop and draw together.
  expect(ticks.filter((a) => a.on.startsWith("step-tick-") && a.props.includes("transform")).map((a) => a.on).sort()).toEqual(["step-tick-1", "step-tick-2"]);
  expect(ticks.filter((a) => a.props.includes("clipPath"))).toHaveLength(2);
  const title = dialog.getByTestId("step-row-2").locator("span.type-body");
  expect(await title.evaluate((el) => getComputedStyle(el).transitionProperty)).toContain("color");
  expect(await title.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
  // Closing and opening again doesn't replay them.
  await dialog.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "All steps" }).click();
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
  expect((await animations(page, "dialog[open]")).filter((a) => a.props.includes("clipPath"))).toHaveLength(0);
});

test("All steps, reduced motion: the check fades in, nothing pops", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(URL);
  await page.getByRole("button", { name: "All steps" }).click();
  await page.getByRole("dialog", { name: "All steps" }).getByTestId("step-tick-1").click();
  const ticks = await animations(page, "dialog[open]");
  expect(ticks.some((a) => a.props.includes("transform") || a.props.includes("clipPath"))).toBe(false);
  expect(ticks.some((a) => a.props.includes("opacity"))).toBe(true);
});

test("tablet: the All steps dialog grows out of the All steps link", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto(URL);
  const link = page.getByRole("button", { name: "All steps" });
  await link.click();
  const dialog = page.getByRole("dialog", { name: "All steps" });
  const moving = await animations(page, "dialog[open]");
  // Scale and a fade (the sheet's translate is reset to 0 from tablet, a no-op transition from 0px).
  const props = moving.filter((a) => a.on === "dialog").flatMap((a) => a.props);
  expect(props).toEqual(expect.arrayContaining(["opacity", "scale"]));
  expect(props.every((p) => ["opacity", "scale", "translate"].includes(p))).toBe(true);
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
  const [origin, box, l] = [await dialog.evaluate((el) => getComputedStyle(el).transformOrigin), await dialog.boundingBox(), await link.boundingBox()];
  const [ox, oy] = origin.split(" ").map(parseFloat) as [number, number];
  expect(box && l && Math.abs(box.x + ox - (l.x + l.width / 2))).toBeLessThan(1.5);
  expect(box && l && Math.abs(box.y + oy - (l.y + l.height / 2))).toBeLessThan(1.5);
});

test("Task list: each section shows its done count; a tapped open brings the rows in one after another", async ({ page }) => {
  await page.goto(URL);
  await page.getByRole("button", { name: "All steps" }).click();
  const dialog = page.getByRole("dialog", { name: "All steps" });
  // Figma's sample draws steps 1 (Preset), 2 (Skin) and 9 (Sculpt): one label per section drawn, with its count.
  await expect(dialog.getByTestId("step-section-Preset")).toHaveText("Preset0 of 1");
  await expect(dialog.getByTestId("step-section-Sculpt")).toContainText("of");
  const lines = await dialog.locator("ol > li").evaluateAll((els) =>
    els.map((el) => el.getAnimations().map((a) => ({ delay: a.effect?.getComputedTiming().delay, keys: Object.keys((a.effect as KeyframeEffect).getKeyframes()[0] ?? {}) }))[0]),
  );
  // Every line fades up by transform and opacity; the delays climb, gaps shrinking, and stop at the cap.
  expect(lines.every((l) => l?.keys.includes("opacity") && l.keys.includes("transform"))).toBe(true);
  const delays = lines.map((l) => l?.delay as number);
  expect(delays[0]).toBe(0);
  for (let i = 1; i < delays.length; i++) {
    if (i < 8) expect(delays[i]).toBeGreaterThan(delays[i - 1]!);
    else expect(delays[i]).toBe(delays[i - 1]);
  }
  expect(Math.max(...delays)).toBeLessThanOrEqual(136);
  // Ticking Preset's step fills its count: it rolls to 1 of 1.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
  await dialog.getByTestId("step-tick-1").click();
  await expect(dialog.getByTestId("step-section-Preset")).toHaveText("Preset1 of 1");
});

test("Task list from the keyboard, or with reduced motion: the rows come with the sheet, no stagger", async ({ page }) => {
  await page.goto(URL);
  await page.getByRole("button", { name: "All steps" }).focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "All steps" });
  await expect(dialog).toBeVisible();
  expect(await dialog.locator("ol > li").evaluateAll((els) => els.flatMap((el) => el.getAnimations()).length)).toBe(0);
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "All steps" }).click();
  expect(await dialog.locator("ol > li").evaluateAll((els) => els.flatMap((el) => el.getAnimations()).length)).toBe(0);
});
