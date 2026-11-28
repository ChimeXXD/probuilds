"use client";

import { createContext, type MouseEvent, type ReactNode, useContext, useRef, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { buttonClass, ButtonLabel } from "@/components/ui/Button";
import { PRESS_ENABLED, STATE_TRANSITION } from "@/components/ui/interaction";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { skipsMotion } from "@/lib/submit/motion";

// Small pieces Submit a build's steps share, each from its Figma part: the step line ("Submit a build · 1 of 4"),
// the round − / + buttons and the actions bar (sticky on phone, under the content from tablet). The slider is in
// Slider.tsx, the stars in Stars.tsx.

/** The step the editor came from, and whether the move skips its motion (a key press); null on the first step shown. */
export const StepFrom = createContext<{ step: number; still: boolean } | null>(null);

/**
 * "Submit a build" (Label/Default, text/secondary) and "1 of 4" (Label/Caption, text/muted), 20 px tall.
 * Step progress (motion-bookmarks.pdf #9): the step's number rolls from the one before, up going forward and down
 * going back (RollingNumber, 140 ms ease-out), so the move through the four steps reads in the corner the eye checks.
 * Not from the keyboard; reduced motion crossfades. Figma draws only the words, so there is no bar to fill.
 */
export function StepLine({ label, step }: { label: string; step: number }) {
  const from = useContext(StepFrom);
  return (
    <div className="flex h-5 items-center gap-2">
      <p className="type-label min-w-0 flex-1 text-text-secondary">{label}</p>
      <p data-testid="step-count" className="type-caption shrink-0 text-text-muted tabular-nums">
        <RollingNumber value={String(step)} from={from ? String(from.step) : undefined} still={from?.still ?? true} />
        {" of 4"}
      </p>
    </div>
  );
}

/**
 * Number stepper (motion-bookmarks.pdf #12): whether the next change of a rolling number skips its roll. `gate(at,
 * byKey, next)` is called with each change: a key press, or a change sooner than 140 ms after the last (ten fast taps on
 * +), sets the number at once instead of queueing rolls. Nothing rolls on the first view, and a change that didn't come
 * through `gate` (the value set from outside, as a new archetype resets height and weight) is set at once too.
 */
export function useRollGate(value: number) {
  const last = useRef(-Infinity);
  const [gated, setGated] = useState<{ still: boolean; value: number | null }>({ still: true, value: null });
  const gate = (at: number, byKey: boolean, next: number) => {
    setGated({ still: skipsMotion(at, last.current, byKey), value: next });
    last.current = at;
  };
  return [gated.still || gated.value !== value, gate] as const;
}

/** A round − or + button (bg/raised in a card, bg/surface on the page), with that surface's hover fill and a press. */
export function RoundButton({
  sign,
  label,
  onPress,
  size,
  surface = "raised",
  disabled = false,
}: {
  sign: "minus" | "plus";
  label: string;
  onPress: (e: MouseEvent<HTMLButtonElement>) => void;
  size: 44 | 48;
  surface?: "raised" | "surface";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onPress}
      className={`flex shrink-0 items-center justify-center rounded-full text-text-primary disabled:text-action-disabled ${PRESS_ENABLED} ${STATE_TRANSITION} ${surface === "raised" ? "bg-bg-raised not-disabled:hover:bg-hover-fill-raised" : "bg-bg-surface not-disabled:hover:bg-hover-fill"} ${size === 48 ? "size-12" : "size-11"}`}
    >
      <Icon name={sign} size={size === 48 ? 22 : 20} />
    </button>
  );
}

/**
 * The step's actions. Phone: a bar docked at the foot of the screen (bg/page, a divider above, 12 / 20 px in), Back
 * 117 px and the next step filling the rest, directly above the bottom nav: its surface runs on down behind the nav
 * (pb-nav-clear), so the nav floats on it and the page never shows between the two (D-125 (2); Figma 400:3219 drew the
 * bar in the nav's place, which read as the nav vanishing). The caller makes it sticky. Tablet and desktop: under the
 * content, on the right (Back 140, next 280).
 */
export function ActionsBar({
  back,
  next,
  nextWidth = "tablet:w-70",
  gap = "tablet:pt-10",
}: {
  back?: (e: MouseEvent<HTMLButtonElement>) => void;
  next: { label: string; onPress: (e: MouseEvent<HTMLButtonElement>) => void; disabled?: boolean };
  nextWidth?: string;
  gap?: string;
}) {
  return (
    <div
      data-testid="submit-actions"
      className={`flex gap-3 border-t border-system-divider bg-bg-page px-5 pt-3 pb-nav-clear tablet:justify-end tablet:border-0 tablet:px-0 tablet:pb-0 ${gap}`}
    >
      {back && (
        <button type="button" onClick={back} className={buttonClass("secondary", "w-29.25 shrink-0 tablet:w-35")}>
          <ButtonLabel icon="arrow-left" iconSide="left">
            Back
          </ButtonLabel>
        </button>
      )}
      <button
        type="button"
        data-testid="submit-next"
        disabled={next.disabled}
        onClick={next.onPress}
        className={buttonClass("primary", `min-w-0 flex-1 ${nextWidth} tablet:flex-none disabled:bg-action-disabled-bg disabled:text-action-disabled`)}
      >
        <ButtonLabel icon="arrow-right">{next.label}</ButtonLabel>
      </button>
    </div>
  );
}

/** A section heading (Heading/H3) with 12 px under it, and an optional caption on the right. */
export function SectionTitle({ children, aside, id }: { children: ReactNode; aside?: string; id?: string }) {
  return (
    <div className="flex items-center gap-2 pb-3">
      <h2 id={id} className="type-h3 min-w-0 flex-1 text-text-primary">
        {children}
      </h2>
      {aside && <p className="type-caption shrink-0 text-text-muted">{aside}</p>}
    </div>
  );
}
