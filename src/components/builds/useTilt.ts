"use client";

import { type PointerEvent, useEffect, useState } from "react";
import { reducedMotion, type Spring, SPRINGS, type SpringState, stepSpring } from "@/lib/motion";
import { finePointer, parallax, pointerRatio, sheenShift, TILT, tiltFor, tiltTransform } from "@/lib/tilt";

// The share card's hover tilt (D-125 (1); the maths and values are in src/lib/tilt.ts). One frame loop runs three
// springs, rotateX, rotateY and the press scale, from their live values and speeds, so a pointer that turns back
// mid-settle is caught where the card is (apple-design §3, two independent axes). While the pointer is over the card
// the turn follows it on the follow spring (900/50, no overshoot); on leave it lands flat on the settle spring
// (280/22, one small overshoot). Each frame writes transforms straight to the elements, never React state or an
// inherited CSS variable (animation-performance): the tilt layer turns, each side's contents slide (depth) and each
// side's light moves. At rest the inline styles are removed, so the card is exactly as drawn (and Save images, which
// draws the cards' own nodes, never sees a shift). Mouse and pen only, on a device that hovers with a fine pointer,
// never under reduced motion; a touch keeps tap to flip with no tilt. The press scale (0.98) answers any pointer.

interface Axis {
  s: SpringState;
  target: number;
  spring: Spring;
  precision: number;
}

const axis = (value: number, precision: number): Axis => ({ s: { value, velocity: 0 }, target: value, spring: SPRINGS.follow, precision });
const resting = (a: Axis) => Math.abs(a.s.value - a.target) < a.precision && Math.abs(a.s.velocity) < a.precision * 10;

class Tilt {
  card: HTMLElement | null = null;
  layers: (HTMLElement | null)[] = [];
  sheens: (HTMLElement | null)[] = [];
  private rx = axis(0, 0.01);
  private ry = axis(0, 0.01);
  private scale = axis(1, 0.0005);
  private frame = 0;
  private last = 0;

  /** A ref callback's element: the tilt layer, or side `i`'s contents or light. */
  attach(part: "card" | "layers" | "sheens", i: number, el: HTMLElement | null) {
    if (part === "card") this.card = el;
    else this[part][i] = el;
  }

  private get flat() {
    return this.rx.target === 0 && this.ry.target === 0 && this.scale.target === 1;
  }

  /** Writes the live values to the elements; `clear` hands them back to their own styles. */
  private write(clear: boolean) {
    const { rx, ry, scale } = this;
    if (this.card) this.card.style.transform = clear ? "" : tiltTransform(rx.s.value, ry.s.value, scale.s.value);
    const p = parallax(rx.s.value, ry.s.value);
    // The contents keep their own scale (FlipCard's --s, set once on the card, never animated).
    for (const el of this.layers) if (el) el.style.transform = clear ? "" : `translate3d(${p.x}px, ${p.y}px, 0) scale(var(--s))`;
    const l = sheenShift(rx.s.value, ry.s.value);
    for (const el of this.sheens) if (el) el.style.transform = clear ? "" : `translate3d(${l.x}%, ${l.y}%, 0)`;
  }

  private light(on: boolean) {
    for (const el of this.sheens) if (el) el.style.opacity = on ? "1" : "";
  }

  private tick = (now: number) => {
    let dt = Math.min((now - this.last) / 1000, 0.064);
    this.last = now;
    const axes = [this.rx, this.ry, this.scale];
    // Steps of at most 1/120 s, so a dropped frame doesn't throw the springs off.
    while (dt > 0) {
      const step = Math.min(dt, 1 / 120);
      for (const a of axes) a.s = stepSpring(a.spring, a.s, a.target, step);
      dt -= step;
    }
    if (axes.every(resting)) {
      for (const a of axes) a.s = { value: a.target, velocity: 0 };
      this.frame = 0;
      this.write(this.flat);
      return;
    }
    this.write(false);
    this.frame = requestAnimationFrame(this.tick);
  };

  private run() {
    if (this.frame) return;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  /** Turns toward a pointer at (clientX, clientY) over `rect`. */
  follow(clientX: number, clientY: number, rect: DOMRect) {
    const { rx, ry } = tiltFor(pointerRatio(clientX, clientY, rect));
    this.rx.target = rx;
    this.ry.target = ry;
    this.rx.spring = this.ry.spring = SPRINGS.follow;
    this.light(true);
    this.run();
  }

  /** The pointer left: back to flat on the settle spring. */
  settle() {
    this.light(false);
    if (this.flat && !this.frame) return;
    this.rx.target = this.ry.target = 0;
    this.scale.target = 1;
    this.rx.spring = this.ry.spring = this.scale.spring = SPRINGS.settle;
    this.run();
  }

  press(down: boolean) {
    this.scale.target = down ? TILT.press : 1;
    // Both ways on the follow spring: the release snaps back with no wobble (review-animations 9: the response snaps).
    this.scale.spring = SPRINGS.follow;
    this.run();
  }

  /** Flat at once, with no motion (the sheet closed). */
  reset = () => {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    for (const a of [this.rx, this.ry, this.scale]) {
      a.target = a === this.scale ? 1 : 0;
      a.s = { value: a.target, velocity: 0 };
    }
    this.write(true);
    this.light(false);
  };
}

// The refs and handlers are made once per card, so React doesn't detach and re-attach the refs on every render.
function api(t: Tilt) {
  const tilts = (e: PointerEvent) => e.pointerType !== "touch" && finePointer() && !reducedMotion();
  type Ref = (el: HTMLElement | null) => void;
  const ref = (part: "layers" | "sheens"): [Ref, Ref] => [(el) => t.attach(part, 0, el), (el) => t.attach(part, 1, el)];
  const layers = ref("layers");
  const sheens = ref("sheens");
  return {
    tilt: (el: HTMLElement | null) => t.attach("card", 0, el),
    /** Ref for side `i`'s contents (the layer that floats). */
    layer: (i: 0 | 1) => layers[i],
    /** Ref for side `i`'s light. */
    sheen: (i: 0 | 1) => sheens[i],
    handlers: {
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        if (tilts(e)) t.follow(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
      },
      onPointerLeave: () => t.settle(),
      onPointerDown: (e: PointerEvent) => {
        if (e.button === 0 && !reducedMotion()) t.press(true);
      },
      onPointerUp: () => t.press(false),
      onPointerCancel: () => t.press(false),
    },
  };
}

export function useTilt() {
  const [t] = useState(() => new Tilt());
  const [refs] = useState(() => api(t));

  // A sheet closed with the pointer still on the card (Escape) opens flat next time.
  useEffect(() => {
    const dialog = t.card?.closest("dialog");
    dialog?.addEventListener("close", t.reset);
    return () => {
      dialog?.removeEventListener("close", t.reset);
      t.reset();
    };
  }, [t]);

  return refs;
}
