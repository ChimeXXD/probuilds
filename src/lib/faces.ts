// The Faces library's rules (`/faces`, Figma 333:1139 / 345:1310 / 345:1391; D-68, D-69, D-70, D-97 (5)): one card per
// face with its kind and plain title, chips by kind with counts, and a search by name. The chips count what the
// search leaves, so a name we don't have puts every chip at 0 (Figma 372:1853).
import type { LoadedFace } from "./content/load.ts";
import type { SubjectKind } from "./content/types.ts";

/** Footballers, Athletes, Musicians (D-68). */
export type FaceKind = SubjectKind;
export type FaceFilter = "all" | FaceKind;

export const KIND_LABEL = { footballer: "Footballer", athlete: "Athlete", musician: "Musician" } as const satisfies Record<FaceKind, string>;

export const FACE_FILTERS: readonly { value: FaceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "footballer", label: "Footballers" },
  { value: "athlete", label: "Athletes" },
  { value: "musician", label: "Musicians" },
];

// Request a face is Submit's second tab (D-121 (5)); the dashed "Missing a face?" tile at the end of the grid (D-70)
// and the request panel both open it. /faces/request redirects there (public/_redirects). The page waits on Supabase
// (D-84, D-96): preview only for now.
export const REQUEST_FACE_HREF = "/submit/request";

export interface FaceCardView {
  id: string;
  /** The face page, /faces/<slug>. */
  href: string;
  /** The plain title as the file writes it (D-69). */
  title: string;
  /** The subject's name, searched with the title but not shown. */
  name: string;
  kind: FaceKind;
  kindLabel: string;
  draft: boolean;
  /** One of Figma's sample faces (D-107): the demo note marks it, so its card carries no Draft tag. */
  sample: boolean;
  /** Chime's own in-game capture (D-10), a sample's stand-in (D-108), or null for the empty slot. */
  picture: { src: string; alt: string } | null;
}

/**
 * One face, worded for its card. The picture is the face's first screenshot, and only when `pictureExists` finds its
 * file (under public/): a missing file shows the empty slot rather than a broken image.
 */
export function faceCardView(face: LoadedFace, pictureExists: (file: string) => boolean): FaceCardView {
  const shot = face.screenshots[0];
  return {
    id: face.id,
    href: `/faces/${face.slug}`,
    title: face.title,
    name: face.subject.name,
    kind: face.subject.kind,
    kindLabel: KIND_LABEL[face.subject.kind],
    draft: face.status === "draft",
    sample: face.sample !== undefined,
    picture: shot && pictureExists(shot.file) ? { src: `/${shot.file}`, alt: shot.alt } : null,
  };
}

/** The library's cards: Figma's sample faces first, in the places it draws them, then the others in content order. */
export function faceCards(faces: LoadedFace[], pictureExists: (file: string) => boolean): FaceCardView[] {
  const place = (f: LoadedFace) => f.sample?.place ?? Infinity;
  // Array sort is stable, so faces of equal place (all the non-samples) keep the content's order.
  const byPlace = (a: LoadedFace, b: LoadedFace) => (place(a) === place(b) ? 0 : place(a) < place(b) ? -1 : 1);
  return [...faces].sort(byPlace).map((f) => faceCardView(f, pictureExists));
}

/** Lower case, accents dropped ("Mbappé" finds "mbappe"). */
export const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** The words typed, folded; blank words dropped. */
export const searchWords = (query: string) => fold(query).split(/\s+/).filter(Boolean);

/** True when every word typed is in the face's title or name. An empty search matches everything. */
export function matchesSearch(card: FaceCardView, query: string): boolean {
  const haystack = fold(`${card.title} ${card.name}`);
  return searchWords(query).every((word) => haystack.includes(word));
}

/** Each chip's count: the faces of that kind the search leaves. */
export function filterCounts(cards: FaceCardView[], query: string): Record<FaceFilter, number> {
  const counts: Record<FaceFilter, number> = { all: 0, footballer: 0, athlete: 0, musician: 0 };
  for (const card of cards) {
    if (!matchesSearch(card, query)) continue;
    counts.all += 1;
    counts[card.kind] += 1;
  }
  return counts;
}

/** The cards to show: the chosen kind (or all) that match the search, in the content's order. */
export function visibleFaces(cards: FaceCardView[], filter: FaceFilter, query: string): FaceCardView[] {
  return cards.filter((c) => (filter === "all" || c.kind === filter) && matchesSearch(c, query));
}
