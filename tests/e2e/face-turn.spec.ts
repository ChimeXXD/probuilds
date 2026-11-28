import { expect, type Page, test } from "@playwright/test";

// Creators' turn frames (D-123): five sample faces turn by drag with frames cut from a creator's FC 27 tutorial, and
// the credit line names and links that video, "360° turn from <channel>'s video" (rule 5). Preview only: the frames
// live under sample/, which a build without drafts deletes.
test.skip(process.env.PROBUILDS_DRAFTS !== "1", "preview page");

const TURNS = [
  ["neymar-jr-mohawk", "CodeName Max", "UOrV95yMy50"],
  ["lebron-james", "JaxStash", "aJez-2ttA3I"],
  ["lamine-yamal", "CodeName Max", "IYBrT2yBauQ"],
  ["zinedine-zidane", "CodeName Max", "LlCyI-Fqpr0"],
  ["michael-olise", "CodeName Max", "s1KBQuNvRJc"],
] as const;

/** Drags across the hero picture by `dx` px, slowly enough that it doesn't fling on. */
async function drag(page: Page, dx: number) {
  const box = await page.getByTestId("face-picture-hero").boundingBox();
  if (!box) throw new Error("no hero picture");
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 12 });
  await page.waitForTimeout(80); // rest before letting go: no flick
  await page.mouse.up();
}

for (const [slug, channel, videoId] of TURNS) {
  test(`${slug}: a drag turns the head through its frames, and the turn credits ${channel}'s video`, async ({ page }) => {
    await page.goto(`/faces/${slug}`);
    const img = page.getByTestId("face-picture-hero").locator("img");
    await expect(img).toHaveAttribute("src", `/sample/faces/${slug}.webp`);
    await drag(page, 80);
    // 8 px a frame: 80 px to the right is 10 frames on from the front (frame 01), so frame 11.
    await expect(img).toHaveAttribute("src", `/sample/faces/${slug}/turn/11.webp`);
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBe(640);
    const credit = page.getByTestId("credit-line").getByRole("link", { name: `360° turn from ${channel}'s video` });
    await expect(credit).toHaveAttribute("href", `https://www.youtube.com/watch?v=${videoId}`);
    await expect(credit).toHaveAttribute("target", "_blank");
  });
}

test("LeBron: the tutorial stays CodeName Max's while the turn is JaxStash's, each credited for what it is", async ({ page }) => {
  await page.goto("/faces/lebron-james");
  const credit = page.getByTestId("credit-line");
  await expect(credit.getByRole("link", { name: "Tutorial by CodeName Max" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=eV2G-DOTAQI");
  await expect(credit.getByRole("link", { name: "360° turn from JaxStash's video" })).toBeVisible();
  await expect(credit).toHaveText(/^Tutorial by CodeName Max\s*360° turn from JaxStash.s video$/);
});

test("a face with no turn frames has no turn credit", async ({ page }) => {
  await page.goto("/faces/michael-jackson");
  await expect(page.getByTestId("turn-credit")).toHaveCount(0);
});

test("Donald Trump's frames are kept but his face is not on the site (D-123)", async ({ page }) => {
  const res = await page.goto("/faces/donald-trump");
  expect(res?.status()).toBe(404);
});

test.describe("computer", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false });

  test("the turn credit thickens its underline on hover (D-121 (1))", async ({ page }) => {
    await page.goto("/faces/zinedine-zidane");
    const link = page.getByTestId("turn-credit");
    const thickness = () => link.evaluate((el) => getComputedStyle(el).textDecorationThickness);
    await page.mouse.move(0, 0);
    const rest = await thickness();
    await link.hover();
    await expect.poll(thickness).not.toBe(rest);
  });
});
