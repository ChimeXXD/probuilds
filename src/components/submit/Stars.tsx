"use client";

import { type CSSProperties, type MouseEvent, useRef, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { PRESS, STATE_TRANSITION } from "@/components/ui/interaction";
import { popFrames, starDelays } from "@/lib/submit/motion";
import { reducedMotion } from "@/lib/motion";

// Five stars, the first `value` lit (Figma Icon/star: accent/text lit, border/strong not). Each star sets the count.
// Star rating (motion-bookmarks.pdf #17). Purpose: feedback where the finger is, and the count read as a row filling.
// - The star picked pops: scale 1 → 1.15 → 1 on the pop spring, sampled into Web Animations keyframes (popFrames), so it
//   runs off the main thread and a second tap simply starts a new pop.
// - The stars before it that were off fill left to right, 30 ms apart; stars that go out go out together. Each star is
//   two icons, off and lit, and only the lit one's opacity changes (--dur-fast, ease-out), never its colour.
// - On a computer (hover and a fine pointer only), hovering a star previews that count: the stars it would light show at
//   half strength, the lit ones it would turn off dim to half. No preview on touch (a tap would leave it stuck).
// From the keyboard (Enter or Space on a star) the stars change at once, with no pop. Reduced motion: no pop and no
// wave; the stars fade together.
const POP = popFrames().map((s) => ({ scale: String(s) }));
const POP_MS = Math.round(((POP.length - 1) / 120) * 1000);

export function Stars({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  // The last pick's wave, kept only for the value it set: a value changed from elsewhere never replays it.
  const [picked, setPicked] = useState<{ value: number; delays: (number | null)[]; key: boolean } | null>(null);
  const change = picked?.value === value ? picked : null;
  const [preview, setPreview] = useState<number | null>(null);
  const icons = useRef<(HTMLSpanElement | null)[]>([]);

  const pick = (n: number, e: MouseEvent<HTMLButtonElement>) => {
    const key = e.detail === 0;
    const calm = key || reducedMotion();
    setPicked({ value: n, delays: calm ? [null, null, null, null, null] : starDelays(n, value), key });
    setPreview(null);
    if (!calm) icons.current[n - 1]?.animate(POP, { duration: POP_MS, easing: "linear" });
    onChange(n);
  };
  // Hover preview, only for a mouse or trackpad on a device that hovers.
  const hover = (n: number | null) => {
    if (n !== null && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setPicked(null);
    setPreview(n);
  };

  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1" onPointerLeave={() => setPreview(null)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const lit = n <= value;
        const shown = preview === null ? (lit ? 1 : 0) : n <= preview ? (lit ? 1 : 0.5) : lit ? 0.5 : 0;
        const delay = change?.delays[n - 1];
        const style = { opacity: shown, transitionDelay: delay ? `${delay}ms` : undefined } as CSSProperties;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            onClick={(e) => pick(n, e)}
            onPointerEnter={(e) => e.pointerType === "mouse" && hover(n)}
            className={`tap-target flex size-6 ${STATE_TRANSITION} ${PRESS}`}
          >
            <span ref={(el) => void (icons.current[n - 1] = el)} data-part="star" className="grid size-6">
              <span className="col-start-1 row-start-1 flex text-border-strong">
                <Icon name="star" size={24} />
              </span>
              <span
                data-part="lit"
                className={`col-start-1 row-start-1 flex text-accent-text ${change?.key ? "" : "transition-opacity duration-(--dur-fast) ease-(--ease-out)"}`}
                style={style}
              >
                <Icon name="star" size={24} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
