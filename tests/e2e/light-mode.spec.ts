import { expect, type Locator, type Page, test } from "@playwright/test";

// D-125 (4): the light-mode sweep. Lime (#d8ff4f) on cream or white is 1.03–1.07:1, so in light mode every lime
// shape that carries meaning (a gauge's arc, a slider's progress, an AP meter, a knob, the picked tile's ring, an
// active chip's edge) is accent/text instead (D-115's rule), a lime fill keeps its 1 px ink ring (D-102 (5)), and a
// field's edge is input/border at 3:1 (WCAG 1.4.11). Plus a contrast pass over the main pages: no text under AA.

const ACCENT_TEXT = "rgb(44, 87, 72)"; // accent/text, light (#2c5748)
const LIME = "rgb(216, 255, 79)"; // accent/fill (#d8ff4f)
const INPUT_BORDER = "rgb(140, 138, 130)"; // input/border, light (#8c8a82)

const light = (page: Page) => page.addInitScript(() => localStorage.setItem("theme", "light"));
const css = (el: Locator, prop: string) => el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop);

test.describe("light mode", () => {
  // Submit, Faces and the sample build are preview pages.
  test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");
  test.beforeEach(({ page }) => light(page));

  test("Build page: the gauges' arc is accent/text on a visible track, the AP meter's 'left' is accent/text", async ({ page }) => {
    await page.goto("/builds/finisher/meta-finisher");
    const gauge = page.locator("svg path[stroke-dasharray]").first();
    expect(await css(gauge, "stroke")).toBe(ACCENT_TEXT);
    const track = page.locator("svg:has(path[stroke-dasharray]) path:not([stroke-dasharray])").first();
    expect(await css(track, "stroke")).toBe("rgb(209, 206, 193)"); // border/subtle, not white on cream
    expect(await css(page.getByTestId("ap-meter").locator("[data-part=left]"), "background-color")).toBe(ACCENT_TEXT);
    // Spent sits right beside left: text/secondary next to accent/text was 1.03:1, so spent is border/strong.
    expect(await css(page.getByTestId("ap-meter").locator("[data-part=spent]"), "background-color")).toBe("rgb(183, 180, 169)");
    // The meters' empty tracks are border/subtle, not white on cream (1.1:1), the level slider's included.
    expect(await css(page.getByTestId("ap-meter"), "background-color")).toBe("rgb(209, 206, 193)");
    expect(await css(page.getByTestId("level-fill").locator("xpath=.."), "background-color")).toBe("rgb(209, 206, 193)");
  });

  test("Submit: the level's progress, the picked archetype's ring, the AP meter, the active group and off PlayStyles", async ({ page }) => {
    await page.goto("/submit");
    expect(await css(page.locator("[data-part=fill]").first(), "background-color")).toBe(ACCENT_TEXT);
    const picked = page.getByTestId("archetype-tile").and(page.locator("[aria-pressed=true]"));
    expect(await css(picked, "box-shadow")).toContain(ACCENT_TEXT);
    await page.getByRole("button", { name: /^Attributes/ }).click();
    expect(await css(page.getByTestId("ap-meter-spent"), "background-color")).toBe(ACCENT_TEXT);
    const group = page.getByRole("navigation", { name: "Attribute groups" }).locator("[aria-current=true]");
    expect(await css(group, "border-top-color")).toBe(ACCENT_TEXT);
    await page.getByRole("button", { name: /^PlayStyles/ }).click();
    // An unpicked PlayStyle's deep-gold badge isn't dimmed in light mode (at 60 % it was 1.95:1 on cream).
    const off = page.getByTestId("playstyle-chip").and(page.locator("[aria-pressed=false]")).first().getByTestId("playstyle-art");
    expect(await css(off, "opacity")).toBe("1");
  });

  test("fields' edges are input/border, 3:1 on white and on cream", async ({ page }) => {
    await page.goto("/faces");
    const field = page.getByTestId("search-field");
    expect(await css(field, "border-top-color")).toBe(INPUT_BORDER);
  });

  test("a face's All steps: a done step's lime circle has its ink ring; an open one's edge is input/border", async ({ page }) => {
    await page.goto("/faces/neymar-jr-mohawk");
    await page.getByRole("button", { name: /Done, next/i }).click();
    await page.getByRole("button", { name: /All steps/i }).first().click();
    expect(await css(page.getByTestId("step-tick-1"), "box-shadow")).toContain("rgb(16, 17, 19)");
    expect(await css(page.getByTestId("step-tick-2"), "border-top-color")).toBe(INPUT_BORDER);
  });
});

test("dark mode keeps lime for the same shapes", async ({ page }) => {
  test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");
  await page.goto("/submit");
  expect(await css(page.locator("[data-part=fill]").first(), "background-color")).toBe(LIME);
});

// Text contrast on the main pages in light mode: every visible text at full opacity, not inside a disabled control,
// against the colours behind it (pictures and gradients are skipped: their contrast is checked by eye).
// Faces, Builds and Submit are page.preview.tsx: on the live build they are the 404, so they run with PROBUILDS_DRAFTS=1.
const PAGES = ["/", "/changelog", "/about", "/takedown", "/nope"];
const PREVIEW_PAGES = ["/faces", "/builds", "/builds/finisher", "/submit", "/submit/request"];
for (const path of [...PAGES, ...PREVIEW_PAGES]) {
  test(`light mode: text on ${path} meets AA`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone-390", "one width is enough per run; the sweep checked 390 and 1440");
    test.skip(PREVIEW_PAGES.includes(path) && process.env.PROBUILDS_DRAFTS !== "1", "preview page");
    await light(page);
    await page.goto(path);
    // Text still fading in (opacity < 1) is skipped below, so let the finite entrance animations end first.
    await page.evaluate(async () => {
      await document.fonts.ready;
      const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
      await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
    });
    const low = await page.evaluate(() => {
      const rgba = (c: string) => {
        const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c);
        return m ? [+m[1]!, +m[2]!, +m[3]!, m[4] === undefined ? 1 : +m[4]] : null;
      };
      const over = (t: number[], b: number[]) => [0, 1, 2].map((i) => t[i]! * t[3]! + b[i]! * (1 - t[3]!));
      const lum = (c: number[]) => {
        const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!);
      };
      const out: string[] = [];
      for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1 || el.closest(":disabled,[aria-disabled=true],[inert]")) continue;
        const s = getComputedStyle(el);
        if (s.visibility === "hidden") continue;
        let faded = false;
        const layers: number[][] = [];
        let picture = false;
        for (let n: HTMLElement | null = el; n; n = n.parentElement) {
          const ns = getComputedStyle(n);
          if (Number(ns.opacity) < 1) faded = true;
          if (ns.backgroundImage !== "none") picture = true;
          const bg = rgba(ns.backgroundColor);
          if (bg && bg[3]! > 0) layers.push(bg);
          if (bg && bg[3] === 1) break;
        }
        const fg = rgba(s.color);
        if (faded || picture || !fg) continue;
        let back = [255, 255, 255];
        for (let i = layers.length - 1; i >= 0; i--) back = over(layers[i]!, back);
        const text = over(fg, back);
        const [a, b] = [lum(text), lum(back)].sort((x, y) => y - x);
        const ratio = (a! + 0.05) / (b! + 0.05);
        const size = parseFloat(s.fontSize);
        const need = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700) ? 3 : 4.5;
        if (ratio < need) out.push(`${el.textContent!.trim().slice(0, 40)} · ${ratio.toFixed(2)}:1`);
      }
      return out;
    });
    expect(low).toEqual([]);
  });
}
