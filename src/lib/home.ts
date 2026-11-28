// Home's rules (`/`, Figma 364:2118 / 367:1629 / 367:1836; D-75 to D-78): faces first (four of them, the face of the
// week left out of the row), the face of the week, one meta build per line of the team (attack: Finisher, midfield:
// Maestro, defence: Boss), the latest changes and the season card. Home appears only when content fills every section
// (D-107: no empty sections). Only a sample face can be the face of the week until the rule for real faces is set, so
// the live site, which never shows samples, keeps its placeholder until then.
import { archetypePreviewView, type BuildPreviewView, buildPreviewView } from "./build-preview.ts";
import { KIND_LABEL as CHANGE_KIND } from "./changelog.ts";
import type { Content } from "./content/load.ts";
import { formatDay } from "./content/version.ts";
import { faceRecipe } from "./face-page.ts";
import { type FaceCardView, faceCards, KIND_LABEL } from "./faces.ts";

/** Figma 364:2339, under the builds while any of them is a sample or not recorded yet. */
// TODO(Chime): Figma's wording names Maestro and Boss; it fits only while those two are the unrecorded ones.
export const SAMPLE_BUILDS_NOTE = "Sample builds. Maestro and Boss values come when they are recorded in game. Tap a card to open its build.";
/** The three lines of the team Home previews, in order (D-75 (2)). */
export const TEAM_LINES = ["finisher", "maestro", "boss"] as const;
const FACES_SHOWN = 4;
const CHANGES_SHOWN = 3;

export interface HomeView {
  faces: FaceCardView[];
  week: { href: string; title: string; line: string; picture: { src: string; alt: string } | null };
  builds: BuildPreviewView[];
  sampleNote: string | null;
  changes: { id: string; line: string; title: string }[];
}

export function homeView(content: Content, pictureExists: (file: string) => boolean): HomeView | null {
  const cards = faceCards(content.faces, pictureExists);
  // TODO(Chime): the rule that picks the face of the week (HANDOFF); today it is the one Figma draws.
  const weekFace = content.faces.find((f) => f.sample?.faceOfTheWeek);
  const faces = cards.filter((c) => c.id !== weekFace?.id).slice(0, FACES_SHOWN);
  const builds = TEAM_LINES.flatMap((id) => {
    const archetype = content.archetypeFile.archetypes.find((a) => a.id === id);
    if (!archetype) return [];
    // The line's Meta pick, else its Recommended build, else the archetype itself (D-124, amending D-75 (4)): Home
    // never shows an unbadged build, so an untitled draft can't stand in for a line.
    const own = content.builds.filter((b) => b.archetype.id === id);
    const build = own.find((b) => b.badge === "meta") ?? own.find((b) => b.badge === "recommended");
    return [build ? buildPreviewView(build, { sample: Boolean(build.sample), tag: true }) : archetypePreviewView(archetype)];
  });
  const changes = content.changelog.slice(0, CHANGES_SHOWN).map((e) => ({ id: e.id, line: `${formatDay(e.date)} · ${CHANGE_KIND[e.kind]}`, title: e.title }));
  if (!weekFace || faces.length < FACES_SHOWN || builds.length < TEAM_LINES.length || changes.length === 0) return null;
  const week = cards.find((c) => c.id === weekFace.id);
  return {
    faces,
    week: {
      href: `/faces/${weekFace.slug}`,
      title: weekFace.title,
      line: `${KIND_LABEL[weekFace.subject.kind]} · ${faceRecipe(weekFace).total} steps`,
      picture: week?.picture ?? null,
    },
    builds,
    sampleNote: builds.some((b) => b.sample) ? SAMPLE_BUILDS_NOTE : null,
    changes,
  };
}
