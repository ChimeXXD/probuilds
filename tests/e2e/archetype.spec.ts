import { expect, test } from "@playwright/test";

// The archetype page (Figma 288:1031 / 290:796 / 290:1084, D-62): one static page per archetype. Preview only
// (D-105): the builds are drafts. Emblems ship since D-106. Spark has one draft; Finisher has Figma's sample (D-107)
// and Leski's draft read from his video (D-123 (2)), which has no title yet and comes after the badged cards.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

test("archetype: See Finisher builds opens the Finisher page, and the breadcrumb goes back to it", async ({ page }) => {
  await page.goto("/builds#finisher");
  await page.getByRole("link", { name: "See Finisher builds" }).click();
  await expect(page).toHaveURL(/\/builds\/finisher$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Finisher");
  await expect(page.getByText("Forward · 4 builds", { exact: true })).toBeVisible();
  await expect(page.getByTestId("build-card-meta-finisher")).toBeVisible();
  await expect(page.getByRole("img", { name: "Finisher" })).toBeVisible();
  await expect(page.getByTestId("bottom-nav").getByRole("link", { name: "Builds" })).toHaveAttribute("aria-current", "page");
  const crumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(crumb.getByText("Finisher")).toHaveAttribute("aria-current", "page");
  await crumb.getByRole("link", { name: "Builds" }).click();
  await expect(page).toHaveURL(/\/builds#finisher$/);
  await expect(page.getByTestId("emblem-finisher")).toHaveAttribute("aria-pressed", "true");
});

test("archetype: Finisher shows Figma's three sample cards in its order, marked once as samples (288:1031)", async ({ page }) => {
  await page.goto("/builds/finisher");
  await expect(page.getByText("Sample values: not real builds yet", { exact: true })).toBeVisible();
  const titles = page.locator("[data-testid^=build-card-] h2");
  await expect(titles).toHaveText(["Meta Finisher", "Tall Finisher", "PLACEHOLDER", "Quick Finisher"]);
  const tall = page.getByTestId("build-card-tall-finisher");
  await expect(tall.locator("a").first()).toHaveAttribute("href", "/builds/finisher/tall-finisher");
  await expect(tall.getByText("Recommended", { exact: true })).toBeVisible();
  await expect(tall.getByText("Level 55 · 193 cm · 88 kg")).toBeVisible();
  await expect(tall.getByText("Precision Header")).toBeVisible();
  const quick = page.getByTestId("build-card-quick-finisher");
  await expect(quick.getByText("Level 55 · 173 cm · 72 kg")).toBeVisible();
  await expect(quick.getByText("Rapid")).toBeVisible();
  // The sample cards carry no Draft tag, version tag or credit; the note marks them (D-113). Leski's draft has all three.
  for (const id of ["meta", "tall", "quick"]) {
    const sample = page.getByTestId(`build-card-${id}-finisher`);
    await expect(sample.getByText("Draft", { exact: true })).toHaveCount(0);
    await expect(sample.getByText(/Not yet checked in game|Made by/)).toHaveCount(0);
  }
  const leski = page.getByTestId("build-card-finisher-leski");
  await expect(leski.getByText("Draft", { exact: true })).toBeVisible();
  await expect(leski.getByText("FC 27 · Season 2 · Not yet checked in game")).toBeVisible();
  // On Figma's 393 px phone: one column, 12 px apart, as drawn (at 360 the body line may wrap, as it should).
  await page.setViewportSize({ width: 393, height: 852 });
  const meta = await page.getByTestId("build-card-meta-finisher").boundingBox();
  const tallBox = await tall.boundingBox();
  expect(meta && tallBox && Math.round(tallBox.y - (meta.y + meta.height))).toBe(12);
  // Alone in its row, each card is as tall as its own header: Recommended (26 px with its border) 2 px taller than the
  // Meta pick tag (24 px), no tag 12 px shorter, as 288:1096, 288:1136 and 288:1174 draw them (266, 268, 254). Leski's
  // card has a footer, so every card keeps a footer row (14 px more each than Figma's three alone).
  const quickBox = await quick.boundingBox();
  const heights = [meta, tallBox, quickBox].map((b) => Math.round(b?.height ?? 0));
  expect(heights.map((h) => h - (heights[0] ?? 0))).toEqual([0, 2, -12]);
});

test("archetype on desktop: three cards a row, each row one height, headers and all (D-62 (3))", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds/finisher");
  const ids = ["meta-finisher", "tall-finisher", "finisher-leski", "quick-finisher"];
  const boxes = await Promise.all(ids.map((id) => page.getByTestId(`build-card-${id}`).boundingBox()));
  const [first] = boxes;
  expect(boxes.map((b) => b && [Math.round(b.x), Math.round(b.width)])).toEqual([
    [120, 384],
    [528, 384],
    [936, 384],
    [120, 384],
  ]);
  // The first row shares one height; Quick Finisher starts the second, beside the Submit tile across the two empty cells.
  expect(boxes.slice(0, 3).every((b) => b && first && Math.round(b.y) === Math.round(first.y) && Math.round(b.height) === Math.round(first.height))).toBe(true);
  const quick = boxes[3];
  const tile = await page.getByTestId("submit-tile").boundingBox();
  expect(quick && tile && [Math.round(tile.x), Math.round(tile.y - quick.y), Math.round(tile.height - quick.height)]).toEqual([528, 0, 0]);
});

test("archetype on tablet: two cards a row, 24 px apart; four cards fill the rows, so no Submit tile (290:796)", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1100 });
  await page.goto("/builds/finisher");
  const leski = await page.getByTestId("build-card-finisher-leski").boundingBox();
  const quick = await page.getByTestId("build-card-quick-finisher").boundingBox();
  const tall = await page.getByTestId("build-card-tall-finisher").boundingBox();
  expect(leski && [Math.round(leski.x), Math.round(leski.width)]).toEqual([40, 365]);
  expect(quick && [Math.round(quick.x), Math.round(quick.width)]).toEqual([429, 365]);
  expect(leski && quick && [Math.round(quick.y - leski.y), Math.round(quick.height - leski.height)]).toEqual([0, 0]);
  expect(tall && quick && Math.round(quick.y - (tall.y + tall.height))).toBe(24);
  await expect(page.getByTestId("submit-tile")).toBeHidden();
});

test("archetype: the draft build's card shows its values as written, its version tag and credit", async ({ page }) => {
  await page.goto("/builds/spark");
  await expect(page.getByText("Forward · 1 build", { exact: true })).toBeVisible();
  const card = page.getByTestId("build-card-spark-2008-winger");
  await expect(card.getByRole("link", { name: "2008 Winger" })).toHaveAttribute("href", "/builds/spark/spark-2008-winger");
  await expect(card.getByRole("heading", { level: 2 })).toHaveText("2008 Winger");
  await expect(card.getByText("Draft", { exact: true })).toBeVisible();
  await expect(card.getByText("Level PLACEHOLDER · PLACEHOLDER cm · PLACEHOLDER kg")).toBeVisible();
  await expect(card.getByText("FC 27 · Season 2 · Not yet checked in game")).toBeVisible();
  await expect(card.getByText("Made by Chime in game")).toBeVisible();
  for (const code of ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"]) await expect(card.getByText(code, { exact: true })).toBeVisible();
  await expect(card.getByText("Trickster")).toBeVisible();
  // The badges and the default face load.
  for (const img of await card.locator("img").all()) expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  // Phone is one column: no gap, so no Submit tile.
  await expect(page.getByTestId("submit-tile")).toBeHidden();
});

test("archetype on tablet: two across, the Submit tile fills the gap beside the one build", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1100 });
  await page.goto("/builds/spark");
  const card = await page.getByTestId("build-card-spark-2008-winger").boundingBox();
  const tile = page.getByTestId("submit-tile");
  await expect(tile).toBeVisible();
  await expect(tile).toHaveAttribute("href", "/submit");
  const box = await tile.boundingBox();
  expect(card && box && Math.round(box.x - (card.x + card.width))).toBe(24);
  expect(card && box && Math.round(box.height)).toBe(Math.round(card?.height ?? 0));
});

test("archetype on desktop: the 1200 px column starts at 120, and the tile spans the two empty cells", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds/spark");
  expect((await page.getByRole("navigation", { name: "Breadcrumb" }).boundingBox())?.x).toBe(120);
  const card = await page.getByTestId("build-card-spark-2008-winger").boundingBox();
  const tile = await page.getByTestId("submit-tile").boundingBox();
  expect(card?.width).toBe(384);
  expect(tile?.width).toBe(792);
});

test("archetype: every archetype has its page, and an unknown one is the 404", async ({ page, request }) => {
  for (const id of ["shot-stopper", "sweeper-keeper", "progressor", "boss", "marauder", "disruptor", "recycler", "maestro", "creator", "spark", "magician", "finisher", "target"]) {
    expect((await request.get(`/builds/${id}`)).status(), id).toBe(200);
  }
  expect((await page.goto("/builds/no-such-archetype"))?.status()).toBe(404);
});
