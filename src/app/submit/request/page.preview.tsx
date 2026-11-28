import type { Metadata } from "next";
import { RequestFace } from "@/components/faces/RequestFace";
import { SHOW_DRAFTS } from "@/lib/drafts";
import { SITE_NAME } from "@/lib/site";

// Request a face, Submit's second tab (D-121 (5); Figma "Phase 4 · Changelog & Submit": 402:3451 / 418:9607 / 418:9742
// and its states; D-83, D-84, D-96). Preview only (D-105) until the Supabase project exists: rename this file to
// page.tsx then. With no project the preview shows Figma's sample list (D-107).
export const metadata: Metadata = { title: `Request a face · ${SITE_NAME}` };

export default function RequestFacePage() {
  return <RequestFace preview={SHOW_DRAFTS} />;
}
