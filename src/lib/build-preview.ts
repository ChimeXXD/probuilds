// A build as a preview card, D-62's stat-strip card: the matching build on a finished face (D-79; Figma 374:2045,
// "Build · 2008 Winger") and Home's meta builds (D-75; 364:2220). A build not recorded yet shows "not recorded yet",
// a dash for every key stat and its signature PlayStyles+; a line of the team with no build file at all is drawn
// from its archetype (Home's Meta Maestro and Meta Boss, D-75 (4)). Values reach the card as the build file writes
// them; no number is made up.
import { bodyLine, creditLine, KEY_STATS } from "./archetype-page.ts";
import { GROUPS, playStylePlusIcon } from "./builds.ts";
import type { LoadedBuild } from "./content/load.ts";
import type { Archetype, KeyStatCode, Position } from "./content/types.ts";
import { versionWording } from "./content/version.ts";

export interface BuildPreviewView {
  href: string;
  title: string;
  /** "Meta pick" or "Recommended" (D-34), or null. */
  tag: string | null;
  picture: { src: string; alt: string } | null;
  positions: Position[];
  /** "Level 55 · 185 cm · 80 kg", or "Spark · not recorded yet". */
  line: string;
  keyStats: { code: string; value: string }[];
  playStylesPlus: { name: string; icon: string | null }[];
  /** Rules 4 and 5 on a real face's page; null beside Figma's samples, which draw neither (as on the archetype page). */
  versionTag: string | null;
  credit: string | null;
  /** Any draft build (Figma's samples included), or an archetype with no build yet: Home's sample note covers it. */
  sample: boolean;
}

const PLACEHOLDER = "PLACEHOLDER";
/** Figma 374:2061: an em dash for a key stat nobody has recorded. */
const NO_STAT = "—";
const TAG = { meta: "Meta pick", recommended: "Recommended" } as const;
const plusOf = (names: string[]) => [...new Set(names)].filter((name) => name !== PLACEHOLDER).map((name) => ({ name, icon: playStylePlusIcon(name) }));
const noStats = () => KEY_STATS.map((code) => ({ code, value: NO_STAT }));

/** False for a line nobody has recorded: its card leaves the stat row out rather than print six "—" (D-115). */
export const hasKeyStats = (stats: { value: string }[]): boolean => stats.some((s) => s.value !== NO_STAT);

/**
 * One build's card. `sample` hides the version tag and credit, as Figma's sample cards draw them; `tag` shows its
 * Meta pick or Recommended tag (Home draws it; the face page's matching build, D-79, doesn't).
 */
export function buildPreviewView(build: LoadedBuild, { sample, tag = false }: { sample: boolean; tag?: boolean }): BuildPreviewView {
  const recorded = typeof build.level === "number";
  return {
    href: `/builds/${build.archetype.id}/${build.slug}`,
    title: build.title,
    tag: tag && build.badge ? TAG[build.badge] : null,
    picture: build.picture ? { src: `/${build.picture.file}`, alt: build.picture.alt } : null,
    positions: build.positions,
    line: recorded ? bodyLine(build) : `${build.archetype.name} · not recorded yet`,
    keyStats: build.sample ? KEY_STATS.map((code) => ({ code, value: String(build.sample?.keyStats[code as KeyStatCode] ?? NO_STAT) })) : noStats(),
    playStylesPlus: plusOf([...build.playStyles.signature, ...build.playStyles.plus]),
    versionTag: sample ? null : versionWording(build.versionTag).tag,
    credit: sample ? null : creditLine(build.credits, Boolean(build.sample)),
    sample: build.status === "draft",
  };
}

/**
 * A line of the team with no build yet (Figma 365:2069, "Build · Meta Maestro"): "Meta <archetype>", Meta pick, the
 * group and "not recorded yet", dashes and the archetype's signature PlayStyles+; it opens the archetype's builds.
 */
export function archetypePreviewView(archetype: Archetype): BuildPreviewView {
  const group = GROUPS.find((g) => g.group === archetype.positionGroup)?.label ?? archetype.name;
  return {
    href: `/builds/${archetype.id}`,
    // TODO(Chime): "Meta <archetype>" is how Home's frames name a build nobody has recorded yet.
    title: `Meta ${archetype.name}`,
    tag: TAG.meta,
    picture: null,
    positions: [],
    line: `${group} · not recorded yet`,
    keyStats: noStats(),
    playStylesPlus: plusOf(archetype.signaturePlayStyles.map((p) => p.name)),
    versionTag: null,
    credit: null,
    sample: true,
  };
}
