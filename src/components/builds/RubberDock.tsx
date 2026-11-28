"use client";

import { type RefObject, useLayoutEffect, useRef } from "react";
import { reducedMotion, runSpring, SPRINGS, type SpringState, userInitiated } from "@/lib/motion";

// The Rubber dock (motion-bookmarks.pdf #4): the emblem rail's lime ring is one shape that travels from the old
// emblem to the new one. Its leading edge runs on the lead spring and its trailing edge on the slower trail spring,
// so the ring stretches into a pill on the way and snaps back round the new emblem (squash and stretch). Purpose:
// spatial consistency, the selection visibly moves rather than blinking from one emblem to another.
// Drawn as three pieces so the 2.5 px line never thickens: two half-ring caps that only translate, and the top and
// bottom lines between them, which scale along x (a horizontal line keeps its height under scaleX). Every frame
// writes transforms straight to the pieces (no React render). A new pick mid-flight carries on from where the edges
// are, at their speed. Until it has measured the rail (and without JavaScript) the dock stays hidden and the picked
// button draws its own ring. At rest the three pieces give way to one whole ring (D-121 (3)): where the caps and the
// 1 px middle line met, their anti-aliased edges left a thin seam through the picked emblem. The pieces show only
// in flight; the ring takes over exactly the outline the pieces landed on, so the hand-over doesn't jump, and only the
// seam goes.
// Reduced motion: the ring fades in round the new emblem instead of travelling. A keyboard pick puts it there at once.

const LINE = "light:shadow-[inset_0_1px_0_var(--color-accent-on-fill),inset_0_-1px_0_var(--color-accent-on-fill)]";
// Each piece is see-through at rest and the whole ring see-through in flight (data-flying on the dock).
const PIECE = "absolute top-0 left-0 origin-left border-accent-fill opacity-0 group-data-flying/dock:opacity-100";

export function RubberDock({ rail, selector, still = false }: { rail: RefObject<HTMLElement | null>; selector: string; still?: boolean }) {
  const box = useRef<HTMLSpanElement>(null);
  const left = useRef<HTMLSpanElement>(null);
  const mid = useRef<HTMLSpanElement>(null);
  const right = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const edges = useRef<{ l: SpringState; r: SpringState; top: number; size: number } | null>(null);
  const running = useRef<{ stop: () => SpringState }[]>([]);

  const measure = useRef<(animate: boolean) => void>(() => {});
  const byKey = useRef(still);
  // Read by the measure below, which runs after this in the same commit.
  useLayoutEffect(() => {
    byKey.current = still;
  }, [still]);

  useLayoutEffect(() => {
    const container = rail.current;
    if (!container) return;
    const draw = () => {
      const e = edges.current;
      if (!e || !left.current || !mid.current || !right.current) return;
      const half = e.size / 2;
      left.current.style.transform = `translate(${e.l.value}px, ${e.top}px)`;
      right.current.style.transform = `translate(${e.r.value - half}px, ${e.top}px)`;
      // The lines overlap each cap by half a pixel, so no hairline seam shows where they meet mid-flight.
      mid.current.style.transform = `translate(${e.l.value + half - 0.5}px, ${e.top}px) scaleX(${(Math.max(0, e.r.value - e.l.value - e.size) + 1) / 100})`;
    };
    // Rest: the whole ring round the target, and the pieces hidden.
    const land = () => {
      const e = edges.current;
      if (!e || !box.current || !ring.current) return;
      ring.current.style.transform = `translate(${e.l.value}px, ${e.top}px)`;
      delete box.current.dataset.flying;
    };
    measure.current = (animate: boolean) => {
      const button = container.querySelector<HTMLElement>(selector);
      if (!button || !box.current || !left.current || !mid.current || !right.current || !ring.current) return;
      const c = container.getBoundingClientRect();
      const b = button.getBoundingClientRect();
      const target = { l: b.left - c.left, r: b.right - c.left, top: b.top - c.top, size: b.width };
      const prev = edges.current;
      // The live edges, if a flight is still running, so a new pick carries on from where they are.
      const live = running.current.map((s) => s.stop());
      running.current = [];
      ring.current.style.width = `${target.size}px`;
      ring.current.style.height = `${target.size}px`;
      for (const piece of [left.current, right.current]) {
        piece.style.width = `${target.size / 2}px`;
        piece.style.height = `${target.size}px`;
      }
      mid.current.style.height = `${target.size}px`;
      // A change nobody made (the page opening on a linked archetype) puts the ring in place without a flight.
      // A keyboard pick moves it at once too (D-120 (2)).
      const instant = !animate || !prev || prev.size !== target.size || !userInitiated() || byKey.current;
      if (instant || reducedMotion()) {
        edges.current = { l: { value: target.l, velocity: 0 }, r: { value: target.r, velocity: 0 }, top: target.top, size: target.size };
        draw();
        land();
        container.dataset.docked = "";
        if (!instant) box.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "linear" });
        return;
      }
      const from = { l: live[0] ?? prev.l, r: live[1] ?? prev.r };
      edges.current = { ...from, top: target.top, size: target.size };
      // The edge in the direction of travel leads; the other trails.
      const rightward = target.l > from.l.value;
      draw();
      box.current.dataset.flying = "";
      let flying = 2;
      const run = (edge: "l" | "r", to: number, leads: boolean) =>
        runSpring(
          leads ? SPRINGS.lead : SPRINGS.trail,
          from[edge],
          to,
          (v) => {
            if (edges.current) edges.current[edge] = { value: v, velocity: 0 };
            draw();
          },
          // Both edges home: the whole ring takes over.
          () => --flying === 0 && land(),
        );
      // runSpring reports values only; stop() returns the full state (value and speed) for the next pick.
      running.current = [run("l", target.l, !rightward), run("r", target.r, rightward)];
    };
    measure.current(edges.current !== null);
  }, [rail, selector]);

  // A new layout (a breakpoint, a font that loaded) puts the ring in place at once.
  useLayoutEffect(() => {
    const container = rail.current;
    if (!container) return;
    const resize = new ResizeObserver(() => measure.current(false));
    resize.observe(container);
    // The groups too: on a wide rail the row keeps its width while a label that reflows (a font that loaded) moves
    // the emblems inside it.
    for (const group of container.children) resize.observe(group);
    return () => {
      resize.disconnect();
      running.current.forEach((s) => s.stop());
    };
  }, [rail]);

  return (
    <span
      ref={box}
      aria-hidden="true"
      data-testid="rubber-dock"
      className="group/dock pointer-events-none invisible absolute inset-0 z-1 group-data-docked/rail:visible"
    >
      <span
        ref={left}
        className={`${PIECE} rounded-l-full border-y-[2.5px] border-l-[2.5px] light:shadow-[inset_1px_0_0_var(--color-accent-on-fill),inset_0_1px_0_var(--color-accent-on-fill),inset_0_-1px_0_var(--color-accent-on-fill)]`}
      />
      <span ref={mid} className={`${PIECE} ${LINE} w-[100px] border-y-[2.5px]`} />
      <span
        ref={right}
        className={`${PIECE} rounded-r-full border-y-[2.5px] border-r-[2.5px] light:shadow-[inset_-1px_0_0_var(--color-accent-on-fill),inset_0_1px_0_var(--color-accent-on-fill),inset_0_-1px_0_var(--color-accent-on-fill)]`}
      />
      {/* The ring at rest: one shape, so nothing meets in the middle. */}
      <span
        ref={ring}
        data-testid="rubber-dock-ring"
        className="absolute top-0 left-0 rounded-full border-[2.5px] border-accent-fill group-data-flying/dock:opacity-0 light:shadow-[inset_0_0_0_1px_var(--color-accent-on-fill)]"
      />
    </span>
  );
}
