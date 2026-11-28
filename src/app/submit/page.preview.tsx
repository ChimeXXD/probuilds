import type { Metadata } from "next";
import { PlayStyleInfoProvider } from "@/components/builds/PlayStyleInfo";
import { SubmitEditor } from "@/components/submit/SubmitEditor";
import { siteContent } from "@/lib/content/site-content";
import { SHOW_DRAFTS } from "@/lib/drafts";
import { SITE_NAME } from "@/lib/site";
import { SAMPLE_DRAFT } from "@/lib/submit/editor";

// Submit a build (Figma "Phase 4 · Changelog & Submit": start 400:3219, attributes 399:3121, PlayStyles 406:3024,
// name and share 401:3616, sent for listing 429:5828, and their states; D-85 to D-90, D-99, D-100). Preview only
// (D-105) until the Supabase project exists (D-96) and Chime has the attribute prices (O-14): rename this file to
// page.tsx then. The editor opens on Figma's sample build (D-107).
// TODO(Chime): what a new build starts from on probuilds.club (each archetype's starting values aren't recorded).
export const metadata: Metadata = { title: `Submit a build · ${SITE_NAME}` };

export default function SubmitPage() {
  const { archetypeFile, playStyles } = siteContent();
  // The PlayStyles step lists every PlayStyle, each with an info button (D-121 (4)).
  return (
    <PlayStyleInfoProvider infos={playStyles}>
      <SubmitEditor file={archetypeFile} initial={SAMPLE_DRAFT} preview={SHOW_DRAFTS} />
    </PlayStyleInfoProvider>
  );
}
