import { expect, test } from "@playwright/test";

const NOTICE = "Not endorsed by or affiliated with EA or its licensors. Not endorsed by the people named.";

test("live: home keeps its placeholder until faces, builds and changes are published, with the notice (rule 3)", async ({ page }) => {
  test.skip(process.env.PROBUILDS_DRAFTS === "1", "this run is a preview build");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ProBuilds");
  await expect(page.getByTestId("site-notice")).toHaveText(NOTICE);
});

// Home (Figma 364:2118 / 367:1629 / 367:1836; D-75 to D-78), filled with Figma's sample faces, sample build and the
// changelog's draft entries on the preview (D-107).
test.describe("preview home", () => {
  test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

  test("faces first: four faces, the face of the week left out of the row (D-77)", async ({ page }) => {
    await page.goto("/");
    const faces = page.getByTestId("home-faces");
    const builds = page.getByTestId("home-builds");
    const [f, b] = await Promise.all([faces.boundingBox(), builds.boundingBox()]);
    expect((f?.y ?? 0) < (b?.y ?? 0)).toBe(true);
    await expect(faces.getByRole("heading", { name: "Faces" })).toBeVisible();
    await expect(faces.getByRole("link", { name: "See all" })).toHaveAttribute("href", "/faces");
    const cards = faces.locator('[data-testid^="home-face-"]');
    await expect(cards).toHaveCount(4);
    const names = ["2008 Ronaldo", "Lamine Yamal", "LeBron James", "Michael Jackson"];
    const slugs = ["cristiano-ronaldo-2008", "lamine-yamal", "lebron-james", "michael-jackson"];
    for (const [i, name] of names.entries()) {
      await expect(cards.nth(i)).toContainText(name);
      await expect(cards.nth(i)).toHaveAttribute("href", `/faces/${slugs[i]}`);
    }
    await expect(page.getByTestId("bottom-nav").getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  test("face of the week: Neymar Jr (Mohawk), its kind and steps, and Start", async ({ page }) => {
    await page.goto("/");
    const week = page.getByTestId("face-of-the-week");
    await expect(week).toContainText("Face of the week");
    await expect(week.getByRole("heading", { name: "Neymar Jr (Mohawk)" })).toBeVisible();
    await expect(week).toContainText("Footballer · 18 steps");
    await expect(week.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/faces/neymar-jr-mohawk");
  });

  test("meta builds: one per line of the team, each opening its page, with Figma's sample note (D-75)", async ({ page }) => {
    await page.goto("/");
    const builds = page.getByTestId("home-builds");
    await expect(builds.getByRole("link", { name: "View all builds" }).first()).toHaveAttribute("href", "/builds");
    const cards = builds.locator('[data-testid^="build-preview-"]');
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("Meta Finisher");
    await expect(cards.nth(0)).toContainText("Level 55 · 185 cm · 80 kg");
    await expect(cards.nth(0).locator("a").first()).toHaveAttribute("href", "/builds/finisher/meta-finisher");
    // Maestro's only build is Leski's untitled draft, which Home doesn't show (D-124): the archetype card stays.
    await expect(cards.nth(1)).toContainText("Meta Maestro");
    await expect(cards.nth(1)).toContainText("Midfielder · not recorded yet");
    await expect(cards.nth(1)).toContainText("Pinged Pass");
    await expect(cards.nth(1).locator("a").first()).toHaveAttribute("href", "/builds/maestro");
    await expect(cards.nth(2)).toContainText("Meta Boss");
    await expect(cards.nth(2)).toContainText("Defender · not recorded yet");
    await expect(cards.nth(2).locator("a").first()).toHaveAttribute("href", "/builds/boss");
    for (const i of [0, 1, 2]) await expect(cards.nth(i)).toContainText("Meta pick");
    await expect(builds).toContainText("Sample builds. Maestro and Boss values come when they are recorded in game. Tap a card to open its build.");
    // Phone: the cards swipe sideways inside the rail; the page itself never scrolls sideways.
    const [scrollWidth, clientWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(scrollWidth).toBe(clientWidth);
  });

  test("what changed: the three latest entries, newest first, and the season card", async ({ page }) => {
    await page.goto("/");
    const changes = page.getByTestId("home-changes");
    await expect(changes.getByRole("link", { name: "Changelog" })).toHaveAttribute("href", "/changelog");
    await expect(changes.locator("li")).toHaveText([
      "10 Nov 2026 · Title updateTitle Update 1.2.0",
      "22 Oct 2026 · Archetype updateArchetype costs re-priced, every build reset",
      "25 Sep 2026 · SeasonFC 27 launches; Clubs moves into The Grounds",
    ]);
    await expect(page.getByTestId("home-season")).toContainText("Season 3 starts Thu 3 Dec");
    await expect(page.getByTestId("home-season")).toContainText("Every face and build gets re-checked in game, and older ones say so.");
  });

  test("tablet: poster cards, the week beside the changes, two build columns and the View all builds tile (D-76, D-78)", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto("/");
    const week = await page.getByTestId("face-of-the-week").boundingBox();
    const changes = await page.getByTestId("home-changes").boundingBox();
    expect(week).toMatchObject({ x: 40, width: 379 });
    expect(changes).toMatchObject({ x: 443, width: 351 });
    await expect(page.getByTestId("view-all-builds-tile")).toBeVisible();
    await expect(page.getByTestId("view-all-builds-tile")).toHaveAttribute("href", "/builds");
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByTestId("view-all-builds-tile")).toBeHidden();
  });

  test("every link and button on home is at least 44 px to touch", async ({ page }) => {
    await page.goto("/");
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("main a, main button")]
        .filter((el) => el.checkVisibility())
        .map((el) => {
          const r = el.getBoundingClientRect();
          const b = getComputedStyle(el, "::before");
          const wide = b.content !== "none" && b.position === "absolute";
          return { name: el.textContent, w: wide ? Math.max(r.width, parseFloat(b.width)) : r.width, h: wide ? Math.max(r.height, parseFloat(b.height)) : r.height };
        })
        .filter((t) => t.w < 44 || t.h < 44),
    );
    expect(small).toEqual([]);
  });
});
