// Search (`/search`, Figma 376:2282 / 376:2393 / 376:2491; D-80 (3)): the faces and builds that match what was typed,
// in two groups. Faces match on their title and the person's name (as the library's search does); builds on their
// name, archetype and positions, and through a matching face they are paired with (Figma finds the 2008 Winger for
// "Ronaldo"). Every word typed must match; case and accents don't count.
import { type BuildPreviewView, buildPreviewView } from "./build-preview.ts";
import type { Content } from "./content/load.ts";
import { type FaceCardView, faceCards, fold, matchesSearch, searchWords } from "./faces.ts";

export interface SearchBuild extends BuildPreviewView {
  /** Name and archetype, folded, for matching. */
  text: string;
  /** Positions, folded ("st"): matched as whole words. */
  positionWords: string[];
  /** The faces paired with this build (D-79). */
  faceIds: string[];
}

export interface SearchIndex {
  faces: FaceCardView[];
  builds: SearchBuild[];
}

export function searchIndex(content: Content, pictureExists: (file: string) => boolean): SearchIndex {
  return {
    faces: faceCards(content.faces, pictureExists),
    builds: content.builds.map((build) => ({
      ...buildPreviewView(build, { sample: Boolean(build.sample) }),
      text: fold(`${build.title} ${build.archetype.name}`),
      positionWords: build.positions.map(fold),
      faceIds: content.faces.filter((f) => f.pairedBuild.id === build.id).map((f) => f.id),
    })),
  };
}

export function searchResults(index: SearchIndex, query: string): { faces: FaceCardView[]; builds: SearchBuild[] } {
  const typed = searchWords(query);
  if (typed.length === 0) return { faces: [], builds: [] };
  const faces = index.faces.filter((f) => matchesSearch(f, query));
  const found = new Set(faces.map((f) => f.id));
  // Positions are whole words ("ST" must not find "Finisher"); names and archetypes match anywhere in a word.
  const matches = (b: SearchBuild) => typed.every((w) => b.text.includes(w) || b.positionWords.includes(w));
  const builds = index.builds.filter((b) => matches(b) || b.faceIds.some((id) => found.has(id)));
  return { faces, builds };
}

/** "2 results for “Ronaldo”" (Figma 376:2303). */
export function resultsLine(results: { faces: unknown[]; builds: unknown[] }, query: string): string {
  const n = results.faces.length + results.builds.length;
  return `${n} ${n === 1 ? "result" : "results"} for “${query.trim()}”`;
}
