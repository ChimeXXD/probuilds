import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { archetypeViews, GROUPS, groupViews, playStyleIcon, sinceLabel } from "@/lib/builds";
import type { ArchetypeFile } from "@/lib/content/types";

// The Builds page's rules (Figma Builds 241:556 / 279:1399 / 276:1073, D-57, D-60), read from the real archetype file.
const file = JSON.parse(readFileSync(join(process.cwd(), "content", "archetypes", "fc27.json"), "utf8")) as ArchetypeFile;
const views = archetypeViews(file);
const finisher = views.find((v) => v.id === "finisher");

describe("builds page data", () => {
  it("names the four groups as the game does, in the rail's order", () => {
    expect(GROUPS.map((g) => g.label)).toEqual(["Keeper", "Defender", "Midfielder", "Forward"]);
    expect(groupViews(views).map((g) => [g.label, g.items.length])).toEqual([
      ["Keeper", 2],
      ["Defender", 3],
      ["Midfielder", 4],
      ["Forward", 4],
    ]);
  });

  it("numbers all 13 archetypes in rail order", () => {
    expect(views).toHaveLength(13);
    expect(views.map((v) => v.place)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(finisher).toMatchObject({ place: 12, total: 13, groupLabel: "Forward", name: "Finisher" });
  });

  it("words the Finisher's facts as the design does", () => {
    expect(finisher?.signature).toEqual([
      { name: "Low Driven Shot", since: "Since launch", icon: "/art/playstyles/low-driven-shot.webp" },
      { name: "First Touch", since: "Since Season 2", icon: "/art/playstyles/first-touch.webp" },
    ]);
    expect(finisher?.checked).toBe(false);
    // The sources of what the page shows: the signatures and the specializations (D-121 (3)).
    expect(finisher?.sources.map((s) => s.label)).toEqual([
      "Dexerto",
      "Pro Clubs HQ",
      "Chime, in game",
    ]);
    expect(finisher?.sources[0]?.url).toBe("https://www.dexerto.com/wikis/ea-fc-27/all-archetypes-explained/");
  });

  it("gives each archetype its specializations, each with its PlayStyle+ badge and the targets it needs (D-121 (3))", () => {
    expect(finisher?.specializations).toEqual([
      {
        name: "Finisher+",
        plus: { name: "Chip Shot", icon: "/art/playstyles-plus/chip-shot.webp" },
        targets: [
          { attribute: "Ball Control", value: 90 },
          { attribute: "Composure", value: 92 },
          { attribute: "Reactions", value: 90 },
        ],
      },
      {
        name: "Presser",
        plus: { name: "Relentless", icon: "/art/playstyles-plus/relentless.webp" },
        targets: [
          { attribute: "Agility", value: 90 },
          { attribute: "Stamina", value: 92 },
          { attribute: "Aggression", value: 90 },
        ],
      },
      {
        name: "Hunter",
        plus: { name: "Gamechanger", icon: "/art/playstyles-plus/gamechanger.webp" },
        targets: [
          { attribute: "Balance", value: 90 },
          { attribute: "Finishing", value: 90 },
          { attribute: "Curve", value: 92 },
        ],
      },
    ]);
    expect(views.every((v) => v.specializations.length === 3)).toBe(true);
  });

  it("leaves out specializations the file doesn't have yet, and targets nobody has read", () => {
    const bare: ArchetypeFile = {
      ...file,
      archetypes: file.archetypes.map((a) =>
        a.id === "spark" ? { ...a, specializations: null } : a.id === "magician" ? { ...a, specializations: [{ name: "Hotshot", playStyle: "Power Shot", targets: null, sourceIds: ["chime-in-game-20261125"] }] } : a,
      ),
    };
    const bareViews = archetypeViews(bare);
    expect(bareViews.find((v) => v.id === "spark")?.specializations).toEqual([]);
    expect(bareViews.find((v) => v.id === "magician")?.specializations[0]?.targets).toEqual([]);
  });

  it("gives every archetype its own stance and pattern", () => {
    for (const v of views) {
      expect(v.stance.src).toBe(`/art/stances/${v.id}.webp`);
      expect(v.pattern).toBe(`/art/stances/${v.id}-pattern.webp`);
    }
  });

  it("words when a PlayStyle arrived and names its badge file", () => {
    expect(sinceLabel("launch")).toBe("Since launch");
    expect(sinceLabel("season-3")).toBe("Since Season 3");
    expect(playStyleIcon("1v1 Close Down")).toBe("/art/playstyles/1v1-close-down.webp");
  });
});
