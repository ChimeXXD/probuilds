import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayStyleInfoProvider } from "@/components/builds/PlayStyleInfo";
import { FacePageView } from "@/components/faces/FacePageView";
import { infosFor, plusUses } from "@/lib/content/playstyles";
import { siteContent } from "@/lib/content/site-content";
import { faceOgView } from "@/lib/face-og";
import { facePageView } from "@/lib/face-view";
import { previewImages } from "@/lib/link-preview";
import { SITE_NAME } from "@/lib/site";

// The face page (Figma "Phase 2 · Faces": 353:1410 / 427:8649 / 427:8767 and its states; D-71 to D-74, D-79). Preview
// only (D-105) until faces are published: rename this file to page.tsx to put it on probuilds.club. Today the faces are
// Figma's five samples with its sample recipe and stand-in pictures (D-107, D-108).
const publicDir = join(process.cwd(), "public");
const faceBySlug = (slug: string) => siteContent().faces.find((f) => f.slug === slug);

export const dynamicParams = false;

export function generateStaticParams() {
  return siteContent().faces.map((f) => ({ slug: f.slug }));
}

// The link preview (Figma 430:7306) is made at build time beside the page (./og.png); its absolute address comes from
// the same helper as the build pages' (lib/link-preview.ts: the preview deployment's own, else probuilds.club).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const face = faceBySlug((await params).slug);
  if (!face) return { title: SITE_NAME };
  const og = faceOgView(face);
  const title = `${face.title} · ${SITE_NAME}`;
  const preview = previewImages(`/faces/${face.slug}/og.png`, og.alt);
  return {
    ...preview,
    title,
    openGraph: { ...preview.openGraph, title, description: og.facts, type: "article" },
    twitter: { ...preview.twitter, title, description: og.facts },
  };
}

export default async function FacePage({ params }: { params: Promise<{ slug: string }> }) {
  const face = faceBySlug((await params).slug);
  if (!face) notFound();
  const view = facePageView(face, (file) => existsSync(join(publicDir, file)));
  // The paired build's PlayStyle+ badges open what each does (D-121 (4)).
  return (
    <PlayStyleInfoProvider infos={infosFor(siteContent().playStyles, plusUses([view.paired]))}>
      <FacePageView view={view} />
    </PlayStyleInfoProvider>
  );
}
