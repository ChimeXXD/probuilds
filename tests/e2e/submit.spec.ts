import { expect, type Page, test } from "@playwright/test";

// Submit a build (Figma 400:3219, 399:3121, 428:5513, 406:3024, 401:3616, 412:2989, 413:3113, 429:5828, 441:8928;
// D-85 to D-90, D-99, D-100). Preview only (D-105): with no Supabase project, sending and sharing use the preview's
// stand-in (src/lib/submit/send.ts), and ?send=fail makes it fail.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

const next = (page: Page) => page.getByTestId("submit-next");

test("start: Figma's sample, the level fills in its AP, and the actions bar sits above the nav (400:3219, D-125 (2))", async ({ page }) => {
  await page.goto("/submit");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your build");
  await expect(page.getByText("1 of 4")).toBeVisible();
  await expect(page.getByTestId("submit-group").and(page.locator("[aria-pressed=true]"))).toHaveText("Forward");
  await expect(page.getByTestId("archetype-tile")).toHaveText([/Spark/, /Magician/, /Finisher/, /Target/]);
  await expect(page.getByTestId("archetype-tile").and(page.locator("[aria-pressed=true]"))).toContainText("FinisherLow Driven ShotFirst Touch");
  await expect(page.getByTestId("submit-position")).toHaveText(["ST", "CF", "LW", "RW", "CAM", "LM", "RM"]);
  await expect(page.getByTestId("submit-ap")).toHaveText("1,062 AP to spendLevel 45 adds 44 more");
  await page.getByRole("button", { name: "Level up" }).click();
  await expect(page.getByTestId("submit-ap")).toHaveText("1,106 AP to spendLevel 46 adds 25 more");
  const body = page.getByTestId("submit-body");
  // Height reads feet first, cm small (D-121 (6)); weight stays kg first.
  await expect(page.getByTestId("height-value")).toHaveText("6'1\"");
  await expect(page.getByRole("slider", { name: "Height" })).toHaveAttribute("aria-valuetext", "6'1\", 185 cm");
  await expect(body).toContainText("6'1\"185 cm");
  await expect(body).toContainText("5'5\"Finisher range6'3\"");
  await expect(body).toContainText("80 kg176 lb");
  await expect(page.getByTestId("body-changes")).toContainText("Acceleration−2Agility−2Strength+2");
  // Figma's body changes are its sample's: another height has no figures yet.
  await page.getByRole("button", { name: "Height up" }).click();
  await expect(body).toContainText("6'1\"186 cm");
  await expect(page.getByTestId("body-changes")).toHaveCount(0);
  await expect(page.getByTestId("bottom-nav")).toBeVisible();
  await expect(next(page)).toHaveText("Attributes");
});

test("start: another group and archetype bring their own positions and body range", async ({ page }) => {
  await page.goto("/submit");
  await page.getByTestId("submit-group").filter({ hasText: "Defender" }).click();
  await expect(page.getByTestId("archetype-tile")).toHaveText([/Progressor/, /Boss/, /Marauder/]);
  await page.getByTestId("archetype-tile").filter({ hasText: "Boss" }).click();
  await expect(page.getByTestId("submit-position")).toHaveText(["CB", "LB", "RB", "LWB", "RWB", "CDM"]);
  await expect(page.getByTestId("submit-body")).toContainText("5'11\"Boss range6'5\"");
  // A build keeps at least one position.
  await page.getByTestId("submit-position").filter({ hasText: "CB" }).click();
  await expect(page.getByTestId("submit-position").filter({ hasText: "CB" })).toHaveAttribute("aria-pressed", "true");
});

test("attributes: the AP counter, typing that jumps on after two digits, and the 99 limit (399:3121, 428:5513)", async ({ page }) => {
  await page.goto("/submit");
  await next(page).click();
  await expect(page.getByText("Finisher · Level 44 · Attributes")).toBeVisible();
  await expect(page.getByTestId("ap-counter")).toHaveText("51AP left1,011 spent1,062 at level 44");
  const finishing = page.getByRole("textbox", { name: "Finishing", exact: true });
  await finishing.click();
  await expect(page.getByText("Typing · next: Shot Power")).toBeVisible();
  await finishing.pressSequentially("95");
  await expect(page.getByRole("textbox", { name: "Shot Power", exact: true })).toBeFocused();
  await expect(finishing).toHaveValue("95");
  await finishing.fill("100");
  await expect(page.getByText("Attributes go up to 99")).toBeVisible();
  await expect(next(page)).toBeDisabled();
  await page.getByRole("button", { name: "Finishing down" }).click();
  await expect(finishing).toHaveValue("99");
  await expect(next(page)).toBeEnabled();
  // Height and weight show on the attributes they change.
  await expect(page.getByText("−2 from height and weight · 86 in a match")).toBeVisible();
  // A group's number is its average: Pace 87, then 88 with Acceleration at 90.
  await page.getByRole("button", { name: "Acceleration up" }).click();
  await page.getByRole("button", { name: "Acceleration up" }).click();
  await expect(page.getByRole("region", { name: "Pace" })).toContainText("Pace88");
  await page.getByRole("radio", { name: "5 stars" }).first().click();
  await expect(page.getByRole("radiogroup", { name: "Skill Moves" }).getByRole("radio", { checked: true })).toHaveAccessibleName("5 stars");
});

test("PlayStyles: PlayStyle+ only from the archetype, picked per slot, and chips that tick (406:3024)", async ({ page }) => {
  await page.goto("/submit?state=playstyles");
  const menu = page.getByTestId("plus-menu");
  await expect(menu.getByRole("button")).toHaveText(["First Touch+Signature", "Chip Shot+Finisher+", "Gamechanger+Hunter", "Relentless+Presser"]);
  await menu.getByRole("button", { name: /Gamechanger\+/ }).click();
  await expect(page.getByTestId("plus-slot").nth(1)).toContainText("Gamechanger+Hunter");
  await expect(page.getByTestId("playstyle-chip").and(page.locator("[data-state=plus]"))).toHaveText(["Low Driven Shot+", "Gamechanger+"]);
  await expect(page.getByText("5PlayStyles")).toBeVisible();
  await page.getByTestId("playstyle-chip").filter({ hasText: "Dead Ball" }).click();
  await expect(page.getByText("6PlayStyles")).toBeVisible();
  await expect(next(page)).toHaveText("Review");
});

test("name and share: the card follows the editor, Share card makes the short link, the nav is back (401:3616)", async ({ page }) => {
  await page.goto("/submit?state=name");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Name it and share");
  const card = page.getByTestId("your-card");
  await expect(card).toContainText("Your Finisher");
  await expect(card).toContainText("probuilds.club/b/your-finisher");
  await expect(card).toContainText("Made by you. Not endorsed by or affiliated with EA or its licensors. Not endorsed by the people named.");
  await page.getByLabel("Build name").fill("Kola's Finisher");
  await page.getByLabel("Your name for the credit").fill("Kola");
  await expect(card).toContainText("Kola's Finisher");
  await expect(card).toContainText("Made by Kola.");
  await expect(page.getByTestId("bottom-nav").locator("[aria-current=page]")).toHaveAccessibleName("Submit");
  await page.getByTestId("share-card").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("figure", { name: "Share card 1 of 2" })).toContainText("probuilds.club/b/k7x2m9");
  await expect(dialog.getByRole("figure", { name: "Share card 2 of 2" })).toContainText("Kola's Finisher · Level 44 · Controlled");
});

test("name and share: a picture stays on the card only, and can be removed (412:2989)", async ({ page }) => {
  await page.goto("/submit?state=name");
  await page.getByTestId("face-file").setInputFiles("public/art/probuilds-face.svg");
  const face = page.getByTestId("pro-face");
  await expect(face).toContainText("Your pictureOn your card. Swap it any time.");
  await expect(page.getByTestId("your-card").locator("img[src^='blob:']")).toHaveCount(1);
  await face.getByRole("button", { name: "Remove" }).click();
  await expect(face).toContainText("No picture yet");
});

test("send for listing: it goes through, or says it didn't and keeps the build (429:5828, 441:8928)", async ({ page }) => {
  await page.goto("/submit?state=name");
  await page.getByTestId("submit-listing").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sent for listing");
  await expect(page.getByRole("list", { name: "What happens next" }).getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Submit another build" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your build");

  await page.goto("/submit?state=name&send=fail");
  await page.getByLabel("Build name").fill("Kept");
  await page.getByTestId("submit-listing").click();
  await expect(page.getByTestId("send-failed")).toHaveText("Couldn't send. Check your connection and try again. Your build is still here.");
  await expect(page.getByTestId("submit-listing")).toHaveText("Try again");
  await expect(page.getByLabel("Build name")).toHaveValue("Kept");
});

test("phone layout: steppers and sliders are 44 px targets, inputs are 16 px or more (no iOS zoom)", async ({ page }) => {
  await page.goto("/submit?state=attributes");
  for (const name of ["Finishing down", "Finishing up"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box && [box.width, box.height]).toEqual([44, 44]);
  }
  const size = await page.getByRole("textbox", { name: "Finishing", exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
  await page.goto("/submit?state=name");
  const field = await page.getByLabel("Build name").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(field).toBeGreaterThanOrEqual(16);
});
