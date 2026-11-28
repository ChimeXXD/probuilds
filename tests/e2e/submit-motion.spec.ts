import { expect, type Page, test } from "@playwright/test";

// Motion on Submit a build (motion-bookmarks.pdf, motion-placement.pdf pages 10 to 12). Preview only: the editor opens
// on Figma's sample, a draft (D-105).
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

/** Clicks a button with a pointer (detail 1) or as Enter does (detail 0), in the page, and reads `read` on the next
 * frame, so a 140 ms roll is still there to see however slow the test runner is. */
const clickAndRead = <T,>(page: Page, selector: string, read: string, detail = 1) =>
  page.evaluate(
    async ([sel, fn, d]) => {
      document.querySelector<HTMLElement>(sel)!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: d }));
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      return new Function(`return (${fn})()`)() as T;
    },
    [selector, read, detail] as const,
  );

const stepRoll = `() => [...document.querySelectorAll('[data-testid="step-count"] > span > span')].map((e) => getComputedStyle(e).animationName)`;

test("step progress: the step's number rolls up going forward, down going back; a key press doesn't roll (#9)", async ({ page }) => {
  await page.goto("/submit");
  await expect(page.getByTestId("step-count")).toHaveText("1 of 4");
  // Nothing rolls on the first step shown.
  expect(await page.evaluate(`(${stepRoll})()`)).toEqual(["none"]);
  expect(await clickAndRead<string[]>(page, '[data-testid="submit-next"]', stepRoll)).toEqual(["roll-in-up", "roll-out-up"]);
  await expect(page.getByTestId("step-count")).toHaveText("2 of 4");
  await page.waitForTimeout(200);
  expect(await clickAndRead<string[]>(page, '[data-testid="submit-actions"] button:first-child', stepRoll)).toEqual(["roll-in-down", "roll-out-down"]);
  await expect(page.getByTestId("step-count")).toHaveText("1 of 4");
  await page.waitForTimeout(200);
  expect(await clickAndRead<string[]>(page, '[data-testid="submit-next"]', stepRoll, 0)).toEqual(["none"]);
  await expect(page.getByTestId("step-count")).toHaveText("2 of 4");
});

test("step progress with reduced motion: the number crossfades", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/submit");
  expect(await clickAndRead<string[]>(page, '[data-testid="submit-next"]', stepRoll)).toEqual(["fade-in", "fade-out"]);
});

// Segmented control (#7): the shared sliding pill (PillRow, the one the other chip rows use) travels to the picked
// group; the new group's tiles fade and rise in, 0 / 45 / 80 ms apart, unless the pick came from the keyboard.
/** The row of group chips: the real chips, then the pill's ring and lime layers (PillRow). */
const groupRow = `[...document.querySelectorAll('[data-testid="submit-group"]')][0].parentElement`;
const pillState = `() => {
  const row = ${groupRow};
  const fill = row.lastElementChild;
  const picked = row.querySelector('[data-testid="submit-group"][aria-pressed="true"]');
  return {
    picked: picked.textContent,
    clip: getComputedStyle(fill).clipPath,
    transition: getComputedStyle(fill).transitionProperty,
    tiles: [...document.querySelectorAll('[data-testid="archetype-tile"]')].map((t) => getComputedStyle(t).animationName + " " + getComputedStyle(t).animationDelay),
  };
}`;
type Pill = { picked: string; clip: string; transition: string; tiles: string[] };
const readPill = (page: Page) => page.evaluate(`(${pillState})()`) as Promise<Pill>;
/** Opens /submit once the script has placed the pill (the static page draws the picked chip lime by itself). */
const openStart = async (page: Page) => {
  await page.goto("/submit");
  await expect.poll(async () => (await readPill(page)).clip).toMatch(/^inset/);
};
/** Clicks a group chip by its label, with a pointer (detail 1) or as Enter does (detail 0), and reads the row. */
const pickGroup = (page: Page, label: string, detail = 1) =>
  page.evaluate(
    async ([l, d, fn]) => {
      const chip = [...document.querySelectorAll<HTMLElement>('[data-testid="submit-group"]')].find((c) => c.textContent === l)!;
      chip.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: d }));
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      return new Function(`return (${fn})()`)() as Pill;
    },
    [label, detail, pillState] as const,
  );

test("segmented control: the pill travels to the group picked; its tiles rise in one after another (#7)", async ({ page }) => {
  await openStart(page);
  const first = await readPill(page);
  expect(first.picked).toBe("Forward");
  // The first view doesn't animate the tiles.
  expect(first.tiles.every((t) => t.startsWith("none"))).toBe(true);
  // At 360 px Forward wraps to a second line: a pick on the other line fades the pill in there instead of sliding
  // diagonally across both lines (usePill); on one line it slides.
  const top = (label: string) => page.getByTestId("submit-group").filter({ hasText: label }).evaluate((el) => el.getBoundingClientRect().top);
  const sameLine = Math.abs((await top("Forward")) - (await top("Defender"))) < 2;
  const mid = await pickGroup(page, "Defender");
  expect(mid.picked).toBe("Defender");
  expect(mid.transition).toBe("clip-path");
  expect(mid.tiles).toEqual(["fade-rise 0s", "fade-rise 0.045s", "fade-rise 0.08s"]);
  // Two frames in it is on its way (when it slides); then it comes to rest on Defender, away from where it was.
  await page.waitForTimeout(500);
  const landed = (await readPill(page)).clip;
  expect(landed).not.toBe(first.clip);
  if (sameLine) expect(mid.clip).not.toBe(landed);
  else expect(mid.clip).toBe(landed);
  await page.waitForTimeout(100);
  expect((await readPill(page)).clip).toBe(landed);
  await expect(page.getByTestId("submit-group").and(page.locator("[aria-pressed=true]"))).toHaveText("Defender");
});

test("segmented control from the keyboard, and with reduced motion: the tiles don't rise", async ({ page }) => {
  await openStart(page);
  const key = await pickGroup(page, "Midfielder", 0);
  expect(key.picked).toBe("Midfielder");
  expect(key.tiles.every((t) => t.startsWith("none"))).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStart(page);
  const reduced = await pickGroup(page, "Keeper");
  expect(reduced.transition).toBe("none");
  expect(reduced.tiles).toEqual(["fade-in 0s", "fade-in 0s"]);
});

// Number stepper (#12): the level and every attribute roll on a tap of − / +; a key press, or a tap faster than the
// 140 ms roll, sets the number at once.
const rollOf = (testId: string) => `() => [...document.querySelectorAll('[data-testid="${testId}"] > span > span')].map((e) => getComputedStyle(e).animationName)`;
/** Two pointer taps `gap` ms apart, in the page, then the roll's animation names on the next frame. */
const doubleTap = (page: Page, selector: string, read: string, gap = 40) =>
  page.evaluate(
    async ([sel, fn, g]) => {
      const tap = () => document.querySelector<HTMLElement>(sel)!.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
      tap();
      await new Promise((r) => setTimeout(r, g));
      tap();
      await new Promise(requestAnimationFrame);
      return new Function(`return (${fn})()`)() as string[];
    },
    [selector, read, gap] as const,
  );

test("number stepper: the level rolls up on +, down on −; fast taps and key presses don't roll (#12)", async ({ page }) => {
  await openStart(page);
  await expect(page.getByTestId("level-number")).toHaveText("44");
  expect(await clickAndRead<string[]>(page, 'button[aria-label="Level up"]', rollOf("level-number"))).toEqual(["roll-in-up", "roll-out-up"]);
  await expect(page.getByTestId("level-number")).toHaveText("45");
  await page.waitForTimeout(200);
  expect(await clickAndRead<string[]>(page, 'button[aria-label="Level down"]', rollOf("level-number"))).toEqual(["roll-in-down", "roll-out-down"]);
  await page.waitForTimeout(200);
  expect(await doubleTap(page, 'button[aria-label="Level up"]', rollOf("level-number"))).toEqual(["none"]);
  await expect(page.getByTestId("level-number")).toHaveText("46");
  await page.waitForTimeout(200);
  expect(await clickAndRead<string[]>(page, 'button[aria-label="Level up"]', rollOf("level-number"), 0)).toEqual(["none"]);
  await expect(page.getByTestId("level-number")).toHaveText("47");
  await expect(page.getByTestId("submit-ap")).toContainText("Level 48 adds");
});

test("number stepper: an attribute's number rolls in its box; typing shows the field itself (#12)", async ({ page }) => {
  await page.goto("/submit?state=attributes");
  const row = page.getByTestId("attribute-row").filter({ hasText: "Acceleration" });
  await expect(row.getByTestId("attribute-value")).toHaveText("88");
  const sel = '[data-testid="attribute-row"]:has(#attr-acceleration)';
  expect(await clickAndRead<string[]>(page, `${sel} button[aria-label="Acceleration up"]`, `() => [...document.querySelectorAll('${sel} [data-testid="attribute-value"] > span > span')].map((e) => getComputedStyle(e).animationName)`)).toEqual([
    "roll-in-up",
    "roll-out-up",
  ]);
  await expect(page.getByRole("textbox", { name: "Acceleration", exact: true })).toHaveValue("89");
  await expect(row.getByTestId("attribute-value")).toHaveText("89");
  // The field's own text is see-through under the rolling number; typing hides the number and shows the field's.
  await expect(page.getByRole("textbox", { name: "Acceleration", exact: true })).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  await page.getByRole("textbox", { name: "Acceleration", exact: true }).click();
  await expect(row.getByTestId("attribute-value")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Acceleration", exact: true })).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
  await page.getByRole("textbox", { name: "Acceleration", exact: true }).fill("90");
  await page.getByRole("textbox", { name: "Acceleration", exact: true }).blur();
  await expect(row.getByTestId("attribute-value")).toHaveText("90");
  expect(await doubleTap(page, `${sel} button[aria-label="Acceleration down"]`, `() => [...document.querySelectorAll('${sel} [data-testid="attribute-value"] > span > span')].map((e) => getComputedStyle(e).animationName)`)).toEqual(["none"]);
  await expect(row.getByTestId("attribute-value")).toHaveText("88");
});

// Exposure slider (#16): the level's track has a tick for every level; the knob and the fill settle on the level by
// transform with the settle spring; a key press moves them at once; a drag across a level gives a haptic tick.
const knob = (page: Page, slider: string) => page.locator(`div:has(> input[aria-label="${slider}"]) [data-part="knob"]`);
/** The slider's box, scrolled to the middle of the screen (clear of the sticky actions bar) for a mouse drag. */
const sliderBox = async (page: Page, name: string) => {
  const slider = page.getByRole("slider", { name });
  await slider.evaluate((el) => el.scrollIntoView({ block: "center" }));
  return (await slider.boundingBox())!;
};

test("exposure slider: 55 level ticks; the knob and fill settle by transform; keys move them at once (#16)", async ({ page }) => {
  await openStart(page);
  const track = page.locator('div:has(> input[aria-label="Level"])');
  const ticks = await track.locator('[data-part="ticks"]').evaluate((el) => {
    const t = el.getBoundingClientRect();
    return [...el.children].map((c) => (c.getBoundingClientRect().left - t.left) / t.width);
  });
  expect(ticks).toHaveLength(55);
  ticks.forEach((x, i) => expect(x).toBeCloseTo((i + 1) / 55, 2));
  // The page never scrolls sideways because of the knob.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => document.documentElement.clientWidth));
  await page.getByRole("button", { name: "Level up" }).click();
  const k = knob(page, "Level");
  expect(await k.evaluate((el) => [getComputedStyle(el).transitionProperty, getComputedStyle(el).transitionTimingFunction.slice(0, 7)])).toEqual(["transform, translate, scale, rotate", "linear("]);
  expect(await track.locator('[data-part="fill"]').evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("transform, translate, scale, rotate");
  // It lands at 45 / 55 of the track, the fill scaled to the same share.
  await expect.poll(() => k.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).e / el.parentElement!.clientWidth)).toBeCloseTo(45 / 55, 3);
  await expect.poll(() => track.locator('[data-part="fill"]').evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)).toBeCloseTo(45 / 55, 3);
  await page.getByRole("slider", { name: "Level" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("level-number")).toHaveText("46");
  expect(await k.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
});

test("exposure slider: dragging across levels gives a light haptic tick per level where the phone can", async ({ page }) => {
  await page.addInitScript(() => {
    const calls: unknown[] = [];
    Object.assign(window, { vibrations: calls });
    Object.defineProperty(navigator, "vibrate", { value: (p: unknown) => (calls.push(p), true), configurable: true });
  });
  await openStart(page);
  const box = await sliderBox(page, "Level");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 10 + (box.width - 20) * (44 / 55), y);
  await page.mouse.down();
  await page.mouse.move(box.x + 10 + (box.width - 20) * (40 / 55), y, { steps: 8 });
  await page.mouse.up();
  const level = Number(await page.getByTestId("level-number").textContent());
  expect(level).toBeLessThan(44);
  const calls = await page.evaluate(() => (window as unknown as { vibrations: unknown[] }).vibrations);
  expect(calls.length).toBeGreaterThan(0);
  expect(calls.every((c) => c === 5)).toBe(true);
});

// Range slider (#15): held, the knob grows 1.1× and a bubble with the value rides on it (follow spring); a key press
// shows neither and moves the knob at once.
test("range slider: holding the height knob grows it and shows the value on it; keys don't (#15)", async ({ page }) => {
  await openStart(page);
  const height = page.locator('div:has(> input[aria-label="Height"])');
  const dot = height.locator('[data-part="knob-dot"]');
  const bubble = height.locator('[data-part="bubble"]');
  await expect(bubble).toHaveCSS("opacity", "0");
  const box = await sliderBox(page, "Height");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 10 + (box.width - 20) * (20 / 25), y);
  await page.mouse.down();
  await expect(dot).toHaveCSS("scale", "1.1");
  await expect(bubble).toHaveCSS("opacity", "1");
  await page.mouse.move(box.x + 10 + (box.width - 20) * (15 / 25), y, { steps: 5 });
  await expect(bubble).toHaveText(/^\d'\d{1,2}"$/); // feet first (D-121 (6))
  expect(await knob(page, "Height").evaluate((el) => getComputedStyle(el).transitionTimingFunction.slice(0, 7))).toBe("linear(");
  await page.mouse.up();
  await expect(dot).toHaveCSS("scale", "none");
  await expect(bubble).toHaveCSS("opacity", "0");
  // From the keyboard: no bubble, no grow, no glide.
  await page.getByRole("slider", { name: "Height" }).focus();
  await page.keyboard.press("ArrowRight");
  expect(await knob(page, "Height").evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
  await expect(bubble).toHaveCSS("opacity", "0");
});

test("range slider with reduced motion: the bubble only fades, the knob doesn't grow or glide", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStart(page);
  const height = page.locator('div:has(> input[aria-label="Height"])');
  const box = await sliderBox(page, "Height");
  await page.mouse.move(box.x + 10 + (box.width - 20) * (20 / 25), box.y + box.height / 2);
  await page.mouse.down();
  await expect(height.locator('[data-part="bubble"]')).toHaveCSS("opacity", "1");
  await expect(height.locator('[data-part="knob-dot"]')).toHaveCSS("scale", "1");
  expect(await knob(page, "Height").evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
  await page.mouse.up();
});
