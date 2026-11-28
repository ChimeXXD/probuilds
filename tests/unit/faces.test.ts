import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent, type LoadedFace } from "@/lib/content/load";
import {
  FACE_FILTERS,
  faceCards,
  faceCardView,
  type FaceCardView,
  filterCounts,
  matchesSearch,
  REQUEST_FACE_HREF,
  visibleFaces,
} from "@/lib/faces";

// The Faces library's rules (`/faces`, Figma 333:1139 / 345:1310 / 345:1391; D-68, D-69, D-70, D-97 (5)), read from
// the real content with drafts on, as the preview builds it. Today the faces are Figma's five sample faces (D-107,
// D-108), drafts whose pictures are Figma's stand-ins under public/sample/faces/.
const content = loadContent(join(process.cwd(), "content"), { includeDrafts: true });
const draft = content.faces.find((f) => f.id === "cristiano-ronaldo-2008") as LoadedFace;
const none = () => false;
const inPublic = (file: string) => existsSync(join(process.cwd(), "public", file));
/** A copy of a face that isn't one of Figma's samples. */
const withoutSample = (face: LoadedFace): LoadedFace => {
  const copy = { ...face };
  delete copy.sample;
  return copy;
};

/** Test cards, one per kind plus a second footballer (layout data, not content). */
const card = (over: Partial<FaceCardView>): FaceCardView => ({
  id: "x",
  href: "/faces/x",
  title: "X",
  name: "X",
  kind: "footballer",
  kindLabel: "Footballer",
  draft: false,
  sample: false,
  picture: null,
  ...over,
});
const cards = [
  card({ id: "ronaldo", title: "2008 Ronaldo", name: "Cristiano Ronaldo" }),
  card({ id: "yamal", title: "Lamine Yamal", name: "Lamine Yamal" }),
  card({ id: "lebron", title: "LeBron James", name: "LeBron James", kind: "athlete", kindLabel: "Athlete" }),
  card({ id: "mj", title: "Michael Jackson", name: "Michael Jackson", kind: "musician", kindLabel: "Musician" }),
  card({ id: "mbappe", title: "Kylian Mbappé", name: "Kylian Mbappé" }),
];
const ids = (list: FaceCardView[]) => list.map((c) => c.id);

describe("faces library data", () => {
  it("has the four filters in the design's order: All, Footballers, Athletes, Musicians (D-68)", () => {
    expect(FACE_FILTERS.map((f) => f.label)).toEqual(["All", "Footballers", "Athletes", "Musicians"]);
    expect(FACE_FILTERS.map((f) => f.value)).toEqual(["all", "footballer", "athlete", "musician"]);
  });

  it("words a face for its card: plain title as written, the kind, its page, draft and sample marked (D-69, D-107)", () => {
    expect(faceCardView(draft, inPublic)).toEqual({
      id: "cristiano-ronaldo-2008",
      href: "/faces/cristiano-ronaldo-2008",
      title: "2008 Ronaldo",
      name: "Cristiano Ronaldo",
      kind: "footballer",
      kindLabel: "Footballer",
      draft: true,
      sample: true,
      picture: { src: "/sample/faces/cristiano-ronaldo-2008.webp", alt: "Stand-in from Xaiiros's YouTube tutorial: 2008 Ronaldo, front view" },
    });
    expect(faceCardView(withoutSample(draft), inPublic).sample).toBe(false);
  });

  it("lists Figma's sample faces as the library draws them: titles, kinds, order, each with its picture (D-107, D-108)", () => {
    const list = faceCards(content.faces, inPublic);
    expect(list.map((c) => [c.title, c.kindLabel])).toEqual([
      ["2008 Ronaldo", "Footballer"],
      ["Neymar Jr (Mohawk)", "Footballer"],
      ["Lamine Yamal", "Footballer"],
      ["LeBron James", "Athlete"],
      ["Michael Jackson", "Musician"],
    ]);
    expect(list.every((c) => c.sample && c.draft && c.picture?.src.startsWith("/sample/faces/"))).toBe(true);
    expect(filterCounts(list, "")).toEqual({ all: 5, footballer: 3, athlete: 1, musician: 1 });
  });

  it("puts samples first by their place, then other faces in the content's order", () => {
    const at = (id: string, place?: number): LoadedFace => ({ ...withoutSample(draft), id, slug: id, ...(place ? { sample: { place } } : {}) });
    const list = faceCards([at("a"), at("b", 2), at("c"), at("d", 1)], none);
    expect(ids(list)).toEqual(["d", "b", "a", "c"]);
  });

  it("shows the first screenshot only when its file is in the repo; otherwise the empty slot (D-10)", () => {
    const withShot: LoadedFace = {
      ...draft,
      screenshots: [
        { file: "faces/cristiano-ronaldo-2008-1.webp", alt: "Chime's Pro in FC 27, front view", by: "Chime" },
        { file: "faces/cristiano-ronaldo-2008-2.webp", alt: "Side view", by: "Chime" },
      ],
    };
    const seen: string[] = [];
    const exists = (file: string) => (seen.push(file), true);
    expect(faceCardView(withShot, exists).picture).toEqual({
      src: "/faces/cristiano-ronaldo-2008-1.webp",
      alt: "Chime's Pro in FC 27, front view",
    });
    expect(seen).toEqual(["faces/cristiano-ronaldo-2008-1.webp"]);
    expect(faceCardView(withShot, none).picture).toBeNull();
    expect(faceCardView({ ...draft, screenshots: [] }, () => true).picture).toBeNull();
  });

  it("searches by title or name, ignoring case, accents and extra spaces", () => {
    const ronaldo = cards[0] as FaceCardView;
    const mbappe = cards[4] as FaceCardView;
    expect(matchesSearch(ronaldo, "")).toBe(true);
    expect(matchesSearch(ronaldo, "   ")).toBe(true);
    expect(matchesSearch(ronaldo, "ronaldo")).toBe(true);
    expect(matchesSearch(ronaldo, "CRISTIANO")).toBe(true);
    expect(matchesSearch(ronaldo, "2008")).toBe(true);
    expect(matchesSearch(ronaldo, "  2008   ronaldo ")).toBe(true);
    expect(matchesSearch(ronaldo, "ronaldo 2006")).toBe(false);
    expect(matchesSearch(ronaldo, "Zidane")).toBe(false);
    expect(matchesSearch(mbappe, "mbappe")).toBe(true);
    expect(matchesSearch(mbappe, "MBAPPÉ")).toBe(true);
  });

  it("counts each chip over the faces the search leaves (every chip at 0 for a name we lack)", () => {
    expect(filterCounts(cards, "")).toEqual({ all: 5, footballer: 3, athlete: 1, musician: 1 });
    expect(filterCounts(cards, "james")).toEqual({ all: 1, footballer: 0, athlete: 1, musician: 0 });
    expect(filterCounts(cards, "Zidane")).toEqual({ all: 0, footballer: 0, athlete: 0, musician: 0 });
    expect(filterCounts([], "")).toEqual({ all: 0, footballer: 0, athlete: 0, musician: 0 });
  });

  it("shows the faces of the chosen kind that match the search, in the content's order", () => {
    expect(ids(visibleFaces(cards, "all", ""))).toEqual(["ronaldo", "yamal", "lebron", "mj", "mbappe"]);
    expect(ids(visibleFaces(cards, "footballer", ""))).toEqual(["ronaldo", "yamal", "mbappe"]);
    expect(ids(visibleFaces(cards, "athlete", ""))).toEqual(["lebron"]);
    expect(ids(visibleFaces(cards, "musician", "jackson"))).toEqual(["mj"]);
    expect(ids(visibleFaces(cards, "musician", "ronaldo"))).toEqual([]);
    expect(ids(visibleFaces(cards, "all", "Zidane"))).toEqual([]);
  });

  it("sends Missing a face and Request a face to Submit's Request tab (D-121 (5))", () => {
    expect(REQUEST_FACE_HREF).toBe("/submit/request");
  });
});
