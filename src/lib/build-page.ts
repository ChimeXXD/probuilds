// The build page's rules (`/builds/[archetype]/[build]`, Figma 298:3630 / 306:794 / 306:1286; D-63). Values reach
// the page as the build file writes them: a draft's "PLACEHOLDER" stays "PLACEHOLDER", and nothing here works out
// a game number the file doesn't hold (CLAUDE.md). The level switch, AP, key stats and "All of it at level N" show
// only Figma's sample figures (D-107): a recorded build needs each archetype's attribute prices (O-14), the level
// engine (Sharon's PR #7) and a rule for the key stats (A-18) first.
import { buildCardView, type BuildCardView } from "./archetype-page.ts";
import { allOfItView, type LevelsView, levelsView, SAMPLE_FOOTNOTE, SAMPLE_LABEL } from "./build-level.ts";
import { GROUPS, playStylePlusIcon, playStyleSlug } from "./builds.ts";
import { ATTRIBUTE_GROUPS } from "./content/attributes.ts";
import type { LoadedBuild } from "./content/load.ts";
import type { AcceleRate, Archetype, ArchetypeFile } from "./content/types.ts";
import { shareCardsView, type ShareCardsView } from "./share-cards.ts";

// Copy from the Figma frames, word for word.
export const RAW_VALUES_NOTE = "Raw values, as with Attribute totals off: masteries, height and weight and Amps aren't added.";
export const PICTURE_CAPTION = "No picture yet, so it shows the ProBuilds face";
const PLAYED_NOTE = "Played for one match before it's called meta";
const UNCHECKED_NOTE =
  "Not yet checked in game: we read this build from the creator's video. It becomes a Meta pick only after Chime or Sharon makes it and plays a match with it.";

/** The regular PlayStyle badges in public/art/playstyles (Figma PlayStyle/…, Tier=PlayStyle; EA's art, D-39). */
// TODO(Chime): 11 regular badges aren't exported yet (Chip Shot, Power Shot, Dead Ball, Acrobatic, Gamechanger,
// Tiki Taka, Block, Slide Tackle, Long Throw, Far Throw, 1v1 Close Down); those show their name with no badge.
const REGULAR_BADGES = new Set([
  "1v1-close-down", "acrobatic", "aerial-fortress", "anticipate", "block", "bruiser", "chip-shot", "cross-claimer",
  "dead-ball", "deflector", "enforcer", "far-reach", "far-throw", "finesse-shot", "first-touch", "footwork",
  "gamechanger", "incisive-pass", "intercept", "inventive", "jockey", "long-ball-pass", "long-throw", "low-driven-shot",
  "pinged-pass", "power-shot", "precision-header", "press-proven", "quick-step", "rapid", "relentless", "slide-tackle",
  "technical", "tiki-taka", "trickster", "whipped-pass",
]);

const isNumber = (v: unknown): v is number => typeof v === "number";

export interface AttributeGroupView {
  code: string;
  name: string;
  /** The group's rating (the gauge): the sample's key stat, else null (how they are worked out is open, A-18). */
  value: number | null;
  attributes: { name: string; value: number | string; mastery: boolean; percent: number; body?: number }[];
}

/** The PlayStyles a Build page shows, by tier, for its info sheet (D-121 (4)). */
export function buildPlayStyleUses(view: Pick<BuildPageView, "playStylesPlus" | "playStyles" | "specialization">) {
  return [
    ...view.playStylesPlus.map((p) => ({ name: p.name, tier: "plus" as const })),
    ...view.playStyles.map((p) => ({ name: p.name, tier: "playStyle" as const })),
    ...(view.specialization?.plus ? [{ name: view.specialization.plus.replace(/\+$/, ""), tier: "plus" as const }] : []),
  ];
}

export interface SpecializationView {
  name: string;
  /** "Chip Shot+", or null when the archetype file doesn't list this specialization. */
  plus: string | null;
  icon: string | null;
  /** The build's raw value beside each unlock target (RESEARCH §10.4: raw values only). */
  targets: { attribute: string; value: number | string | null; target: number | null }[];
  /** The build's own level when its raw values meet every target, else null. */
  reachedAt: number | null;
  /** The sample's note on how it counts the targets (D-107), or null. */
  note: string | null;
  /** "Reached from level 50 with the sample prices. Counts raw values only.", or null. */
  reachedFrom: string | null;
}

export interface BuildPageView extends Omit<BuildCardView, "credit" | "playStylesPlus"> {
  archetype: { id: string; name: string; groupLabel: string };
  checked: boolean;
  /** "Sample build · values and prices not checked in game" on Figma's sample (D-107), in place of the Draft tag. */
  sampleLabel: string | null;
  /** "Made by Chime in game · Played for one match before it's called meta"; null when a reference line stands in. */
  credit: string | null;
  /** A streamer's video the build was read from (D-66): "Read from <name>'s video · Watch the video". */
  reference: { name: string; url: string | null } | null;
  levels: LevelsView | null;
  allOfIt: { heading: string; text: string } | null;
  /** The sample's closing note on the draft art (Figma 298:4135). */
  footnote: string | null;
  share: ShareCardsView;
  uncheckedNote: string | null;
  /** A player's shared build (Figma 439:8847, D-100 (1)): its tag, line and second button; null on every other build. */
  shared: { tag: string; line: string; makeYourOwn: { label: string; href: string } } | null;
  specialization: SpecializationView | null;
  facts: { term: string; value: string; label?: string; stars?: number }[];
  playStylesPlus: { name: string; icon: string | null; signature: boolean }[];
  playStyles: { name: string; icon: string | null }[];
  mastery: { note: string; source: { label: string; url: string } | null } | null;
  attributeGroups: AttributeGroupView[];
}

/** One page per shown build: its archetype's id and its slug. */
export function pageBuilds(builds: LoadedBuild[]): { archetype: string; build: string }[] {
  return builds.map((b) => ({ archetype: b.archetype.id, build: b.slug }));
}

/** 185 → `6'1" · 185 cm`: height in both units on a full list (DESIGN.md §Type). A unit conversion, not a game number. */
export function heightLine(cm: number): string {
  if (!isNumber(cm)) return `${cm} cm`;
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}'${inches % 12}" · ${cm} cm`;
}

/** 80 → "176 lb · 80 kg". */
export function weightLine(kg: number): string {
  return isNumber(kg) ? `${Math.round(kg / 0.45359237)} lb · ${kg} kg` : `${kg} kg`;
}

/** 4 → "★★★★", read out as "4 stars". */
export function stars(count: number): { text: string; label: string } {
  if (!isNumber(count)) return { text: String(count), label: String(count) };
  return { text: "★".repeat(count), label: `${count} ${count === 1 ? "star" : "stars"}` };
}

/** The regular PlayStyle badge, or null for a placeholder or a badge not exported yet. */
export function playStyleBadge(name: string): string | null {
  const slug = playStyleSlug(name);
  return REGULAR_BADGES.has(slug) ? `/art/playstyles/${slug}.webp` : null;
}

/** The build's attributes in the game's six groups (D-63), plus goalkeeping; groups it has none in are left out. */
export function attributeGroups(
  attributes: LoadedBuild["attributes"],
  mastery: readonly string[],
  keyStats?: Partial<Record<string, number>>,
): AttributeGroupView[] {
  const byName = new Map(attributes.map((a) => [a.name, a.value]));
  return ATTRIBUTE_GROUPS.flatMap((g) => {
    const rows = (g.attributes as readonly string[]).flatMap((name) => {
      const value = byName.get(name);
      if (value === undefined) return [];
      return [{ name, value, mastery: mastery.includes(name), percent: isNumber(value) ? value : 0 }];
    });
    // The gauges show the six key stats: the sample's (D-107); how a recorded build's are worked out is open (A-18).
    return rows.length > 0 ? [{ code: g.code, name: g.name, value: keyStats?.[g.code] ?? null, attributes: rows }] : [];
  });
}

/**
 * The line under ATTRIBUTES (D-63 (4)), the design's wording with the archetype's mastery attributes. The levels
 * are EA's (Pitch Notes) and game footage's (RESEARCH §10.6), the same for every archetype.
 */
export function masteryNote(archetype: Archetype, sources: ArchetypeFile["sources"]): BuildPageView["mastery"] {
  const mastery = archetype.masteryAttributes;
  if (!mastery || mastery.attributes.length === 0) return null;
  const names = mastery.attributes.join(" and ");
  const source = sources.find((s) => mastery.sourceIds.includes(s.id));
  return {
    note: `Mastery +2: levelling ${archetype.name} adds +1 to ${names} at level 10 and +1 more by level 55, on every ${archetype.name} build. Not included in the values below.`,
    // TODO(Chime): only EA's source is in content; the footage for levels 30 and 55 (Leski, 22 Oct) isn't linked.
    // The design's short label is for EA's Pitch Notes only; any other source is named by its own title.
    source: source ? { label: source.id === "ea-grounds-deep-dive" ? "EA Pitch Notes" : source.title, url: source.url } : null,
  };
}

/** The build's specialization, its PlayStyle+ and unlock targets from the archetype file (A-18, RESEARCH §10.4). */
export function specializationView(build: LoadedBuild): SpecializationView | null {
  if (build.specialization === null) return null;
  const known = build.archetype.specializations?.find((s) => s.name === build.specialization);
  const sample = build.sample?.specialization ?? null;
  const notes = {
    note: sample?.note ?? null,
    reachedFrom: sample ? `Reached from level ${sample.reachedFrom} with the sample prices. Counts raw values only.` : null,
  };
  if (!known) return { name: String(build.specialization), plus: null, icon: null, targets: [], reachedAt: null, ...notes };
  const byName = new Map(build.attributes.map((a) => [a.name, a.value]));
  // The sample counts every target at one value (its note says why, D-107); a recorded build uses the archetype's.
  const targets = (known.targets ?? []).map((t) => ({
    attribute: t.attribute,
    value: byName.get(t.attribute) ?? null,
    target: sample ? sample.target : t.value,
  }));
  const reached =
    targets.length > 0 && targets.every((t) => isNumber(t.value) && isNumber(t.target) && t.value >= t.target) && isNumber(build.level);
  return {
    name: known.name,
    plus: `${known.playStyle}+`,
    icon: playStylePlusIcon(known.playStyle),
    targets,
    reachedAt: reached ? build.level : null,
    ...notes,
  };
}

const ACCELERATE: Record<AcceleRate, string> = {
  explosive: "Explosive",
  "mostly-explosive": "Mostly Explosive",
  "controlled-explosive": "Controlled Explosive",
  controlled: "Controlled",
  "controlled-lengthy": "Controlled Lengthy",
  "mostly-lengthy": "Mostly Lengthy",
  lengthy: "Lengthy",
};

/** A recorded star rating, so the page draws its stars as shapes (Barlow has no ★). */
function starCount(count: number): { stars?: number } {
  return isNumber(count) ? { stars: count } : {};
}

function facts(build: LoadedBuild): BuildPageView["facts"] {
  const accelerate = build.body.accelerate;
  const skill = stars(build.skillMoves);
  const weak = stars(build.weakFoot);
  return [
    { term: "Built at level", value: String(build.level) },
    { term: "Height", value: heightLine(build.body.heightCm) },
    { term: "Weight", value: weightLine(build.body.weightKg) },
    ...(accelerate === null ? [] : [{ term: "AcceleRATE", value: ACCELERATE[accelerate as AcceleRate] ?? String(accelerate) }]),
    { term: "Skill moves", value: skill.text, label: skill.label, ...starCount(build.skillMoves) },
    { term: "Weak foot", value: weak.text, label: weak.label, ...starCount(build.weakFoot) },
  ];
}

/** One build, worded for its page. */
export function buildPageView(build: LoadedBuild, sources: ArchetypeFile["sources"], currentSeason?: number): BuildPageView {
  const card = buildCardView(build, currentSeason);
  const reference = build.credits.find((c) => c.role === "reference");
  const sample = build.sample ?? null;
  const maker = card.credit;
  // A build read from a video shows that line in place of the maker's (Figma 371:2208).
  const credit = reference ? null : [maker, build.badge === "meta" ? PLAYED_NOTE : null].filter(Boolean).join(" · ") || null;
  const signature = new Set(build.playStyles.signature);
  const archetype = {
    id: build.archetype.id,
    name: build.archetype.name,
    groupLabel: GROUPS.find((g) => g.group === build.archetype.positionGroup)?.label ?? build.archetype.positionGroup,
  };
  const playStyles = build.playStyles.regular.map((name) => ({ name, icon: playStyleBadge(name) }));
  const groups = attributeGroups(build.attributes, build.archetype.masteryAttributes?.attributes ?? [], sample?.keyStats);
  return {
    ...card,
    archetype,
    checked: build.versionTag.verifiedOn !== null,
    sampleLabel: sample ? SAMPLE_LABEL : null,
    credit,
    reference: reference ? { name: reference.name, url: reference.url } : null,
    uncheckedNote: reference && build.versionTag.verifiedOn === null ? UNCHECKED_NOTE : null,
    shared: null,
    levels: levelsView(build),
    allOfIt: allOfItView(build),
    specialization: specializationView(build),
    facts: facts(build),
    playStylesPlus: card.playStylesPlus.map((p) => ({ ...p, signature: signature.has(p.name) })),
    playStyles,
    mastery: masteryNote(build.archetype, sources),
    attributeGroups: groups,
    footnote: sample ? SAMPLE_FOOTNOTE : null,
    share: shareCardsView(build, {
      title: card.title,
      badge: card.badge,
      href: card.href,
      archetype,
      positions: card.positions,
      versionTag: card.versionTag,
      maker,
      playStylesPlus: card.playStylesPlus,
      regularBadges: playStyles,
      attributeGroups: groups,
    }),
  };
}
