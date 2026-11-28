import { expect, test } from "@playwright/test";

// Search results (Figma 376:2282 / 376:2393 / 376:2491; D-80 (3), D-97 (6)), opened from the top bar's search button.
// Preview only (D-105): what it searches is Figma's sample faces and builds (D-107).
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

test("the top bar's search opens Search; typing finds faces and builds, in their groups with counts", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("top-bar").getByRole("link", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/search\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Search");
  const input = page.getByTestId("search-input");
  await expect(input).toHaveAttribute("placeholder", "Search faces and builds");
  await input.fill("Ronaldo");
  await expect(page.getByTestId("search-count")).toHaveText("2 results for “Ronaldo”");
  const faces = page.getByTestId("search-faces");
  await expect(faces.getByRole("heading", { name: "Faces" })).toBeVisible();
  await expect(faces).toContainText("1");
  await expect(faces.locator('[data-testid^="face-card-"]')).toHaveCount(1);
  await expect(faces.getByTestId("face-card-1")).toHaveAttribute("href", "/faces/cristiano-ronaldo-2008");
  const builds = page.getByTestId("search-builds");
  await expect(builds.locator('[data-testid^="build-preview-"]')).toHaveCount(1);
  await expect(builds.getByTestId("build-preview-1").locator("a").first()).toHaveAttribute("href", "/builds/spark/spark-2008-winger");
  // The query goes into the address, so the results survive a reload and can be shared.
  await expect(page).toHaveURL(/\?q=Ronaldo$/);
  await page.reload();
  await expect(page.getByTestId("search-input")).toHaveValue("Ronaldo");
  await expect(page.getByTestId("search-count")).toHaveText("2 results for “Ronaldo”");
});

test("no section is lit in the bottom nav on Search (Page=None, D-97 (6))", async ({ page }) => {
  await page.goto("/search?q=Ronaldo");
  await expect(page.getByTestId("bottom-nav").locator('[aria-current="page"]')).toHaveCount(0);
});

test("Clear empties the search and the results", async ({ page }) => {
  await page.goto("/search?q=Ronaldo");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByTestId("search-input")).toHaveValue("");
  await expect(page.getByTestId("search-count")).toHaveCount(0);
  await expect(page.getByTestId("search-faces")).toHaveCount(0);
});

test("tablet: a 560 px field, faces three across and builds two across", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto("/search?q=lamine");
  expect((await page.getByTestId("search-field").boundingBox())?.width).toBe(560);
  const cols = (id: string) => page.getByTestId(id).locator("ul").first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(await cols("search-faces")).toBe(3);
  expect(await cols("search-builds")).toBe(2);
});
