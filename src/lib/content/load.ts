// Content loader (SPEC §Data model, A-02): reads content/ at build time, validates every file, keeps
// only published builds, faces and changelog entries, and resolves the links between them. A link
// from published content to a draft or withdrawn file fails the build: drafts have no page, and
// withdrawn content is never built, listed or linked (FORMAT §Status, D-10).
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Problem } from "./check.ts";
import { type PlayStyleInfo, playStyleInfos, PLAYSTYLES_FILE, type PlayStylesFile } from "./playstyles.ts";
import type { Archetype, ArchetypeFile, Build, ChangelogEntry, Credit, Creator, CreatorsFile, Embed, Face, Status } from "./types.ts";
import { validateAll } from "./validate.ts";

export interface ContentFile {
  path: string; // under content/: "faces/x.json"
  data: unknown;
}

export type ResolvedCredit = Credit & { creator: Creator | null };
export type ResolvedEmbed = Embed & { creator: Creator | null };
export type LoadedBuild = Omit<Build, "archetype" | "credits"> & { archetype: Archetype; credits: ResolvedCredit[] };
export type LoadedFace = Omit<Face, "pairedBuild" | "credits" | "embeds"> & {
  pairedBuild: LoadedBuild;
  credits: ResolvedCredit[];
  embeds: ResolvedEmbed[];
};
export type LoadedChangelogEntry = Omit<ChangelogEntry, "affects"> & { affects: { builds: LoadedBuild[]; faces: LoadedFace[] } };

export interface Content {
  archetypeFile: ArchetypeFile;
  creators: Creator[];
  /** What each PlayStyle does, in EA's words (content/playstyles.json); empty when the file is absent (fixtures). */
  playStyles: PlayStyleInfo[];
  builds: LoadedBuild[]; // by id
  faces: LoadedFace[]; // by id
  changelog: LoadedChangelogEntry[]; // newest first
}

/** "file path: message", the line the build prints for a problem. */
export const problemLine = (p: Problem) => `${p.file}${p.path ? ` ${p.path}` : ""}: ${p.message}`;

export class ContentError extends Error {
  readonly problems: Problem[];

  constructor(problems: Problem[]) {
    super(`content: ${problems.length} problem(s)\n${problems.map(problemLine).join("\n")}`);
    this.name = "ContentError";
    this.problems = problems;
  }
}

/** Every .json file under `root`, sorted by path, plus a problem for each one that isn't valid JSON. */
export function readContent(root: string): { files: ContentFile[]; problems: Problem[] } {
  const files: ContentFile[] = [];
  const problems: Problem[] = [];
  const paths = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => relative(root, join(entry.parentPath, entry.name)))
    .sort();
  for (const path of paths) {
    try {
      files.push({ path, data: JSON.parse(readFileSync(join(root, path), "utf8")) });
    } catch (error) {
      problems.push({ file: path, path: "", message: `not valid JSON (${(error as Error).message})` });
    }
  }
  return { files, problems };
}

export interface LoadOptions {
  /** Preview builds also show drafts (marked as drafts on the page). Withdrawn content never shows (rule 8). */
  includeDrafts?: boolean;
}

/** Reads, validates and resolves everything in `root` (content/, or a test fixture folder). Throws ContentError. */
export function loadContent(root: string, { includeDrafts = false }: LoadOptions = {}): Content {
  const { files, problems } = readContent(root);
  problems.push(...validateAll(files));
  if (problems.length > 0) throw new ContentError(problems);

  // Validated: every file has its format's shape, so the casts below hold.
  const find = (path: string) => files.find((f) => f.path === path)?.data;
  const archetypeFile = find("archetypes/fc27.json") as ArchetypeFile | undefined;
  const creatorsFile = find("creators.json") as CreatorsFile | undefined;
  const playStylesFile = find(PLAYSTYLES_FILE) as PlayStylesFile | undefined;
  if (!archetypeFile) problems.push({ file: "archetypes/fc27.json", path: "", message: "is missing" });
  if (!creatorsFile) problems.push({ file: "creators.json", path: "", message: "is missing" });
  if (!archetypeFile || !creatorsFile) throw new ContentError(problems);

  const inFolder = <T>(folder: string) => files.filter((f) => f.path.startsWith(folder)).map((f) => ({ path: f.path, item: f.data as T }));
  const builds = inFolder<Build>("builds/");
  const faces = inFolder<Face>("faces/");
  const changelog = inFolder<ChangelogEntry>("changelog/");

  // Published content may link only to published content.
  const statusOf = { build: statuses(builds), face: statuses(faces) };
  const link = (file: string, path: string, kind: "build" | "face", id: string) => {
    const status = statusOf[kind].get(id);
    if (status === "withdrawn") problems.push({ file, path, message: `${kind} "${id}" is withdrawn, so nothing may link to it (D-10)` });
    if (status === "draft") problems.push({ file, path, message: `${kind} "${id}" is a draft, so it has no page` });
  };
  // Two files with one id (builds/x.json and builds/old/x.json) would silently replace each other below.
  for (const list of [builds, faces, changelog]) {
    const seen = new Set<string>();
    for (const { path, item } of list) {
      if (seen.has(item.id)) problems.push({ file: path, path: "id", message: `"${item.id}" is used by another file` });
      seen.add(item.id);
    }
  }
  // Two sample faces in one place would leave Figma's library order to file names (D-107 (2)).
  const places = new Set<number>();
  for (const { path, item } of faces) {
    const place = item.sample?.place;
    if (place === undefined) continue;
    if (places.has(place)) problems.push({ file: path, path: "sample.place", message: `place ${place} is used by another sample face` });
    places.add(place);
  }
  // Home features one face of the week (Figma 364:2141).
  const weeks = faces.filter(({ item }) => item.status !== "withdrawn" && item.sample?.faceOfTheWeek === true);
  for (const { path } of weeks.slice(1)) problems.push({ file: path, path: "sample.faceOfTheWeek", message: "another sample face is already the face of the week" });
  // Only changelog entries and faces link; files are sorted by path, so this reports in path order.
  for (const { path, item } of [...changelog, ...faces]) {
    if (item.status !== "published") continue;
    if ("pairedBuild" in item) link(path, "pairedBuild", "build", item.pairedBuild);
    if ("affects" in item) {
      item.affects.builds.forEach((id, i) => link(path, `affects.builds[${i}]`, "build", id));
      item.affects.faces.forEach((id, i) => link(path, `affects.faces[${i}]`, "face", id));
    }
  }
  if (problems.length > 0) throw new ContentError(problems);

  const creatorById = new Map(creatorsFile.creators.map((c) => [c.id, c]));
  const creator = (id: string | null) => (id === null ? null : (creatorById.get(id) ?? null));
  const archetypeById = new Map(archetypeFile.archetypes.map((a) => [a.id, a]));
  const shown = (status: Status) => status === "published" || (includeDrafts && status === "draft");
  const shownOf = <T extends { status: Status; id: string }>(list: { item: T }[]) =>
    list.map(({ item }) => item).filter((item) => shown(item.status));

  const loadedBuilds = new Map<string, LoadedBuild>();
  for (const build of shownOf(builds)) {
    loadedBuilds.set(build.id, {
      ...build,
      archetype: required(archetypeById, build.archetype),
      credits: build.credits.map((c) => ({ ...c, creator: creator(c.creatorId) })),
    });
  }
  const loadedFaces = new Map<string, LoadedFace>();
  // Published items passed the link checks above, so their links must resolve. An id that names no file fails
  // validation in every mode. A draft shown on a preview build may still point at something withdrawn (or a
  // draft on the live site): that link is left out, and a draft face whose build isn't shown goes with it.
  const resolve = <T>(map: Map<string, T>, id: string, status: Status) => (status === "published" ? required(map, id) : map.get(id));
  for (const face of shownOf(faces)) {
    const pairedBuild = resolve(loadedBuilds, face.pairedBuild, face.status);
    if (!pairedBuild) continue;
    loadedFaces.set(face.id, {
      ...face,
      pairedBuild,
      credits: face.credits.map((c) => ({ ...c, creator: creator(c.creatorId) })),
      embeds: face.embeds.map((e) => ({ ...e, creator: creator(e.creatorId) })),
    });
  }
  const loadedChangelog = shownOf(changelog)
    .map((entry) => ({
      ...entry,
      affects: {
        builds: entry.affects.builds.flatMap((id) => resolve(loadedBuilds, id, entry.status) ?? []),
        faces: entry.affects.faces.flatMap((id) => resolve(loadedFaces, id, entry.status) ?? []),
      },
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const byId = <T extends { id: string }>(map: Map<string, T>) => [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
  return {
    archetypeFile,
    creators: creatorsFile.creators,
    playStyles: playStylesFile ? playStyleInfos(playStylesFile) : [],
    builds: byId(loadedBuilds),
    faces: byId(loadedFaces),
    changelog: loadedChangelog,
  };
}

function statuses(list: { item: { id: string; status: Status } }[]) {
  return new Map(list.map(({ item }) => [item.id, item.status]));
}

/** A link the checks above guarantee; a miss here is a bug in the loader, not in content. */
function required<T>(map: Map<string, T>, id: string): T {
  const value = map.get(id);
  if (value === undefined) throw new Error(`loadContent: "${id}" passed the link checks but wasn't loaded`);
  return value;
}
