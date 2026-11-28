"use client";

import { type ChangeEvent, memo, useEffect, useRef, useState } from "react";

// Submit a build's slider (Figma: a 4 px track, the value in lime and a 20 px cream knob): a real range input,
// invisible, over the drawing. The knob's centre sits at the value's share of the track, as Figma draws it (44 of 55 →
// 80 %); `mark` draws the middle tick of the height and weight sliders. The knob and the fill move by transform only
// (translateX in the track's own width, 100cqw, and scaleX), so a moving knob never lays the row out again.
// Two kinds of motion (motion-bookmarks.pdf), both skipped when the parent marks a change `still` (a key press, or a
// change faster than the one before it could play) and under reduced motion:
// - "settle", the Exposure slider (#16), the level: a 1 px tick under the track for every level, and the knob and fill
//   settle on the new level with the settle spring's one small overshoot, as the Build page's level slider does. While
//   a finger drags across a level, a light haptic tick (`navigator.vibrate(5)`, where the phone has it).
// - "follow", the Range slider (#15), height and weight: while held, the knob grows 1.1× and a bubble with the value
//   rides on it, both on the follow spring (no overshoot: the finger leads, the knob keeps up); the knob follows its
//   steps on the same spring. A key press moves it at once and shows no bubble.
// The knob shows the input's focus ring; the bubble is hidden from screen readers (the value is read from the input).
// Hover (a mouse or trackpad, D-121 (1)): the track steps to the hovered border colour and the knob grows to 1.1×, the
// size it is held at, saying "grab me".
export type SlideInfo = { held: boolean; at: number };

export function Slider({
  label,
  min,
  max,
  value,
  onChange,
  fill = true,
  mark = false,
  motion = null,
  still = true,
  ticks = false,
  bubble,
  valueText,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number, info: SlideInfo) => void;
  fill?: boolean;
  mark?: boolean;
  motion?: "settle" | "follow" | null;
  still?: boolean;
  ticks?: boolean;
  bubble?: string;
  /** What a screen reader says for the value (aria-valuetext), when the bare number is not what the screen shows. */
  valueText?: string;
}) {
  const p = Math.min(Math.max(value - min, 0), max - min) / (max - min);
  // Whether a pointer is pressing the slider (React state only on press and release, never per move).
  const [held, setHeld] = useState(false);
  const heldNow = useRef(false);
  const pressing = useRef<AbortController | null>(null);
  // A slider removed mid-press (the step changes) drops its window listeners with it.
  useEffect(() => () => pressing.current?.abort(), []);
  const press = () => {
    pressing.current?.abort();
    heldNow.current = true;
    setHeld(true);
    const done = new AbortController();
    pressing.current = done;
    // Whichever of pointerup / pointercancel comes first ends the press and removes both listeners.
    const release = () => {
      heldNow.current = false;
      setHeld(false);
      done.abort();
    };
    window.addEventListener("pointerup", release, { signal: done.signal });
    window.addEventListener("pointercancel", release, { signal: done.signal });
  };
  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    if (motion === "settle" && heldNow.current && next !== value) haptic();
    onChange(next, { held: heldNow.current, at: e.timeStamp });
  };
  const follow = motion === "follow" && held;
  const glide =
    motion === "settle" && !still
      ? "transition-transform duration-(--spring-settle-ms) ease-(--spring-settle)"
      : motion === "follow" && (!still || held)
        ? "transition-transform duration-(--spring-follow-ms) ease-(--spring-follow)"
        : "transition-none";
  const move = `${glide} motion-reduce:transition-none`;
  return (
    <div className="relative h-5 [container-type:inline-size]">
      <input
        type="range"
        aria-label={label}
        aria-valuetext={valueText}
        min={min}
        max={max}
        value={Math.min(value, max)}
        onChange={change}
        onPointerDown={press}
        onKeyDown={() => (heldNow.current = false)}
        className="peer absolute -inset-x-2.5 -inset-y-3 z-10 cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-2 h-1 overflow-hidden rounded-[2px] bg-border-strong transition-colors duration-(--dur-fast) ease-(--ease-out) can-hover:[.peer:hover~&]:bg-input-border-hovered"
      >
        {fill && <span data-part="fill" className={`block h-full origin-left bg-accent-fill ${move}`} style={{ transform: `scaleX(${p})` }} />}
      </span>
      {mark && <span aria-hidden="true" className="absolute top-1 left-1/2 h-3 w-0.5 -translate-x-1/2 bg-text-muted" />}
      {ticks && <Ticks min={min} max={max} />}
      {/* A zero-width carrier moved by the track's width (cqw), so the knob never widens the page's scroll area. */}
      <span aria-hidden="true" data-part="knob" className={`absolute top-0 left-0 h-5 w-0 ${move}`} style={{ transform: `translateX(calc(${p} * 100cqw))` }}>
        <span
          data-part="knob-dot"
          className={`absolute top-0 -left-2.5 size-5 rounded-full bg-text-primary transition-[scale] duration-(--spring-follow-ms) ease-(--spring-follow) motion-reduce:transition-none motion-reduce:scale-100 can-hover:[.peer:hover~*_&]:scale-110 [.peer:focus-visible~*_&]:outline-2 [.peer:focus-visible~*_&]:outline-offset-2 [.peer:focus-visible~*_&]:outline-focus-ring ${
            follow ? "scale-110" : ""
          }`}
        />
        {bubble !== undefined && (
          <span
            data-part="bubble"
            className={`type-caption absolute bottom-[calc(100%+10px)] left-0 origin-bottom rounded-sm bg-system-tooltip px-2 py-1 whitespace-nowrap text-system-on-tooltip shadow-elevation-2 transition-[opacity,scale] duration-(--dur-fast) ease-(--ease-out) motion-reduce:scale-100 ${
              follow ? "" : "scale-90 opacity-0"
            }`}
            // Centred on the knob mid-track, sliding to sit inside the track at its ends (break-ui: at 190 cm a centred
            // bubble hung past the card's edge).
            style={{ translate: `${-p * 100}% 0` }}
          >
            {bubble}
          </span>
        )}
      </span>
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
 * The Exposure slider's ticks (#16): a 1 px line under the track for every whole value from min + 1 to max, at its
 * share of the track like the knob, in the 6 px below the track. One box per tick, so each snaps to the pixel grid.
 * TODO(Chime): not drawn in Figma; length and colour follow the Build page's (border/subtle, 4 px). The Build page's
 * taller tick marks where a build's specialization is reached; a build being made here has no such level yet.
 */
const Ticks = memo(function Ticks({ min, max }: { min: number; max: number }) {
  return (
    <span aria-hidden="true" data-part="ticks" className="absolute inset-x-0 top-3.5 h-1">
      {Array.from({ length: max - min }, (_, i) => min + i + 1).map((v) => (
        <span key={v} className="absolute top-0 h-1 w-px bg-border-subtle" style={{ left: `${((v - min) / (max - min)) * 100}%` }} />
      ))}
    </span>
  );
});
