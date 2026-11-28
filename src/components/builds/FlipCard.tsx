"use client";

import type { ReactNode } from "react";
import { useTilt } from "./useTilt";

// The Share build card that turns over (D-117, D-118; Figma "Build · share card flips", front 549:11147 / 549:11841 /
// 549:12532, back 549:13222 / 549:13916 / 549:14607): the Overview on the front, the Attributes on the back. A tap,
// click, Enter or Space turns it over: rotateY 180° over 400 ms, ease-out. Reduced motion swaps the sides with a fade.
// Both faces stay in the page, so Save images still makes both images and screen readers read both. Sizes are the
// 360 × 640 cards scaled by --s: 0.625 on phone (225 × 400), 0.8625 from tablet (311 × 552), 0.75 on screens under
// 830 px tall (270 × 480), where the larger card would push the dialog off the screen.
// On a mouse or pen the card also tilts toward the pointer (D-125 (1), useTilt): a layer around the flip, so the tilt
// adds to whichever side is showing and the flip's own 180° turn is untouched.
export function FlipCard({ front, back, side, onFlip }: { front: ReactNode; back: ReactNode; side: 0 | 1; onFlip: () => void }) {
  const flipped = side === 1;
  const { tilt, layer, sheen, handlers } = useTilt();
  return (
    // The faces are figures screen readers read in full; a transparent button over them turns the card (a button's own
    // contents aren't read out, so it can't hold the cards).
    <div
      data-testid="share-cards"
      className="relative mx-auto h-[calc(640px*var(--s))] w-[calc(360px*var(--s))] shrink-0 [--s:0.625] [perspective:1400px] tablet:[--s:0.8625] tablet:short:[--s:0.75]"
      {...handlers}
    >
      <div ref={tilt} data-part="tilt" className="relative size-full [transform-style:preserve-3d]">
        <div
          className={`relative size-full transition-transform duration-400 ease-out [transform-style:preserve-3d] motion-reduce:transform-none motion-reduce:transition-none ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <Face label="Share card 1 of 2" shown={!flipped} layer={layer(0)} sheen={sheen(0)}>
            {front}
          </Face>
          <Face label="Share card 2 of 2" shown={flipped} back layer={layer(1)} sheen={sheen(1)}>
            {back}
          </Face>
        </div>
      </div>
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={`Card ${side + 1} of 2. Tap to flip`}
        onClick={onFlip}
        className="absolute inset-0 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
      />
    </div>
  );
}

type Ref = (el: HTMLElement | null) => void;

function Face({ label, shown, back = false, layer, sheen, children }: { label: string; shown: boolean; back?: boolean; layer: Ref; sheen: Ref; children: ReactNode }) {
  return (
    // The page colour behind the contents, so their few pixels of depth never open a gap at the card's edge.
    <figure
      aria-label={label}
      className={`absolute inset-0 m-0 overflow-hidden rounded-md bg-bg-page shadow-[0_8px_24px_0_var(--color-system-backdrop)] [backface-visibility:hidden] motion-reduce:transition-opacity motion-reduce:duration-200 ${
        back ? "[transform:rotateY(180deg)] motion-reduce:transform-none" : ""
      } ${shown ? "" : "motion-reduce:opacity-0"}`}
    >
      <div ref={layer} className="absolute top-0 left-0 origin-top-left [transform:scale(var(--s))]">
        {children}
      </div>
      {/* The light under the pointer (the ticket's glare): outside the card's own node, so never in a saved image.
          A cream glow on the dark card, a faint white one on cream (85 % washed the text out); it fades with hover. */}
      <span
        ref={sheen}
        aria-hidden="true"
        data-part="sheen"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_closest-side,color-mix(in_srgb,var(--color-text-primary)_14%,transparent),transparent)] opacity-0 transition-opacity duration-(--dur-base) ease-(--ease-out) light:bg-[radial-gradient(circle_closest-side,color-mix(in_srgb,var(--color-bg-surface)_35%,transparent),transparent)]"
      />
    </figure>
  );
}
