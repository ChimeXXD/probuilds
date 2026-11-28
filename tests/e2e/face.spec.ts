import { expect, type Page, test } from "@playwright/test";

// The face page (`/faces/[slug]`, Figma "Phase 2 · Faces"): not started 353:1410, step 2 353:1524, in progress
// 353:1648, finished 372:1984, ticks reset 372:2108; D-71 to D-74, D-79. Preview only (D-105): the faces are Figma's
// samples with its sample recipe (D-107), which draws steps 1, 2 and 9 of 18.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

const URL = "/faces/cristiano-ronaldo-2008";
const KEY = "face:cristiano-ronaldo-2008:v1";
const card = (page: Page) => page.getByTestId("step-card");
const next = (page: Page) => page.getByRole("button", { name: "Done, next" });

test("not started: title, version tag, credit, sample note, step 1 (preset) and the sections bar", async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2008 Ronaldo");
  await expect(page.getByText("Footballer", { exact: true })).toBeVisible();
  await expect(page.getByTestId("version-tag")).toHaveText("FC 27 · Season 2 · Not yet checked in game");
  const credit = page.getByTestId("credit-line");
  await expect(credit).toContainText("Made by Chime in game");
  await expect(credit.getByRole("link", { name: "Tutorial by Xaiiros" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=SHmX5Z8BxFs");
  await expect(page.getByText("Sample recipe: values are placeholders until Chime records this face.")).toBeVisible();
  await expect(page.getByTestId("face-progress")).toContainText("Step 1 of 18 · Preset");
  await expect(page.getByTestId("section-bar").locator("[data-fill]")).toHaveCount(7);
  await expect(card(page)).toContainText("In the game");
  await expect(card(page)).toContainText("Head › Presets");
  await expect(card(page).getByRole("heading", { name: "Pick the preset" })).toBeVisible();
  await expect(page.getByTestId("value-chip-1")).toContainText("Preset");
  await expect(page.getByTestId("value-chip-1")).toContainText("147");
  await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();
  await expect(page.getByTestId("next-line")).toHaveText("Next: Customize › Skin · 4 values");
  await expect(page.getByTestId("limits-callout")).toHaveText("The game can't do this exactly: the hairline sits a little higher than the real one.");
  await expect(page.getByTestId("face-picture-hero").getByText("360°")).toBeVisible();
  await expect(page.getByTestId("bottom-nav").getByRole("link", { name: "Faces" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("site-notice")).toBeVisible();
});

test("Done, next walks the drawn screens; Back returns; ticks survive a reload (SPEC flow 2)", async ({ page }) => {
  await page.goto(URL);
  await next(page).click();
  await expect(page.getByTestId("face-progress")).toContainText("Step 2 of 18 · Skin");
  await expect(card(page)).toContainText("Customize › Skin");
  const values: [string, string][] = [["Complexion", "8"], ["Skin Surface", "33"], ["Scarring", "None"], ["Lip Makeup", "54"]];
  for (const [i, [label, value]] of values.entries()) {
    await expect(page.getByTestId(`value-chip-${i + 1}`)).toContainText(label);
    await expect(page.getByTestId(`value-chip-${i + 1}`)).toContainText(value);
  }
  await expect(page.getByTestId("next-line")).toHaveText("Next: Customize › Head · 3 values");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByTestId("face-progress")).toContainText("Step 1 of 18 · Preset");
  await next(page).click();
  await next(page).click();
  await expect(page.getByTestId("face-progress")).toContainText("Step 9 of 18 · Sculpt");
  await expect(card(page)).toContainText("Sculpt › Shape › Skeletal");
  await expect(card(page).getByRole("heading", { name: "Eyes · Eyelid Upper" })).toBeVisible();
  await expect(page.getByTestId("value-chip-1")).toContainText("Down ← → Up");
  await expect(page.getByTestId("value-chip-1")).toContainText("62");
  await expect(page.getByTestId("value-chip-2")).toContainText("48");
  await expect(page.getByTestId("next-line")).toHaveText("Next: Sculpt › Chin · Chin · 1 slider");
  // Sculpt is the current section, a third done (4 of its 12 screens); Preset to Hair are done.
  const fills = await page.getByTestId("section-bar").locator("[data-fill]").evaluateAll((els) => els.map((el) => el.getAttribute("data-fill")));
  expect(fills).toEqual(["1", "1", "1", "1", "1", "0.333", "0"]);

  await page.reload();
  await expect(page.getByTestId("face-resume")).toContainText("Continuing from step 9");
  await expect(page.getByTestId("face-progress")).toContainText("Step 9 of 18 · Sculpt");
  await page.getByTestId("face-resume").getByRole("button", { name: "Start over" }).click();
  await expect(page.getByTestId("face-progress")).toContainText("Step 1 of 18 · Preset");
  await expect(page.getByTestId("face-resume")).toHaveCount(0);
});

test("finished: Face done, then the matching build card (D-79)", async ({ page }) => {
  await page.goto(URL);
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ step: 9 })), KEY);
  await page.reload();
  await next(page).click();
  await expect(page.getByTestId("face-progress")).toContainText("All 18 steps done");
  await expect(page.getByRole("heading", { name: "Face done" })).toBeVisible();
  await expect(page.getByText("Save it, then check it in a match cutscene, not only in the editor.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Set up the matching build" })).toBeVisible();
  const paired = page.getByTestId("paired-build");
  await expect(paired.locator("a").first()).toHaveAttribute("href", "/builds/spark/spark-2008-winger");
  await expect(paired).toContainText("Spark · not recorded yet");
  await expect(paired).toContainText("Trickster");
  await expect(page.getByRole("link", { name: "Back to faces" })).toHaveAttribute("href", "/faces");
  await expect(page.getByTestId("next-line")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("face-progress")).toContainText("All 18 steps done");
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByTestId("face-progress")).toContainText("Step 1 of 18 · Preset");
});

test("a bumped version clears the ticks and says so (Figma 372:2108)", async ({ page }) => {
  await page.goto(URL);
  // Seeded before the reloaded page's scripts run: set after the first load, the first page's own read (which runs
  // once it hydrates) could clear the old key before the reload looks for it.
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("face:cristiano-ronaldo-2008:v0", JSON.stringify({ step: 9 }));
  });
  await page.reload();
  await expect(page.getByTestId("face-reset")).toHaveText("This face was updated. Your ticks start fresh.");
  await expect(page.getByTestId("face-progress")).toContainText("Step 1 of 18 · Preset");
  expect(await page.evaluate(() => localStorage.getItem("face:cristiano-ronaldo-2008:v0"))).toBeNull();
  // The pill may run into the gutter (Figma draws it 357 px in a 353 px column) but never off the screen.
  const [scrollWidth, clientWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scrollWidth).toBe(clientWidth);
});

test("All steps lists the steps; ticking one moves the walk", async ({ page }) => {
  await page.goto(URL);
  await page.getByRole("button", { name: "All steps" }).click();
  const dialog = page.getByRole("dialog", { name: "All steps" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-testid^="step-row-"]')).toHaveCount(3);
  await expect(dialog.getByTestId("step-row-9")).toContainText("Eyes · Eyelid Upper");
  await dialog.getByTestId("step-tick-2").click();
  await expect(page.getByTestId("face-progress")).toContainText("Step 9 of 18 · Sculpt");
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});

test("the tutorial loads only on tap, from youtube-nocookie.com (rule 5)", async ({ page }) => {
  const youtube: string[] = [];
  page.on("request", (r) => /youtube(-nocookie)?\.com/.test(r.url()) && youtube.push(r.url()));
  await page.goto(URL);
  const facade = page.getByTestId("embed-facade");
  await expect(facade).toContainText("How to create CRISTIANO RONALDO in EA FC27");
  await expect(facade).toContainText("Xaiiros · Tap to play");
  expect(youtube).toEqual([]);
  await facade.click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\/SHmX5Z8BxFs\?/);
});

test("the library's cards open their face pages", async ({ page }) => {
  await page.goto("/faces");
  await page.getByTestId("face-card-3").click();
  await expect(page).toHaveURL(/\/faces\/lamine-yamal\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lamine Yamal");
  await expect(page.getByTestId("embed-facade")).toContainText("How to Make LAMINE YAMAL (New Look) in EA FC 27");
});

test("tablet: the breadcrumb, a 300 px summary column and the steps beside it, 40 px apart (D-74)", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto(URL);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Faces/2008 Ronaldo");
  const summary = await page.getByTestId("face-summary").boundingBox();
  const steps = await page.getByTestId("face-steps").boundingBox();
  expect(summary).toMatchObject({ x: 40, width: 300 });
  expect(steps).toMatchObject({ x: 380, width: 414 });
  await expect(page.getByTestId("bottom-nav")).toBeHidden();
});

test("every control on the page is at least 44 px to touch", async ({ page }) => {
  await page.goto(URL);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("main a, main button")]
      .filter((el) => el.checkVisibility())
      .map((el) => {
        const r = el.getBoundingClientRect();
        const b = getComputedStyle(el, "::before");
        const wide = b.content !== "none" && b.position === "absolute";
        return { name: el.textContent || el.getAttribute("aria-label"), w: wide ? Math.max(r.width, parseFloat(b.width)) : r.width, h: wide ? Math.max(r.height, parseFloat(b.height)) : r.height };
      })
      .filter((t) => t.w < 44 || t.h < 44),
  );
  expect(small).toEqual([]);
});
