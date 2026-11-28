import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent, type LoadedFace } from "@/lib/content/load";
import { facePageView } from "@/lib/face-view";
import { buildPreviewView } from "@/lib/build-preview";

// What the face page shows around the steps (Figma 353:1410 / 427:8649 / 427:8767 and 372:1984): kind, plain title,
// version tag (rule 4), credit line (rule 5), the sample note, the limits callout, the tutorial facade and the matching
// build card (D-79).
const content = loadContent(join(process.cwd(), "content"), { includeDrafts: true });
const fixtures = loadContent(join(import.meta.dirname, "fixtures", "content", "good"), { includeDrafts: true });
const face = (id: string) => content.faces.find((f) => f.id === id) as LoadedFace;
const always = () => true;

describe("facePageView", () => {
  it("words Figma's 2008 Ronaldo as drawn", () => {
    const view = facePageView(face("cristiano-ronaldo-2008"), always);
    expect(view).toMatchObject({
      title: "2008 Ronaldo",
      kindLabel: "Footballer",
      madeBy: "Made by Chime in game",
      tutorial: { label: "Tutorial by Xaiiros", url: "https://www.youtube.com/watch?v=SHmX5Z8BxFs" },
      sampleNote: "Sample recipe: values are placeholders until Chime records this face.",
      versionTag: "FC 27 · Season 2 · Not yet checked in game",
      checked: false,
      olderSeason: null,
      limits: ["The game can't do this exactly: the hairline sits a little higher than the real one."],
      embed: { videoId: "SHmX5Z8BxFs", title: "How to create CRISTIANO RONALDO in EA FC27", channelLine: "Xaiiros · Tap to play" },
      picture: { src: "/sample/faces/cristiano-ronaldo-2008.webp" },
      rotate: true,
      storage: { id: "cristiano-ronaldo-2008", version: 1 },
    });
  });

  it("gives every sample face its own tutorial and Figma's sample recipe", () => {
    for (const [id, title] of <[string, string][]>[
      ["neymar-jr-mohawk", "How to Make SANTOS NEYMAR JR in EA FC 27 (MOHAWK)"],
      ["lamine-yamal", "How to Make LAMINE YAMAL (New Look) in EA FC 27"],
      ["lebron-james", "How to Make LEBRON JAMES in EA FC 27"],
      ["michael-jackson", "How to Make MICHAEL JACKSON in EA FC 27"],
      ["zinedine-zidane", "How to Make ZINEDINE ZIDANE in EA FC 27"],
      ["michael-olise", "How to Make MICHAEL OLISE in EA FC 27"],
    ]) {
      const view = facePageView(face(id), always);
      expect(view.embed?.title).toBe(title);
      expect(view.tutorial?.label).toBe("Tutorial by CodeName Max");
      expect(view.recipe.total).toBe(18);
      // Figma's samples other than 2008 Ronaldo weren't made by anyone (faces-library-audit item 18): no maker line (D-115).
      expect(view.madeBy).toBeNull();
    }
  });

  it("leaves out the picture when its file is missing, and the sample note on a recorded face", () => {
    const view = facePageView(fixtures.faces.find((f) => f.id === "test-footballer-2010") as LoadedFace, () => false);
    expect(view.picture).toBeNull();
    expect(view.sampleNote).toBeNull();
    expect(view.rotate).toBe(false);
    expect(view.versionTag).toBe("FC 27 · Season 3 · verified 4 Dec 2026");
    expect(view.madeBy).toBe("Made by Chime in game");
    expect(view.limits).toEqual(["The game can't do this exactly: Test limit."]);
  });
});

// Creators' turn frames (D-123): five sample faces turn with frames cut from a creator's tutorial, each credited and
// linked as "360° turn from <channel>'s video" beside the other credits (rule 5).
describe("facePageView turntables (D-123)", () => {
  const video = (id: string) => `https://www.youtube.com/watch?v=${id}`;

  it("turns the five faces with frames, crediting each turn's own video", () => {
    for (const [id, channel, videoId] of <[string, string, string][]>[
      ["neymar-jr-mohawk", "CodeName Max", "UOrV95yMy50"],
      ["lebron-james", "JaxStash", "aJez-2ttA3I"],
      ["lamine-yamal", "CodeName Max", "IYBrT2yBauQ"],
      ["zinedine-zidane", "CodeName Max", "LlCyI-Fqpr0"],
      ["michael-olise", "CodeName Max", "s1KBQuNvRJc"],
    ]) {
      const view = facePageView(face(id), always);
      expect(view.turn).toEqual({ folder: `sample/faces/${id}/turn`, frames: 36 });
      expect(view.turnCredit).toEqual({ label: `360° turn from ${channel}'s video`, url: video(videoId) });
      expect(view.rotate).toBe(true);
    }
  });

  it("keeps LeBron's picture and tutorial CodeName Max's while his turn is JaxStash's, each credited for what it is", () => {
    const view = facePageView(face("lebron-james"), always);
    expect(view.picture?.src).toBe("/sample/faces/lebron-james.webp");
    expect(view.tutorial).toEqual({ label: "Tutorial by CodeName Max", url: video("eV2G-DOTAQI") });
    expect(view.turnCredit?.label).toBe("360° turn from JaxStash's video");
  });

  it("words the two new sample faces: Footballers, plain titles, frame 1 as the picture", () => {
    for (const [id, title] of <[string, string][]>[
      ["zinedine-zidane", "Zinedine Zidane"],
      ["michael-olise", "Michael Olise"],
    ]) {
      const view = facePageView(face(id), always);
      expect(view).toMatchObject({ title, kindLabel: "Footballer", madeBy: null, picture: { src: `/sample/faces/${id}.webp` } });
      expect(view.sampleNote).toBe("Sample recipe: values are placeholders until Chime records this face.");
    }
  });

  it("has no turn and no turn credit where there are no frames, or where the frames are missing", () => {
    for (const id of ["cristiano-ronaldo-2008", "michael-jackson"]) {
      expect(facePageView(face(id), always)).toMatchObject({ turn: null, turnCredit: null });
    }
    const missing = facePageView(face("neymar-jr-mohawk"), (file) => !file.includes("/turn/"));
    expect(missing).toMatchObject({ turn: null, turnCredit: null, picture: { src: "/sample/faces/neymar-jr-mohawk.webp" } });
    const noPicture = facePageView(face("neymar-jr-mohawk"), (file) => file.includes("/turn/"));
    expect(noPicture).toMatchObject({ picture: null, turn: null, turnCredit: null });
  });

  it("credits no video for Chime's own turn: the maker line already says who made it", () => {
    const own = { ...face("cristiano-ronaldo-2008"), turn: { folder: "faces/cristiano-ronaldo-2008/turn", frames: 36, by: "Chime" } };
    expect(facePageView(own, always)).toMatchObject({ turn: { folder: "faces/cristiano-ronaldo-2008/turn", frames: 36 }, turnCredit: null });
  });
});

describe("buildPreviewView, the matching build (D-79)", () => {
  const spark = content.builds.find((b) => b.id === "spark-2008-winger");
  const finisher = content.builds.find((b) => b.id === "meta-finisher");

  it("shows an unrecorded build as Figma 374:2045 draws it: archetype, not recorded yet, dashes, signature PlayStyles+", () => {
    if (!spark) throw new Error("spark-2008-winger missing");
    expect(buildPreviewView(spark, { sample: true })).toMatchObject({
      href: "/builds/spark/spark-2008-winger",
      // Figma draws "2008 WINGER"; the card shows the build file's own title (lane A owns content/builds).
      title: spark.title,
      positions: ["RW", "LW"],
      line: "Spark · not recorded yet",
      keyStats: ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"].map((code) => ({ code, value: "—" })),
      playStylesPlus: [
        { name: "Trickster", icon: "/art/playstyles-plus/trickster.webp" },
        { name: "Rapid", icon: "/art/playstyles-plus/rapid.webp" },
      ],
      versionTag: null,
      credit: null,
    });
  });

  it("shows a recorded build's level, height and weight and Figma's sample key stats", () => {
    if (!finisher) throw new Error("meta-finisher missing");
    const view = buildPreviewView(finisher, { sample: true });
    expect(view.line).toBe("Level 55 · 185 cm · 80 kg");
    expect(view.keyStats.map((s) => s.value)).toEqual(["88", "80", "58", "84", "38", "66"]);
  });

  it("adds the version tag and credit on a real face's page (rules 4, 5)", () => {
    if (!finisher) throw new Error("meta-finisher missing");
    const view = buildPreviewView(finisher, { sample: false });
    expect(view.versionTag).toBe("FC 27 · Season 2 · Not yet checked in game");
    // The sample build's maker is Figma's "— (sample)", which is left out (D-115); a real build names its maker.
    expect(view.credit).toBeNull();
  });
});
