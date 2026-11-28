"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ms } from "@/lib/motion";
import { pageMotion } from "@/lib/page-motion";

// Page changes ease instead of cutting (D-121 (2); DESIGN.md Motion). The layout wraps each page in a <ViewTransition
// name="page">, so React runs the browser's View Transition on a navigation; this decides how it looks. On the click
// that starts a navigation it writes the way to go on <html> (data-page-motion: forward, back, expand or still, from
// lib/page-motion.ts), and globals.css animates ::view-transition-new(page) from it: the new page slides 40 px in from
// that side while it fades in, over --dur-page with the house ease-out; the old page steps aside at once, so two pages
// never show through each other. A link opened from the keyboard (a click with detail 0) stays still, as does a change
// with no click behind it (Back, a search picked with Enter); reduced motion fades only. Without View Transitions the
// page opens as before.
// The click's choice lasts exactly as long as the View Transition it starts: it is cleared when that transition
// finishes (not on a timer, which a slow phone would overrun mid-slide), and a later click's choice is never cleared
// by an earlier transition ending (a second link clicked while the first page is still sliding in).
const IGNORE = (a: HTMLAnchorElement) => a.target === "_blank" || a.hasAttribute("download") || a.origin !== window.location.origin;
const clear = () => delete document.documentElement.dataset.pageMotion;
// A click that leads nowhere new (or a page slower than this to arrive) lets go of its motion.
const UNUSED_MS = 3000;
type WithTransition = Document & { activeViewTransition?: ViewTransition | null };

export function PageMotion() {
  const pathname = usePathname();
  const clicks = useRef(0);
  const fallback = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const root = document.documentElement;
    const doc = document as WithTransition;
    const clearFor = (click: number) => () => clicks.current === click && clear();

    // Waits for the View Transition this click starts (a new one, not one already running), then clears with it.
    const follow = (click: number) => {
      const before = doc.activeViewTransition;
      const t0 = performance.now();
      const tick = () => {
        if (clicks.current !== click) return;
        const vt = doc.activeViewTransition;
        if (vt && vt !== before) void vt.finished.finally(clearFor(click));
        else if (performance.now() - t0 > UNUSED_MS) clear();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || IGNORE(a)) return;
      // A build card carries its picture and name to its build page (BuildCard's shared ViewTransitions).
      const expand = a.dataset.testid?.startsWith("build-card-") ?? false;
      root.dataset.pageMotion = pageMotion(window.location.pathname + window.location.search, a.pathname + a.search, { byKey: e.detail === 0, expand });
      const click = ++clicks.current;
      clearTimeout(fallback.current);
      // Browsers that don't say which transition is running: let go a while after the click.
      if ("activeViewTransition" in document) follow(click);
      else fallback.current = setTimeout(clearFor(click), UNUSED_MS);
    };
    // Back and Forward are no click: whatever a click chose before doesn't carry over to them.
    const onPop = () => {
      clicks.current += 1;
      clear();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // Without activeViewTransition: once the new page is in, its slide has --dur-page plus a margin to run.
  useEffect(() => {
    if ("activeViewTransition" in document) return;
    const click = clicks.current;
    clearTimeout(fallback.current);
    fallback.current = setTimeout(() => clicks.current === click && clear(), ms("--dur-page", 300) + 100);
    return () => clearTimeout(fallback.current);
  }, [pathname]);

  return null;
}
