import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  archetypeBuilds,
  bodyLine,
  buildCardView,
  buildCountLabel,
  creditLine,
  KEY_STATS,
  SAMPLE_CARDS_NOTE,
  submitTile,
} from "@/lib/archetype-page";
import { playStylePlusIcon } from "@/lib/builds";
import { loadContent, type LoadedBuild } from "@/lib/content/load";

// The archetype page's rules (Figma 288:1031 / 290:796 / 290:1084, D-62), read from the real content (drafts on, as
// the preview builds it). The draft build's values are "PLACEHOLDER" and must reach the card as written.
const content = loadContent(join(process.cwd(), "content"), { includeDrafts: true });
const draft = content.builds.find((b) => b.id === "spark-2008-winger") as LoadedBuild;

/** The draft with recorded-looking values, for the wording only (test data, not content). */
const recorded = (over: Partial<LoadedBuild> = {}): LoadedBuild => ({
  ...draft,
  status: "published",
  title: "Meta Finisher",
  level: 55,
  body: { heightCm: 185, weightKg: 80, accelerate: null },
  ...over,
});

describe("archetype page data", () => {
  it("keeps an archetype's builds only, Meta pick first, then Recommended, then the rest", () => {
    expect(archetypeBuilds(content.builds, "spark").map((b) => b.id)).toEqual(["spark-2008-winger"]);
    // Figma's three sample builds, in the order the Archetype frames draw them (288:1031): Meta pick, Recommended, none;
    // Leski's draft (D-123 (2)), with no badge, sits among the rest in content order.
    expect(archetypeBuilds(content.builds, "finisher").map((b) => b.id)).toEqual(["meta-finisher", "tall-finisher", "finisher-leski", "quick-finisher"]);
    expect(archetypeBuilds(content.builds, "maestro").map((b) => b.id)).toEqual(["maestro-leski"]);
    expect(archetypeBuilds(content.builds, "target")).toEqual([]);
    const a = recorded({ id: "a", badge: null });
    const b = recorded({ id: "b", badge: "recommended" });
    const c = recorded({ id: "c", badge: "meta" });
    expect(archetypeBuilds([a, b, c], "spark").map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("counts builds under the group, as the header does", () => {
    expect(buildCountLabel("Forward", 3)).toBe("Forward · 3 builds");
    expect(buildCountLabel("Forward", 1)).toBe("Forward · 1 build");
    expect(buildCountLabel("Keeper", 0)).toBe("Keeper · 0 builds");
  });

  it("words level, height and weight, metric only (D-92)", () => {
    expect(bodyLine(recorded())).toBe("Level 55 · 185 cm · 80 kg");
    expect(bodyLine(draft)).toBe("Level PLACEHOLDER · PLACEHOLDER cm · PLACEHOLDER kg");
  });

  it("credits the maker and any tutorial followed (D-08)", () => {
    expect(creditLine(draft.credits)).toBe("Made by Chime in game");
    expect(
      creditLine([
        { role: "made-by", name: "Sharon", url: null, creatorId: null, creator: null },
        { role: "tutorial", name: "JaxStash", url: "https://youtube.com/x", creatorId: null, creator: null },
      ]),
    ).toBe("Made by Sharon in game · tutorial by JaxStash");
    expect(creditLine([])).toBeNull();
  });

  it("names a PlayStyle+ badge only when its file exists", () => {
    expect(playStylePlusIcon("Low Driven Shot")).toBe("/art/playstyles-plus/low-driven-shot.webp");
    expect(playStylePlusIcon("1v1 Close Down")).toBe("/art/playstyles-plus/1v1-close-down.webp");
    expect(playStylePlusIcon("PLACEHOLDER")).toBeNull();
    expect(playStylePlusIcon("Not A PlayStyle")).toBeNull();
    // Every archetype's Signature PlayStyles and specialization PlayStyle+ have a badge file.
    const files = new Set(readdirSync(join(process.cwd(), "public", "art", "playstyles-plus")));
    for (const a of content.archetypeFile.archetypes) {
      const names = [...a.signaturePlayStyles.map((p) => p.name), ...(a.specializations ?? []).map((s) => s.playStyle)];
      for (const n of names) expect(files.has(playStylePlusIcon(n)?.split("/").pop() ?? `${n} (no badge)`)).toBe(true);
    }
  });

  it("turns the draft into a card with its values as written", () => {
    const card = buildCardView(draft);
    expect(card).toMatchObject({
      id: "spark-2008-winger",
      href: "/builds/spark/spark-2008-winger",
      title: "2008 Winger",
      draft: true,
      badge: null,
      picture: null,
      positions: ["RW", "LW"],
      body: "Level PLACEHOLDER · PLACEHOLDER cm · PLACEHOLDER kg",
      versionTag: "FC 27 · Season 2 · Not yet checked in game",
      olderSeason: null,
      credit: "Made by Chime in game",
    });
    // Signature PlayStyle+ first, then the build's own; a placeholder has no badge.
    expect(card.playStylesPlus).toEqual([
      { name: "Trickster", icon: "/art/playstyles-plus/trickster.webp" },
      { name: "Rapid", icon: "/art/playstyles-plus/rapid.webp" },
      { name: "PLACEHOLDER", icon: null },
    ]);
  });

  it("words Figma's sample cards as the frames draw them, marked as samples (D-107, D-113)", () => {
    const cards = archetypeBuilds(content.builds, "finisher").map((b) => buildCardView(b));
    const [meta, tall, quick] = ["meta-finisher", "tall-finisher", "quick-finisher"].map((id) => cards.find((c) => c.id === id));
    expect(SAMPLE_CARDS_NOTE).toBe("Sample values: not real builds yet");
    expect(meta).toMatchObject({ title: "Meta Finisher", badge: "Meta pick", sample: true, positions: ["ST", "CF"], body: "Level 55 · 185 cm · 80 kg" });
    expect(tall).toMatchObject({ title: "Tall Finisher", badge: "Recommended", sample: true, positions: ["ST"], body: "Level 55 · 193 cm · 88 kg" });
    expect(quick).toMatchObject({ title: "Quick Finisher", badge: null, sample: true, positions: ["ST", "CF"], body: "Level 55 · 173 cm · 72 kg" });
    expect(tall?.keyStats.map((k) => k.value)).toEqual(["80", "90", "66", "78", "42", "88"]);
    expect(quick?.keyStats.map((k) => k.value)).toEqual(["94", "88", "74", "89", "34", "66"]);
    expect(tall?.playStylesPlus.map((p) => p.name)).toEqual(["Low Driven Shot", "Precision Header"]);
    expect(quick?.playStylesPlus.map((p) => p.name)).toEqual(["First Touch", "Rapid"]);
    expect(buildCardView(draft).sample).toBe(false);
  });

  it("has the six key stats, with no values until a way to work them out is agreed (A-18)", () => {
    expect(KEY_STATS).toEqual(["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"]);
    expect(buildCardView(draft).keyStats).toEqual(KEY_STATS.map((code) => ({ code, value: null })));
  });

  it("labels the badge and keeps a verified build's date", () => {
    const meta = buildCardView(recorded({ badge: "meta", versionTag: { ...draft.versionTag, verifiedOn: "2026-11-19" } }));
    expect(meta.badge).toBe("Meta pick");
    expect(meta.draft).toBe(false);
    expect(meta.versionTag).toBe("FC 27 · Season 2 · verified 19 Nov 2026");
    expect(buildCardView(recorded({ badge: "recommended" })).badge).toBe("Recommended");
    const old = buildCardView(recorded({ versionTag: { ...draft.versionTag, season: 1 } }), 2);
    expect(old.olderSeason).toBe("Made for Season 1. Values may have changed since.");
  });

  it("fills the last row's gap with the Submit tile: tablet two across, desktop three (D-62)", () => {
    expect(submitTile(0)).toEqual({ tablet: false, desktopSpan: 0 });
    expect(submitTile(1)).toEqual({ tablet: true, desktopSpan: 2 });
    expect(submitTile(2)).toEqual({ tablet: false, desktopSpan: 1 });
    expect(submitTile(3)).toEqual({ tablet: true, desktopSpan: 0 });
    expect(submitTile(4)).toEqual({ tablet: false, desktopSpan: 2 });
    expect(submitTile(6)).toEqual({ tablet: false, desktopSpan: 0 });
  });
});
