import type { Metadata } from "next";
import { BuildsView } from "@/components/builds/BuildsView";
import { PlayStyleInfoProvider } from "@/components/builds/PlayStyleInfo";
import { archetypeViews } from "@/lib/builds";
import { infosFor } from "@/lib/content/playstyles";
import { siteContent } from "@/lib/content/site-content";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Builds · ${SITE_NAME}` };

// The archetype picker (Figma 241:556 / 279:1399 / 276:1073; D-57, D-60). Preview only for now (D-105); its emblems
// ship since D-106. Rename this file to page.tsx to put the page on probuilds.club.
export default function BuildsPage() {
  const { archetypeFile, playStyles } = siteContent();
  const archetypes = archetypeViews(archetypeFile);
  // Every signature (PlayStyle) and specialization (PlayStyle+) badge opens what it does (D-121 (4)).
  const uses = archetypes.flatMap((a) => [
    ...a.signature.map((p) => ({ name: p.name, tier: "playStyle" as const })),
    ...a.specializations.map((s) => ({ name: s.plus.name, tier: "plus" as const })),
  ]);
  return (
    <PlayStyleInfoProvider infos={infosFor(playStyles, uses)}>
      <BuildsView archetypes={archetypes} />
    </PlayStyleInfoProvider>
  );
}
