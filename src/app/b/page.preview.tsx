import type { Metadata } from "next";
import { SharedBuildRoute } from "@/components/builds/SharedBuildRoute";
import { PlayStyleInfoProvider } from "@/components/builds/PlayStyleInfo";
import { siteContent } from "@/lib/content/site-content";
import { SHOW_DRAFTS } from "@/lib/drafts";
import { previewImages, sharedPreviewPath } from "@/lib/link-preview";
import { SAMPLE_SHARE_ID, sampleSharedBuild, sharedBuildPageView } from "@/lib/shared-build";
import { SITE_NAME } from "@/lib/site";

// A player's shared build, probuilds.club/b/<id> (Figma 439:8847 / 439:9404 / 439:9925 and, for a link that doesn't
// load, 440:8514 / 440:8634 / 440:8734; D-99 (2), D-100). One static page: public/_redirects rewrites /b/* here and
// the browser loads the build. Preview only (D-105) until the Supabase project exists (D-96) and Submit can share
// builds: rename this file to page.tsx then. The preview opens Figma's sample at /b/k7x2m9.
// Every shared link shows the one generic preview image (D-99 (2)): a picture per unlisted build needs a server.
export const metadata: Metadata = {
  title: `Shared build · ${SITE_NAME}`,
  ...previewImages(sharedPreviewPath, `Shared build · ${SITE_NAME}`),
};

export default function SharedBuildPage() {
  const { archetypeFile, builds } = siteContent();
  const meta = SHOW_DRAFTS ? builds.find((b) => b.id === "meta-finisher") : undefined;
  const sample = meta
    ? { id: SAMPLE_SHARE_ID, view: sharedBuildPageView(sampleSharedBuild(meta), archetypeFile.sources, SAMPLE_SHARE_ID) }
    : null;
  // A shared build is read in the browser, so the page carries every description (D-121 (4)).
  return (
    <PlayStyleInfoProvider infos={siteContent().playStyles}>
      <SharedBuildRoute archetypeFile={archetypeFile} sample={sample} />
    </PlayStyleInfoProvider>
  );
}
