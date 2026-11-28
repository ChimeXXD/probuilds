import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchetypeBuildsView } from "@/components/builds/ArchetypeBuildsView";
import { PlayStyleInfoProvider } from "@/components/builds/PlayStyleInfo";
import { archetypeBuilds, buildCardView } from "@/lib/archetype-page";
import { archetypeViews } from "@/lib/builds";
import { infosFor, plusUses } from "@/lib/content/playstyles";
import { siteContent } from "@/lib/content/site-content";
import { SITE_NAME } from "@/lib/site";

// One page per archetype, its builds as stat strip cards (Figma 288:1031 / 290:796 / 290:1084; D-62). Preview only
// (D-105) until builds are published (its emblems ship since D-106): rename this file to page.tsx to put
// the pages on probuilds.club. Static export: the 13 archetypes are every page there is.
export const dynamicParams = false;

type Props = { params: Promise<{ archetype: string }> };

const archetypeOf = (id: string) => archetypeViews(siteContent().archetypeFile).find((a) => a.id === id);

export function generateStaticParams() {
  return siteContent().archetypeFile.archetypes.map((a) => ({ archetype: a.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const archetype = archetypeOf((await params).archetype);
  return { title: `${archetype?.name ?? "Builds"} builds · ${SITE_NAME}` };
}

export default async function ArchetypePage({ params }: Props) {
  const archetype = archetypeOf((await params).archetype);
  if (!archetype) notFound();
  const cards = archetypeBuilds(siteContent().builds, archetype.id).map((b) => buildCardView(b));
  return (
    <PlayStyleInfoProvider infos={infosFor(siteContent().playStyles, plusUses(cards))}>
      <ArchetypeBuildsView archetype={archetype} cards={cards} />
    </PlayStyleInfoProvider>
  );
}
