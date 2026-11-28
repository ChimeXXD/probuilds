// The Builds page's rules (Figma Builds 241:556 / 279:1399 / 276:1073; D-57, D-60), from content/archetypes/fc27.json.
import type { Archetype, ArchetypeFile, PositionGroup } from "./content/types.ts";

/** The rail's groups in the game's order and with the game's names (D-57). */
export const GROUPS: readonly { group: PositionGroup; label: string }[] = [
  { group: "goalkeeper", label: "Keeper" },
  { group: "defender", label: "Defender" },
  { group: "midfielder", label: "Midfielder" },
  { group: "attacker", label: "Forward" },
];

/** Short source names as the design's Sources line prints them; any other source shows its full title. */
const SOURCE_LABEL: Record<string, string> = {
  "ea-grounds-deep-dive": "EA, The Grounds deep dive",
  "ea-archetypes-update": "EA, archetypes update (22 Oct)",
  "dexerto-archetypes": "Dexerto",
  "dexerto-levels": "Dexerto",
  "pchq-archetype-changes": "Pro Clubs HQ",
};

/** Where the stance sits in its 252 × 348 Stance card, per the Figma component's 13 variants (258:585), in px. */
type Box = { left: number; top: number; width: number; height: number };
const FULL = { width: 195.79, height: 293.68 };
const STANCE_BOX: Record<string, Box> = {
  "shot-stopper": { left: 46.69, top: 59.97, width: 156.63, height: 234.95 }, // kneeling, drawn at 80% (D-56)
  "sweeper-keeper": { left: 28.68, top: 31.44, ...FULL },
  progressor: { left: 26.27, top: -1.24, width: 195.27, height: 292.9 },
  boss: { left: 27.82, top: 1.43, ...FULL },
  marauder: { left: 29.06, top: 0.66, ...FULL },
  disruptor: { left: 28.01, top: 17.68, ...FULL },
  recycler: { left: 28.77, top: 19.97, ...FULL },
  maestro: { left: 27.34, top: 6.02, ...FULL },
  creator: { left: 28.39, top: 9.84, ...FULL },
  spark: { left: 25.43, top: 3.34, ...FULL },
  magician: { left: 27.04, top: 0.68, width: 192.83, height: 289.25 },
  finisher: { left: 28.39, top: 4.1, ...FULL },
  target: { left: 27.91, top: 2.19, ...FULL },
};
const DEFAULT_BOX: Box = { left: 28.39, top: 4.1, ...FULL };

export interface ArchetypeView {
  id: string;
  name: string;
  group: PositionGroup;
  groupLabel: string;
  /** 1-based place in the rail, of `total`. */
  place: number;
  total: number;
  signature: { name: string; since: string; icon: string }[];
  /** "Finishing, Composure", or null when no source gave them yet. */
  mastery: string | null;
  /** "6 up · 4 down" (the 22 Oct AP cost changes), or null. */
  apChange: string | null;
  checked: boolean;
  sources: { label: string; url: string }[];
  stance: { src: string; box: Box };
  pattern: string;
}

/** "launch" → "Since launch"; "season-2" → "Since Season 2". */
export function sinceLabel(since: Archetype["signaturePlayStyles"][number]["since"]): string {
  return since === "launch" ? "Since launch" : `Since Season ${since.replace("season-", "")}`;
}

/** "1v1 Close Down" → "1v1-close-down": a PlayStyle's badge file name, in public/art/playstyles and playstyles-plus. */
export function playStyleSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** The PlayStyle badge file (Figma PlayStyle/…, Tier=PlayStyle; EA's art, D-39). */
export function playStyleIcon(name: string): string {
  return `/art/playstyles/${playStyleSlug(name)}.webp`;
}

/** The sources an archetype's shown facts come from, in the file's order, one per short name. */
function sourcesOf(a: Archetype, file: ArchetypeFile): ArchetypeView["sources"] {
  const used = new Set([
    ...a.signaturePlayStyles.flatMap((p) => p.sourceIds),
    ...(a.masteryAttributes?.sourceIds ?? []),
    ...(a.apCostChange20261022?.sourceIds ?? []),
  ]);
  const seen = new Set<string>();
  return file.sources.flatMap((s) => {
    const label = SOURCE_LABEL[s.id] ?? s.title;
    if (!used.has(s.id) || seen.has(label)) return [];
    seen.add(label);
    return [{ label, url: s.url }];
  });
}

/** Every archetype in rail order (group by group), worded for the page. */
export function archetypeViews(file: ArchetypeFile): ArchetypeView[] {
  const ordered = GROUPS.flatMap(({ group }) => file.archetypes.filter((a) => a.positionGroup === group));
  return ordered.map((a, i) => ({
    id: a.id,
    name: a.name,
    group: a.positionGroup,
    groupLabel: GROUPS.find((g) => g.group === a.positionGroup)?.label ?? a.positionGroup,
    place: i + 1,
    total: ordered.length,
    signature: a.signaturePlayStyles.map((p) => ({ name: p.name, since: sinceLabel(p.since), icon: playStyleIcon(p.name) })),
    mastery: a.masteryAttributes ? a.masteryAttributes.attributes.join(", ") : null,
    apChange: a.apCostChange20261022 ? `${a.apCostChange20261022.up} up · ${a.apCostChange20261022.down} down` : null,
    checked: a.verifiedInGame,
    sources: sourcesOf(a, file),
    stance: { src: `/art/stances/${a.id}.webp`, box: STANCE_BOX[a.id] ?? DEFAULT_BOX },
    pattern: `/art/stances/${a.id}-pattern.webp`,
  }));
}

/** The archetype's builds page: the Stance card and its "See … builds" button both open it (D-121 (3)). */
export const buildsHref = (a: { id: string }) => `/builds/${a.id}`;

/** The rail's groups with their archetypes, skipping any group with none. */
export function groupViews(views: ArchetypeView[]): { label: string; items: ArchetypeView[] }[] {
  return GROUPS.map(({ group, label }) => ({ label, items: views.filter((v) => v.group === group) })).filter((g) => g.items.length > 0);
}
