"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { PILL_FILL, PILL_RING, usePill } from "@/components/ui/usePill";
import { ms, reducedMotion, token } from "@/lib/motion";
import { isCurrent, SECTIONS } from "@/lib/nav";
import { Icon } from "./Icon";

// Figma Bottom nav (282:521), phone only: a floating pill 344 px wide, 24 px above the bottom (and the home
// indicator). The current section is the lime pill with its label (DESIGN.md, D-94); the others are 48 px icons.
// On a page outside the five sections (Page=None) Home's icon is cream. In light mode the lime pill gets a thin
// dark ring, since lime on cream is 1.03:1 (D-37). Figma's background blur is left out: the nav is opaque, so
// it would show nothing and still cost a repaint on every scroll frame.
//
// Motion (Bottom bar, motion-bookmarks #5): on a tap the pill slides to the new tab (usePill, --spring-fade), its
// label fades in, and the icons beside it, which the wider pill pushes along, slide to their new places in the same
// spring instead of jumping (a FLIP on transform). It starts on the tap, not when the next page arrives, so the nav
// answers at once. Reduced motion: the pill fades in at the new tab and nothing slides.
// An icon turns text/primary on hover (a narrow window on a computer; D-121 (1)), over --dur-fast.
// Through a page change (a View Transition, D-121 (2)) the nav is its own group, bottom-nav, painted above the page
// group and shown live, so the incoming page never covers it (D-125 (2); globals.css).
const ITEM =
  "flex h-12 items-center rounded-full [-webkit-tap-highlight-color:transparent] touch-manipulation select-none transition-colors duration-(--dur-fast) ease-(--ease-out)";
const PICKED_GEOMETRY = "gap-1.5 pr-[18px] pl-3.5";

export function BottomNav() {
  const pathname = usePathname();
  // The tab just tapped, until its page arrives (or the tap turns out to go nowhere new).
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  // Once the page changes the tap is spent: without this, coming back to the page it was made on (Back) would
  // bring the pill back to the old tap's tab.
  if (tapped && tapped.from !== pathname) setTapped(null);
  const pending = tapped && tapped.from === pathname ? tapped.href : null;
  const index = SECTIONS.findIndex((s) => (pending ? s.href === pending : isCurrent(s.href, pathname)));
  const current = index === -1 ? null : index;
  const none = current === null;
  // Where each icon was on screen when the tab was tapped (mid-slide included), for the FLIP.
  const before = useRef<number[] | null>(null);

  const { row: nav, ring, fill, ready } = usePill<HTMLElement>(current, (row, copy) => {
    // Reduced motion: the icons take their new places at once (the pill fades in, usePill).
    if (!before.current || reducedMotion()) return;
    const items = [...Array.from(row.children).slice(0, SECTIONS.length), ...Array.from(copy.children)] as HTMLElement[];
    for (const el of items) for (const a of el.getAnimations()) a.cancel();
    const rowLeft = row.getBoundingClientRect().left;
    const timing = { duration: ms("--spring-fade-ms", 320), easing: token("--spring-fade", "ease-out") };
    Array.from(row.children)
      .slice(0, SECTIONS.length)
      .forEach((el, i) => {
        const dx = (before.current?.[i] ?? 0) - (el.getBoundingClientRect().left - rowLeft);
        if (Math.abs(dx) < 0.5) return;
        const frames = { transform: [`translateX(${dx}px)`, "none"] };
        el.animate(frames, timing);
        copy.children[i]?.animate(frames, timing);
      });
    before.current = null;
    // The new label fades in as the pill brings it (Decoration: a fade, no movement of its own).
    copy.querySelector("[data-label]")?.animate({ opacity: [0, 1] }, { duration: ms("--dur-base", 220), easing: token("--ease-out", "ease-out") });
  });

  const tap = (href: string) => {
    const row = nav.current;
    if (!row || href === SECTIONS[current ?? -1]?.href) return;
    const rowLeft = row.getBoundingClientRect().left;
    before.current = Array.from(row.children)
      .slice(0, SECTIONS.length)
      .map((el) => el.getBoundingClientRect().left - rowLeft);
    setTapped({ href, from: pathname });
  };

  return (
    <nav
      ref={nav}
      aria-label="Sections"
      data-testid="bottom-nav"
      className="fixed inset-x-0 bottom-[calc(24px+env(safe-area-inset-bottom))] z-10 [view-transition-name:bottom-nav] mx-auto flex w-[344px] max-w-[calc(100%-16px)] items-center justify-between rounded-full border border-border-strong bg-bg-page p-[5px] shadow-bottom-nav tablet:hidden"
    >
      {SECTIONS.map((s, i) => {
        const picked = i === current;
        const idle = none && s.href === "/" ? "text-text-primary" : "text-text-secondary";
        // Before hydration the link draws its own lime pill; after it, the pill layer does.
        const look = !picked
          ? `size-12 justify-center hover:text-text-primary ${idle}`
          : ready
            ? `${PICKED_GEOMETRY} ${idle}`
            : `${PICKED_GEOMETRY} bg-accent-fill text-accent-on-fill light:ring-1 light:ring-accent-on-fill light:ring-inset`;
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-label={s.label}
            aria-current={isCurrent(s.href, pathname) ? "page" : undefined}
            onClick={(e) => {
              // A new tab or window (or a link Next won't follow) leaves this page where it is.
              if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) tap(s.href);
            }}
            className={`${ITEM} ${look}`}
          >
            <Icon name={s.icon} size={24} />
            {picked && <span className={`type-button-sm ${ready ? "opacity-0" : ""}`}>{s.label}</span>}
          </Link>
        );
      })}
      {ready && (
        <>
          <div ref={ring} aria-hidden="true" className={`${PILL_RING} rounded-full`} />
          <div ref={fill} aria-hidden="true" inert className={`${PILL_FILL} flex items-center justify-between rounded-full p-[5px]`}>
            {SECTIONS.map((s, i) => (
              <span key={s.href} className={`${ITEM} ${i === current ? PICKED_GEOMETRY : "size-12 justify-center"}`}>
                <Icon name={s.icon} size={24} />
                {i === current && (
                  <span data-label className="type-button-sm">
                    {s.label}
                  </span>
                )}
              </span>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}
