import { expect, test } from "@playwright/test";

// The Builds page's facts (D-121 (3)): the archetype's specializations replace the Mastery and AP cost tiles, and
// "See … builds" is the lime primary button with an arrow, the full width of the facts column.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

for (const width of [390, 834, 1440]) {
  test(`facts at ${width}: three specializations with their PlayStyle+ and targets, then the full-width lime button`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/builds#finisher");
    const specs = page.getByTestId("specialization").filter({ visible: true });
    await expect(specs).toHaveCount(3);
    await expect(specs.nth(2)).toContainText("Hunter");
    await expect(specs.nth(2)).toContainText("Gamechanger+");
    await expect(specs.nth(2).getByRole("list")).toContainText("Curve92");
    // Each tile's PlayStyle+ name sits on one line (no orphaned "+").
    for (let i = 0; i < 3; i++) {
      const line = specs.nth(i).locator("p").nth(1);
      const lh = await line.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
      expect((await line.boundingBox())!.height).toBeLessThan(lh * 1.5);
    }
    const see = page.getByTestId("see-builds").filter({ visible: true });
    await expect(see).toHaveText("See Finisher builds");
    const fill = await see.evaluate((el) => getComputedStyle(el).backgroundColor);
    const lime = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "var(--color-accent-fill)";
      document.body.append(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(fill).toBe(lime);
    // Full width of its column: as wide as the specializations list above it.
    const list = (await page.getByTestId("specializations").filter({ visible: true }).boundingBox())!;
    const button = (await see.boundingBox())!;
    expect(Math.abs(button.width - list.width)).toBeLessThan(1);
    expect(Math.abs(button.x - list.x)).toBeLessThan(1);
  });
}

test("on desktop the three tiles keep their targets level when a name takes two lines (Sweeper Keeper+)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#sweeper-keeper");
  const lists = page.getByTestId("specialization").filter({ visible: true }).getByRole("list");
  const tops = await lists.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
  expect(tops).toHaveLength(3);
  expect(new Set(tops).size).toBe(1);
});

test.describe("on a computer with a mouse", () => {
  test.use({ hasTouch: false, isMobile: false });

  test("the See builds arrow nudges right on hover, and not with reduced motion", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/builds#finisher");
    const see = page.getByTestId("see-builds").filter({ visible: true });
    const arrow = see.locator("span[aria-hidden]").first();
    const x = async () => (await arrow.boundingBox())!.x;
    const rest = await x();
    await see.hover();
    await expect.poll(async () => Math.round((await x()) - rest)).toBe(2);
    await page.mouse.move(0, 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(async () => Math.round((await x()) - rest)).toBe(0);
    await see.hover();
    await page.waitForTimeout(200);
    expect(Math.round((await x()) - rest)).toBe(0);
  });
});
