import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/load";
import { infosFor, playStyleNamesUsed, validatePlayStylesFile } from "@/lib/content/playstyles";
import { validateAll } from "@/lib/content/validate";
import { PLAYSTYLE_CATEGORIES } from "@/lib/submit/editor";

// content/playstyles.json (FORMAT §PlayStyles, D-121 (4)): what each PlayStyle and PlayStyle+ does, in EA's own
// words, each with the EA page it was read from; null where EA's wording wasn't found ("to check in game").
const SOURCE = { id: "ea-what-are-playstyles", title: "PlayStyles: Everything You Need to Know", url: "https://www.ea.com/x", accessed: "2026-11-28" };
const good = () => ({
  schemaVersion: 1,
  game: "fc27",
  updated: "2026-11-28",
  note: "EA's own words.",
  sources: [SOURCE],
  playStyles: [
    {
      name: "Chip Shot",
      playStyle: { text: "Performs chip shots faster and with greater accuracy.", sourceId: "ea-what-are-playstyles" },
      plus: { text: "Performs chip shots more quickly with exceptional accuracy.", sourceId: "ea-what-are-playstyles" },
      notes: null,
    },
    { name: "Long Throw", playStyle: null, plus: null, notes: "Not found on an EA page yet." },
  ],
});
const messages = (data: unknown) => validatePlayStylesFile("playstyles.json", data).map((p) => `${p.path}: ${p.message}`);

describe("validatePlayStylesFile", () => {
  it("passes a file with EA wording and with entries still to check in game (null)", () => {
    expect(messages(good())).toEqual([]);
  });

  it("fails a description without text or with a source the file doesn't list", () => {
    const bad = good();
    bad.playStyles[0]!.playStyle = { text: " ", sourceId: "ea-what-are-playstyles" };
    bad.playStyles[0]!.plus = { text: "Faster.", sourceId: "fut-gg" };
    expect(messages(bad)).toEqual(["playStyles[0].playStyle.text: must be text", 'playStyles[0].plus.sourceId: unknown source "fut-gg"']);
  });

  it("fails a name used twice, a source that isn't a web link and a wrong game", () => {
    const bad = { ...good(), game: "fc26" };
    bad.playStyles[1]!.name = "Chip Shot";
    bad.sources[0] = { ...SOURCE, url: "javascript:alert(1)" };
    expect(messages(bad)).toEqual([
      'game: must be one of fc27, got "fc26"',
      "sources[0].url: must be a web link starting with https://",
      "playStyles[1].name: is used twice",
    ]);
  });

  it("fails a source that isn't an EA page and a source id used twice", () => {
    const bad = good();
    bad.sources.push({ ...SOURCE, url: "https://www.fut.gg/playstyles" });
    expect(messages(bad)).toEqual([
      "sources[1].url: must be an EA page (ea.com), never another site (rule 9)",
      "sources[1].id: is used twice",
    ]);
  });

  it("fails a description that is neither an object nor null", () => {
    const bad = good() as unknown as { playStyles: { playStyle: unknown }[] };
    bad.playStyles[0]!.playStyle = "Performs chip shots faster.";
    expect(messages(bad)).toEqual(["playStyles[0].playStyle: must be an object or null"]);
  });
});

describe("PlayStyle names across content", () => {
  it("with playstyles.json present, an archetype naming a PlayStyle it doesn't describe fails the build", () => {
    const archetypes = loadContent(join(process.cwd(), "content")).archetypeFile;
    const problems = validateAll([
      { path: "archetypes/fc27.json", data: archetypes },
      { path: "playstyles.json", data: good() },
    ]);
    expect(problems.some((p) => p.file === "playstyles.json" && /"Far Reach" is used .* but has no entry/.test(p.message))).toBe(true);
  });

  it("the site's file describes every PlayStyle the site shows: signatures, specializations, builds and Submit's list", () => {
    const content = loadContent(join(process.cwd(), "content"), { includeDrafts: true });
    const names = new Set(content.playStyles.map((p) => p.name));
    const used = [
      ...playStyleNamesUsed(content.archetypeFile, content.builds),
      ...PLAYSTYLE_CATEGORIES.flatMap((c) => c.playStyles),
    ];
    expect(used.filter((n) => !names.has(n))).toEqual([]);
    // Every entry found has EA's text with an ea.com source; none is left to check in game today (28 Nov).
    for (const p of content.playStyles) {
      for (const d of [p.playStyle, p.plus]) {
        expect(d?.source.url).toMatch(/^https:\/\/www\.ea\.com\//);
      }
    }
  });
});

describe("infosFor", () => {
  const all = loadContent(join(process.cwd(), "content")).playStyles;

  it("keeps only the PlayStyles a page shows, and only the tiers it shows them in, so a page carries what it needs", () => {
    const picked = infosFor(all, [
      { name: "Chip Shot", tier: "plus" },
      { name: "Rapid", tier: "playStyle" },
      { name: "Chip Shot", tier: "plus" },
    ]);
    expect(picked.map((p) => p.name)).toEqual(["Chip Shot", "Rapid"]);
    expect(picked[0]?.plus?.text).toBe("Performs chip shots more quickly with exceptional accuracy.");
    expect(picked[0]?.playStyle).toBeNull();
    expect(picked[1]?.playStyle?.text).toMatch(/^Reaches a higher sprint speed while dribbling/);
    expect(picked[1]?.plus).toBeNull();
  });

  it("keeps both tiers when a page shows both, and skips names with no entry (a placeholder)", () => {
    const picked = infosFor(all, [
      { name: "Rapid", tier: "playStyle" },
      { name: "Rapid", tier: "plus" },
      { name: "PLACEHOLDER", tier: "playStyle" },
    ]);
    expect(picked).toHaveLength(1);
    expect(picked[0]?.playStyle).not.toBeNull();
    expect(picked[0]?.plus).not.toBeNull();
  });
});
