import { expect, type Page, test } from "@playwright/test";

// D-121 (2), DESIGN.md Motion: a page change slides the new page 40 px in from the side it came from over --dur-page
// (300 ms), --ease-out, as a View Transition (PageMotion). None on a key press; a short fade with reduced motion.

type Anim = { pseudo: string; duration: number; easing: string; from: string; opacity: string };

/** Records each view transition's animations once it is ready. */
async function record(page: Page) {
  await page.addInitScript(() => {
    const seen: unknown[][] = [];
    Object.assign(window, { transitions: seen });
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((arg: Parameters<typeof start>[0]) => {
      const t = start(arg);
      t.ready.then(() =>
        seen.push(
          document.documentElement.getAnimations({ subtree: true }).map((a) => {
            const effect = a.effect as KeyframeEffect;
            const first = (effect.getKeyframes()[0] ?? {}) as Record<string, unknown>;
            return {
              pseudo: effect.pseudoElement ?? "",
              duration: Number(effect.getTiming().duration),
              easing: String(first.easing ?? effect.getTiming().easing),
              from: String(first.translate ?? ""),
              opacity: String(first.opacity ?? ""),
            };
          }),
        ),
      );
      return t;
    }) as typeof document.startViewTransition;
  });
}
const transitions = (page: Page) => page.evaluate(() => (window as unknown as { transitions: Anim[][] }).transitions);
const pageIn = (anims: Anim[]) => anims.filter((a) => a.pseudo === "::view-transition-new(page)");

test.describe("computer", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false });

  // Pages on the live site too: Changelog, About (after the sections) and Takedown.
  test("a page to the right comes in from the right, 40 px, 300 ms ease-out; one to the left from the left", async ({ page }) => {
    await record(page);
    await page.goto("/changelog");
    await page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about\/?$/);
    await expect.poll(async () => (await transitions(page)).length).toBe(1);
    await page.getByTestId("top-bar").getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Changelog" }).click();
    await expect(page).toHaveURL(/\/changelog\/?$/);
    await expect.poll(async () => (await transitions(page)).length).toBe(2);
    const [toAbout, toChangelog] = await transitions(page);
    expect(pageIn(toAbout!)).toEqual([expect.objectContaining({ duration: 300, easing: "cubic-bezier(0.23, 1, 0.32, 1)", from: "40px", opacity: "0" })]);
    expect(pageIn(toChangelog!)).toEqual([expect.objectContaining({ duration: 300, from: "-40px" })]);
    // The shell doesn't crossfade or move.
    expect(toAbout!.map((a) => a.pseudo)).not.toContain("::view-transition-old(root)");
  });

  test("a link opened from the keyboard changes the page at once", async ({ page }) => {
    await record(page);
    await page.goto("/about");
    await page.getByTestId("top-bar").getByRole("link", { name: "Changelog" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/changelog\/?$/);
    await page.waitForTimeout(400);
    for (const t of await transitions(page)) expect(pageIn(t)).toEqual([]);
  });

  test("reduced motion: the new page only fades, briefly", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await record(page);
    await page.goto("/about");
    await page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "Takedown" }).click();
    await expect(page).toHaveURL(/\/takedown\/?$/);
    await expect.poll(async () => (await transitions(page)).length).toBe(1);
    const [t] = await transitions(page);
    expect(pageIn(t!)).toEqual([expect.objectContaining({ duration: 150, from: "", opacity: "0" })]);
  });

  test("without View Transitions the page simply opens", async ({ page }) => {
    await page.addInitScript(() => {
      delete (Document.prototype as { startViewTransition?: unknown }).startViewTransition;
    });
    await page.goto("/about");
    await page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "Takedown" }).click();
    await expect(page).toHaveURL(/\/takedown\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test("phone: a tab tapped in the bottom nav slides its page in from its side", async ({ page }) => {
  await record(page);
  await page.goto("/about");
  await page.getByTestId("bottom-nav").getByRole("link", { name: "Home" }).tap();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await expect.poll(async () => (await transitions(page)).length).toBe(1);
  const [t] = await transitions(page);
  expect(pageIn(t!)).toEqual([expect.objectContaining({ duration: 300, from: "-40px" })]);
});
