import { expect, test } from "@playwright/test";

// D-125 (2): the phone pass. Every page at 320, 360, 390 and 430 px: no sideways scroll, the top bar inside the
// screen (search was pushed off it at 320 px), the footer inside its gutters; no input that makes iOS zoom (under
// 16 px); no grey tap flash; the small links and the Request field are 44 px targets.
const DRAFTS = process.env.PROBUILDS_DRAFTS === "1";
const LIVE = ["/", "/changelog", "/about", "/takedown", "/no-such-page"];
const PREVIEW = ["/faces", "/faces/cristiano-ronaldo-2008", "/builds", "/builds/finisher", "/builds/finisher/meta-finisher", "/search", "/submit", "/submit/request"];
const PAGES = DRAFTS ? [...LIVE, ...PREVIEW] : LIVE;

for (const width of [320, 360, 390, 430]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("no page scrolls sideways; the top bar and the footer stay inside the screen", async ({ page }) => {
      for (const path of PAGES) {
        await page.goto(path);
        const fit = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const right = (sel: string) => Math.max(...[...document.querySelectorAll(sel)].map((el) => el.getBoundingClientRect().right));
          return { vw, scroll: document.documentElement.scrollWidth, bar: right("[data-testid=top-bar] a, [data-testid=top-bar] button"), footer: right("footer nav a") };
        });
        expect(fit.scroll, path).toBeLessThanOrEqual(fit.vw);
        // The search button inside the screen (at 320 px its 44 px box ends about 5 px short of the edge, the
        // icon about 15 px; keeping the full 20 px gutter there would drop the season chip).
        expect(fit.bar, path).toBeLessThanOrEqual(fit.vw);
        expect(fit.footer, path).toBeLessThanOrEqual(fit.vw - 20 + 0.5);
      }
    });
  });
}

test("no tap flash anywhere, and a tap is a click at once", async ({ page }) => {
  await page.goto("/");
  const [flash, touch] = await page.evaluate(() => [
    getComputedStyle(document.querySelector("footer a")!).getPropertyValue("-webkit-tap-highlight-color"),
    getComputedStyle(document.querySelector("footer a")!).touchAction,
  ]);
  expect(flash).toBe("rgba(0, 0, 0, 0)");
  expect(touch).toBe("manipulation");
});

test.describe("preview pages", () => {
  test.skip(!DRAFTS, "preview pages");

  test("every text field is 16 px or more, so iOS doesn't zoom into it", async ({ page }) => {
    for (const path of ["/search", "/faces", "/submit/request"]) {
      await page.goto(path);
      const sizes = await page.$$eval("input:not([type=range]):not([type=file]), textarea, select", (els) =>
        els.filter((el) => (el as HTMLElement).checkVisibility()).map((el) => parseFloat(getComputedStyle(el).fontSize)),
      );
      expect(sizes.length, path).toBeGreaterThan(0);
      for (const s of sizes) expect(s, path).toBeGreaterThanOrEqual(16);
    }
  });

  test("a tap anywhere on the Request field puts the caret in it", async ({ page }) => {
    await page.goto("/submit/request");
    const input = page.locator("#request-name");
    const box = (await input.locator("xpath=ancestor::div[1]").boundingBox())!;
    // The search icon, at the field's left, outside the 26 px input line.
    await page.touchscreen.tap(box.x + 22, box.y + 8);
    await expect(input).toBeFocused();
  });

  test("the build page's source links are 44 px targets", async ({ page }) => {
    await page.goto("/builds/finisher/meta-finisher");
    const links = page.locator("main a[target=_blank]").filter({ visible: true });
    expect(await links.count()).toBeGreaterThan(0);
    for (const a of await links.all()) {
      const hit = await a.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const b = getComputedStyle(el, "::before");
        return { w: Math.max(r.width, parseFloat(b.width) || 0), h: Math.max(r.height, parseFloat(b.height) || 0) };
      });
      expect(hit.w).toBeGreaterThanOrEqual(44);
      expect(hit.h).toBeGreaterThanOrEqual(44);
    }
  });
});
