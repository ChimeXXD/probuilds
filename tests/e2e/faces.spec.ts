import { expect, type Page, test } from "@playwright/test";

// The Faces library (Figma 333:1139 / 345:1310 / 345:1391; no results 372:1853 / 427:9875 / 427:9960; D-68, D-70,
// D-97 (5)). Preview only (D-105): the faces are Figma's five sample faces, drafts with its stand-in pictures (D-107,
// D-108), then Zidane and Olise, sample faces added for their creators' turns (D-123); the demo note marks them all
// instead of the Draft tag.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

const DEMO_NOTE = "Demo: stand-in faces from Xaiiros's and CodeName Max's YouTube tutorials. Each real card shows our own in-game recreation.";
/** The seven sample faces, in the order the library draws them: slug, kind, title. */
const DRAWN = [
  ["cristiano-ronaldo-2008", "Footballer", "2008 Ronaldo"],
  ["neymar-jr-mohawk", "Footballer", "Neymar Jr (Mohawk)"],
  ["lamine-yamal", "Footballer", "Lamine Yamal"],
  ["lebron-james", "Athlete", "LeBron James"],
  ["michael-jackson", "Musician", "Michael Jackson"],
  ["zinedine-zidane", "Footballer", "Zinedine Zidane"],
  ["michael-olise", "Footballer", "Michael Olise"],
] as const;

const chip = (page: Page, n: number) => page.getByTestId(`filter-chip-${n}`);
const counts = async (page: Page) => Promise.all([1, 2, 3, 4].map((n) => chip(page, n).locator("span").last().innerText()));
const columns = (page: Page) =>
  page.getByTestId("face-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);

test("faces: the seven sample faces, each with its kind, name, page and stand-in picture; Faces is the current section", async ({ page }) => {
  await page.goto("/faces");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Faces");
  await expect(page.getByText(DEMO_NOTE)).toBeVisible();
  await expect(page.getByTestId("bottom-nav").getByRole("link", { name: "Faces" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('[data-testid^="face-card-"]')).toHaveCount(7);
  for (const [i, [slug, kind, title]] of DRAWN.entries()) {
    const card = page.getByTestId(`face-card-${i + 1}`);
    await expect(card).toHaveAttribute("href", `/faces/${slug}`);
    await expect(card.getByText(kind, { exact: true })).toBeVisible();
    await expect(card.getByText(title, { exact: true })).toBeVisible();
    // The stand-in loads and fills the 4:5 slot; the demo note marks the samples, so no Draft tag (D-107).
    const img = card.locator("img");
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveAttribute("src", `/sample/faces/${slug}.webp`);
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBe(468);
    const slot = await card.getByTestId("face-picture").boundingBox();
    expect(slot && Math.abs(slot.height - (slot.width * 5) / 4)).toBeLessThan(1);
    await expect(card.getByText("Draft", { exact: true })).toHaveCount(0);
  }
  expect(await columns(page)).toBe(2);
  await expect(page.getByText("Not endorsed by or affiliated with EA or its licensors. Not endorsed by the people named.")).toBeVisible();
});

// The focus ring (outline plus offset) of the first and last chip must fit inside their scrolling row, which clips.
const ringFits = (page: Page) =>
  Promise.all(
    [1, 4].map((n) =>
      chip(page, n).evaluate((el) => {
        (el as HTMLElement).focus();
        // What a browser does when Tab lands on a chip outside the row's view (focus() alone may not scroll it).
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
        const style = getComputedStyle(el);
        const ring = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
        const r = el.getBoundingClientRect();
        // The row that scrolls (and so clips): the chips sit in the sliding pill's row inside it (Tab pill).
        const row = (el.closest(".overflow-x-auto") as HTMLElement).getBoundingClientRect();
        // All four edges: scrolled into view, the last chip can land against the row's right edge.
        return (
          ring > 0 &&
          r.top - ring >= row.top &&
          r.bottom + ring <= row.bottom &&
          r.left - ring >= row.left &&
          r.right + ring <= row.right
        );
      }),
    ),
  );

test("faces: a chip's focus ring is not clipped by its scrolling row, on phone and tablet", async ({ page }) => {
  await page.goto("/faces");
  expect(await ringFits(page)).toEqual([true, true]);
  await page.setViewportSize({ width: 834, height: 1100 });
  expect(await ringFits(page)).toEqual([true, true]);
});

const shownCards = (page: Page) => page.locator('[data-testid^="face-card-"]').evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")));

test("faces: chips show Figma's counts and filter by kind", async ({ page }) => {
  await page.goto("/faces");
  expect(await counts(page)).toEqual(["7", "5", "1", "1"]);
  await expect(chip(page, 1)).toHaveAttribute("aria-pressed", "true");
  await chip(page, 3).click();
  await expect(chip(page, 3)).toHaveAttribute("aria-pressed", "true");
  await expect(chip(page, 1)).toHaveAttribute("aria-pressed", "false");
  expect(await shownCards(page)).toEqual(["face-card-4"]);
  await chip(page, 4).click();
  expect(await shownCards(page)).toEqual(["face-card-5"]);
  await chip(page, 2).click();
  expect(await shownCards(page)).toEqual(["face-card-1", "face-card-2", "face-card-3", "face-card-6", "face-card-7"]);
  await expect(page.getByTestId("missing-face-tile")).toBeVisible();
  await chip(page, 1).click();
  await expect(page.locator('[data-testid^="face-card-"]')).toHaveCount(7);
});

test("faces: search filters by name, the chips count what it leaves, and Clear brings everything back", async ({ page }) => {
  await page.goto("/faces");
  const search = page.getByTestId("search-input");
  await expect(search).toHaveAttribute("placeholder", "Search faces by name");
  await search.fill("ronaldo");
  expect(await shownCards(page)).toEqual(["face-card-1"]);
  expect(await counts(page)).toEqual(["1", "1", "0", "0"]);
  await search.fill("Mbappe");
  await expect(page.locator('[data-testid^="face-card-"]')).toHaveCount(0);
  // Figma's no-results state (372:1853 / 427:9875 / 427:9960): every chip at 0, the card, no grid, tile or panel.
  const emptyState = page.getByTestId("faces-empty");
  await expect(emptyState.getByText("No faces here yet")).toBeVisible();
  await expect(emptyState.getByText("Ask for it, and vote for what we make next")).toBeVisible();
  await expect(emptyState.getByRole("link", { name: "Request a face" })).toHaveAttribute("href", "/submit/request");
  await expect(page.getByTestId("missing-face-tile")).toHaveCount(0);
  await expect(page.getByText("Who should we make next?")).toHaveCount(0);
  expect(await counts(page)).toEqual(["0", "0", "0", "0"]);
  // The demo note is page-level: it stays while the library holds sample faces (427:9875, 427:9960).
  await expect(page.getByText(DEMO_NOTE)).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await expect(page.locator('[data-testid^="face-card-"]')).toHaveCount(7);
  expect(await counts(page)).toEqual(["7", "5", "1", "1"]);
});

test("faces: Missing a face and the request panel's Request a face open Submit's Request tab (D-121 (5))", async ({ page }) => {
  await page.goto("/faces");
  const tile = page.getByTestId("missing-face-tile");
  await expect(tile).toHaveAttribute("href", "/submit/request");
  await expect(tile.getByText("Missing a face?")).toBeVisible();
  await expect(tile.getByText("Suggest one on Submit")).toBeVisible();
  // The tile is the picture's size, beside the last card (Michael Olise).
  const slot = await page.getByTestId("face-card-7").getByTestId("face-picture").boundingBox();
  const box = await tile.boundingBox();
  expect(slot && box && Math.round(box.height)).toBe(Math.round(slot?.height ?? 0));
  expect(slot && box && Math.round(box.x - (slot.x + slot.width))).toBe(12);
  await expect(page.getByText("Who should we make next?")).toBeVisible();
  await expect(page.getByTestId("request-face-link")).toHaveAttribute("href", "/submit/request");
  await tile.click();
  await expect(page).toHaveURL(/\/submit\/request$/);
  await expect(page.getByTestId("submit-tab").filter({ hasText: "Request a face" })).toHaveAttribute("aria-current", "page");
});

test("faces on tablet: three columns, 24 px apart, chips and a 300 px search on one row", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1100 });
  await page.goto("/faces");
  expect(await columns(page)).toBe(3);
  const card = await page.getByTestId("face-card-7").boundingBox();
  const tile = await page.getByTestId("missing-face-tile").boundingBox();
  expect(card && Math.round(card.width)).toBe(235);
  expect(card && tile && Math.round(tile.x - (card.x + card.width))).toBe(24);
  const search = await page.getByTestId("search-field").boundingBox();
  const chips = await chip(page, 1).boundingBox();
  expect(search?.width).toBe(300);
  expect(search && chips && Math.abs(search.y + search.height / 2 - (chips.y + chips.height / 2))).toBeLessThan(1);
});

test("faces on desktop: six columns in the 1200 px column, a 360 px search beside the chips", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/faces");
  expect(await columns(page)).toBe(6);
  const card = await page.getByTestId("face-card-1").boundingBox();
  expect(card?.x).toBe(120);
  expect(card?.width).toBe(180);
  const search = await page.getByTestId("search-field").boundingBox();
  expect(search?.width).toBe(360);
  expect(search && search.x + search.width).toBe(1320);
  const request = await page.getByTestId("request-face-link").boundingBox();
  expect(request?.width).toBe(240);
});

test("faces: no sideways scroll at this width; chips, search, cards and links are at least 44 px to tap", async ({ page }) => {
  await page.goto("/faces");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const targets = [
    page.getByTestId("search-input"),
    ...[1, 2, 3, 4].map((n) => chip(page, n)),
    page.getByTestId("face-card-1"),
    page.getByTestId("missing-face-tile"),
    page.getByTestId("request-face-link"),
  ];
  for (const t of targets) {
    const box = await t.boundingBox();
    expect(box && box.height >= 40 && box.width >= 44, await t.getAttribute("data-testid") ?? "").toBe(true);
    // A 40 px chip reaches 44 px with its ::before tap area.
    const tap = await t.evaluate((el) => {
      const before = getComputedStyle(el, "::before");
      const r = el.getBoundingClientRect();
      return Math.max(r.height, before.content !== "none" ? parseFloat(before.height) || 0 : 0);
    });
    expect(tap, await t.getAttribute("data-testid") ?? "").toBeGreaterThanOrEqual(44);
  }
  await page.getByTestId("search-input").fill("x");
  const clear = await page.getByRole("button", { name: "Clear search" }).boundingBox();
  expect(clear && clear.width >= 44 && clear.height >= 44).toBe(true);
});
