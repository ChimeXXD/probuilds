import { expect, test } from "@playwright/test";

// Request a face (Figma 402:3451, 430:6093, 430:6517, 430:6931, 441:9598, 441:9992; D-83, D-84, D-96). Preview only
// (D-105): with no Supabase project the page shows Figma's sample list and a stand-in for sending and voting.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

const rows = (page: import("@playwright/test").Page) => page.getByTestId("face-request");

test("the sample list: ranked by votes, two voted, one being made, the Submit tab lit (402:3451, D-121 (5))", async ({ page }) => {
  await page.goto("/submit/request");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Request a face");
  await expect(rows(page)).toHaveText([
    /^12017 RonaldoFootballer · Being made214$/,
    /^2Kanye WestMusician167$/,
    /^32006 RonaldinhoFootballer121$/,
    /^4Burna BoyMusician96$/,
    /^5Usain BoltAthlete58$/,
  ]);
  await expect(page.getByRole("button", { name: /^Vote for 2017 Ronaldo/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /^Vote for Kanye West/ })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("bottom-nav").locator("[aria-current=page]")).toHaveAccessibleName("Submit");
  await page.getByTestId("request-kind").filter({ hasText: "Musicians" }).click();
  await expect(rows(page)).toHaveText([/^2Kanye West/, /^4Burna Boy/]);
});

test("voting: once per browser, counted at once, and kept on reload", async ({ page }) => {
  await page.goto("/submit/request");
  const kanye = page.getByRole("button", { name: /^Vote for Kanye West/ });
  await kanye.click();
  await expect(kanye).toHaveAttribute("aria-pressed", "true");
  await expect(kanye).toHaveText("168");
  await kanye.click();
  await expect(kanye).toHaveText("168");
  await page.reload();
  await expect(page.getByRole("button", { name: /^Vote for Kanye West/ })).toHaveAttribute("aria-pressed", "true");
});

test("a vote that doesn't go through is taken back, with the red toast (441:9992)", async ({ page }) => {
  await page.goto("/submit/request?vote=fail");
  const burna = page.getByRole("button", { name: /^Vote for Burna Boy/ });
  await burna.click();
  await expect(page.getByText("Your vote didn't go through. Try again.")).toBeVisible();
  await expect(burna).toHaveAttribute("aria-pressed", "false");
  await expect(burna).toHaveText("96");
});

test("typing a name already asked for offers the vote instead, or a new request (430:6093)", async ({ page }) => {
  await page.goto("/submit/request");
  await page.getByLabel("Who do you want?").fill("Kanye");
  const asked = page.getByTestId("already-asked");
  await expect(asked).toHaveText("Already asked forKanye WestMusician · 167 votesVote");
  await expect(page.getByRole("button", { name: "Ask for “Kanye” as a new face" })).toBeVisible();
  await asked.getByRole("button", { name: "Vote for Kanye West" }).click();
  await expect(page.getByRole("button", { name: /^Vote for Kanye West, 168/ })).toHaveAttribute("aria-pressed", "true");
});

test("a request is sent, and Ask for another starts again (430:6517)", async ({ page }) => {
  await page.goto("/submit/request");
  await page.getByLabel("Who do you want?").fill("2010 Messi");
  await page.getByRole("button", { name: "Request" }).click();
  await expect(page.getByTestId("request-sent")).toContainText("Asked for 2010 MessiNew requests show in the list once we've checked them");
  // Moderated (D-96): it isn't in the list yet.
  await expect(rows(page).filter({ hasText: "2010 Messi" })).toHaveCount(0);
  await page.getByRole("button", { name: "Ask for another" }).click();
  await expect(page.getByLabel("Who do you want?")).toBeFocused();
});

test("a request that doesn't go through keeps the name and offers Try again (441:9598)", async ({ page }) => {
  await page.goto("/submit/request?request=fail");
  await page.getByLabel("Who do you want?").fill("2010 Messi");
  await page.getByRole("button", { name: "Request" }).click();
  await expect(page.getByTestId("request-failed")).toHaveText("Couldn't send your request. Check your connection and try again.");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByLabel("Who do you want?")).toHaveValue("2010 Messi");
});

test("no requests yet: the empty card in place of the chips and list (430:6931)", async ({ page }) => {
  await page.goto("/submit/request?requests=none");
  await expect(page.getByTestId("requests-empty")).toHaveText("No requests yetBe the first: ask for a face above");
  await expect(page.getByTestId("request-kind")).toHaveCount(0);
});

test("phone: the field is 16 px or more and every vote box is a 56 px target", async ({ page }) => {
  await page.goto("/submit/request");
  const size = await page.getByLabel("Who do you want?").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
  const box = await page.getByRole("button", { name: /^Vote for Usain Bolt/ }).boundingBox();
  expect(box && [box.width, box.height]).toEqual([56, 56]);
});
