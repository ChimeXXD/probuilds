"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/shell/Icon";
import { type ArchetypeView, buildsHref } from "@/lib/builds";
import { StanceCard } from "./StanceCard";
import { slot, useSwipeDeck } from "./useSwipeDeck";

// The swipeable Stance cards (D-57, D-60). The selected card is centred; its neighbours sit either side, scaled
// down, blurred and at 60%, as Figma's peeking instances do (D-56). Phone: a 380 px band, 252 px card 16 px from
// the top, neighbours 200 px wide 246.5 px off centre, cut by the screen edge. Tablet: a 350 px column, 280 px
// card, 180 px neighbours behind it 85 px off centre. Desktop: 560 px, 392 px card, 230 px neighbours 165 px off.
// A horizontal drag is the Swipe deck (useSwipeDeck: only the front card moves, D-116; a flick throws it, the next
// card settles in with the settle spring); a tap on a neighbour picks it. Tablet and desktop add previous and next
// buttons with "12 of 13". A change from a tap, an arrow or the rail moves the cards on the same settle spring as a
// throw (D-121 (3), Chime: "It should be the same animation"), opacity on 250 ms --ease-out; a jump along the rail
// carries the old cards out and the new ones in the way the deck is going. The keyboard moves nothing (D-120 (2));
// reduced motion keeps only the fade. A tap or click on the front card opens the archetype's builds (D-121 (3)), the
// page its "See … builds" button opens; a press that became a drag never does. The card is not a second link for
// the keyboard or a screen reader: the button under it is that way in (as Submit's "Your card" does).
const MOVE =
  "[transition:transform_var(--spring-settle-ms)_var(--spring-settle),opacity_250ms_var(--ease-out)] motion-reduce:[transition:opacity_250ms_var(--ease-out)]";
const STAGE =
  "relative h-[380px] w-full touch-pan-y overflow-hidden select-none [--card-top:16px] [--card-w:252px] [--peek-s:0.7937] [--peek-x:246.5px] " +
  "tablet:h-[386.67px] tablet:w-[350px] tablet:overflow-visible tablet:[--card-top:0px] tablet:[--card-w:280px] tablet:[--peek-s:0.6429] tablet:[--peek-x:85px] " +
  "desktop:h-[541.33px] desktop:w-[560px] desktop:[--card-w:392px] desktop:[--peek-s:0.5867] desktop:[--peek-x:165px]";
const ARROW =
  "flex size-13 items-center justify-center rounded-sm border-[1.5px] border-border-strong text-text-primary disabled:text-action-disabled";

export function StanceStage({
  archetypes,
  selected,
  still,
  onSelect,
}: {
  archetypes: ArchetypeView[];
  selected: number;
  /** The last change came from the keyboard: the cards change places at once. */
  still: boolean;
  onSelect: (index: number, still?: boolean) => void;
}) {
  const current = archetypes[selected];
  const go = (i: number, byKey = false) => {
    if (i >= 0 && i < archetypes.length) onSelect(i, byKey);
  };
  const { stage, cardRef, trail, dragged, handlers } = useSwipeDeck({ selected, count: archetypes.length, still, onSelect: go });

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div ref={stage} data-testid="stance-stage" className={STAGE} {...handlers}>
        {archetypes.map((a, i) => {
          const offset = i - selected;
          // Cards of the window being left stay for their flight out (trail), parked two slots off and faded.
          const leaving = trail.some((t) => Math.abs(i - t) <= 2);
          if (Math.abs(offset) > 2 && !leaving) return null;
          const centre = offset === 0;
          const peek = Math.abs(offset) === 1;
          const style = { transform: slot(Math.max(-2, Math.min(2, offset))) } as CSSProperties;
          return (
            <div
              key={a.id}
              ref={cardRef(i)}
              data-testid={`stance-card-${a.id}`}
              aria-hidden={centre ? undefined : true}
              onClick={peek ? () => !dragged() && go(i) : undefined}
              style={style}
              className={`absolute top-(--card-top) left-1/2 aspect-[252/348] w-(--card-w) ${still ? "transition-none" : MOVE} ${
                centre ? "z-2" : peek ? "z-1 cursor-pointer opacity-60 blur-[1.5px]" : "pointer-events-none opacity-0"
              }`}
            >
              <StanceCard archetype={a} eager={centre} />
              {centre && (
                // The whole front card opens the builds page. Out of the tab order and hidden from screen readers:
                // the "See … builds" button is the same link for them. Not draggable, so a drag stays a swipe.
                <Link
                  href={buildsHref(a)}
                  tabIndex={-1}
                  aria-hidden="true"
                  draggable={false}
                  data-testid="stance-card-open"
                  onClick={(e) => dragged() && e.preventDefault()}
                  className="absolute inset-0 z-3"
                />
              )}
            </div>
          );
        })}
        {current && (
          <p aria-live="polite" className="sr-only">
            {`${current.name}, ${current.groupLabel}`}
          </p>
        )}
      </div>
      <div className="mt-5 hidden items-center gap-[30px] tablet:flex desktop:mt-6 desktop:gap-[38px]">
        <button type="button" aria-label="Previous archetype" disabled={selected === 0} onClick={(e) => go(selected - 1, e.detail === 0)} className={ARROW}>
          <Icon name="chevron-left" size={24} />
        </button>
        <span className="type-caption text-text-secondary">{current ? `${current.place} of ${current.total}` : ""}</span>
        <button
          type="button"
          aria-label="Next archetype"
          disabled={selected === archetypes.length - 1}
          onClick={(e) => go(selected + 1, e.detail === 0)}
          className={ARROW}
        >
          <Icon name="chevron-right" size={24} />
        </button>
      </div>
    </div>
  );
}
