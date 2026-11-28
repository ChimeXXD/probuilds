import { describe, expect, it } from "vitest";
import { validateFace, type Context } from "@/lib/content/validate";
import faceGood from "../fixtures/face-good.json";

// Figma's sample faces (D-107, D-108): a draft with `"sample": { "place": n }` (its place in Figma's library) may show
// Figma's stand-in picture, kept under sample/faces/. Never a published face, and never a face that isn't a sample
// (FORMAT §Face recipe).
const ctx: Context = {
  archetypeIds: new Set(["spark"]),
  creatorIds: new Set(["test-creator"]),
  buildIds: new Set(["test-spark-build"]),
  faceIds: new Set(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function changed<T>(fixture: T, change: (copy: any) => void): T {
  const copy = structuredClone(fixture);
  change(copy);
  return copy;
}
const problems = (data: unknown) => validateFace("faces/x.json", data, ctx).map((p) => [p.path, p.message]);
const STAND_IN = { file: "sample/faces/test-footballer-2010.webp", alt: "Stand-in picture", by: "Test Channel" };

/** The good fixture as a draft sample face showing a stand-in picture. */
const sampled = (change: (copy: any) => void = () => {}) => // eslint-disable-line @typescript-eslint/no-explicit-any
  changed(faceGood, (f) => {
    f.status = "draft";
    f.sample = { place: 1 };
    f.screenshots = [{ ...STAND_IN }];
    change(f);
  });

describe("validateFace sample faces (D-107, D-108)", () => {
  it("passes a draft sample face whose picture is a stand-in under sample/faces/", () => {
    expect(problems(sampled())).toEqual([]);
  });

  it("still passes a sample face's own captures under faces/", () => {
    expect(problems(sampled((f) => (f.screenshots = faceGood.screenshots)))).toEqual([]);
  });

  it("fails a published face marked as a sample", () => {
    expect(problems(sampled((f) => (f.status = "published")))).toContainEqual(["sample", "published but is still a sample (D-107)"]);
  });

  it("fails a sample that isn't an object with a place from 1", () => {
    for (const value of [true, "yes", 1, null]) {
      expect(problems(sampled((f) => (f.sample = value)))).toContainEqual(["sample", "must be an object"]);
    }
    for (const place of [0, 1.5, "1", null]) {
      expect(problems(sampled((f) => (f.sample.place = place))).map(([path]) => path)).toEqual(["sample.place"]);
    }
  });

  it("fails a stand-in picture on a face that isn't a sample", () => {
    const bad = changed(faceGood, (f) => {
      f.status = "draft";
      f.screenshots = [{ ...STAND_IN }];
    });
    expect(problems(bad)).toEqual([["screenshots[0].file", 'must be a file under "faces/"']]);
  });

  it("keeps the folder rule for a sample: no other folder, no climbing out", () => {
    for (const file of ["builds/x.webp", "sample/faces/../../x.webp", "sample/x.webp"]) {
      expect(problems(sampled((f) => (f.screenshots[0].file = file)))).toEqual([
        ["screenshots[0].file", 'must be a file under "faces/" or "sample/faces/"'],
      ]);
    }
  });
});

// Creators' turn frames (D-123): a sample face may turn with frames cut from a creator's FC 27 tutorial, kept under
// sample/faces/ beside its picture. Each names the video it came from, which the face page credits and links (rule 5).
// Chime's own clips stay under faces/ and need no video.
describe("validateFace creators' turn frames (D-123)", () => {
  const SOURCE = { url: "https://www.youtube.com/watch?v=abc123", title: "How to Make a Test Face in EA FC 27", channel: "Test Channel" };
  const STAND_IN_TURN = { folder: "sample/faces/test-footballer-2010/turn", frames: 36, by: "Test Channel", source: { ...SOURCE } };
  const turning = (change: (turn: any) => void = () => {}) => // eslint-disable-line @typescript-eslint/no-explicit-any
    sampled((f) => {
      f.turn = structuredClone(STAND_IN_TURN);
      change(f.turn);
    });

  it("passes a sample face turning with a creator's frames under sample/faces/, with the video they came from", () => {
    expect(problems(turning())).toEqual([]);
  });

  it("still passes Chime's own turn under faces/ with no video, on a sample or not", () => {
    const own = { folder: "faces/test-footballer-2010/turn", frames: 36, by: "Chime" };
    expect(problems(sampled((f) => (f.turn = { ...own })))).toEqual([]);
    expect(problems(changed(faceGood, (f) => (f.turn = { ...own, source: null })))).toEqual([]);
  });

  it("fails a video named on Chime's own turn under faces/", () => {
    const own = { folder: "faces/test-footballer-2010/turn", frames: 36, by: "Test Channel", source: { ...SOURCE } };
    expect(problems(sampled((f) => (f.turn = own)))).toEqual([["turn.source", 'only a creator\'s turn under "sample/faces/" names a video (D-123)']]);
  });

  it("fails a creator's frames on a face that isn't a sample", () => {
    const bad = changed(faceGood, (f) => {
      f.status = "draft";
      f.turn = structuredClone(STAND_IN_TURN);
    });
    expect(problems(bad)).toEqual([["turn.folder", 'must be a folder under "faces/"']]);
  });

  it("keeps the folder rule for a sample's turn: no other folder, no climbing out", () => {
    for (const folder of ["builds/x/turn", "sample/faces/../../x", "sample/x/turn"]) {
      expect(problems(turning((t) => (t.folder = folder)))).toEqual([["turn.folder", 'must be a folder under "faces/" or "sample/faces/"']]);
    }
  });

  it("fails a creator's frames from another face's folder: no face turns with someone else's head", () => {
    expect(problems(turning((t) => (t.folder = "sample/faces/donald-trump/turn")))).toEqual([
      ["turn.folder", 'must be a folder under "sample/faces/test-footballer-2010/"'],
    ]);
  });

  it("fails a creator's frames with no video to credit", () => {
    for (const source of [undefined, null, "https://www.youtube.com/watch?v=abc123"]) {
      expect(problems(turning((t) => (t.source = source)))).toEqual([["turn.source", "must be an object"]]);
    }
  });

  it("checks the video: a web link, its title, its channel, and the frames credited to that channel", () => {
    expect(problems(turning((t) => (t.source.url = "youtube.com/watch?v=abc123")))).toEqual([["turn.source.url", "must be a web link starting with https://"]]);
    expect(problems(turning((t) => (t.source.title = "")))).toEqual([["turn.source.title", "must be text"]]);
    expect(problems(turning((t) => (t.source.channel = 3))).map(([path]) => path)).toContain("turn.source.channel");
    expect(problems(turning((t) => (t.by = "Chime")))).toEqual([["turn.by", 'must be the video\'s channel, "Test Channel" (D-123)']]);
  });
});
