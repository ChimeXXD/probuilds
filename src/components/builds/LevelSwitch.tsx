"use client";

import { type ChangeEvent, type MouseEvent, useRef, useState } from "react";
import { Callout } from "@/components/ui/Callout";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { type ApShare, type LevelsView, nearestLevel, stepLevel } from "@/lib/build-level";
import { useChosenLevel } from "./ChosenLevel";

// Figma "Section - Your level" (298:3669) and its level-32 state (371:1697): "Your level" with − / + around the
// number, the AP line, and a slider whose knob sits at level ÷ 55 along the track. A level short of the build adds
// the warning under the section. TODO(Chime): only the levels the sample draws (55 and 32) have figures, so the
// slider and − / + move between those; every other level needs the archetype's attribute prices (O-14) and the AP
// each level gives (the level engine, Sharon's PR #7).
// TODO(Chime): "Your level", the stepper's glyphs and number and the AP line are drawn without a text style; built
// as drawn (Barlow Condensed 20, Barlow Bold 22, Barlow Condensed 24, Barlow 14 / 18.85). The AP line's two colours
// aren't tokens (Figma ab9b80 and efe6d4): text/muted and text/primary here. The knob's 3 px ring (Figma 0c0906) is
// accent/on-fill, the nearest token.
// Stat card (motion-bookmarks.pdf #13): the AP numbers roll to their new values with the level (RollingNumber, tabular
// figures so the line doesn't shift); only the ones that changed move. Storage meter (#14): a thin bar under the line,
// spent from the left and left over from the right, each by scaleX.
// Hover (D-121 (1)): the steppers take the page's faint hover fill, press 0.97; the knob turns accent/fill-hover
// while a mouse is over the slider (gated like every hover, by hand, as it is an arbitrary peer variant).
const STEP =
  "flex size-11 items-center justify-center rounded-sm font-text text-[22px] leading-[22px] font-bold text-text-primary " +
  "transition-[background-color,scale] duration-(--dur-fast) ease-(--ease-out) hover:bg-hover-fill-page active:scale-[0.97] motion-reduce:active:scale-100";

export function LevelSwitch({ levels }: { levels: LevelsView }) {
  const [{ level, still }, setOwn] = useState({ level: levels.initial, still: false });
  // The story cards follow the level picked here (D-114 (3)).
  const { choose } = useChosenLevel();
  // Number stepper (motion-bookmarks.pdf #12): the level rolls on a tap, but not on a key press or a tap that came
  // faster than the 140 ms roll (the frequent-action rule): those set the number at once.
  const lastChange = useRef(-Infinity);
  // Whether a pointer is pressing the slider: a change without one (arrow keys, VoiceOver) is set at once.
  const held = useRef(false);
  const drawn = levels.states.map((s) => s.level);
  const state = levels.states.find((s) => s.level === level) ?? levels.states[0];
  if (!state) return null;
  const setLevel = (next: number, at: number, byKey: boolean) => {
    if (next === state.level) return;
    setOwn({ level: next, still: byKey || at - lastChange.current < 140 });
    lastChange.current = at;
    choose(next);
  };
  // A click from Enter or Space has no pointer behind it (detail 0).
  const step = (e: MouseEvent<HTMLButtonElement>, dir: -1 | 1) => setLevel(stepLevel(drawn, state.level, dir), e.timeStamp, e.detail === 0);
  const p = state.level / levels.max;
  // Snap to the nearest drawn level; a small move without a pointer (an arrow key, Page Up/Down, VoiceOver) that would
  // snap straight back steps to the next drawn level that way instead, so the slider works from the keyboard. A drag
  // only snaps, so the knob doesn't flick between levels under the finger.
  const onSlide = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const nearest = nearestLevel(drawn, value);
    const next = !held.current && nearest === state.level && value !== state.level ? stepLevel(drawn, state.level, value < state.level ? -1 : 1) : nearest;
    if (held.current && next !== state.level) haptic();
    setLevel(next, e.timeStamp, !held.current);
  };
  // Whichever of pointerup / pointercancel comes first ends the press and removes both listeners; a key press always
  // counts as the keyboard, even if the pointer's release was never seen.
  const press = () => {
    held.current = true;
    const done = new AbortController();
    const release = () => {
      held.current = false;
      done.abort();
    };
    window.addEventListener("pointerup", release, { signal: done.signal });
    window.addEventListener("pointercancel", release, { signal: done.signal });
  };
  // Exposure slider (motion-bookmarks.pdf #16): the knob and the fill move together by transform, settling on the
  // level with the settle spring's small overshoot; a key press or a change faster than the roll moves them at once,
  // and reduced motion never animates them (the number crossfades instead).
  const glide = `transition-transform duration-(--spring-settle-ms) ease-(--spring-settle) motion-reduce:transition-none ${still ? "transition-none" : ""}`;

  return (
    <div data-testid="level-switch" className="flex flex-col">
      <section aria-labelledby="your-level" className="flex flex-col border-b border-border-subtle pt-2 pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 id="your-level" className="font-display text-[20px] leading-5 font-extrabold text-text-primary uppercase">Your level</h2>
            <div className="flex items-center rounded-sm border border-border-subtle bg-bg-page">
              <button type="button" aria-label="Level down" className={STEP} onClick={(e) => step(e, -1)}>
                −
              </button>
              <output aria-label="Level" className="flex h-11 w-13 items-center justify-center font-display text-[24px] leading-6 font-extrabold text-text-primary tabular-nums">
                <RollingNumber value={String(state.level)} still={still} />
              </output>
              <button type="button" aria-label="Level up" className={STEP} onClick={(e) => step(e, 1)}>
                +
              </button>
            </div>
          </div>
          {/* The meter hangs in the space above the knob, out of the flow, so the section keeps Figma's height. */}
          <div className="relative">
            <p aria-live="polite" className="font-text text-[14px] leading-[18.85px] font-medium text-text-muted">
              {`AP at level ${state.level}: `}
              <b className="font-bold text-text-primary tabular-nums">
                <RollingNumber value={state.ap} still={still} />
              </b>
              {" · spent "}
              <b className="font-bold text-text-primary tabular-nums">
                <RollingNumber value={state.spent} still={still} />
              </b>
              {" · left "}
              <b className="font-bold text-text-primary tabular-nums">
                <RollingNumber value={state.left} still={still} />
              </b>
            </p>
            <Meter share={state.share} still={still} />
          </div>
        </div>
        <div className="px-3.5 pt-0.5">
          <div className="relative h-11 [container-type:inline-size]">
            {/* The real control, invisible over the drawing; the knob shows its focus. */}
            <input
              type="range"
              aria-label="Your level"
              min={1}
              max={levels.max}
              value={state.level}
              onChange={onSlide}
              onPointerDown={press}
              onKeyDown={() => (held.current = false)}
              className="peer absolute inset-y-0 -left-3.5 z-10 h-full w-[calc(100%+28px)] cursor-pointer opacity-0"
            />
            <span aria-hidden="true" className="absolute top-4.75 -right-3.5 -left-3.5 h-1.5 overflow-hidden rounded-[3px] bg-bg-surface light:bg-border-subtle">
              {/* 14 px wider than the track, slid left so its end sits under the knob's centre (100cqw is the knob's
                  travel, the track less its 14 px ends): it moves with the knob, and is hidden under it at rest. */}
              <span
                data-testid="level-fill"
                className={`block h-full w-[calc(100%+14px)] bg-text-secondary ${glide}`}
                style={{ transform: `translateX(calc(${p - 1} * 100cqw - 28px))` }}
              />
            </span>
            <Ticks max={levels.max} special={levels.specializationAt} />
            {/* A zero-width carrier moved by the track's own width (cqw), so the knob never widens the page's scroll area. */}
            <span aria-hidden="true" data-testid="level-knob" className={`absolute top-2 left-0 h-7 w-0 ${glide}`} style={{ transform: `translateX(calc(${p} * 100cqw))` }}>
              <span className="absolute top-0 -left-3.5 size-7 rounded-full bg-accent-fill shadow-[0_0_0_3px_var(--color-accent-on-fill)] transition-colors duration-(--dur-fast) ease-(--ease-out) [@media(hover:hover)_and_(pointer:fine)]:[.peer:hover~*_&]:bg-accent-fill-hover [.peer:focus-visible~*_&]:outline-2 [.peer:focus-visible~*_&]:outline-offset-4 [.peer:focus-visible~*_&]:outline-focus-ring" />
            </span>
          </div>
        </div>
      </section>
      {state.callout && (
        <div data-testid="level-short">
          <Callout>{state.callout}</Callout>
        </div>
      )}
    </div>
  );
}

/** A light tick on each detent where the device can (Android; iOS Safari has no vibration). */
function haptic() {
  try {
    navigator.vibrate?.(5);
  } catch {
    // Refused (no user gesture yet, or blocked): the knob's settle is the feedback.
  }
}

/**
 * The Exposure slider's ticks (motion-bookmarks.pdf #16): one 1 px line for every level under the track, at level ÷ 55
 * like the knob; the specialization level's tick is taller. One box per tick rather than a tiled background, so each
 * snaps to the pixel grid on its own (WebKit rounds a tile's size, and 54 rounded tiles drift off the knob).
 * TODO(Chime): not drawn in Figma; tick length and colour are a proposal (border/subtle, 4 px; text/muted, 8 px).
 */
function Ticks({ max, special }: { max: number; special: number | null }) {
  return (
    <span aria-hidden="true" data-testid="level-ticks" className="absolute inset-x-0 top-[29px] h-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((l) => (
        <span
          key={l}
          data-testid={l === special ? "level-tick-special" : undefined}
          className={`absolute top-0 w-px ${l === special ? "h-2 bg-text-muted" : "h-1 bg-border-subtle"}`}
          style={{ left: `${(l / max) * 100}%` }}
        />
      ))}
    </span>
  );
}

/**
 * The Storage meter (motion-bookmarks.pdf #14): the level's AP as a 3 px bar in the gap under the AP line, spent (text/secondary) growing from the
 * left and what's left (lime, D-115's "AP left") from the right, on the track colour; in light mode left is accent/text and
 * spent border/strong (text/secondary beside accent/text was 1.03:1); status/danger when the build
 * needs more than the level gives. scaleX only, --dur-base --ease-out, no bounce (it is data); at once from the
 * keyboard and with reduced motion (the numbers crossfade).
 * TODO(Chime): not drawn in Figma; its height, place and colours are a proposal.
 */
function Meter({ share, still }: { share: ApShare; still: boolean }) {
  const move = `transition-transform duration-(--dur-base) ease-(--ease-out) motion-reduce:transition-none ${still ? "transition-none" : ""}`;
  return (
    <span aria-hidden="true" data-testid="ap-meter" className="absolute inset-x-0 top-[calc(100%+2.5px)] block h-0.75 overflow-hidden rounded-[2px] bg-bg-surface light:bg-border-subtle">
      <span
        data-part="spent"
        className={`absolute inset-0 origin-left ${share.over ? "bg-status-danger" : "bg-text-secondary light:bg-border-strong"} ${move}`}
        style={{ transform: `scaleX(${share.spent})` }}
      />
      <span data-part="left" className={`absolute inset-0 origin-right bg-accent-fill light:bg-accent-text ${move}`} style={{ transform: `scaleX(${share.left})` }} />
    </span>
  );
}
