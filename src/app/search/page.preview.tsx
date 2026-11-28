import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { PlayStyleInfoProvider } from "@/components/builds/PlayStyleInfo";
import { SearchView } from "@/components/search/SearchView";
import { infosFor, plusUses } from "@/lib/content/playstyles";
import { siteContent } from "@/lib/content/site-content";
import { searchIndex } from "@/lib/search";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Search · ${SITE_NAME}` };

// Search results (Figma 376:2282 / 376:2393 / 376:2491; D-80 (3), a Should), opened from the top bar's search button.
// Preview only (D-105) while the faces and builds it searches are Figma's samples (D-107): rename this file to
// page.tsx to put it on probuilds.club. Everything searched is in the page; the search runs in the browser.
const publicDir = join(process.cwd(), "public");

export default function SearchPage() {
  const index = searchIndex(siteContent(), (file) => existsSync(join(publicDir, file)));
  // The found builds' PlayStyle+ badges open what each does (D-121 (4)).
  return (
    <PlayStyleInfoProvider infos={infosFor(siteContent().playStyles, plusUses(index.builds))}>
      <SearchView index={index} />
    </PlayStyleInfoProvider>
  );
}
