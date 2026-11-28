import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  attributeGroups,
  buildPageView,
  heightLine,
  masteryNote,
  pageBuilds,
  playStyleBadge,
  specializationView,
  stars,
  weightLine,
} from "@/lib/build-page";
import { loadContent, type LoadedBuild } from "@/lib/content/load";

// The build page's rules (`/builds/[archetype]/[build]`, Figma 298:3630 / 306:794 / 306:1286; D-63), read from the
// real content with drafts on, as the preview builds it. The draft's values are "PLACEHOLDER" and reach the page as
// written: nothing here works out a game number the build file doesn't hold (CLAUDE.md, D-43).
const content = loadContent(join(process.cwd(), "content"), { includeDrafts: true });
const draft = content.builds.find((b) => b.id === "spark-2008-winger") as LoadedBuild;
const sources = content.archetypeFile.sources;
const finisher = content.archetypeFile.archetypes.find((a) => a.id === "finisher");
if (!finisher) throw new Error("finisher");

/** A recorded-looking Finisher build, for the wording only (test data, not content). */
const recorded = (over: Partial<LoadedBuild> = {}): LoadedBuild => ({
  ...draft,
  id: "meta-finisher",
  slug: "meta-finisher",
  status: "published",
  title: "Meta Finisher",
  archetype: finisher,
  positions: ["ST", "CF"],
  level: 55,
  body: { heightCm: 185, weightKg: 80, accelerate: "controlled" },
  attributes: [
    { name: "Acceleration", value: 87 },
    { name: "Finishing", value: 94 },
    { name: "Ball Control", value: 92 },
    { name: "Composure", value: 92 },
    { name: "Reactions", value: 92 },
  ],
  playStyles: { signature: ["Low Driven Shot", "First Touch"], plus: [], regular: ["Finesse Shot", "Power Shot"] },
  specialization: "Finisher+",
  skillMoves: 4,
  weakFoot: 4,
  ...over,
});

describe("build page data", () => {
  it("gives every shown build its page under its archetype", () => {
    expect(pageBuilds(content.builds)).toEqual([
      { archetype: "finisher", build: "finisher-leski" },
      { archetype: "maestro", build: "maestro-leski" },
      { archetype: "finisher", build: "meta-finisher" },
      { archetype: "finisher", build: "quick-finisher" },
      { archetype: "spark", build: "spark-2008-winger" },
      { archetype: "finisher", build: "tall-finisher" },
    ]);
  });

  it("has a badge file for every regular PlayStyle in the Figma PlayStyle set (D-39)", () => {
    const names = [
      "Chip Shot", "Power Shot", "Dead Ball", "Acrobatic", "Gamechanger", "Tiki Taka", "Block", "Slide Tackle",
      "Long Throw", "Far Throw", "1v1 Close Down", "Rapid",
    ];
    for (const name of names) {
      const badge = playStyleBadge(name);
      expect(badge, name).not.toBeNull();
      expect(existsSync(join(process.cwd(), "public", badge as string)), name).toBe(true);
    }
    expect(playStyleBadge("PLACEHOLDER")).toBeNull();
  });

  it("words height in feet and inches and weight in pounds beside the metric value (D-92)", () => {
    expect(heightLine(185)).toBe("6'1\" · 185 cm");
    expect(heightLine(170)).toBe("5'7\" · 170 cm");
    expect(heightLine(183)).toBe("6'0\" · 183 cm");
    expect(weightLine(80)).toBe("176 lb · 80 kg");
    expect(weightLine(65)).toBe("143 lb · 65 kg");
    // A placeholder stays as written.
    expect(heightLine("PLACEHOLDER" as never)).toBe("PLACEHOLDER cm");
    expect(weightLine("PLACEHOLDER" as never)).toBe("PLACEHOLDER kg");
  });

  it("draws star ratings as stars and says the number for screen readers", () => {
    expect(stars(4)).toEqual({ text: "★★★★", label: "4 stars" });
    expect(stars(1)).toEqual({ text: "★", label: "1 star" });
    expect(stars("PLACEHOLDER" as never)).toEqual({ text: "PLACEHOLDER", label: "PLACEHOLDER" });
  });

  it("groups the build's attributes in the game's order, marks mastery, and leaves out empty groups", () => {
    const groups = attributeGroups(recorded().attributes, ["Finishing", "Composure"]);
    expect(groups.map((g) => g.name)).toEqual(["Pace", "Shooting", "Dribbling"]);
    expect(groups[1]).toEqual({
      code: "SHO",
      name: "Shooting",
      value: null,
      attributes: [{ name: "Finishing", value: 94, mastery: true, percent: 94 }],
    });
    expect(groups[2]?.attributes.map((a) => a.name)).toEqual(["Reactions", "Ball Control", "Composure"]);
    // The draft's placeholder values stay as written, with an empty bar.
    expect(attributeGroups(draft.attributes, [])[0]?.attributes[0]).toEqual({
      name: "Acceleration",
      value: "PLACEHOLDER",
      mastery: false,
      percent: 0,
    });
  });

  it("explains the archetype's mastery and links its source, or says nothing when no source gave it", () => {
    expect(masteryNote(finisher, sources)).toEqual({
      note: "Mastery +2: levelling Finisher adds +1 to Finishing and Composure at level 10 and +1 more by level 55, on every Finisher build. Not included in the values below.",
      source: { label: "EA Pitch Notes", url: "https://www.ea.com/en/games/ea-sports-fc/fc-27/news/pitch-notes-fc27-the-grounds-deep-dive" },
    });
    expect(masteryNote({ ...draft.archetype, masteryAttributes: null }, sources)).toBeNull();
    // A source other than EA's Pitch Notes is named by its own title, never as EA's.
    const boss = content.archetypeFile.archetypes.find((a) => a.id === "boss");
    expect(boss && masteryNote(boss, sources)?.source).toEqual({
      label: "Dexerto, how to level up archetypes (FC 27)",
      url: "https://www.dexerto.com/wikis/ea-fc-27/how-to-level-up-archetypes/",
    });
  });

  it("reads the specialization's PlayStyle+ and targets from the archetype file, the build's values beside them", () => {
    expect(specializationView(recorded())).toEqual({
      name: "Finisher+",
      plus: "Chip Shot+",
      icon: "/art/playstyles-plus/chip-shot.webp",
      targets: [
        { attribute: "Ball Control", value: 92, target: 90 },
        { attribute: "Composure", value: 92, target: 92 },
        { attribute: "Reactions", value: 92, target: 90 },
      ],
      reachedAt: 55,
      note: null,
      reachedFrom: null,
    });
    // A target the build doesn't reach: no "Reached" line.
    const short = recorded({ attributes: [{ name: "Ball Control", value: 80 }, { name: "Composure", value: 92 }, { name: "Reactions", value: 92 }] });
    expect(specializationView(short)?.reachedAt).toBeNull();
    // An attribute the build doesn't list has no value.
    expect(specializationView(recorded({ attributes: [] }))?.targets[0]).toEqual({ attribute: "Ball Control", value: null, target: 90 });
    // The draft names a placeholder: shown as written, with nothing else.
    expect(specializationView(draft)).toEqual({ name: "PLACEHOLDER", plus: null, icon: null, targets: [], reachedAt: null, note: null, reachedFrom: null });
    expect(specializationView(recorded({ specialization: null }))).toBeNull();
  });

  it("turns the draft into its page with every value as written", () => {
    const view = buildPageView(draft, sources);
    expect(view).toMatchObject({
      id: "spark-2008-winger",
      title: "2008 Winger",
      draft: true,
      badge: null,
      archetype: { id: "spark", name: "Spark", groupLabel: "Forward" },
      versionTag: "FC 27 · Season 2 · Not yet checked in game",
      checked: false,
      olderSeason: null,
      credit: "Made by Chime in game",
      reference: null,
      uncheckedNote: null,
      picture: null,
      positions: ["RW", "LW"],
      body: "Level PLACEHOLDER · PLACEHOLDER cm · PLACEHOLDER kg",
      mastery: {
        note: "Mastery +2: levelling Spark adds +1 to Crossing and Dribbling at level 10 and +1 more by level 55, on every Spark build. Not included in the values below.",
        source: { label: "EA Pitch Notes", url: "https://www.ea.com/en/games/ea-sports-fc/fc-27/news/pitch-notes-fc27-the-grounds-deep-dive" },
      },
    });
    expect(view.facts).toEqual([
      { term: "Built at level", value: "PLACEHOLDER" },
      { term: "Height", value: "PLACEHOLDER cm" },
      { term: "Weight", value: "PLACEHOLDER kg" },
      { term: "AcceleRATE", value: "PLACEHOLDER" },
      { term: "Skill moves", value: "PLACEHOLDER", label: "PLACEHOLDER" },
      { term: "Weak foot", value: "PLACEHOLDER", label: "PLACEHOLDER" },
    ]);
    expect(view.playStylesPlus).toEqual([
      { name: "Trickster", icon: "/art/playstyles-plus/trickster.webp", signature: true },
      { name: "Rapid", icon: "/art/playstyles-plus/rapid.webp", signature: true },
      { name: "PLACEHOLDER", icon: null, signature: false },
    ]);
    expect(view.playStyles).toEqual([{ name: "PLACEHOLDER", icon: null }]);
    expect(view.keyStats.map((s) => s.code)).toEqual(["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"]);
  });

  it("words a recorded Meta pick as the design does", () => {
    const view = buildPageView(recorded({ badge: "meta" }), sources);
    expect(view.badge).toBe("Meta pick");
    expect(view.credit).toBe("Made by Chime in game · Played for one match before it's called meta");
    expect(view.facts.slice(0, 4)).toEqual([
      { term: "Built at level", value: "55" },
      { term: "Height", value: "6'1\" · 185 cm" },
      { term: "Weight", value: "176 lb · 80 kg" },
      { term: "AcceleRATE", value: "Controlled" },
    ]);
    expect(view.facts[4]).toEqual({ term: "Skill moves", value: "★★★★", label: "4 stars", stars: 4 });
    expect(view.playStyles).toEqual([
      { name: "Finesse Shot", icon: "/art/playstyles/finesse-shot.webp" },
      { name: "Power Shot", icon: "/art/playstyles/power-shot.webp" },
    ]);
  });

  it("leaves out AcceleRATE when the file has none", () => {
    const view = buildPageView(recorded({ body: { heightCm: 185, weightKg: 80, accelerate: null } }), sources);
    expect(view.facts.map((f) => f.term)).not.toContain("AcceleRATE");
  });

  it("credits a build read from a streamer's video and says it isn't checked yet (D-66)", () => {
    const view = buildPageView(
      recorded({ credits: [{ role: "reference", name: "Leski", url: "https://www.youtube.com/watch?v=x", creatorId: null, creator: null }] }),
      sources,
    );
    expect(view.credit).toBeNull();
    expect(view.reference).toEqual({ name: "Leski", url: "https://www.youtube.com/watch?v=x" });
    expect(view.uncheckedNote).toBe(
      "Not yet checked in game: we read this build from the creator's video. It becomes a Meta pick only after Chime or Sharon makes it and plays a match with it.",
    );
    const checked = buildPageView(
      recorded({
        versionTag: { ...draft.versionTag, verifiedOn: "2026-11-19" },
        credits: [{ role: "reference", name: "Leski", url: "https://www.youtube.com/watch?v=x", creatorId: null, creator: null }],
      }),
      sources,
    );
    expect(checked.uncheckedNote).toBeNull();
  });

  it("warns on a build from an older season (D-05)", () => {
    const view = buildPageView(recorded({ versionTag: { ...draft.versionTag, season: 2, verifiedOn: "2026-11-19" } }), sources, 3);
    expect(view.versionTag).toBe("FC 27 · Season 2 · verified 19 Nov 2026");
    expect(view.olderSeason).toBe("Made for Season 2. Values may have changed since.");
  });
});
