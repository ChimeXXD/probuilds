"use client";

import Link from "next/link";
import { useState } from "react";
import { useFlip } from "@/components/ui/useFlip";
import { useSmoothTab } from "@/components/ui/useSmoothTab";
import { Icon } from "@/components/shell/Icon";
import { ButtonLabel, buttonClass } from "@/components/ui/Button";
import { FilterChip, FilterChipGhost } from "@/components/ui/FilterChip";
import { PRESS_CARD, STATE_TRANSITION } from "@/components/ui/interaction";
import { PillRow } from "@/components/ui/PillRow";
import {
  FACE_FILTERS,
  type FaceCardView,
  type FaceFilter,
  filterCounts,
  REQUEST_FACE_HREF,
  SUBMIT_HREF,
  visibleFaces,
} from "@/lib/faces";
import { FaceCard } from "./FaceCard";
import { FaceSearch } from "./FaceSearch";

// Figma "Faces library" (phone 333:1139, tablet 345:1310, desktop 345:1391; D-70 option A, the poster grid): the
// header, search and kind chips (D-68), the faces two / three / six across with the dashed "Missing a face?" tile
// last, then "Who should we make next?" (D-97 (5)). Phone stacks search over chips (the chips scroll sideways to
// the screen's edge); tablet and desktop put the chips left and the search right on one row. Nothing matching shows
// the no-results card instead of the grid and panel (372:1853 / 427:9875 / 427:9960). While Figma's sample faces are
// listed (drafts, preview only), its demo note says their pictures are stand-ins (D-107, D-108); it marks them in place
// of the Draft tag (D-113). It is page-level, so it stays when a search leaves nothing (as 427:9875 and 427:9960 draw it).
// Content: 16 / 20 / 32 px on phone (top / gaps / bottom), 24 / 24 / 64 on tablet and desktop.
const DEMO_NOTE =
  "Demo: stand-in faces from Xaiiros's and CodeName Max's YouTube tutorials. Each real card shows our own in-game recreation.";

export function FacesView({ cards }: { cards: FaceCardView[] }) {
  const [filter, setFilter] = useState<FaceFilter>("all");
  const [query, setQuery] = useState("");
  const counts = filterCounts(cards, query);
  const shown = visibleFaces(cards, filter, query);
  // 1-based place in the full list, so a test ID names the same face under every filter.
  const place = new Map(cards.map((c, i) => [c.id, i + 1]));
  const { grid, leave, before: leaving } = useSmoothTab<HTMLUListElement>(filter);
  // Typing a search moves the results instead of snapping them (D-121 (2), Chime's ask for search though it is
  // keyboard input): cards that stay glide to their new places, the ones that drop out fade where they were, new ones
  // fade in, and the request panel under the grid glides with them (useFlip). Short and quiet: --dur-base at most.
  const { list: flipList, layer: flipLayer, before: flipBefore } = useFlip<HTMLDivElement>();
  const search = (q: string) => {
    flipBefore();
    setQuery(q);
  };
  const pick = (value: FaceFilter, byKey: boolean) => {
    if (value === filter) return;
    const at = (v: FaceFilter) => FACE_FILTERS.findIndex((f) => f.value === v);
    // From the keyboard (a click with detail 0) the grid changes at once (D-120 (2)).
    if (!byKey) leaving(at(value) > at(filter) ? 1 : -1);
    setFilter(value);
  };
  // TODO(Chime): nothing tells a screen reader that the results changed after a search or a chip. A polite live
  // region needs wording (for example how many faces show) that no design or decision gives yet.

  return (
    <main className="relative flex flex-col gap-5 px-5 pt-4 pb-8 tablet:gap-6 tablet:px-10 tablet:pt-6 tablet:pb-16 desktop:mx-auto desktop:w-full desktop:max-w-(--layout-content-max) desktop:px-0">
      <header className="flex flex-col gap-2">
        <h1 className="type-h1 text-text-primary">Faces</h1>
        <p className="type-body text-text-secondary tablet:max-w-[600px]">
          Lookalike and era faces, each a step-by-step recipe with a build to match.
        </p>
        {cards.some((c) => c.sample) && <p className="type-caption text-text-muted tablet:max-w-[600px]">{DEMO_NOTE}</p>}
      </header>
      <div className="flex flex-col gap-5 tablet:flex-row-reverse tablet:items-center tablet:gap-6">
        <FaceSearch value={query} onChange={search} />
        {/* A sideways-scrolling row also clips up and down: 4 px of padding (cancelled by -4 px margin) keeps each
            chip's 44 px tap area and its focus ring (2 px outline, 2 px offset); 6 px of scroll padding keeps the ring
            in view when focus scrolls a chip to the row's edge (4 px for the ring, 2 for rounding: chips are fractional
            widths, the scroll lands on whole pixels). On phone it runs to the screen's edges, as Figma's
            chips run off the frame. */}
        <div className="-mx-5 -my-1 flex scroll-px-1.5 overflow-x-auto px-5 py-1 tablet:-mx-1 tablet:min-w-0 tablet:flex-1 tablet:px-1">
          <PillRow
            selected={FACE_FILTERS.findIndex((f) => f.value === filter)}
            className="flex w-max shrink-0 gap-2"
            chips={(pill) =>
              FACE_FILTERS.map((f, i) => (
                <FilterChip
                  key={f.value}
                  testId={`filter-chip-${i + 1}`}
                  label={f.label}
                  count={counts[f.value]}
                  pressed={filter === f.value}
                  pill={pill}
                  onPress={(e) => pick(f.value, e.detail === 0)}
                />
              ))
            }
            ghosts={FACE_FILTERS.map((f) => (
              <FilterChipGhost key={f.value} label={f.label} count={counts[f.value]} />
            ))}
          />
        </div>
      </div>
      {shown.length > 0 ? (
        <div ref={flipList} className="flex flex-col gap-4 tablet:gap-6">
          {/* The old grid fades out in the layer over the new one (Smooth tab, useSmoothTab). */}
          <div className="relative">
            <div ref={leave} aria-hidden="true" inert className="pointer-events-none absolute inset-x-0 top-0 z-1" />
            <ul ref={grid} data-testid="face-grid" className="grid grid-cols-2 gap-x-3 gap-y-4 tablet:grid-cols-3 tablet:gap-x-6 tablet:gap-y-8 desktop:grid-cols-6">
              {shown.map((card) => (
                <FaceCard key={card.id} card={card} place={place.get(card.id) ?? 0} />
              ))}
              <li data-flip="missing-face">
                {/* Figma "Suggest a face" (341:1316): the picture's size, a dashed border/strong outline, lime plus. */}
                <Link
                  href={SUBMIT_HREF}
                  data-testid="missing-face-tile"
                  className={`group flex aspect-[4/5] flex-col justify-end gap-1.5 rounded-md border border-dashed border-border-strong p-4 hover:border-input-border-hovered hover:bg-hover-fill-page ${STATE_TRANSITION} ${PRESS_CARD}`}
                >
                  <span className={`flex text-text-secondary group-hover:text-text-primary ${STATE_TRANSITION}`}>
                    <Icon name="plus" size={24} />
                  </span>
                  <span className="type-label text-text-primary">Missing a face?</span>
                  <span className="type-caption text-text-muted">Suggest one on Submit</span>
                </Link>
              </li>
            </ul>
          </div>
          <RequestPanel />
        </div>
      ) : (
        <NoFaces enter={query !== ""} />
      )}
      {/* Cards a search drops fade out in this layer (useFlip); outside the grid, so they still fade when a search
          leaves nothing and the grid gives way to the no-results card. */}
      <div ref={flipLayer} aria-hidden="true" inert className="pointer-events-none absolute inset-0 z-1" />
    </main>
  );
}

/** Figma "Request a face panel" (427:10078): stacked on phone; text and a 240 px button in one row from tablet up. */
function RequestPanel() {
  return (
    <section data-flip="request-panel" aria-labelledby="request-face-title" className="flex flex-col gap-3.5 rounded-lg bg-bg-surface p-5 tablet:flex-row tablet:items-center tablet:gap-6">
      <div className="flex flex-col gap-1 tablet:min-w-0 tablet:flex-1">
        <h2 id="request-face-title" className="type-h4 text-text-primary">
          Who should we make next?
        </h2>
        <p className="type-body text-text-secondary">Ask for a face, or vote for one someone already asked for</p>
      </div>
      <Link href={REQUEST_FACE_HREF} data-testid="request-face-link" className={buttonClass("secondary", "w-full shrink-0 tablet:w-60", "large", "surface")}>
        <ButtonLabel icon="arrow-right">Request a face</ButtonLabel>
      </Link>
    </section>
  );
}

/** Figma "Empty" (372:1935): the face icon, "No faces here yet" and Request a face (Medium), centred. */
function NoFaces({ enter }: { enter: boolean }) {
  // A search that leaves nothing fades the card in (--dur-base) instead of swapping it in at once.
  const fade = enter ? "animate-[fade-in_var(--dur-base)_var(--ease-out)_both]" : "";
  return (
    <div data-testid="faces-empty" className={`flex flex-col items-center gap-2.5 rounded-lg bg-bg-surface px-6 py-10 text-center ${fade}`}>
      <span className="flex text-text-muted">
        <Icon name="faces" size={40} />
      </span>
      <h2 className="type-h3 text-text-primary">No faces here yet</h2>
      {/* Figma sets this line on one line at 393, running 3 px into the card's 24 px padding: -4 px each side allows
          that, and it still wraps, balanced, on narrower phones. */}
      <p className="type-body -mx-1 text-balance text-text-secondary">Ask for it, and vote for what we make next</p>
      <Link href={REQUEST_FACE_HREF} className={buttonClass("secondary", "", "medium", "surface")}>
        <ButtonLabel icon="arrow-right">Request a face</ButtonLabel>
      </Link>
    </div>
  );
}
