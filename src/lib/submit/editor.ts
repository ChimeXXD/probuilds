// Submit a build, the editor's rules (D-85 to D-90) and Figma's sample (start 400:3219, attributes 399:3121,
// PlayStyles 406:3024, name and share 401:3616; D-107). Game numbers come from RESEARCH §10 with their status:
// AP by level (§10.1) and height and weight ranges (§10.3, read in game by Chime) are real. What isn't known yet is
// Figma's sample, shown only for the sample's own values and never worked out for anything else: each archetype's
// attribute prices (O-14, so "AP left" uses the sample's spend, D-85 (3)), what height and weight change, and the
// AcceleRATE rule (sources disagree, §10.3; D-90 says check in game first).
import { ATTRIBUTE_GROUPS } from "../content/attributes.ts";
import type { Archetype, ArchetypeFile, Position, PositionGroup } from "../content/types.ts";

export interface SubmitDraft {
  archetype: string;
  positions: Position[];
  level: number;
  heightCm: number;
  weightKg: number;
  /** Raw values, as Edit Attributes shows them with Attribute totals off. */
  attributes: { name: string; value: number }[];
  skillMoves: number;
  weakFoot: number;
  /** The two PlayStyle+ slots: signatures, or one signature and one specialization's PlayStyle+ (D-87). */
  plus: [string, string];
  regular: string[];
  title: string;
  credit: string;
}

/** The six outfield groups the editor draws (Figma 399:3121); Goalkeeping isn't drawn. */
export const EDITOR_GROUPS = ATTRIBUTE_GROUPS.slice(0, 6);
const ORDER: string[] = EDITOR_GROUPS.flatMap((g) => [...g.attributes]);

// Figma's sample build, copied from the frames (D-107). Drafts only: the editor opens on it on the preview.
const SAMPLE_VALUES = [88, 86, 90, 92, 84, 78, 80, 75, 72, 65, 60, 78, 62, 70, 82, 80, 88, 86, 84, 87, 40, 72, 38, 42, 36, 74, 80, 78, 65];
export const SAMPLE_DRAFT: SubmitDraft = {
  archetype: "finisher",
  positions: ["ST"],
  level: 44,
  heightCm: 185,
  weightKg: 80,
  attributes: ORDER.map((name, i) => ({ name, value: SAMPLE_VALUES[i] ?? 0 })),
  skillMoves: 4,
  weakFoot: 4,
  plus: ["Low Driven Shot", "Chip Shot"],
  regular: ["Finesse Shot", "Power Shot", "Technical", "Rapid", "Quick Step"],
  title: "",
  credit: "",
};
/** The sample's AP spent (Figma "AP counter" 436:8511): a figure, since no prices are known (O-14). */
const SAMPLE_SPENT = 1011;

// RESEARCH §10.1: AP each level adds, level 1 to 55 (the grants add up to every total in the table).
const GRANTS = [100, 9, 9, 9, 19, 10, 10, 10, 10, 38, 13, 13, 13, 13, 25, 13, 13, 13, 13, 44, 19, 19, 19, 19, 38, 25, 25, 25, 25, 63,
  25, 25, 25, 25, 38, 25, 25, 25, 25, 50, 25, 25, 25, 25, 44, 25, 25, 25, 25, 63, 25, 25, 25, 25, 50];
export const LEVEL_MAX = GRANTS.length;
const count = (n: number) => n.toLocaleString("en-US");

/** The AP a Pro has at a level, 1 to 55. */
export const apAtLevel = (level: number) => GRANTS.slice(0, Math.min(Math.max(level, 1), LEVEL_MAX)).reduce((a, b) => a + b, 0);

/** "1,062 AP to spend" and "Level 45 adds 44 more" (400:3372); no next line at the top level. */
export function levelLine(level: number): { spend: string; next: string | null } {
  const next = GRANTS[level];
  return { spend: `${count(apAtLevel(level))} AP to spend`, next: next === undefined ? null : `Level ${level + 1} adds ${next} more` };
}

/** The "AP left" counter (D-85 (3)). Spent is the sample's until prices are recorded, never more than the level gives. */
export function apCounter(draft: SubmitDraft) {
  const total = apAtLevel(draft.level);
  const spent = Math.min(SAMPLE_SPENT, total);
  return { left: count(total - spent), spent: `${count(spent)} spent`, total: `${count(total)} at level ${draft.level}`, percent: (spent / total) * 100 };
}

// RESEARCH §10.3, read in game by Chime (25 Nov), converted to cm and kg.
// TODO(Chime): Figma draws the Finisher's range as 164 cm (FCClub); the game's 5'5" is 165 cm, used here.
const RANGES: Record<string, [number, number, number, number]> = {
  "shot-stopper": [178, 198, 80, 100], "sweeper-keeper": [183, 201, 80, 100], progressor: [178, 196, 75, 95],
  boss: [180, 196, 80, 100], marauder: [168, 188, 65, 85], disruptor: [168, 188, 65, 85], recycler: [173, 193, 65, 85],
  maestro: [163, 188, 65, 85], creator: [163, 188, 65, 85], spark: [163, 188, 60, 80], magician: [163, 188, 60, 80],
  finisher: [165, 190, 70, 90], target: [178, 196, 80, 100],
};

export function bodyRange(archetype: string) {
  const [hMin, hMax, wMin, wMax] = RANGES[archetype] ?? RANGES.finisher!;
  return { height: { min: hMin, max: hMax }, weight: { min: wMin, max: wMax } };
}

/** 185 → `6'1"`, 80 → "176 lb": height's main value (D-121 (6)) and weight's small one (Figma 436:8531). */
export function heightImperial(cm: number) {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}
export const weightImperial = (kg: number) => `${Math.round(kg / 0.45359237)} lb`;

/**
 * "What your body changes" and the AcceleRATE (D-90 (1)): Figma's sample figures, for the sample's Finisher at
 * 185 cm and 80 kg only. Every other body returns null until the effects are read in game (RESEARCH §10.3).
 */
export function bodyChanges(draft: Pick<SubmitDraft, "archetype" | "heightCm" | "weightKg">) {
  if (draft.archetype !== "finisher" || draft.heightCm !== 185 || draft.weightKg !== 80) return null;
  return {
    changes: [
      { attribute: "Acceleration", delta: -2 },
      { attribute: "Agility", delta: -2 },
      { attribute: "Strength", delta: 2 },
    ],
    accelerate: "Controlled",
    rule: "Explosive needs 182 cm or less. Updates as you set attributes.",
  };
}

/** "−2", "+2": the minus sign Figma uses. */
export const signed = (delta: number) => `${delta < 0 ? "−" : "+"}${Math.abs(delta)}`;

/** A group's number beside its heading: the average of its values, rounded, as Figma's sample shows. */
export function groupAverage(attributes: SubmitDraft["attributes"], code: string): number {
  const names: readonly string[] = EDITOR_GROUPS.find((g) => g.code === code)?.attributes ?? [];
  const values = attributes.filter((a) => names.includes(a.name)).map((a) => a.value);
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
}

/** The value's error (Figma 428:5513), or null. */
export const attributeError = (value: number) => (value > 99 ? "Attributes go up to 99" : null);

/** The attribute after this one, for "Typing · next: Shot Power"; null after the last. */
export function nextAttribute(name: string): string | null {
  const i = ORDER.indexOf(name);
  return i >= 0 ? (ORDER[i + 1] ?? null) : null;
}

/** "Finisher · Level 44 · Attributes" over steps 2 and 3. */
export const stepLine = (draft: SubmitDraft, archetype: Archetype, step: string) => `${archetype.name} · Level ${draft.level} · ${step}`;

/** The archetype picker's groups (Figma "Groups" chips), in the game's order. */
export const archetypesIn = (file: ArchetypeFile, group: PositionGroup) => file.archetypes.filter((a) => a.positionGroup === group);

// "Tap all you play". Figma draws the forward list; the others are the positions of each line.
// TODO(Chime): Figma draws only Forward (ST CF LW RW CAM LM RM); check the other groups' lists.
export const POSITIONS_BY_GROUP: Record<PositionGroup, Position[]> = {
  goalkeeper: ["GK"],
  defender: ["CB", "LB", "RB", "LWB", "RWB", "CDM"],
  midfielder: ["CDM", "CM", "CAM", "LM", "RM"],
  attacker: ["ST", "CF", "LW", "RW", "CAM", "LM", "RM"],
};

/** The regular PlayStyles by category, in Figma's order (406:3024). */
export const PLAYSTYLE_CATEGORIES: readonly { name: string; playStyles: readonly string[] }[] = [
  { name: "Shooting", playStyles: ["Finesse Shot", "Chip Shot", "Power Shot", "Dead Ball", "Precision Header", "Acrobatic", "Low Driven Shot", "Gamechanger"] },
  { name: "Ball control", playStyles: ["Technical", "Rapid", "First Touch", "Trickster", "Press Proven"] },
  { name: "Passing", playStyles: ["Incisive Pass", "Pinged Pass", "Long Ball Pass", "Tiki Taka", "Whipped Pass", "Inventive"] },
  { name: "Physical", playStyles: ["Quick Step", "Relentless", "Long Throw", "Bruiser", "Enforcer"] },
  { name: "Defending", playStyles: ["Jockey", "Block", "Intercept", "Anticipate", "Slide Tackle", "Aerial Fortress"] },
];

export interface PlusOption {
  name: string;
  /** "Signature", or the specialization that gives it ("Finisher+"). */
  source: string;
  specialization: string | null;
}

/** What a PlayStyle+ slot can hold (D-87): the archetype's two signatures and its specializations' PlayStyle+. */
export function plusOptions(archetype: Archetype): PlusOption[] {
  const signatures = archetype.signaturePlayStyles.map((s) => ({ name: s.name, source: "Signature", specialization: null }));
  // By PlayStyle name, as Figma lists the Finisher's (Chip Shot, Gamechanger, Relentless; 406:3322).
  const specs = (archetype.specializations ?? [])
    .map((s) => ({ name: s.playStyle, source: s.name, specialization: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...signatures, ...specs];
}

/** The archetype's two signatures, its default PlayStyle+. */
export const defaultPlus = (archetype: Archetype): [string, string] => [
  archetype.signaturePlayStyles[0]?.name ?? "",
  archetype.signaturePlayStyles[1]?.name ?? "",
];

/**
 * Puts `name` in slot `slot`. A specialization's PlayStyle+ replaces a signature, and only one specialization is
 * active at a time, so the other slot then holds a signature.
 */
export function pickPlus(plus: SubmitDraft["plus"], archetype: Archetype, slot: 0 | 1, name: string): SubmitDraft["plus"] {
  const options = plusOptions(archetype);
  const isSpec = (n: string) => options.some((o) => o.name === n && o.specialization);
  const signatures = options.filter((o) => !o.specialization).map((o) => o.name);
  const next: [string, string] = [...plus];
  const other = slot === 0 ? 1 : 0;
  next[slot] = name;
  if (next[other] === name || (isSpec(name) && isSpec(next[other]))) {
    next[other] = signatures.find((s) => s !== name) ?? next[other];
  }
  return next;
}

/** The regular PlayStyles, without the two PlayStyle+ (a PlayStyle picked as one stops being a regular one). */
export const regularOf = (draft: Pick<SubmitDraft, "plus" | "regular">) => draft.regular.filter((r) => !draft.plus.includes(r));

/** The specialization the slots pick, or null when both are signatures. */
export function chosenSpecialization(plus: SubmitDraft["plus"], archetype: Archetype): string | null {
  return plusOptions(archetype).find((o) => o.specialization && plus.includes(o.name))?.specialization ?? null;
}

/** A new archetype resets what belongs to it: its positions, PlayStyle+ and body range (middle of the range). */
export function withArchetype(draft: SubmitDraft, archetype: Archetype): SubmitDraft {
  const range = bodyRange(archetype.id);
  const middle = (r: { min: number; max: number }) => Math.round((r.min + r.max) / 2);
  return {
    ...draft,
    archetype: archetype.id,
    positions: [POSITIONS_BY_GROUP[archetype.positionGroup][0] as Position],
    plus: defaultPlus(archetype),
    heightCm: middle(range.height),
    weightKg: middle(range.weight),
  };
}

/** "Your Finisher": the card's name while the build has none (Figma 401:3616). */
export const titleOf = (draft: SubmitDraft, archetype: Archetype) => draft.title.trim() || `Your ${archetype.name}`;

/** "your-finisher". */
export const slugOf = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "build";
