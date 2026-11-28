import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArchetypeBuildsView } from "@/components/builds/ArchetypeBuildsView";
import { archetypeBuilds, buildCardView } from "@/lib/archetype-page";
import { archetypeViews } from "@/lib/builds";
import { loadContent } from "@/lib/content/load";

// The archetype page as the static export renders it (Figma 288:1031 / 290:796 / 290:1084, D-62), from the real
// content with drafts on (the preview). Spark and Finisher have one draft build each (Finisher's is Figma's sample, D-107); Target has none yet.
const content = loadContent(join(process.cwd(), "content"), { includeDrafts: true });
const views = archetypeViews(content.archetypeFile);
const render = (id: string) => {
  const archetype = views.find((v) => v.id === id);
  if (!archetype) throw new Error(id);
  const cards = archetypeBuilds(content.builds, id).map((b) => buildCardView(b));
  return renderToStaticMarkup(createElement(ArchetypeBuildsView, { archetype, cards }));
};
const spark = render("spark");
const target = render("target");
const finisher = render("finisher");

describe("ArchetypeBuildsView", () => {
  it("has the breadcrumb back to Builds, opening on this archetype", () => {
    expect(spark).toMatch(/<nav aria-label="Breadcrumb"/);
    expect(spark).toMatch(/<a[^>]*href="\/builds#spark"[^>]*>Builds<\/a>/);
    expect(spark).toMatch(/aria-current="page"[^>]*>Spark</);
  });

  it("titles the page with the archetype, its group and build count", () => {
    expect(spark).toMatch(/<h1[^>]*>Spark<\/h1>/);
    expect(spark).toContain("Forward · 1 build");
    expect(target).toMatch(/<h1[^>]*>Target<\/h1>/);
    expect(target).toContain("Forward · 0 builds");
  });

  it("shows the archetype's emblem, named by the archetype (D-106)", () => {
    expect(spark).toMatch(/data-testid="archetype-emblem"[^>]*role="img"[^>]*aria-label="Spark"|role="img"[^>]*aria-label="Spark"[^>]*data-testid="archetype-emblem"/);
    expect(spark).toContain("/art/archetypes/spark.svg");
  });

  it("shows the draft build as a card linking to its page, values as written", () => {
    // The card holds a link laid over it, named by the title, so its PlayStyle+ badges can be buttons (D-121 (4)).
    const link = /data-testid="build-card-spark-2008-winger"[^>]*>(<a[^>]*>)/.exec(spark)?.[1] ?? "";
    expect(link).toContain('href="/builds/spark/spark-2008-winger"');
    expect(link).toContain('aria-labelledby="build-card-title-spark-2008-winger"');
    expect(spark).toMatch(/<h2 id="build-card-title-spark-2008-winger"/);
    expect(spark).toMatch(/<h2[^>]*><span[^>]*>2008 Winger<\/span><\/h2>/);
    expect(spark).toContain(">Draft<");
    expect(spark).toContain(">RW<");
    expect(spark).toContain(">LW<");
    expect(spark).toContain("Level PLACEHOLDER · PLACEHOLDER cm · PLACEHOLDER kg");
    expect(spark).toContain("/art/probuilds-face.svg");
  });

  it("has the six key stats and the PlayStyles+ with their badges", () => {
    for (const code of ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"]) expect(spark).toContain(`<dt class="type-caption text-text-secondary">${code}</dt>`);
    expect(spark).toContain("PlayStyles+");
    expect(spark).toContain("/art/playstyles-plus/trickster.webp");
    expect(spark).toContain("/art/playstyles-plus/rapid.webp");
    // A placeholder has no description, so it stays plain text, not a button.
    expect(spark).toMatch(/>PLACEHOLDER<\/span><\/span><\/li>/);
  });

  it("carries the version tag and credit line on the card (D-05, D-08)", () => {
    expect(spark).toContain("FC 27 · Season 2 · Not yet checked in game");
    expect(spark).toContain("Made by Chime in game");
  });

  it("draws Figma's sample cards with the sample note once, no Draft tag, version tag or credit (288:1031, D-113)", () => {
    expect(finisher).toContain("Forward · 3 builds");
    expect(finisher.split("Sample values: not real builds yet")).toHaveLength(2);
    expect(finisher).toMatch(/<h2[^>]*><span[^>]*>Tall Finisher<\/span><\/h2>/);
    expect(finisher).not.toContain(">Draft<");
    expect(finisher).not.toContain("Not yet checked in game");
    expect(finisher).not.toContain("Made by");
    // Three rows a card when no card has a footer; the tile matches them.
    expect(finisher).toMatch(/<li class="row-span-3 hidden tablet:flex desktop:hidden">/);
    expect(spark).not.toContain("Sample values");
  });

  it("fills the last row's gap with Submit a build on tablet and desktop, never on phone", () => {
    // One build: the tile shows beside it on tablet and across the two empty cells on desktop.
    expect(spark).toMatch(/<li class="row-span-4 hidden tablet:flex desktop:flex desktop:col-span-2"><a [^>]*data-testid="submit-tile"/);
    expect(spark).toMatch(/<a [^>]*href="\/submit"[^>]*data-testid="submit-tile"|<a [^>]*data-testid="submit-tile"[^>]*href="\/submit"/);
    expect(spark).toContain("Submit a build");
    expect(target).not.toContain("submit-tile");
  });
});
