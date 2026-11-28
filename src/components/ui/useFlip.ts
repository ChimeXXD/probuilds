"use client";

import { useLayoutEffect, useRef } from "react";
import { ms, reducedMotion, token } from "@/lib/motion";

// A list that changes in place moves instead of snapping (D-121 (2): the Faces search, Request a face's list). Each item
// carries data-flip="<its id>". Call `before()` just before the change (in the event handler, while the old list is
// still on screen); after React draws the new list:
// - an item still there glides from where it was to where it is now (FLIP: a translate that eases to none over
//   --dur-base, --ease-out), so the gap a leaving item opens closes rather than jumps;
// - an item that left fades out in place (a still copy laid in `layer`, out of the layout at once, so the others
//   close up while it fades: choreograph's "a leaving element leaves the layout at once"), --dur-fast, to 96 %;
// - an item that arrived fades in from 96 % over --dur-base.
// Typing fast interrupts it: each new change starts from where every item is on screen at that moment, and earlier
// copies go at once. Reduced motion: nothing moves or scales; the arriving and leaving items only fade. `still: true`
// (a keyboard pick other than typing) changes the list at once.
export function useFlip<L extends HTMLElement>() {
  const list = useRef<L>(null);
  const layer = useRef<HTMLDivElement>(null);
  const snapshot = useRef<{ boxes: Map<string, DOMRect>; els: Map<string, HTMLElement> } | null>(null);
  const version = useRef(0);
  const played = useRef(0);

  // The live items only: the copies fading in `layer`, and the still copy a Smooth tab lays over the same list, are
  // inert and carry the same data-flip ids.
  const items = () => Array.from(list.current?.querySelectorAll<HTMLElement>("[data-flip]") ?? []).filter((el) => !el.closest("[inert]"));

  /** Call right before the state change that changes the list. */
  const before = ({ still = false }: { still?: boolean } = {}) => {
    layer.current?.replaceChildren();
    snapshot.current = null;
    if (still) return;
    const boxes = new Map<string, DOMRect>();
    const els = new Map<string, HTMLElement>();
    // No list on screen (the no-results card): an empty snapshot, so every item that comes back fades in.
    for (const el of items()) {
      const id = el.dataset.flip ?? "";
      // Where it is on screen now, mid-glide included; then the glide stops there.
      boxes.set(id, el.getBoundingClientRect());
      for (const a of el.getAnimations()) a.cancel();
      els.set(id, el);
    }
    snapshot.current = { boxes, els };
    const v = (version.current += 1);
    // A call that no render follows (nothing changed) must not leave a stale snapshot for a later, unrelated render.
    requestAnimationFrame(() => {
      if (played.current !== v && version.current === v) {
        played.current = v;
        snapshot.current = null;
      }
    });
  };

  useLayoutEffect(() => {
    const snap = snapshot.current;
    if (!snap || played.current === version.current) return;
    played.current = version.current;
    snapshot.current = null;
    const over = layer.current;
    const reduce = reducedMotion();
    const ease = token("--ease-out", "ease-out");
    const move = { duration: ms("--dur-base", 220), easing: ease };
    const fast = { duration: ms("--dur-fast", 150), easing: ease };
    const now = new Set<string>();
    for (const el of items()) {
      const id = el.dataset.flip ?? "";
      now.add(id);
      const was = snap.boxes.get(id);
      if (!was) {
        el.animate(reduce ? { opacity: [0, 1] } : { opacity: [0, 1], scale: [0.96, 1] }, move);
        continue;
      }
      const r = el.getBoundingClientRect();
      const dx = was.left - r.left;
      const dy = was.top - r.top;
      if (!reduce && (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)) el.animate({ translate: [`${dx}px ${dy}px`, "0 0"] }, move);
    }
    if (!over) return;
    const origin = over.getBoundingClientRect();
    for (const [id, el] of snap.els) {
      const was = snap.boxes.get(id);
      if (now.has(id) || !was) continue;
      // React has taken the item out of the page; a copy of it (cloned only now, for the ones that left) fades out.
      const copy = el.cloneNode(true) as HTMLElement;
      for (const n of [copy, ...Array.from(copy.querySelectorAll("[data-testid], [id]"))]) {
        n.removeAttribute("data-testid");
        n.removeAttribute("id");
      }
      Object.assign(copy.style, {
        position: "absolute",
        left: `${was.left - origin.left}px`,
        top: `${was.top - origin.top}px`,
        width: `${was.width}px`,
        height: `${was.height}px`,
        margin: "0",
      });
      over.append(copy);
      const out = copy.animate(reduce ? { opacity: [1, 0] } : { opacity: [1, 0], scale: [1, 0.96] }, { ...fast, fill: "forwards" });
      out.onfinish = () => copy.remove();
    }
  });

  return { list, layer, before };
}
