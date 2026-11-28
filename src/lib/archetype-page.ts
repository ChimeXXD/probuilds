// The archetype page's rules (`/builds/[archetype]`, Figma 288:1031 / 290:796 / 290:1084; D-62): its builds as
// "stat strip" cards. Values reach the card as the build file writes them: a draft's "PLACEHOLDER" stays
// "PLACEHOLDER" (CLAUDE.md: never invent values).
import { playStylePlusIcon } from "./builds.ts";
import { KEY_STATS } from "./content/attributes.ts";
import type { LoadedBuild, ResolvedCredit } from "./content/load.ts";
import type { Badge, KeyStatCode, Position } from "./content/types.ts";
import { versionWording } from "./content/version.ts";

/** The six key stats the card's strip shows (D-62), in the game's order. */
export { KEY_STATS };
/** Lives in builds.ts now; re-exported for Submit's modules (another lane's files), to move at the next merge. */
export { playStylePlusIcon };

/** Figma's note above the sample cards (288:1094), shown once in place of each card's Draft tag (D-107, D-113). */
export const SAMPLE_CARDS_NOTE = "Sample values: not real builds yet";

export const BADGE_LABEL = { meta: "Meta pick", recommended: "Recommended" } as const satisfies Record<Badge, string>;
const BADGE_RANK = (b: Badge | null) => (b === "meta" ? 0 : b === "recommended" ? 1 : 2);

export interface BuildCardView {
  id: string;
  /** The build page, /builds/<archetype>/<slug>. */
  href: string;
  title: string;
  draft: boolean;
  /** Figma's sample build (D-107): its card is drawn with no Draft tag, version tag or credit; the page's note marks it. */
  sample: boolean;
  badge: (typeof BADGE_LABEL)[Badge] | null;
  picture: { src: string; alt: string } | null;
  positions: Position[];
  /** "Level 55 · 185 cm · 80 kg". */
  body: string;
  /** `value` is null: the key stats aren't stored, and how they are worked out is still open (A-18). */
  keyStats: { code: string; value: string | null }[];
  playStylesPlus: { name: string; icon: string | null }[];
  versionTag: string;
  olderSeason: string | null;
  credit: string | null;
}

/** An archetype's builds: Meta pick first, then Recommended, then the rest (each by id, as the loader sorts). */
export function archetypeBuilds(builds: LoadedBuild[], archetypeId: string): LoadedBuild[] {
  return builds.filter((b) => b.archetype.id === archetypeId).sort((a, b) => BADGE_RANK(a.badge) - BADGE_RANK(b.badge));
}

/** "Forward · 3 builds" under the archetype's name. */
export function buildCountLabel(groupLabel: string, count: number): string {
  return `${groupLabel} · ${count} ${count === 1 ? "build" : "builds"}`;
}

/** "Level 55 · 185 cm · 80 kg": height always with weight, metric on one-line summaries (D-92). */
export function bodyLine(build: LoadedBuild): string {
  return `Level ${build.level} · ${build.body.heightCm} cm · ${build.body.weightKg} kg`;
}

/**
 * "Made by Chime in game · tutorial by <creator>" (DESIGN.md §Content), or null with no maker. Figma's sample wasn't
 * made by anyone: Figma's "Made by — (sample)" (298:3665) is left out, since the sample label already says so (D-115).
 */
export const isSampleMaker = (name: string): boolean => name.endsWith("(sample)");

export function creditLine(credits: ResolvedCredit[], sample = false): string | null {
  const names = (role: string) => credits.filter((c) => c.role === role && !isSampleMaker(c.name)).map((c) => c.name).join(" and ");
  const made = names("made-by");
  if (!made) return null;
  if (sample) return `Made by ${made}`;
  const tutorial = names("tutorial");
  // TODO(Chime): no wording yet for "submitted-by" and "reference" credits on a card; they are left out. A build read
  // from a streamer's video (D-66) credits them as "reference" and needs that wording before one is published.
  return tutorial ? `Made by ${made} in game · tutorial by ${tutorial}` : `Made by ${made} in game`;
}

/** One build, worded for its card. */
export function buildCardView(build: LoadedBuild, currentSeason?: number): BuildCardView {
  const version = versionWording(build.versionTag, currentSeason);
  const plus = [...new Set([...build.playStyles.signature, ...build.playStyles.plus])];
  return {
    id: build.id,
    href: `/builds/${build.archetype.id}/${build.slug}`,
    title: build.title,
    draft: build.status === "draft",
    sample: Boolean(build.sample),
    badge: build.badge ? BADGE_LABEL[build.badge] : null,
    // TODO(Chime): FORMAT names a picture "builds/<slug>.webp" without saying where it is served; read from public/.
    picture: build.picture ? { src: `/${build.picture.file}`, alt: build.picture.alt } : null,
    positions: build.positions,
    body: bodyLine(build),
    // Figma's sample has its own (D-107). TODO(Chime): how a recorded build's six key stats are worked out (A-18;
    // Sharon's PR #8 records them per build).
    keyStats: KEY_STATS.map((code) => ({ code, value: build.sample?.keyStats[code as KeyStatCode]?.toString() ?? null })),
    // Signature PlayStyles are PlayStyle+ in game; a specialization's PlayStyle+ may replace one (D-87).
    playStylesPlus: plus.map((name) => ({ name, icon: playStylePlusIcon(name) })),
    versionTag: version.tag,
    olderSeason: version.olderSeason,
    credit: creditLine(build.credits, Boolean(build.sample)),
  };
}

/**
 * The "Submit a build" tile fills a gap in the last row (D-62): on tablet (two across) when the count is odd, on
 * desktop (three across) across the one or two empty cells. Phone is one column, so it never has a gap.
 */
export function submitTile(count: number): { tablet: boolean; desktopSpan: 0 | 1 | 2 } {
  if (count === 0) return { tablet: false, desktopSpan: 0 };
  return { tablet: count % 2 === 1, desktopSpan: ((3 - (count % 3)) % 3) as 0 | 1 | 2 };
}
