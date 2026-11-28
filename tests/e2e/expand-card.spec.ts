import { expect, type Page, test } from "@playwright/test";

// Expand card (motion-bookmarks.pdf #22): opening a build card carries its picture and name to the build page's in a
// View Transition (progressive enhancement: without one the page just opens). Preview only: the sample builds are drafts.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

/** Records each view transition's animations once it is ready: which pseudo-element, how long, which easing. */
async function recordTransitions(page: Page) {
  await page.addInitScript(() => {
    const seen: { pseudo: string; duration: number; easing: string }[][] = [];
    Object.assign(window, { transitions: seen });
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((arg: Parameters<typeof start>[0]) => {
      const t = start(arg);
      t.ready.then(() =>
        seen.push(
          document.documentElement.getAnimations({ subtree: true }).map((a) => {
            const effect = a.effect as KeyframeEffect;
            const timing = effect.getTiming();
            return { pseudo: effect.pseudoElement ?? "", duration: Number(timing.duration), easing: String(effect.getKeyframes()[0]?.easing ?? timing.easing) };
          }),
        ),
      );
      return t;
    }) as typeof document.startViewTransition;
  });
}
const transitions = (page: Page) =>
  page.evaluate(() => (window as unknown as { transitions: { pseudo: string; duration: number; easing: string }[][] }).transitions);

test("expand card: the card's picture and name travel to the build page's, over 300 ms ease-out", async ({ page }) => {
  await recordTransitions(page);
  await page.goto("/builds/finisher");
  await page.getByTestId("build-card-meta-finisher").click();
  await expect(page).toHaveURL(/\/builds\/finisher\/meta-finisher$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meta Finisher");
  await expect.poll(async () => (await transitions(page)).length).toBe(1);
  const [anims] = await transitions(page);
  const groups = anims!.filter((a) => a.pseudo.startsWith("::view-transition-group(build-"));
  expect(groups.map((g) => g.pseudo).sort()).toEqual([
    "::view-transition-group(build-meta-finisher-picture)",
    "::view-transition-group(build-meta-finisher-title)",
  ]);
  for (const g of groups) expect([g.duration, g.easing]).toEqual([300, "cubic-bezier(0.23, 1, 0.32, 1)"]);
});

test("expand card with reduced motion: the pair doesn't travel, the page only crossfades", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await recordTransitions(page);
  await page.goto("/builds/finisher");
  await page.getByTestId("build-card-meta-finisher").click();
  await expect(page).toHaveURL(/\/builds\/finisher\/meta-finisher$/);
  await expect.poll(async () => (await transitions(page)).length).toBe(1);
  const [anims] = await transitions(page);
  expect(anims!.filter((a) => a.pseudo.startsWith("::view-transition-group(build-"))).toEqual([]);
  // What's left is the page's own short fade (D-121 (2), PageMotion).
  expect(anims!.map((a) => a.pseudo)).toContain("::view-transition-new(page)");
});

test("expand card without View Transitions: the page simply opens", async ({ page }) => {
  await page.addInitScript(() => {
    // A browser that has never heard of it.
    delete (Document.prototype as { startViewTransition?: unknown }).startViewTransition;
  });
  await page.goto("/builds/finisher");
  await page.getByTestId("build-card-meta-finisher").click();
  await expect(page).toHaveURL(/\/builds\/finisher\/meta-finisher$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meta Finisher");
});

test("expand card: leaving the archetype page any other way carries nothing; the page only slides (D-121 (2))", async ({ page }) => {
  await recordTransitions(page);
  await page.goto("/builds/finisher");
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Builds" }).click();
  await expect(page).toHaveURL(/\/builds#finisher$/);
  await expect.poll(async () => (await transitions(page)).length).toBe(1);
  const [anims] = await transitions(page);
  expect(anims!.filter((a) => a.pseudo.startsWith("::view-transition-group(build-"))).toEqual([]);
  expect(anims!.map((a) => a.pseudo)).toContain("::view-transition-new(page)");
});
