import { expect, type Locator, type Page, test } from "@playwright/test";

// Bottom bar, Tab pill and Smooth tab (motion-bookmarks #5, #6, #8; docs/design/motion-placement.md). One lime pill
// slides between items as a clip-path transition on a copy of the row drawn in the picked colours; the real row keeps
// the links and buttons. These check what moves (by property), where it lands, and the gentler reduced-motion version.

/** Every running CSS transition or Web Animation on the page: what it animates and on which element. */
const running = (page: Page) =>
  page.evaluate(() =>
    document.getAnimations().map((a) => {
      const effect = a.effect as KeyframeEffect | null;
      const target = effect?.target as HTMLElement | null;
      const props = "transitionProperty" in a ? [(a as CSSTransition).transitionProperty] : (effect?.getKeyframes() ?? []).flatMap((k) => Object.keys(k));
      return { props: [...new Set(props)].filter((p) => !["offset", "easing", "composite", "computedOffset"].includes(p)), testId: target?.closest("[data-testid]")?.getAttribute("data-testid") ?? null, layer: !!target?.closest('[aria-hidden="true"]') };
    }),
  );
const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));

/** The pill's clip, read back as the box it leaves visible, relative to its row. */
async function pillBox(layer: Locator) {
  return layer.evaluate((el) => {
    const m = getComputedStyle(el).clipPath.match(/inset\(([^)]*?)\s+round/);
    // The browser shortens inset() as it does margins: 1 to 4 values.
    const v = (m?.[1] ?? "").split(/\s+/).map(parseFloat);
    const [top, right, bottom, left] = [v[0], v[1] ?? v[0], v[2] ?? v[0], v[3] ?? v[1] ?? v[0]] as [number, number, number, number];
    const box = el.getBoundingClientRect();
    return { left: box.left + left, top: box.top + top, right: box.right - right, bottom: box.bottom - bottom };
  });
}
const near = (a: { left: number; right: number }, b: { x: number; width: number } | null) =>
  !!b && Math.abs(a.left - b.x) < 1.5 && Math.abs(a.right - (b.x + b.width)) < 1.5;

test.describe("bottom bar", () => {
  test("the lime pill slides to the tapped tab by clip-path, the icons beside it slide by transform, the label fades in", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByTestId("bottom-nav");
    const fill = nav.locator("div[inert]");
    await expect(fill).toHaveCount(1);
    await expect(fill).toHaveAttribute("aria-hidden", "true");
    // At rest the pill covers Home exactly.
    expect(near(await pillBox(fill), await nav.getByRole("link", { name: "Home" }).boundingBox())).toBe(true);
    // The copy is hidden from screen readers and can't be clicked: still five links.
    await expect(nav.getByRole("link")).toHaveCount(5);

    await nav.getByRole("link", { name: "Changelog" }).click();
    const moving = await running(page);
    expect(moving.some((a) => a.props.includes("clip-path"))).toBe(true);
    expect(moving.some((a) => a.props.includes("transform"))).toBe(true); // the icons the pill pushes along
    expect(moving.some((a) => a.props.includes("opacity"))).toBe(true); // the label
    // Only clip-path, transform and opacity move: nothing that lays the page out again.
    expect(moving.flatMap((a) => a.props).every((p) => ["clip-path", "transform", "opacity"].includes(p))).toBe(true);
    // The icons' slide is timed from --spring-fade-ms (minified to .32s): 320 ms, like the pill's own transition.
    const flip = await nav.getByRole("link", { name: "Faces" }).evaluate((el) => el.getAnimations()[0]?.effect?.getComputedTiming().duration);
    expect(flip).toBe(320);

    await expect(page).toHaveURL(/\/changelog$/);
    await settle(page);
    const changelog = nav.getByRole("link", { name: "Changelog" });
    await expect(changelog).toHaveAttribute("aria-current", "page");
    expect(near(await pillBox(fill), await changelog.boundingBox())).toBe(true);
    await expect(fill.getByText("Changelog")).toBeVisible();
  });

  test("reduced motion: the pill fades in at the new tab instead of sliding", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const nav = page.getByTestId("bottom-nav");
    await nav.getByRole("link", { name: "Builds" }).click();
    const moving = await running(page);
    expect(moving.some((a) => a.props.includes("clip-path") || a.props.includes("transform"))).toBe(false);
    expect(moving.some((a) => a.layer && a.props.includes("opacity"))).toBe(true);
    await expect(page).toHaveURL(/\/builds$/);
    await settle(page);
    expect(near(await pillBox(nav.locator("div[inert]")), await nav.getByRole("link", { name: "Builds" }).boundingBox())).toBe(true);
  });
});

test.describe("tab pill", () => {
  test.skip(process.env.PROBUILDS_DRAFTS !== "1", "the Faces library lists Figma's sample faces on the preview only");

  test("faces: one pill slides to the chip picked and the grid slides in from that side", async ({ page }) => {
    await page.goto("/faces");
    const chip = (n: number) => page.getByTestId(`filter-chip-${n}`);
    const fill = page.locator("div[inert]").filter({ hasText: "Footballers" });
    expect(near(await pillBox(fill), await chip(1).boundingBox())).toBe(true);
    // The real chips stay the buttons, all drawn unpicked; the pill draws the picked one.
    await expect(chip(1)).toHaveAttribute("aria-pressed", "true");

    await chip(3).click();
    const moving = await running(page);
    expect(moving.some((a) => a.props.includes("clip-path"))).toBe(true);
    // The new grid comes in from the right (Athletes is right of All) by transform and opacity; the old one fades.
    const gridIn = await page.getByTestId("face-grid").evaluate((el) => el.getAnimations().map((a) => (a.effect as KeyframeEffect).getKeyframes()[0]));
    expect(gridIn[0]).toMatchObject({ opacity: "0", transform: "translateX(12px)" });
    expect(moving.some((a) => a.layer && a.props.includes("opacity"))).toBe(true);
    await settle(page);
    expect(near(await pillBox(fill), await chip(3).boundingBox())).toBe(true);
    await expect(page.locator('[data-testid^="face-card-"]')).toHaveCount(1);

    // Back to the left: the grid comes in from the left.
    await chip(2).click();
    const back = await page.getByTestId("face-grid").evaluate((el) => el.getAnimations().map((a) => (a.effect as KeyframeEffect).getKeyframes()[0]));
    expect(back[0]).toMatchObject({ transform: "translateX(-12px)" });
  });

  test("faces, reduced motion: the pill and the grid fade, nothing slides", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/faces");
    await page.getByTestId("filter-chip-4").click();
    const gridIn = await page.getByTestId("face-grid").evaluate((el) => el.getAnimations().map((a) => (a.effect as KeyframeEffect).getKeyframes()[0]));
    expect(gridIn[0]).toMatchObject({ opacity: "0" });
    expect(gridIn[0]).not.toHaveProperty("transform");
    const moving = await running(page);
    expect(moving.some((a) => a.props.includes("clip-path"))).toBe(false);
  });

  test("a chip picked from the keyboard moves the pill at once: no slide on keyboard actions", async ({ page }) => {
    await page.goto("/faces");
    const chip = (n: number) => page.getByTestId(`filter-chip-${n}`);
    const fill = page.locator("div[inert]").filter({ hasText: "Footballers" });
    await chip(1).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(chip(2)).toHaveAttribute("aria-pressed", "true");
    expect((await running(page)).some((a) => a.props.includes("clip-path"))).toBe(false);
    expect(near(await pillBox(fill), await chip(2).boundingBox())).toBe(true);
  });

  test("typing a search never plays the chips' Smooth tab on the grid (its cards move on their own: motion-lists.spec.ts)", async ({ page }) => {
    await page.goto("/faces");
    await page.getByTestId("search-input").fill("ronaldo");
    expect(await page.getByTestId("face-grid").evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  test("request a face: the kind chips (which wrap) use the same pill", async ({ page }) => {
    await page.goto("/faces/request");
    const kinds = page.getByTestId("request-kind");
    // On the same line as "All" the pill slides; on the next line of the wrapped row it fades in there instead
    // of sliding diagonally across both lines.
    const [all, musicians] = await Promise.all([kinds.first().boundingBox(), kinds.filter({ hasText: "Musicians" }).boundingBox()]);
    const sameLine = !!all && !!musicians && Math.abs(all.y - musicians.y) < 2;
    await kinds.filter({ hasText: "Musicians" }).click();
    const moving = await running(page);
    expect(moving.some((a) => a.props.includes("clip-path"))).toBe(sameLine);
    if (!sameLine) expect(moving.some((a) => a.layer && a.props.includes("opacity"))).toBe(true);
    await settle(page);
    const fill = page.locator("div[inert]").filter({ hasText: "Musicians" });
    expect(near(await pillBox(fill), await kinds.filter({ hasText: "Musicians" }).boundingBox())).toBe(true);
    await expect(kinds.filter({ hasText: "Musicians" })).toHaveAttribute("aria-pressed", "true");
  });
});

test("changelog: the filter chips use the same pill", async ({ page }) => {
  await page.goto("/changelog");
  const chips = page.locator('[data-testid^="filter-chip-"]');
  test.skip((await chips.count()) === 0, "no published entries yet, so no filters");
  await chips.nth(1).click();
  expect((await running(page)).some((a) => a.props.includes("clip-path"))).toBe(true);
  await settle(page);
  const fill = page.locator("div[inert]").filter({ hasText: "Title updates" });
  expect(near(await pillBox(fill), await chips.nth(1).boundingBox())).toBe(true);
});
