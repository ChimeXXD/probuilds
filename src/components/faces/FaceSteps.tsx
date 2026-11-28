"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { TEXT_LINK } from "@/components/ui/interaction";
import {
  firstStep,
  isDone,
  nextLine,
  nextStep,
  prevStep,
  progressKey,
  progressLabel,
  type Recipe,
  readProgress,
  screenAt,
  sectionBar,
} from "@/lib/face-page";
import type { BuildPreviewView } from "@/lib/build-preview";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { AllSteps } from "./AllSteps";
import { DoneCard } from "./DoneCard";
import { SectionBar } from "./SectionBar";
import { StepCard } from "./StepCard";

// The walk through a face (D-72, D-73): the resume line or the "ticks start fresh" toast, the progress label with
// All steps and the section bar, then the step card and the "Next:" line, or, when every step is done, the Face done
// card and the matching build (D-79). The step the player is on is kept in this browser (A-07); the static page opens
// on step 1 and moves to the stored step once it has read it. Storage can be missing or refuse (private mode): the
// walk then still works, it just isn't remembered.
export const RESET_TOAST = "This face was updated. Your ticks start fresh.";

export function FaceSteps({ recipe, storage, paired }: { recipe: Recipe; storage: { id: string; version: number }; paired: BuildPreviewView }) {
  const [step, setStep] = useState(() => firstStep(recipe));
  // Shown on arrival only; any move hides them.
  const [notice, setNotice] = useState<"resumed" | "reset" | null>(null);
  // The player has moved since arriving: from then on the step number rolls and a finished section pops (Step
  // progress, motion-bookmarks #9); the jump to a stored step on arrival does neither.
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    let read: ReturnType<typeof readProgress> | null = null;
    try {
      read = readProgress(window.localStorage, storage.id, storage.version, recipe);
    } catch {
      return;
    }
    // Reading the browser's storage after the static HTML has rendered; nothing else sets these on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(read.step);
    setNotice(read.resumed ? "resumed" : read.reset ? "reset" : null);
  }, [recipe, storage.id, storage.version]);

  const go = (to: number) => {
    // A step no screen draws (Figma's sample) moves on to the next drawn one.
    const target = to > recipe.total || screenAt(recipe, to) ? to : nextStep(recipe, to - 1);
    setStep(target);
    setNotice(null);
    setMoved(true);
    try {
      if (target === firstStep(recipe)) window.localStorage.removeItem(progressKey(storage.id, storage.version));
      else window.localStorage.setItem(progressKey(storage.id, storage.version), JSON.stringify({ step: target }));
    } catch {
      // Not remembered; the walk goes on.
    }
  };
  const startOver = () => go(firstStep(recipe));
  const screen = screenAt(recipe, step);
  const back = prevStep(recipe, step);
  const done = isDone(recipe, step);
  const next = nextLine(recipe, step);
  // Kept between renders so SectionBar's effect runs only when the step moves.
  const sections = useMemo(() => sectionBar(recipe, step), [recipe, step]);

  return (
    <>
      {notice === "resumed" && (
        // Figma "Resume" (372:1981): bg/surface, 12 px corners, 10 / 14 px in.
        <div data-testid="face-resume" className="flex items-center justify-between gap-2 rounded-md bg-bg-surface px-3.5 py-2.5">
          <p className="type-label text-text-primary">Continuing from step {step}</p>
          <button type="button" onClick={startOver} className={`type-label tap-target shrink-0 text-text-primary ${TEXT_LINK}`}>
            Start over
          </button>
        </div>
      )}
      {/* Mounted empty with the static page, so the reset line is announced when it fills in (as Toast.tsx). Absolute
          (sr-only), so it takes no gap in the column. */}
      <p role="status" className="sr-only">
        {notice === "reset" ? RESET_TOAST : ""}
      </p>
      {notice === "reset" && (
        // Figma Toast, Tone=info (372:2198): the cream pill in the page's flow, above the progress.
        <p
          data-testid="face-reset"
          aria-hidden="true"
          className="type-label flex w-max max-w-[calc(100%+20px)] items-center gap-2 rounded-[22px] bg-bg-inverse py-3 pr-[18px] pl-3.5 text-text-inverse shadow-elevation-3 tablet:w-full tablet:max-w-full"
        >
          <Icon name="info" size={20} />
          <span className="min-w-0 flex-1">{RESET_TOAST}</span>
        </p>
      )}
      <div data-testid="face-progress" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="type-label text-text-primary" aria-live="polite">
            <StepLabel label={progressLabel(recipe, step)} still={!moved} />
          </p>
          <AllSteps recipe={recipe} step={step} onPick={go} />
        </div>
        <SectionBar sections={sections} pop={moved} />
      </div>
      {done ? (
        <DoneCard paired={paired} onStartOver={startOver} />
      ) : (
        screen && <StepCard screen={screen} onBack={back === null ? null : () => go(back)} onNext={() => go(nextStep(recipe, step))} />
      )}
      {!done && next && (
        <p data-testid="next-line" className="type-caption text-text-muted">
          {next}
        </p>
      )}
    </>
  );
}

/** "Step 9 of 18 · Sculpt" with the step number rolling as it changes (RollingNumber); "All 18 steps done" as it is. */
function StepLabel({ label, still }: { label: string; still: boolean }) {
  const parts = /^Step (\d+)( .*)$/.exec(label);
  if (!parts) return label;
  return (
    <>
      Step <RollingNumber value={parts[1] ?? ""} still={still} />
      {parts[2]}
    </>
  );
}
