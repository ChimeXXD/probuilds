import { expect, type Locator, test } from "@playwright/test";

// D-121 (1): everything clickable on the Builds pages says so under a mouse (DESIGN.md: hover only with a fine
// pointer; a colour or opacity step, never movement). The grey fills come from the hover tokens; these checks cover
// the borders, opacity and colours, which don't depend on them.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview pages");
test.use({ hasTouch: false, isMobile: false });

const style = (l: Locator, prop: string) => l.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
async function changesOnHover(target: Locator, hover: Locator, prop: string) {
  const rest = await style(target, prop);
  await hover.hover();
  await expect.poll(() => style(target, prop)).not.toBe(rest);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test("Builds page: emblems, arrows, the front card's edge and a side card answer the mouse", async ({ page }) => {
  await page.goto("/builds#boss");
  await page.waitForTimeout(400);
  const emblem = page.getByTestId("emblem-target");
  await changesOnHover(emblem, emblem, "border-top-color");
  const next = page.getByRole("button", { name: "Next archetype" });
  await changesOnHover(next, next, "border-top-color");
  const front = page.getByTestId("stance-card-boss");
  await changesOnHover(front.locator("span.border-border-strong").last(), front, "border-top-color");
  const side = page.getByTestId("stance-card-marauder");
  const box = (await side.boundingBox())!;
  await page.mouse.move(box.x + box.width - 12, box.y + box.height / 2);
  await expect.poll(() => style(side, "opacity")).toBe("0.8");
});

test("Build page: the level steppers press and the knob turns on hover", async ({ page }) => {
  await page.goto("/builds/finisher/meta-finisher");
  const knob = page.getByTestId("level-knob").locator("span");
  await changesOnHover(knob, page.getByRole("slider", { name: "Your level" }), "background-color");
  const up = page.getByRole("button", { name: "Level up" });
  expect(await style(up, "transition-property")).toContain("scale");
});

test("archetype page: the breadcrumb and the Submit tile answer the mouse", async ({ page }) => {
  await page.goto("/builds/spark");
  const crumb = page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Builds" });
  await changesOnHover(crumb, crumb, "color");
  const tile = page.getByTestId("submit-tile");
  await changesOnHover(tile, tile, "border-top-color");
});

test("on a phone nothing sticks: a tap leaves no hover state behind", async ({ browser, baseURL }) => {
  // A hand-made context does not inherit the config's `use`, so the base URL is passed on.
  const phone = await browser.newContext({ baseURL, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await phone.newPage();
  await page.goto("/builds#boss");
  const emblem = page.getByTestId("emblem-target");
  const rest = await style(emblem, "border-top-color");
  await emblem.hover();
  // Past the 150 ms fade, so a hover that did apply would show.
  await page.waitForTimeout(300);
  expect(await style(emblem, "border-top-color")).toBe(rest);
  await phone.close();
});
