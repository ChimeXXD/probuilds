import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/load";
import { homeView, SAMPLE_BUILDS_NOTE } from "@/lib/home";

// Home's rules (Figma 364:2118 / 367:1629 / 367:1836; D-75 to D-78), read from the real content with drafts on, as
// the preview builds it: Figma's sample faces, its sample build and the changelog's draft entries (D-107).
const preview = loadContent(join(process.cwd(), "content"), { includeDrafts: true });
const live = loadContent(join(process.cwd(), "content"));
const always = () => true;

describe("homeView", () => {
  const view = homeView(preview, always);

  it("is null on the live site, where no published face can be the face of the week yet", () => {
    expect(homeView(live, always)).toBeNull();
  });

  it("shows four faces in the library's order, leaving out the face of the week (D-77)", () => {
    expect(view?.faces.map((f) => f.title)).toEqual(["2008 Ronaldo", "Lamine Yamal", "LeBron James", "Michael Jackson"]);
  });

  it("features Figma's face of the week with its kind and step count", () => {
    expect(view?.week).toMatchObject({
      href: "/faces/neymar-jr-mohawk",
      title: "Neymar Jr (Mohawk)",
      line: "Footballer · 18 steps",
      picture: { src: "/sample/faces/neymar-jr-mohawk.webp" },
    });
  });

  it("shows one meta build per line of the team: the recorded Meta Finisher, then Maestro and Boss from their archetypes (D-75 (4))", () => {
    expect(view?.builds.map((b) => [b.title, b.tag, b.line, b.href])).toEqual([
      ["Meta Finisher", "Meta pick", "Level 55 · 185 cm · 80 kg", "/builds/finisher/meta-finisher"],
      // Maestro's only build is Leski's untitled draft: Home shows only a Meta pick or Recommended build, else the
      // archetype (D-124), so the line keeps its archetype card.
      ["Meta Maestro", "Meta pick", "Midfielder · not recorded yet", "/builds/maestro"],
      ["Meta Boss", "Meta pick", "Defender · not recorded yet", "/builds/boss"],
    ]);
    expect(view?.builds[0]?.keyStats.map((s) => s.value)).toEqual(["88", "80", "58", "84", "38", "66"]);
    expect(view?.builds[1]?.keyStats.every((s) => s.value === "—")).toBe(true);
    expect(view?.builds[1]?.playStylesPlus.map((p) => p.name)).toEqual(["Pinged Pass", "Long Ball Pass"]);
    expect(view?.builds[2]?.playStylesPlus.map((p) => p.name)).toEqual(["Bruiser", "Aerial Fortress"]);
    expect(view?.sampleNote).toBe(SAMPLE_BUILDS_NOTE);
  });

  it("lists the three latest changes, newest first, as date · kind and title", () => {
    expect(view?.changes).toEqual([
      { id: "2026-11-10-title-update-1-2-0", line: "10 Nov 2026 · Title update", title: "Title Update 1.2.0" },
      { id: "2026-10-22-archetype-update", line: "22 Oct 2026 · Archetype update", title: "Archetype costs re-priced, every build reset" },
      { id: "2026-09-25-launch", line: "25 Sep 2026 · Season", title: "FC 27 launches; Clubs moves into The Grounds" },
    ]);
  });
});
