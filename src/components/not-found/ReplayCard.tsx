"use client";

import { type CSSProperties, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { PRESS, STATE_TRANSITION } from "@/components/ui/interaction";

// Figma Replay card (431:1219) with the "Over the bar" art (D-81, D-93). The art is Figma's vectors placed at
// their design positions as percentages of the 324.76 × 257.6 art box, so it scales with the art box (324.76 px
// wide on phone, 340.4 on tablet, 552 on desktop, per the Figma frames). One-colour parts are masks in token colours, so they follow light
// mode; the ball keeps its own cream and ink. Replay restarts the shot by remounting the ball; with reduced
// motion the last frame shows and the Replay tag hides.
const ART = "/art/over-the-bar";

function Mask({ file, className, style }: { file: string; className: string; style: CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      className={`icon-mask absolute ${className}`}
      style={{ "--icon": `url(${ART}/${file}.svg)`, ...style } as CSSProperties}
    />
  );
}

export function ReplayCard() {
  const [shot, setShot] = useState(0);
  return (
    <figure
      data-testid="replay-card"
      className="flex flex-col items-center rounded-[20px] bg-bg-surface px-3.5 pt-3.5 pb-[18px] tablet:px-4 tablet:pt-4 tablet:pb-[18.87px] desktop:pb-[30.6px]"
    >
      <div className="flex w-full items-center gap-2">
        <button
          type="button"
          onClick={() => setShot((n) => n + 1)}
          className={`tap-target flex items-center gap-1.5 rounded-full bg-bg-raised py-1 pr-2.5 pl-2 text-text-primary hover:bg-hover-fill-raised motion-reduce:hidden ${STATE_TRANSITION} ${PRESS}`}
        >
          <Icon name="play" size={14} />
          <span className="type-caption">Replay</span>
        </button>
        <span className="flex-1" />
        <span className="type-caption text-text-muted">404</span>
      </div>
      {/* The art box is the design's width per size, centred: 324.76 / 340.4 / 552 px, never wider than the card's
          content box (a 370 px tablet card with 16 px sides holds 338 px, so the art takes that). */}
      <div
        aria-hidden="true"
        className="relative aspect-[324.76/257.6] w-full max-w-[324.76px] shrink-0 [container-type:inline-size] tablet:max-w-[340.4px] desktop:max-w-[552px]"
      >
        <Mask file="net" className="text-border-strong" style={{ left: "13.03%", top: "62.86%", width: "73.94%", height: "32.86%" }} />
        {/* Figma's goal line is one straight 1.38 px stroke; Chrome paints nothing for a mask that thin, so it's a bar. */}
        <span className="absolute left-0 w-full bg-border-strong" style={{ top: "95.45%", height: "0.536%" }} />
        <Mask file="goal-frame" className="text-text-primary" style={{ left: "12.04%", top: "61.61%", width: "75.92%", height: "35.36%" }} />
        {["20.26%", "61.33%"].map((left) => (
          <span key={left} className="absolute font-display leading-[0.8] font-extrabold text-accent-fill light:text-accent-text" style={{ left, top: "20.71%", fontSize: "36.26cqw" }}>
            4
          </span>
        ))}
        <span
          key={shot}
          data-testid="replay-ball"
          className="absolute flex items-center justify-center motion-safe:animate-[over-the-bar_600ms_cubic-bezier(0.3,0.3,0.7,1)_both]"
          style={{ left: "36.29%", top: "5.04%", width: "27.13%", height: "34.2%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a fixed two-colour vector, no optimisation */}
          <img src={`${ART}/ball.svg`} alt="" className="h-[79.36%] w-[79.36%] -rotate-18" />
        </span>
        <Mask
          key={`lines-${shot}`}
          file="speed-lines"
          className="text-text-muted motion-safe:animate-[at-rest_600ms_linear_both]"
          style={{ left: "37.54%", top: "31.93%", width: "10.48%", height: "13.04%" }}
        />
      </div>
    </figure>
  );
}
