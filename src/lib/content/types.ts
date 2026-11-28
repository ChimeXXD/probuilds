// Content shapes from docs/FORMAT.md v1 (A-02), with the face format of A-09 and A-12.
// Fields Chime records in game take a type parameter `P`: drafts may hold the string "PLACEHOLDER"
// there (`Face<Placeholder>`), published content may not (`Face`, where P is never). The validator
// checks drafts; the loader returns only published content, so pages never see a placeholder.

export type Placeholder = "PLACEHOLDER";
export type Status = "draft" | "published" | "withdrawn";
export type Game = "fc27";
export type Platform = "ps5" | "xbox" | "pc";
export type IsoDate = string; // "2026-11-20"

export interface VersionTag {
  game: Game;
  season: number;
  verifiedOn: IsoDate | null;
  verifiedBy: string | null;
  platform: Platform | null;
}

export type CreditRole = "made-by" | "tutorial" | "submitted-by" | "reference";

export interface Credit {
  role: CreditRole;
  name: string;
  url: string | null;
  creatorId: string | null;
}

export interface Source {
  title: string;
  url: string;
  accessed: IsoDate;
}

export interface HistoryLine {
  version: number;
  date: IsoDate;
  note: string;
}

/** Fields every build and face carries (D-05, D-08). */
interface Versioned {
  schemaVersion: 1;
  id: string;
  slug: string;
  status: Status;
  _example?: string;
  version: number;
  versionTag: VersionTag;
  credits: Credit[];
  history: HistoryLine[];
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

// Values, stored the way the game shows them (A-09, A-12).

/** A numbered catalogue choice: "Nose 116". */
export interface ItemValue<P = never> {
  kind: "item";
  number: number | P;
}

/** A choice the game shows by name: "Warm Black", "None". */
export interface NamedValue<P = never> {
  kind: "named";
  name: string | P;
}

/** A Sculpt slider, 0 to 100, with the labels at its two ends. */
export interface SliderValue<P = never> {
  kind: "slider";
  low: string;
  high: string;
  value: number | P;
}

/** A slider with no number (Skin Tone): the knob's place along the track, 0 to 100. */
export interface PositionValue<P = never> {
  kind: "position";
  percent: number | P;
}

export type PartValue<P = never> = ItemValue<P> | NamedValue<P> | PositionValue<P>;

export type PartTabName = "skin" | "head" | "face" | "hair";
export const PART_TABS: readonly PartTabName[] = ["skin", "head", "face", "hair"];

export interface PartStep<P = never> {
  control: string | P;
  label: string | P;
  value: PartValue<P>;
  tip: string | null;
}

export interface PartTab<P = never> {
  tab: PartTabName;
  steps: PartStep<P>[];
}

export type SculptMode = "shape" | "weight" | "definition";
export type SculptLayer = "skeletal" | "flesh" | "fat";

export interface SculptStep<P = never> {
  mode: SculptMode;
  layer: SculptLayer;
  region: string;
  subRegion: string;
  sliders: SliderValue<P>[];
  tip: string | null;
}

export interface Sculpt<P = never> {
  symmetry: boolean;
  steps: SculptStep<P>[];
}

export interface VisualAge<P = never> {
  toward: "older" | "younger" | P;
  percent: number | P;
}

// Faces (FORMAT §Face recipe).

export type SubjectKind = "footballer" | "athlete" | "musician";

export interface Screenshot {
  file: string;
  alt: string;
  by: string;
}

export interface Embed {
  provider: "youtube";
  videoId: string;
  title: string;
  channel: string;
  creatorId: string | null;
}

/** The turntable: numbered frames in `folder`, cut from one in-game turn clip (D-35). */
export interface Turn {
  folder: string;
  frames: number;
  by: string;
  /**
   * The creator's video the frames were cut from (D-123): a sample face's stand-in turn, under sample/faces/, which
   * the face page credits and links. Absent or null for Chime's own clip.
   */
  source?: TurnSource | null;
}

export interface TurnSource {
  url: string;
  title: string;
  channel: string;
}

export interface Face<P = never> extends Versioned {
  subject: { name: string; kind: SubjectKind; living: boolean };
  era: { label: string; note: string | P };
  title: string;
  target: { look: "matchday" };
  timeMinutes: number | P;
  preset: { number: number | P };
  parts: PartTab<P>[];
  sculpt: Sculpt<P> | null;
  visualAge: VisualAge<P> | null;
  limits: (string | P)[];
  pairedBuild: string;
  screenshots: Screenshot[];
  turn: Turn | null;
  embeds: Embed[];
  /**
   * Figma's sample face (D-107, D-108): a draft whose picture may be Figma's stand-in, under sample/faces/. `place` is
   * where Figma's library draws it (1 first). `recipe` is the sample recipe the face page frames draw, when it has one.
   * `faceOfTheWeek` marks the face Home features (Figma 364:2141); the rule for real faces is still open.
   */
  sample?: { place: number; recipe?: SampleRecipe; faceOfTheWeek?: boolean };
}

/** The face page's sections, in the game's order (D-72, D-73). */
export const RECIPE_SECTIONS = ["Preset", "Skin", "Head", "Face", "Hair", "Sculpt", "Visual Age"] as const;
export type RecipeSectionName = (typeof RECIPE_SECTIONS)[number];

/**
 * Figma's sample recipe (D-107), copied from the face page frames (353:1410, 353:1524, 353:1648): how many values and
 * game screens each section has, and the screens the frames draw, by their step number. Screens no frame draws are
 * absent, never made up, so the walk goes from one drawn screen to the next.
 */
export interface SampleRecipe {
  sections: { name: RecipeSectionName; values: number; screens: number }[];
  screens: {
    step: number;
    where: string;
    title: string;
    values: { label: string; value: string }[];
    hint: string;
    /** The "Next: …" line under the card, as drawn; null when no frame draws one. */
    next: string | null;
  }[];
}

// Builds (FORMAT §Build).

export type Position = "GK" | "CB" | "LB" | "RB" | "LWB" | "RWB" | "CDM" | "CM" | "CAM" | "LM" | "RM" | "LW" | "RW" | "CF" | "ST";
export const POSITIONS: readonly Position[] = ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST"];

/** The seven AcceleRATE types the game shows, fastest start first (FORMAT §Build). */
export const ACCELERATE_RATES = [
  "explosive", "mostly-explosive", "controlled-explosive", "controlled", "controlled-lengthy", "mostly-lengthy", "lengthy",
] as const;
export type AcceleRate = (typeof ACCELERATE_RATES)[number];

/** The six key stats, in the game's order (D-62). */
export type KeyStatCode = "PAC" | "SHO" | "PAS" | "DRI" | "DEF" | "PHY";

/**
 * Figma's sample figures (D-107): what the sample build shows that no recorded build can give yet (key stats, A-18;
 * AP by level, O-14). Drafts only, so it shows on the preview and never on probuilds.club.
 */
export interface BuildSample {
  keyStats: Record<KeyStatCode, number>;
  /**
   * The levels the design draws: the AP the level gives, the AP spent, and how far short of the whole build it is.
   * Empty for a sample drawn only as an archetype card.
   */
  levels: { level: number; ap: number; spent: number; apShort: number | null }[];
  /** The note under the specialization, the target value the sample counts, and the level it is reached from. */
  specialization: { note: string; target: number; reachedFrom: number } | null;
}

/** Set by Chime (D-34, D-62). */
export type Badge = "meta" | "recommended";

/** The order the build was made in, for the level switch (D-43): raise one attribute or star, to a value. */
export interface Spend<P = never> {
  start: { name: string; value: number | P }[];
  startStars: { skillMoves: number | P; weakFoot: number | P };
  steps: { raise: string; to: number | P }[];
}

export interface Build<P = never> extends Versioned {
  title: string | P;
  archetype: string;
  positions: Position[];
  summary: string | P;
  badge: Badge | null;
  level: number | P;
  picture: Screenshot | null;
  body: { heightCm: number | P; weightKg: number | P; accelerate: AcceleRate | null | P };
  attributes: { name: string; value: number | P }[];
  playStyles: { signature: string[]; plus: (string | P)[]; regular: (string | P)[] };
  specialization: string | null | P;
  skillMoves: number | P;
  weakFoot: number | P;
  spend: Spend<P> | null;
  /** Figma's sample figures, on a draft only (D-107). Absent on every recorded build. */
  sample?: BuildSample;
  sources: Source[];
}

// Archetypes (FORMAT §Archetype): one file per game; unverified fields are null.

export type PositionGroup = "goalkeeper" | "defender" | "midfielder" | "attacker";

/** `targets` is null when unread; a target's `value` is null when only its name is known. */
export interface Specialization {
  name: string;
  playStyle: string;
  targets: { attribute: string; value: number | null }[] | null;
  sourceIds: string[];
}

export interface Archetype {
  id: string;
  name: string;
  positionGroup: PositionGroup;
  signaturePlayStyles: { name: string; since: "launch" | `season-${number}`; sourceIds: string[] }[];
  masteryAttributes: { attributes: string[]; sourceIds: string[] } | null;
  apCostChange20261022: { up: number; down: number; sourceIds: string[] } | null;
  specializations: Specialization[] | null;
  typicalPositions: Position[] | null;
  verifiedInGame: boolean;
  notes: string | null;
}

export interface ArchetypeFile {
  schemaVersion: 1;
  game: Game;
  updated: IsoDate;
  note: string;
  archetypes: Archetype[];
  sources: (Source & { id: string })[];
}

// Changelog (FORMAT §Changelog entry).

export type ChangelogKind = "season" | "title-update" | "archetype-update" | "site";

export interface ChangelogEntry {
  schemaVersion: 1;
  id: string;
  status: Status;
  date: IsoDate;
  kind: ChangelogKind;
  game: Game;
  season: number;
  title: string;
  changes: string[];
  source: Source;
  affects: { builds: string[]; faces: string[] };
  siteNote: string | null;
}

// Creators (FORMAT §Creators).

export interface Creator {
  id: string;
  name: string;
  url: string;
  platform: string; // FORMAT shows "youtube"; it doesn't fix a list
  permission: "not-asked" | "asked" | "yes" | "no";
  featured: boolean;
  notes: string;
}

export interface CreatorsFile {
  schemaVersion: 1;
  creators: Creator[];
}
