"use client";

import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { ms, pillInset, reducedMotion, token } from "@/lib/motion";

const noSubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

// One lime pill that slides to the picked item of a row (Tab pill and Bottom bar, motion-bookmarks #5, #6; DESIGN.md:
// "the highlight is one shape that springs from row to row"). It is built as animate's tab-indicator recipe: a copy
// of the row drawn in the picked colours (lime, ink text) sits over the real row and is clipped to the picked item,
// so the pill, its text colour and, in light mode, its dark ring (a second clipped layer 1 px larger, D-37) move as
// one shape with nothing to keep in sync. The clip moves by a CSS transition on clip-path (--spring-fade): it runs
// in the browser's animation engine, not in React, so a navigation loading the next page doesn't hold it up, and a
// second tap retargets it from where it is. The real row stays the buttons and links; the copy is inert and hidden
// from screen readers. Before hydration (and without JavaScript) the row draws its own picked item as before.
// It slides only for a pick made by pointer on the row; a keyboard pick moves it at once (no motion on keyboard
// actions, DESIGN.md), and a pick on another line of a wrapped row fades it in there instead of sliding across.

export const PILL_LAYER =
  "pointer-events-none absolute inset-0 transition-[clip-path] duration-(--spring-fade-ms) ease-(--spring-fade) motion-reduce:transition-none";
export const PILL_RING = `${PILL_LAYER} hidden bg-accent-on-fill light:block`;
export const PILL_FILL = `${PILL_LAYER} bg-accent-fill text-accent-on-fill light:[--pill-ring:1px]`;

function setClip(el: HTMLElement | null, value: string, animate: boolean) {
  // Already there (a resize that didn't move the picked item, or the relayout a pick itself causes): leave a slide
  // in flight alone.
  // (Compared with what was set, not el.style, which the browser re-serialises.)
  if (!el || el.dataset.clip === value) return;
  el.dataset.clip = value;
  if (animate) {
    el.style.clipPath = value;
    return;
  }
  // Resizes, fonts loading and the first placement jump straight there.
  el.style.transition = "none";
  el.style.clipPath = value;
  void el.offsetWidth;
  el.style.transition = "";
}

export interface Pill<T extends HTMLElement = HTMLElement> {
  row: RefObject<T | null>;
  ring: RefObject<HTMLDivElement | null>;
  fill: RefObject<HTMLDivElement | null>;
  /** True once the pill is placed: the row then draws every item unpicked and the pill draws the picked one. */
  ready: boolean;
}

/**
 * `selected` is the index of the picked item among the row's children (the layers come after the items), or null
 * for none. `onMove` runs as the pill starts moving (with the row and the pill's copy of it), for anything that
 * moves with it.
 */
export function usePill<T extends HTMLElement>(selected: number | null, onMove?: (row: T, copy: HTMLDivElement) => void): Pill<T> {
  const row = useRef<T>(null);
  const ring = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  // Hydrated: from here on the pill draws the picked item (false in the static HTML and while hydrating).
  const ready = useSyncExternalStore(noSubscribe, isClient, isServer);
  const last = useRef<number | null | undefined>(undefined);
  const move = useRef(onMove);
  const picked = useRef(selected);
  // How the last pick on the row was made (a click with detail 0 is Enter or Space): only a pointer pick slides the
  // pill. Cleared once a change uses it, so a later change from elsewhere (a link outside the row, Back) slides.
  const byKey = useRef(false);
  const lastTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    move.current = onMove;
    picked.current = selected;
  });

  const place = useCallback((animate: boolean) => {
    const box = row.current;
    const at = picked.current;
    const item = at === null ? null : (box?.children[at] as HTMLElement | undefined);
    const layers = [fill.current, ring.current];
    if (!box || !item) {
      for (const el of layers) if (el) el.style.visibility = "hidden";
      return;
    }
    // Sub-pixel boxes (offsetLeft rounds to whole pixels), measured from the row's padding edge, where the layers
    // start, and without any slide the item is in the middle of (the nav's icons, BottomNav).
    // A chip still easing back from its press (scale 0.97 about its centre, interaction.ts) is measured at full size.
    const outer = box.getBoundingClientRect();
    const seen = item.getBoundingClientRect();
    const style = getComputedStyle(item);
    const [sx = 1, sy = sx] = !style.scale || style.scale === "none" ? [] : style.scale.split(" ").map(Number).filter((n) => n > 0);
    const r = { left: seen.left - (seen.width / sx - seen.width) / 2, top: seen.top - (seen.height / sy - seen.height) / 2, width: seen.width / sx, height: seen.height / sy };
    const shift = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
    const rect = {
      left: r.left - outer.left - box.clientLeft - shift.m41,
      top: r.top - outer.top - box.clientTop - shift.m42,
      width: r.width,
      height: r.height,
    };
    const size = { width: outer.width - box.clientLeft * 2, height: outer.height - box.clientTop * 2 };
    const appearing = !fill.current?.dataset.clip || fill.current.style.visibility === "hidden";
    for (const el of layers) if (el) el.style.visibility = "";
    // A pick on another line of a wrapped row (chips at 360 px) would slide diagonally across both lines.
    const sameLine = lastTop.current === null || Math.abs(lastTop.current - rect.top) < 2;
    lastTop.current = rect.top;
    const slide = animate && !appearing && sameLine && !reducedMotion();
    setClip(ring.current, pillInset(rect, size), slide);
    setClip(fill.current, pillInset(rect, size, "var(--pill-ring, 0px)"), slide);
    // Reduced motion, or a pill appearing where there was none: it fades in where it lands instead of sliding.
    if (animate && !slide) {
      const timing = { duration: ms("--dur-fast", 150), easing: token("--ease-out", "ease-out") };
      for (const el of layers) el?.animate({ opacity: [0, 1] }, timing);
    }
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    const from = last.current;
    const changed = from !== undefined && from !== selected;
    // Moves the rest of the row only for a pointer pick, like the pill itself.
    const animate = changed && !byKey.current;
    if (changed) byKey.current = false;
    if (animate && row.current && fill.current) move.current?.(row.current, fill.current);
    place(animate);
    last.current = selected;
  }, [ready, selected, place]);

  useEffect(() => {
    const box = row.current;
    if (!ready || !box) return;
    // A click, not keydown: Tab moving focus through the row is not a pick.
    const onClick = (e: MouseEvent) => (byKey.current = e.detail === 0);
    box.addEventListener("click", onClick, true);
    return () => box.removeEventListener("click", onClick, true);
  }, [ready]);

  // The row changes size (a phone turning, a web font arriving, a count changing a chip's width): follow at once.
  useEffect(() => {
    const box = row.current;
    if (!ready || !box || typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(box);
    for (const child of Array.from(box.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [ready, place]);

  return { row, ring, fill, ready };
}
