import { expect, type Page, test } from "@playwright/test";

// D-121 (4): every PlayStyle and PlayStyle+ badge opens what it does, in EA's own words with the EA page: a bottom
// sheet on phone, a centred dialog on tablet and desktop.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview pages");

const sheet = (page: Page) => page.getByTestId("playstyle-info");

test("a signature PlayStyle on the Builds page opens a bottom sheet on phone with EA's words and source", async ({ page }) => {
  await page.goto("/builds#finisher");
  const badge = page.getByRole("button", { name: "Low Driven Shot: what it does" }).filter({ visible: true });
  await expect(badge).toHaveAttribute("aria-haspopup", "dialog");
  await badge.click();
  const dialog = sheet(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Low Driven Shot" })).toBeVisible();
  await expect(dialog).toContainText("PlayStyle");
  await expect(dialog).toContainText("Enhances a Player's ability to execute low driven shots");
  await expect(dialog.getByRole("link", { name: /PlayStyles: Everything You Need to Know/ }).first()).toHaveAttribute("href", "https://www.ea.com/games/ea-sports-fc/fc-27/news/what-are-playstyles");
  // EA contradicts itself on this one (Chime, 28 Nov: "it should carry it and just write what they said").
  await expect(dialog).toContainText("Removed the shot speed boost previously applied to low-driven shots");
  await expect(dialog.getByRole("link", { name: /Gameplay Deep Dive/ })).toHaveAttribute("href", "https://www.ea.com/games/ea-sports-fc/fc-27/news/pitch-notes-fc27-gameplay-deep-dive");
  // A bottom sheet: it sits on the bottom edge, full width.
  await page.waitForTimeout(400);
  const box = (await dialog.boundingBox())!;
  const vp = page.viewportSize()!;
  expect(Math.round(box.y + box.height)).toBe(vp.height);
  expect(Math.round(box.width)).toBe(vp.width);
  // Escape closes it and focus goes back to the badge.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(badge).toBeFocused();
});

test("a specialization's PlayStyle+ badge opens a centred dialog on desktop, saying PlayStyle+", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/builds#finisher");
  await page.getByRole("button", { name: "Gamechanger+: what it does" }).filter({ visible: true }).click();
  const dialog = sheet(page);
  await expect(dialog.getByRole("heading", { name: "Gamechanger" })).toBeVisible();
  await expect(dialog).toContainText("PlayStyle+");
  await expect(dialog).toContainText("Fancy and Trivela shots are performed with greatly improved accuracy.");
  await page.waitForTimeout(400);
  const box = (await dialog.boundingBox())!;
  expect(Math.abs(box.x + box.width / 2 - 720)).toBeLessThan(2);
  expect(Math.abs(box.y + box.height / 2 - 500)).toBeLessThan(2);
  // A click on the backdrop closes it.
  await page.mouse.click(40, 40);
  await expect(dialog).toBeHidden();
});

test("a PlayStyle+ on a build card opens its sheet without opening the build; the rest of the card still opens it", async ({ page }) => {
  await page.goto("/builds/finisher");
  const card = page.getByTestId("build-card-meta-finisher");
  await card.getByRole("button", { name: /\+: what it does$/ }).first().click();
  await expect(sheet(page)).toBeVisible();
  await expect(page).toHaveURL(/\/builds\/finisher\/?$/);
  await page.keyboard.press("Escape");
  await card.click({ position: { x: 40, y: 40 } });
  await expect(page).toHaveURL(/\/builds\/finisher\/meta-finisher\/?$/);
});

test("the Build page's PlayStyles and PlayStyles+ open their sheets", async ({ page }) => {
  await page.goto("/builds/finisher/meta-finisher");
  const buttons = page.getByTestId("playstyle-button");
  expect(await buttons.count()).toBeGreaterThan(3);
  await page.getByRole("button", { name: /^[^+]+: what it does$/ }).first().click();
  await expect(sheet(page)).toContainText("PlayStyle");
  await expect(sheet(page).getByRole("link")).toHaveAttribute("href", /^https:\/\/www\.ea\.com\//);
});

test("Home's build cards and a face's paired build: the PlayStyle+ badges open their sheets", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("build-preview-1").getByTestId("playstyle-button").first().click();
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page)).toContainText("PlayStyle+");
});

test("Submit: chips have no info buttons; each category's What these do lists its PlayStyles in EA's words (D-122 (5))", async ({ page }) => {
  await page.goto("/submit?state=playstyles");
  // The chips are Figma's size again and a tap still picks.
  const chip = page.getByTestId("playstyle-chip").filter({ hasText: "Dead Ball" });
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(sheet(page)).toBeHidden();
  await expect(page.getByRole("button", { name: /: what it does$/ })).toHaveCount(0);
  // One link per category.
  await expect(page.getByRole("button", { name: /^What these do/ })).toHaveCount(5);
  const shooting = page.getByRole("button", { name: "What these do: Shooting" });
  await expect(shooting).toHaveAttribute("aria-haspopup", "dialog");
  await shooting.click();
  const dialog = sheet(page);
  await expect(dialog.getByRole("heading", { level: 2, name: "Shooting" })).toBeVisible();
  const items = dialog.getByTestId("playstyle-info-item");
  await expect(items).toHaveCount(8);
  await expect(items.first()).toContainText("Finesse Shot");
  // The sample Finisher holds Low Driven Shot and Chip Shot as PlayStyle+: they are listed as such, in EA's PlayStyle+
  // words; the rest in the PlayStyle words.
  await expect(dialog.getByRole("heading", { level: 3, name: "Low Driven Shot+" })).toBeVisible();
  await expect(dialog).toContainText("Enhances a Player's ability to perform low driven shots with significantly enhanced accuracy");
  await expect(dialog).toContainText("Faster power shots with increased speed");
  await expect(dialog.getByRole("link", { name: /PlayStyles: Everything You Need to Know/ }).first()).toHaveAttribute("href", /ea\.com/);
  // EA's disagreement on Low Driven Shot shows in the list too (D-122 (3)).
  await expect(items.filter({ hasText: "Low Driven Shot" })).toContainText("Removed the shot speed boost");
  // Escape closes it and focus goes back to the button.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(shooting).toBeFocused();
});

test("opened from the keyboard, the sheet appears at once (nothing moves on keyboard actions)", async ({ page }) => {
  await page.goto("/builds#finisher");
  const badge = page.getByRole("button", { name: "First Touch: what it does" }).filter({ visible: true });
  await badge.focus();
  await page.keyboard.press("Enter");
  await expect(sheet(page)).toBeVisible();
  expect(await sheet(page).evaluate((el) => getComputedStyle(el).transitionProperty)).toBe("none");
});
