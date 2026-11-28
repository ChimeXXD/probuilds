import { existsSync } from "node:fs";
import { join } from "node:path";
import { PlayStyleInfoProvider } from "@/components/builds/PlayStyleInfo";
import { HomeView } from "@/components/home/HomeView";
import { infosFor, plusUses } from "@/lib/content/playstyles";
import { siteContent } from "@/lib/content/site-content";
import { homeView } from "@/lib/home";
import { SITE_NAME } from "@/lib/site";

// Home (Figma 364:2118 / 367:1629 / 367:1836; D-75 to D-78). It shows once content fills every section: faces, the
// face of the week, the three lines' builds and the latest changes. On the preview that is Figma's samples and the
// draft changelog (D-107). probuilds.club keeps the placeholder: only a sample face can be the face of the week
// today, and samples are never published, so Home goes live once Chime sets the rule for real faces (lib/home.ts).
const publicDir = join(process.cwd(), "public");

export default function Home() {
  const view = homeView(siteContent(), (file) => existsSync(join(publicDir, file)));
  if (view) {
    // The build cards' PlayStyle+ badges open what each does (D-121 (4)).
    return (
      <PlayStyleInfoProvider infos={infosFor(siteContent().playStyles, plusUses(view.builds))}>
        <HomeView view={view} />
      </PlayStyleInfoProvider>
    );
  }
  return (
    <main>
      <h1>{SITE_NAME}</h1>
      <p>Work in progress</p>
    </main>
  );
}
