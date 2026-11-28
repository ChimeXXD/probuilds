// Which way a page change moves (D-121 (2); DESIGN.md Motion: "the new page slides 40 px from the side it came from").
// The site reads left to right as the nav does: Home, Faces, Builds, Changelog, Submit, then the pages reached from the
// footer and the top bar (About, Takedown, Search) and anything else. A page in a section further right comes in from
// the right ("forward"); further left, from the left ("back"). Inside one section, a page deeper in (a face from the
// library, the Request tab of Submit) is forward and one further out is back; two pages at the same depth read as
// forward. The same page with another query or hash, and any change made from the keyboard, don't move ("still").
// A build card opening its build page "expand"s: its picture and name travel (Expand card, #22) and the page only fades.
import { SECTIONS } from "./nav";

export type PageMotion = "forward" | "back" | "expand" | "still";

const AFTER_SECTIONS = ["/about", "/takedown", "/search"];

/** The path alone, without query, hash or trailing slash ("/" stays "/"). */
function clean(href: string): string {
  const path = href.split(/[?#]/)[0] ?? "/";
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : "/";
}

function place(path: string): number {
  if (path === "/") return 0;
  const section = SECTIONS.findIndex((s) => s.href !== "/" && (path === s.href || path.startsWith(`${s.href}/`)));
  if (section !== -1) return section;
  const extra = AFTER_SECTIONS.findIndex((p) => path === p || path.startsWith(`${p}/`));
  return SECTIONS.length + (extra === -1 ? AFTER_SECTIONS.length : extra);
}

const depth = (path: string) => (path === "/" ? 0 : path.split("/").length - 1);

export function pageMotion(from: string, to: string, how: { byKey?: boolean; expand?: boolean } = {}): PageMotion {
  const a = clean(from);
  const b = clean(to);
  if (a === b || how.byKey) return "still";
  if (how.expand) return "expand";
  const [pa, pb] = [place(a), place(b)];
  if (pa !== pb) return pb > pa ? "forward" : "back";
  return depth(b) < depth(a) ? "back" : "forward";
}
