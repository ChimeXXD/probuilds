// Everything the face page shows around its steps (Figma 353:1410 / 427:8649 / 427:8767; D-71, D-74): the picture
// with the 360° badge, kind and plain title (D-69), the version tag (rule 4), the credit line (rule 5), Figma's sample
// note, the limits callout, the tutorial facade (rule 5) and the matching build for the finished state (D-79).
import { isSampleMaker } from "./archetype-page.ts";
import type { LoadedFace } from "./content/load.ts";
import { versionWording } from "./content/version.ts";
import { type Recipe, faceRecipe } from "./face-page.ts";
import { KIND_LABEL } from "./faces.ts";
import { type BuildPreviewView, buildPreviewView } from "./build-preview.ts";

/** Figma 353:1442: the sample's marker in place of the Draft tag (D-113). */
export const SAMPLE_NOTE = "Sample recipe: values are placeholders until Chime records this face.";
/** UI-BRIEF §5, as the Limits callout draws it. */
export const LIMIT_PREFIX = "The game can't do this exactly: ";

export interface FacePageView {
  slug: string;
  title: string;
  kindLabel: string;
  picture: { src: string; alt: string } | null;
  /** The turntable's frames (D-35), or null; null too when its first frame or the front picture isn't there. */
  turn: { folder: string; frames: number } | null;
  /** "360° turn from <channel>'s video", linking the video a creator's turn was cut from (D-123, rule 5); else null. */
  turnCredit: { label: string; url: string } | null;
  /** The "360°" badge: on a face you can turn, and on Figma's samples, which draw it. */
  rotate: boolean;
  versionTag: string;
  checked: boolean;
  olderSeason: string | null;
  /** "Made by Chime in game"; null for Figma's samples nobody made (their sample note says so, D-115). */
  madeBy: string | null;
  tutorial: { label: string; url: string | null } | null;
  sampleNote: string | null;
  limits: string[];
  embed: { videoId: string; title: string; channelLine: string } | null;
  recipe: Recipe;
  paired: BuildPreviewView;
  storage: { id: string; version: number };
}

export function facePageView(face: LoadedFace, pictureExists: (file: string) => boolean): FacePageView {
  const version = versionWording(face.versionTag);
  const sample = face.sample !== undefined;
  const shot = face.screenshots[0];
  const makers = face.credits.filter((c) => c.role === "made-by").map((c) => c.name);
  // "— (sample)" is the library audit's maker for a sample nobody made (item 18): no maker line for it.
  const realMakers = makers.filter((name) => !isSampleMaker(name));
  const tutorial = face.credits.find((c) => c.role === "tutorial");
  const embed = face.embeds[0];
  const picture = shot && pictureExists(shot.file) ? { src: `/${shot.file}`, alt: shot.alt } : null;
  // The turntable draws over the front picture, so with no picture or no first frame nothing turns: no turn, no turn
  // credit and no badge claiming one.
  const turn = picture && face.turn && pictureExists(`${face.turn.folder}/01.webp`) ? face.turn : null;
  return {
    slug: face.slug,
    title: face.title,
    kindLabel: KIND_LABEL[face.subject.kind],
    picture,
    turn: turn && { folder: turn.folder, frames: turn.frames },
    turnCredit: turn?.source ? { label: `360° turn from ${turn.source.channel}'s video`, url: turn.source.url } : null,
    rotate: turn !== null || sample,
    versionTag: version.tag,
    checked: version.checked,
    olderSeason: version.olderSeason,
    madeBy: realMakers.length > 0 ? `Made by ${realMakers.join(" and ")} in game` : null,
    tutorial: tutorial ? { label: `Tutorial by ${tutorial.name}`, url: tutorial.url } : null,
    sampleNote: face.sample?.recipe ? SAMPLE_NOTE : null,
    limits: face.limits.map((limit) => `${LIMIT_PREFIX}${limit}`),
    embed: embed ? { videoId: embed.videoId, title: embed.title, channelLine: `${embed.channel} · Tap to play` } : null,
    recipe: faceRecipe(face),
    paired: buildPreviewView(face.pairedBuild, { sample }),
    storage: { id: face.id, version: face.version },
  };
}
