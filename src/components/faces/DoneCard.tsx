import Link from "next/link";
import { Icon } from "@/components/shell/Icon";
import { buttonClass } from "@/components/ui/Button";
import { BuildPreviewCard } from "@/components/ui/BuildPreviewCard";
import type { BuildPreviewView } from "@/lib/build-preview";

// Figma "Done card" (372:2086) and "Matching build" (374:2043), the finished state (D-79): a bg/surface card, 20 px
// corners, 20 / 18 px in, 10 px apart: the lime check (32 px), "Face done" (H3), what to do now (Body, secondary), and
// Start over (secondary) beside Back to faces (primary), half each. Then "Set up the matching build" (H3) over the
// build's card. The build slides up once as the face is finished (UI-BRIEF §3); under reduced motion it only fades.
export function DoneCard({ paired, onStartOver }: { paired: BuildPreviewView; onStartOver: () => void }) {
  return (
    <>
      <section aria-labelledby="face-done-title" className="flex flex-col gap-2.5 rounded-[20px] bg-bg-surface px-[18px] py-5">
        <span className="flex text-accent-text">
          <Icon name="check-circle" size={32} />
        </span>
        <h2 id="face-done-title" className="type-h3 text-text-primary">
          Face done
        </h2>
        <p className="type-body text-text-secondary">Save it, then check it in a match cutscene, not only in the editor.</p>
        <div className="flex gap-2 pt-1.5">
          <button type="button" onClick={onStartOver} className={buttonClass("secondary", "flex-1 basis-0 whitespace-nowrap px-3!", "large", "surface")}>
            Start over
          </button>
          <Link href="/faces" className={buttonClass("primary", "flex-1 basis-0 whitespace-nowrap px-3!")}>
            Back to faces
          </Link>
        </div>
      </section>
      <section
        aria-labelledby="matching-build-title"
        className="flex flex-col gap-3 transition-[opacity,translate] duration-300 ease-out starting:translate-y-3 starting:opacity-0 motion-reduce:starting:translate-y-0"
      >
        <h2 id="matching-build-title" className="type-h3 text-text-primary">
          Set up the matching build
        </h2>
        <BuildPreviewCard build={paired} testId="paired-build" />
      </section>
    </>
  );
}
