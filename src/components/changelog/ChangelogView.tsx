"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/shell/Icon";
import { DraftTag } from "@/components/ui/DraftTag";
import { FilterChip, FilterChipGhost } from "@/components/ui/FilterChip";
import { COLOR_TRANSITION } from "@/components/ui/interaction";
import { PillRow } from "@/components/ui/PillRow";
import {
  dayAndMonth,
  type Filter,
  FILTERS,
  groupBySeason,
  KIND_LABEL,
  NEXT_SEASON,
  visibleGroups,
  weUpdated,
  type ChangelogItem,
} from "@/lib/changelog";

// Figma Changelog, option B (D-82): 383:3158 / 390:2540 / 390:2700. Phone and tablet stack the header, the
// season card, the filters and the seasons; desktop puts the first three in a 352 px side column, 64 px from the
// entries. Entries open in place; the newest starts open. With nothing published yet, only the header and the
// season card show.
// Expand card (motion-bookmarks #22): an entry opening in place grows from its row (the details' content box goes
// from grid row 0fr to 1fr, the accepted exception to transform-only) while its body fades in, --dur-base and
// --ease-out; closing is quicker (--dur-fast). content-visibility transitions as a discrete property so the body
// stays drawn while it closes. Browsers without ::details-content just open and close it. Reduced motion: the body
// fades, nothing grows.
const noSubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;
// Hover (D-121 (1)): over an entry's head the card takes the surface's faint fill and its chevron turns text/primary
// (a mouse or trackpad only, as the hover variant in globals.css); the source link underlines and its arrow nudges
// towards the corner it opens to.
const HOVER_ENTRY = `${COLOR_TRANSITION} can-hover:has-[>summary:hover]:bg-hover-fill`;
const CHEVRON = `${COLOR_TRANSITION} can-hover:group-has-[>summary:hover]:text-text-primary`;
const EXPAND =
  "[&::details-content]:grid [&::details-content]:grid-rows-[0fr] [&::details-content]:transition-[grid-template-rows,content-visibility] [&::details-content]:transition-discrete [&::details-content]:duration-(--dur-fast) [&::details-content]:ease-(--ease-out) open:[&::details-content]:grid-rows-[1fr] open:[&::details-content]:duration-(--dur-base) motion-reduce:[&::details-content]:transition-none";

function Entry({
  item,
  index,
  open,
}: {
  item: ChangelogItem;
  /** 1-based place in the full, unfiltered list, so a test ID names the same entry under every filter. */
  index: number;
  open: boolean;
}) {
  const { day, month } = dayAndMonth(item.date);
  return (
    <details
      data-testid={`changelog-entry-${index}`}
      open={open}
      className={`group rounded-lg bg-bg-surface p-4 tablet:px-5 tablet:py-[18px] ${HOVER_ENTRY} ${EXPAND}`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3.5 tablet:gap-4 [&::-webkit-details-marker]:hidden">
        <span className="flex w-11 shrink-0 flex-col items-center tablet:w-12">
          <span className="type-number-lg text-text-primary group-open:text-accent-text">
            {day}
          </span>
          <span className="type-caption text-text-muted">{month}</span>
        </span>
        <span className="flex flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="type-caption text-text-muted">
              {KIND_LABEL[item.kind]}
            </span>
            {item.draft && <DraftTag />}
          </span>
          <span className="type-label tablet:type-h4 text-text-primary">
            {item.title}
          </span>
        </span>
        <span className={`hidden text-text-secondary group-open:inline-flex ${CHEVRON}`}>
          <Icon name="chevron-up" size={24} />
        </span>
        <span className={`inline-flex text-text-secondary group-open:hidden ${CHEVRON}`}>
          <Icon name="chevron-down" size={24} />
        </span>
      </summary>
      {/* One box for the body, so the grid row can hold it at 0 height while it grows (Expand card). */}
      <div
        data-testid="entry-body"
        className="min-h-0 overflow-clip opacity-0 transition-opacity duration-(--dur-fast) ease-(--ease-out) [overflow-clip-margin:12px] group-open:opacity-100 group-open:duration-(--dur-base) in-data-hydrated:group-open:starting:opacity-0"
      >
        <div className="mt-3.5 h-px bg-system-divider" />
        {/* Tablet and desktop indent the body under the title (48 px date + 16 px gap); desktop wraps changes in 300 px columns. */}
        <ul className="mt-3.5 flex flex-col gap-2.5 tablet:pl-16 desktop:flex-row desktop:flex-wrap desktop:gap-x-6 desktop:gap-y-3">
          {item.changes.map((c, i) => (
            <li key={i} className="flex items-start gap-2.5 desktop:w-[300px]">
              {/* Figma's bullet: a 5 px dot at the foot of a 5 × 14 box. */}
              <span
                aria-hidden="true"
                className="mt-[9px] size-[5px] shrink-0 rounded-full bg-text-muted"
              />
              <span className="type-body flex-1 text-text-secondary">{c}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3.5 flex flex-col gap-3.5 pt-1 tablet:gap-2 tablet:pl-16 desktop:flex-row desktop:items-center desktop:gap-6">
          <p className="flex items-center gap-2">
            <span className="type-caption text-text-muted">Source</span>
            <a
              href={item.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/source type-label tap-target flex flex-1 items-center gap-2 text-text-primary tablet:flex-none"
            >
              <span className="flex-1 underline-offset-4 group-hover/source:underline tablet:flex-none">{item.source.title}</span>
              <span className="text-text-secondary transition-[color,translate] duration-(--dur-fast) ease-(--ease-out) group-hover/source:translate-x-px group-hover/source:-translate-y-px group-hover/source:text-text-primary motion-reduce:translate-none!">
                <Icon name="external" size={18} />
              </span>
            </a>
          </p>
          <p className="type-caption flex items-start gap-2">
            <span className="text-text-muted">We updated</span>
            <span className="flex-1 text-text-secondary">
              {weUpdated(item.updated)}
            </span>
          </p>
        </div>
      </div>
    </details>
  );
}

export function ChangelogView({
  items,
  currentSeason,
}: {
  items: ChangelogItem[];
  currentSeason: number;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const groups = visibleGroups(groupBySeason(items), filter);
  // The newest entry the filter leaves visible starts open.
  const newest = groups[0]?.entries[0]?.id;
  const place = new Map(items.map((e, i) => [e.id, i + 1]));
  // Set once the page is live: an entry opened from then on fades its body in (Expand card); the one that starts open
  // just appears with the page.
  const hydrated = useSyncExternalStore(noSubscribe, isClient, isServer);
  return (
    <div data-hydrated={hydrated || undefined} className="flex flex-col desktop:grid desktop:grid-cols-[352px_1fr] desktop:gap-x-16">
      <div>
        <h1 className="type-h1 text-text-primary">Changelog</h1>
        <p className="type-body tablet:type-body-lg mt-2 text-text-secondary">
          What changed in FC 27 Clubs, with EA&apos;s notes as the source.
        </p>
        <div className="mt-5 flex items-center gap-3 rounded-[14px] bg-bg-raised px-4 py-3.5">
          <span className="text-text-primary">
            <Icon name="history" size={22} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="type-label text-text-primary">{NEXT_SEASON}</span>
            <span className="type-caption text-text-secondary">
              Every face and build is checked again that day.
            </span>
          </span>
        </div>
        {items.length > 0 && (
          <>
            <p className="type-label mt-6 hidden text-text-secondary desktop:block">
              Show
            </p>
            {/* A sideways-scrolling row also clips up and down, so 4 px of padding (cancelled by -4 px margin) leaves room
                for each chip's 44 px tap area and its focus ring (2 px outline, 2 px offset); 4 px of scroll padding keeps
                the ring in view when focus scrolls a chip to the row's edge. */}
            <div className="mt-5 desktop:mt-2.5">
              <div className="-m-1 flex scroll-px-1 overflow-x-auto p-1">
                <PillRow
                  selected={FILTERS.findIndex((f) => f.value === filter)}
                  className="flex w-max shrink-0 gap-2 desktop:w-full desktop:shrink desktop:flex-wrap"
                  chips={(pill) =>
                    FILTERS.map((f, i) => (
                      <FilterChip
                        key={f.value}
                        testId={`filter-chip-${i + 1}`}
                        label={f.label}
                        pressed={filter === f.value}
                        pill={pill}
                        onPress={() => setFilter(f.value)}
                      />
                    ))
                  }
                  ghosts={FILTERS.map((f) => (
                    <FilterChipGhost key={f.value} label={f.label} />
                  ))}
                />
              </div>
            </div>
          </>
        )}
      </div>
      {items.length > 0 && (
        <div className="mt-7 tablet:mt-8 desktop:mt-0 desktop:pt-2">
          {groups.map((g) => (
            <section key={g.season} className="pb-7">
              <div className="flex items-center gap-2.5">
                <h2 className="type-h3 text-text-primary">Season {g.season}</h2>
                {g.season === currentSeason && (
                  <span className="type-caption rounded-full border border-accent-text px-2.5 py-[3px] text-accent-text">
                    Now
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {g.entries.map((e) => (
                  <Entry
                    key={e.id}
                    item={e}
                    index={place.get(e.id) ?? 0}
                    open={e.id === newest}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
