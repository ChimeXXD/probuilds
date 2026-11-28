import { expect, test } from "@playwright/test";

// D-121 (5): Submit holds both flows as two tabs at the top, "Submit a build" (/submit) and "Request a face"
// (/submit/request), with the shared sliding pill; /faces/request redirects to the Request tab; the nav's Submit is
// current on both. Preview only: both flows are preview pages (D-105).
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview pages");

const tab = (page: import("@playwright/test").Page, name: string) => page.getByTestId("submit-tab").filter({ hasText: name });

test("phone: two tabs at the top; Request a face opens its tab, the pill follows, Submit stays current in the nav", async ({ page }) => {
  await page.goto("/submit");
  const tabs = page.getByRole("navigation", { name: "Submit" });
  await expect(tabs.getByTestId("submit-tab")).toHaveText(["Submit a build", "Request a face"]);
  await expect(tab(page, "Submit a build")).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1, name: "Your build" })).toBeVisible();
  // The tabs sit above the flow's own content.
  const [bar, title] = await Promise.all([tabs.boundingBox(), page.getByRole("heading", { level: 1 }).boundingBox()]);
  expect((bar?.y ?? 0) < (title?.y ?? 0)).toBe(true);
  await tab(page, "Request a face").click();
  await expect(page).toHaveURL(/\/submit\/request\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Request a face" })).toBeVisible();
  await expect(tab(page, "Request a face")).toHaveAttribute("aria-current", "page");
  await expect(tab(page, "Submit a build")).not.toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("bottom-nav").getByRole("link", { name: "Submit" })).toHaveAttribute("aria-current", "page");
  // Every tab is a 44 px target (CLAUDE.md).
  for (const t of await page.getByTestId("submit-tab").all()) {
    const hit = await t.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const before = getComputedStyle(el, "::before");
      return { height: Math.max(r.height, parseFloat(before.height) || 0) };
    });
    expect(hit.height).toBeGreaterThanOrEqual(44);
  }
  await tab(page, "Submit a build").click();
  await expect(page).toHaveURL(/\/submit\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Your build" })).toBeVisible();
});

test("desktop: the top bar's Submit is current on both tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/submit/request");
  await expect(page.getByTestId("top-bar").getByRole("link", { name: "Submit" })).toHaveAttribute("aria-current", "page");
  await page.goto("/submit");
  await expect(page.getByTestId("top-bar").getByRole("link", { name: "Submit" })).toHaveAttribute("aria-current", "page");
});

test("/faces/request moved: the old address opens the Request tab", async ({ page, request }) => {
  const res = await request.get("/faces/request", { maxRedirects: 0 });
  expect(res.status()).toBe(301);
  expect(res.headers().location).toBe("/submit/request");
  await page.goto("/faces/request");
  await expect(page).toHaveURL(/\/submit\/request\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Request a face" })).toBeVisible();
});

test("without the host's redirect, the static page still sends the browser on", async ({ page }) => {
  // The exported page itself (as a host without _redirects would serve it).
  await page.goto("/faces/request.html");
  await expect(page).toHaveURL(/\/submit\/request\/?$/);
});

test("switching tabs: the bar holds still while the page under it slides in from the tab's side", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const seen: string[][] = [];
    Object.assign(window, { transitions: seen });
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((arg: Parameters<typeof start>[0]) => {
      const t = start(arg);
      t.ready.then(() =>
        seen.push(
          document.documentElement.getAnimations({ subtree: true }).map((a) => {
            const effect = a.effect as KeyframeEffect;
            return `${effect.pseudoElement} ${String((effect.getKeyframes()[0] as Record<string, unknown> | undefined)?.translate ?? "")}`;
          }),
        ),
      );
      return t;
    }) as typeof document.startViewTransition;
  });
  await page.goto("/submit");
  await tab(page, "Request a face").click();
  await expect(page).toHaveURL(/\/submit\/request\/?$/);
  await expect.poll(() => page.evaluate(() => (window as unknown as { transitions: string[][] }).transitions.length)).toBe(1);
  const [anims] = await page.evaluate(() => (window as unknown as { transitions: string[][] }).transitions);
  expect(anims).toContain("::view-transition-new(page) 40px");
  expect(anims!.filter((a) => a.includes("(page-tabs)"))).toEqual([]);
});
