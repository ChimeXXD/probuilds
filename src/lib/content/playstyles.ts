// content/playstyles.json (FORMAT §PlayStyles, D-121 (4)): what each PlayStyle and PlayStyle+ does, in EA's own
// published words, each with the EA page it was read from. `null` where EA's wording hasn't been found: the site then
// says "To check in game". Never another site's text (CLAUDE.md rule 9).
import { at, Check, isObj, type Problem } from "./check.ts";
import type { Game, IsoDate, Source } from "./types.ts";

export interface PlayStyleText {
  text: string;
  sourceId: string;
}

export interface PlayStyleEntry {
  name: string;
  /** What the PlayStyle does, or null when EA's wording wasn't found. */
  playStyle: PlayStyleText | null;
  /** What the PlayStyle+ does, or null. */
  plus: PlayStyleText | null;
  /** For whoever edits the file (EA's own contradictions, other names); never shown. */
  notes: string | null;
}

export interface PlayStylesFile {
  schemaVersion: 1;
  game: Game;
  updated: IsoDate;
  note: string;
  sources: (Source & { id: string })[];
  playStyles: PlayStyleEntry[];
}

/** A description with its source resolved, as the site shows it. */
export interface PlayStyleInfo {
  name: string;
  playStyle: { text: string; source: Source } | null;
  plus: { text: string; source: Source } | null;
}

export const PLAYSTYLES_FILE = "playstyles.json";

/** EA's own pages (FORMAT §PlayStyles): ea.com and its subdomains, such as www.ea.com and help.ea.com. */
const isEaHost = (host: string) => host === "ea.com" || host.endsWith(".ea.com");

export function validatePlayStylesFile(file: string, data: unknown): Problem[] {
  const c = new Check(file, isObj(data) ? data : {});
  if (!c.obj("", data)) return c.problems;
  c.oneOf("schemaVersion", data.schemaVersion, [1]);
  c.oneOf("game", data.game, ["fc27"]);
  c.date("updated", data.updated);
  c.str("note", data.note);
  const ids = new Set<string>();
  if (c.arr("sources", data.sources)) {
    data.sources.forEach((source, i) => {
      const p = at("sources", i);
      if (!c.obj(p, source)) return;
      c.str(`${p}.id`, source.id);
      c.str(`${p}.title`, source.title);
      const before = c.problems.length;
      c.url(`${p}.url`, source.url);
      const url = c.problems.length === before && URL.canParse(String(source.url)) ? new URL(String(source.url)) : null;
      if (url && !isEaHost(url.hostname))
        c.add(`${p}.url`, "must be an EA page (ea.com), never another site (rule 9)");
      c.date(`${p}.accessed`, source.accessed);
      if (typeof source.id !== "string") return;
      if (ids.has(source.id)) c.add(`${p}.id`, "is used twice");
      ids.add(source.id);
    });
  }
  if (c.arr("playStyles", data.playStyles, { min: 1 })) {
    const seen = new Set<unknown>();
    data.playStyles.forEach((entry, i) => {
      const p = at("playStyles", i);
      if (!c.obj(p, entry)) return;
      c.str(`${p}.name`, entry.name);
      if (seen.has(entry.name)) c.add(`${p}.name`, "is used twice");
      seen.add(entry.name);
      for (const tier of ["playStyle", "plus"] as const) {
        const d = entry[tier];
        if (!c.obj(`${p}.${tier}`, d, { nullable: true })) continue;
        c.str(`${p}.${tier}.text`, d.text);
        if (typeof d.sourceId !== "string" || !ids.has(d.sourceId)) c.add(`${p}.${tier}.sourceId`, `unknown source ${JSON.stringify(d.sourceId)}`);
      }
      c.str(`${p}.notes`, entry.notes, { nullable: true });
    });
  }
  return c.problems;
}

type HasPlayStyles = { playStyles?: { signature?: unknown; plus?: unknown; regular?: unknown } };

/** Every PlayStyle name content shows: archetype signatures, specializations' PlayStyle+ and builds' lists. */
export function playStyleNamesUsed(archetypeFile: unknown, builds: unknown[]): string[] {
  const names: string[] = [];
  const add = (v: unknown) => typeof v === "string" && v !== "PLACEHOLDER" && names.push(v);
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  if (isObj(archetypeFile)) {
    for (const a of list(archetypeFile.archetypes)) {
      if (!isObj(a)) continue;
      for (const s of list(a.signaturePlayStyles)) if (isObj(s)) add(s.name);
      for (const s of list(a.specializations)) if (isObj(s)) add(s.playStyle);
    }
  }
  for (const b of builds) {
    const ps = isObj(b) ? (b as HasPlayStyles).playStyles : undefined;
    if (isObj(ps)) for (const name of [...list(ps.signature), ...list(ps.plus), ...list(ps.regular)]) add(name);
  }
  return [...new Set(names)];
}

/** With the PlayStyles file present, each name content uses must have an entry (one problem per missing name). */
export function checkPlayStyleNames(files: { path: string; data: unknown }[]): Problem[] {
  const own = files.find((f) => f.path === PLAYSTYLES_FILE)?.data;
  if (!isObj(own) || !Array.isArray(own.playStyles)) return [];
  const known = new Set(own.playStyles.flatMap((e) => (isObj(e) && typeof e.name === "string" ? [e.name] : [])));
  return files.flatMap(({ path, data }) => {
    const isArchetypes = path === "archetypes/fc27.json";
    if (!isArchetypes && !path.startsWith("builds/")) return [];
    const used = isArchetypes ? playStyleNamesUsed(data, []) : playStyleNamesUsed(null, [data]);
    return used
      .filter((name) => !known.has(name))
      .map((name) => ({ file: PLAYSTYLES_FILE, path: "playStyles", message: `${JSON.stringify(name)} is used in ${path} but has no entry` }));
  });
}

/** The file's entries with their sources resolved (the file has passed validation). */
export function playStyleInfos(file: PlayStylesFile): PlayStyleInfo[] {
  const byId = new Map(file.sources.map(({ id, ...source }) => [id, source]));
  const resolve = (d: PlayStyleText | null) => {
    const source = d && byId.get(d.sourceId);
    return d && source ? { text: d.text, source } : null;
  };
  return file.playStyles.map((e) => ({ name: e.name, playStyle: resolve(e.playStyle), plus: resolve(e.plus) }));
}

export type Tier = "playStyle" | "plus";

/**
 * The descriptions a page needs: only the PlayStyles it shows, each with only the tiers it shows it in (the other
 * tier is null and never asked for), so a page's payload carries a few entries, not all 36.
 */
export function infosFor(all: PlayStyleInfo[], uses: { name: string; tier: Tier }[]): PlayStyleInfo[] {
  const tiers = new Map<string, Set<Tier>>();
  for (const { name, tier } of uses) tiers.set(name, (tiers.get(name) ?? new Set()).add(tier));
  const byName = new Map(all.map((info) => [info.name, info]));
  // In the order the page first shows them.
  return [...tiers].flatMap(([name, used]) => {
    const info = byName.get(name);
    if (!info) return [];
    return [{ name, playStyle: used.has("playStyle") ? info.playStyle : null, plus: used.has("plus") ? info.plus : null }];
  });
}

/** The PlayStyle+ badges a list of build cards shows, as uses for infosFor. */
export function plusUses(cards: { playStylesPlus: { name: string }[] }[]): { name: string; tier: Tier }[] {
  return cards.flatMap((c) => c.playStylesPlus.map((p) => ({ name: p.name, tier: "plus" as const })));
}
