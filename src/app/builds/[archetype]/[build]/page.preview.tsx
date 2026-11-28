import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuildPageView } from "@/components/builds/BuildPageView";
import { PlayStyleInfoProvider } from "@/components/builds/PlayStyleInfo";
import { buildPageView, buildPlayStyleUses, pageBuilds } from "@/lib/build-page";
import { infosFor } from "@/lib/content/playstyles";
import { siteContent } from "@/lib/content/site-content";
import { buildPreviewPath, previewImages } from "@/lib/link-preview";
import { SITE_NAME } from "@/lib/site";

// One page per build (Figma 298:3630 / 306:794 / 306:1286; D-63). Preview only (D-105) until builds are published:
// rename this file to page.tsx to put the pages on probuilds.club. Static export: the shown builds are every page
// there is.
export const dynamicParams = false;

type Props = { params: Promise<{ archetype: string; build: string }> };

const buildOf = ({ archetype, build }: { archetype: string; build: string }) =>
  siteContent().builds.find((b) => b.archetype.id === archetype && b.slug === build);

export function generateStaticParams() {
  return pageBuilds(siteContent().builds);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const build = buildOf(await params);
  const title = `${build?.title ?? "Build"} · ${SITE_NAME}`;
  // Its link preview (Figma 319:885), made at build time by src/app/og/[image]/route.preview.tsx.
  return { title, ...(build ? previewImages(buildPreviewPath(build), title) : {}) };
}

export default async function BuildPage({ params }: Props) {
  const build = buildOf(await params);
  if (!build) notFound();
  const view = buildPageView(build, siteContent().archetypeFile.sources);
  return (
    <PlayStyleInfoProvider infos={infosFor(siteContent().playStyles, buildPlayStyleUses(view))}>
      <BuildPageView view={view} />
    </PlayStyleInfoProvider>
  );
}
