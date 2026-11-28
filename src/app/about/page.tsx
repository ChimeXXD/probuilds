import type { Metadata } from "next";
import { Icon } from "@/components/shell/Icon";
import { STATE_TRANSITION } from "@/components/ui/interaction";
import { PageContent } from "@/components/ui/PageContent";
import { SHOW_DRAFTS } from "@/lib/drafts";
import { NOTICE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `About · ${SITE_NAME}` };

// Figma About, option C (D-91): questions that open in place. The copy is the design's, word for word.
// TODO(Chime): six questions in the design have no answer yet (O-22 (3)). Figma draws them closed (416:3589), so the
// preview shows them as drawn (D-107), with nothing under them when opened; probuilds.club leaves them out until
// there is copy.
const UNANSWERED = [
  "What does “Not yet checked in game” mean?",
  "What's the date on every card?",
  "Can I send a build?",
  "How do face requests work?",
  "Are you part of EA?",
  "How do I get something removed?",
];
const QUESTIONS = [
  {
    q: "What is ProBuilds?",
    a: "Faces and builds for EA SPORTS FC 27 Clubs. Each face is a step-by-step recipe from the editor; each build is a card with its attributes and PlayStyles.",
  },
  {
    q: "Who makes them?",
    a: "Chime and Sharon, in game, on their own consoles. Builds sent by players are checked by Chime before they're listed.",
  },
];
// The preview adds the unanswered questions, closed and empty, after the answered ones.
const ROWS: { q: string; a: string | null }[] = [...QUESTIONS, ...(SHOW_DRAFTS ? UNANSWERED.map((q) => ({ q, a: null })) : [])];

export default function AboutPage() {
  return (
    <PageContent className="flex flex-col desktop:grid desktop:grid-cols-[400px_1fr] desktop:grid-rows-[auto_1fr] desktop:gap-x-24">
      <div className="desktop:col-start-1 desktop:row-start-1">
        <h1 className="type-h1 text-text-primary">About ProBuilds</h1>
        <p className="type-body-lg mt-2.5 text-text-secondary">The short answers. Free, always.</p>
      </div>
      <div className="mt-6 desktop:col-start-2 desktop:row-span-2 desktop:row-start-1 desktop:mt-0">
        {ROWS.map(({ q, a }) => (
          <details key={q} open={a !== null} className="group border-b border-system-divider">
            {/* The 16 px row padding is on the summary, so the whole 54 px row opens and closes it. Hover (D-121 (1)): the
                row takes the page's faint fill (12 px each side, taken back by a negative margin) and its chevron
                turns text/primary. */}
            <summary
              className={`type-label group/q -mx-3 flex cursor-pointer list-none items-center gap-3 rounded-sm px-3 py-4 text-text-primary hover:bg-hover-fill-page [&::-webkit-details-marker]:hidden ${STATE_TRANSITION}`}
            >
              <span className="flex-1">{q}</span>
              <span className={`hidden text-text-secondary group-open:inline-flex group-hover/q:text-text-primary ${STATE_TRANSITION}`}>
                <Icon name="chevron-up" size={22} />
              </span>
              <span className={`inline-flex text-text-secondary group-open:hidden group-hover/q:text-text-primary ${STATE_TRANSITION}`}>
                <Icon name="chevron-down" size={22} />
              </span>
            </summary>
            {a !== null && <p className="type-body -mt-1.5 pb-4 text-text-secondary">{a}</p>}
          </details>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-1.5 self-start rounded-[14px] bg-bg-surface px-4 py-3.5 desktop:col-start-1 desktop:row-start-2 desktop:mt-8">
        <p className="type-label text-text-primary">Not EA, not the people named</p>
        <p className="type-caption text-text-secondary">{NOTICE}</p>
      </div>
    </PageContent>
  );
}
