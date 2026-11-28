import { expect, type Page, test } from "@playwright/test";

// D-125 (3): on a computer the page's scrollbar is the thin custom one (10 px gutter, src/styles/platform.css); on a
// phone the browser's overlay bar stays (it takes no width); sideways rails never show a bar. Headless Chromium hides
// scrollbars unless told otherwise, so this file shows them.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

const gutter = () => window.innerWidth - document.documentElement.clientWidth;
// The page is made two screens tall, so it scrolls whatever it holds (the live Changelog fits one 800 px screen).
const tall = async (page: Page, path: string) => {
  await page.goto(path);
  await page.addStyleTag({ content: "[data-testid=page]{min-height:200vh}" });
};

test.describe("computer", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test("the page scrollbar is the thin one", async ({ page }) => {
    await tall(page, "/changelog");
    expect(await page.evaluate(gutter)).toBe(10);
  });
});

test.describe("narrow computer window", () => {
  test.use({ viewport: { width: 400, height: 800 }, isMobile: false, hasTouch: false });

  test("Home's builds rail scrolls sideways with no bar under it", async ({ page }) => {
    // Every rail is on the preview (Home's builds, Faces and Changelog chips, the Builds emblems).
    test.skip(process.env.PROBUILDS_DRAFTS !== "1", "the rails show drafts");
    await tall(page, "/");
    expect(await page.evaluate(gutter)).toBe(10);
    const rail = page.locator("ul.rail").first();
    const sizes = await rail.evaluate((el: HTMLElement) => ({ scroll: el.scrollWidth, width: el.clientWidth, bar: el.offsetHeight - el.clientHeight }));
    expect(sizes.scroll).toBeGreaterThan(sizes.width);
    expect(sizes.bar).toBe(0);
  });
});

test("phone: the browser's own overlay scrollbar stays", async ({ page }) => {
  await page.goto("/changelog");
  expect(await page.evaluate(gutter)).toBe(0);
});
