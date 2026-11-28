"use client";

import { useEffect, useRef } from "react";
import type { ArchetypeView } from "@/lib/builds";
import { reducedMotion, userInitiated } from "@/lib/motion";
import { Emblem } from "./Emblem";
import { MorphTooltip } from "@/components/ui/MorphTooltip";
import { RubberDock } from "./RubberDock";

// Figma "Emblem rail" (241:573 / 279:1538 / 276:1078): the 13 archetypes grouped Keeper, Defender, Midfielder,
// Forward (D-57), each group over a hairline label. Phone: 56 px emblems 10 px apart, groups 28 px apart, the row
// scrolls sideways and keeps the picked one centred, as Figma's phone frame shows Finisher (half a row of padding
// at each end lets the first and last centre too). Tablet (48 px, 6 apart) and desktop (64 px, 24 apart) show all
// 13 across the content width, the groups sharing the rest (D-59). The picked emblem is raised with a 2.5 px lime
// ring (plus a thin dark ring in light mode, D-37), and its group's label turns primary. The ring is the Rubber
// dock (RubberDock.tsx): one shape that stretches from the old emblem to the new one; the button draws its own ring
// only until the dock has measured the rail.
const EMBLEM =
  "flex size-14 shrink-0 items-center justify-center rounded-full transition-[background-color,border-color] duration-150 ease-out tablet:size-12 desktop:size-16";
const ON =
  "border-[2.5px] border-accent-fill bg-bg-raised light:ring-1 light:ring-accent-on-fill light:ring-inset group-data-docked/rail:border-transparent group-data-docked/rail:ring-0";
// Hover (D-121 (1)): an emblem not picked takes the surface's faint hover fill and a stronger border (no press
// scale: the lime ring is a separate layer and would not shrink with it).
const OFF = "border border-border-subtle bg-bg-surface hover:border-border-strong hover:bg-hover-fill";

export function EmblemRail({
  groups,
  selectedId,
  still,
  onSelect,
}: {
  groups: { label: string; items: ArchetypeView[] }[];
  selectedId: string;
  /** The pick came from the keyboard: the ring and the row move at once (D-120 (2)). */
  still: boolean;
  onSelect: (id: string, byKey: boolean) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Keep the picked emblem centred in the phone's scrolling row (a no-op when all 13 fit).
  useEffect(() => {
    const row = rail.current;
    const button = row?.querySelector<HTMLElement>(`[data-testid="emblem-${selectedId}"]`);
    if (!row || !button || row.scrollWidth <= row.clientWidth) return;
    const reduce = reducedMotion();
    // Rounded down, as Figma rounds the half pixel: the picked emblem sits at 169 px on a 393 px phone, not 168.
    const left = Math.floor(button.offsetLeft + button.offsetWidth / 2 - row.clientWidth / 2);
    row.scrollTo({ left, behavior: first.current || reduce || still || !userInitiated() ? "instant" : "smooth" });
    first.current = false;
  }, [selectedId, still]);

  return (
    <div
      ref={rail}
      className="relative overflow-x-auto pt-2 pb-2.5 rail tablet:overflow-visible tablet:px-10 tablet:pb-4 desktop:mx-auto desktop:max-w-(--layout-content-max) desktop:px-0"
    >
      <div ref={row} className="group/rail relative flex w-max gap-7 px-[calc(50%-28px)] tablet:w-full tablet:justify-between tablet:gap-0 tablet:px-0">
        <RubberDock rail={row} selector={`[data-testid="emblem-${selectedId}"]`} still={still} />
        {/* The archetype's name over the emblem under a mouse (Morph tooltip, #24). */}
        <MorphTooltip container={row} />
        {groups.map((g) => {
          const current = g.items.some((a) => a.id === selectedId);
          return (
            <div key={g.label} role="group" aria-label={g.label} className="flex flex-col items-center gap-2.5">
              <div className="flex gap-2.5 tablet:gap-1.5 desktop:gap-6">
                {g.items.map((a) => {
                  const on = a.id === selectedId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      data-testid={`emblem-${a.id}`}
                      aria-label={a.name}
                      data-tip={a.name}
                      aria-pressed={on}
                      onClick={(e) => onSelect(a.id, e.detail === 0)}
                      className={`${EMBLEM} ${on ? ON : OFF}`}
                    >
                      <Emblem id={a.id} className="size-8 tablet:size-[27.4px] desktop:size-9" />
                    </button>
                  );
                })}
              </div>
              <div aria-hidden="true" className="flex w-full items-center gap-2">
                <span className="h-px flex-1 bg-border-subtle" />
                <span className={`type-caption ${current ? "text-text-primary" : "text-text-muted"}`}>{g.label}</span>
                <span className="h-px flex-1 bg-border-subtle" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
