import { expect, type Page, test } from "@playwright/test";

// D-125 (2): the bottom nav stays put and visible through every page change. The page change is a View Transition
// (D-121 (2)); the new page's snapshot used to paint over the nav while it faded in, so the nav sank under the page
// and popped back when the slide ended. The page change is slowed to a tenth of its speed and the nav's last icon
// (Submit, the last, which stays put while the pill goes between Home and Changelog: pages the live site has too) is compared, mid-change, with the same icon at rest:
// covered, about 70–90 % of its pixels change; held, under 5 % (the icon shifts a fraction of a pixel in the FLIP).

/** The share of pixels (0–1) that changed clearly (by more than 60 of 765 across R, G and B) between two PNG
 * screenshots of the same size, decoded in the page. Antialiasing of an icon nudged half a pixel stays under it. */
async function diff(page: Page, a: Buffer, b: Buffer): Promise<number> {
  return page.evaluate(
    async ([x, y]) => {
      const load = async (b64: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      const [p, q] = [await load(x), await load(y)];
      let changed = 0;
      for (let i = 0; i < p.length; i += 4)
        if (Math.abs(p[i]! - q[i]!) + Math.abs(p[i + 1]! - q[i + 1]!) + Math.abs(p[i + 2]! - q[i + 2]!) > 60) changed += 1;
      return changed / (p.length / 4);
    },
    [a.toString("base64"), b.toString("base64")] as const,
  );
}

const inTransition = (page: Page) => page.evaluate(() => !!(document as Document & { activeViewTransition?: unknown }).activeViewTransition);

async function sampleNav(page: Page, from: string, tab: string, how: "tap" | "click" = "tap") {
  await page.goto(from);
  // What covered the nav was whatever the page had at its height (a face grid, a build card): here the page is painted
  // solid and a screen tall, so every change tests the same thing, whatever the page holds there.
  await page.addStyleTag({ content: "[data-testid=page]{background:#c00;min-height:100vh}" });
  const nav = page.getByTestId("bottom-nav");
  const icon = nav.getByRole("link", { name: "Submit" });
  await expect(nav).toBeVisible();
  const rest = await icon.screenshot();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.1 });
  await nav.getByRole("link", { name: tab })[how]();
  const diffs: number[] = [];
  for (let i = 0; i < 12; i++) {
    const shot = await page.screenshot({ clip: (await icon.boundingBox())! });
    if (await inTransition(page)) diffs.push(await diff(page, rest, shot));
  }
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 });
  return diffs;
}

for (const width of [360, 390, 430]) {
  test.describe(`${width} px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("the bottom nav doesn't fade or vanish while the next page slides in", async ({ page }) => {
      const diffs = await sampleNav(page, "/", "Changelog");
      // The change was caught several times while it ran, and the icon looked the same each time.
      expect(diffs.length).toBeGreaterThanOrEqual(3);
      for (const d of diffs) expect(d).toBeLessThan(0.2);
    });
  });
}

test.describe("narrow computer window", () => {
  test.use({ viewport: { width: 390, height: 800 }, hasTouch: false, isMobile: false });

  test("the bottom nav holds still through a page change, clicked", async ({ page }) => {
    const diffs = await sampleNav(page, "/changelog", "Home", "click");
    expect(diffs.length).toBeGreaterThanOrEqual(3);
    for (const d of diffs) expect(d).toBeLessThan(0.2);
  });
});
