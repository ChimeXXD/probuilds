import Link from "next/link";
import { ViewTransition } from "react";
import { DraftTag } from "@/components/ui/DraftTag";
import type { BuildCardView } from "@/lib/archetype-page";
import { KeyStats } from "./KeyStats";
import { PlayStyleButton } from "./PlayStyleInfo";

// Figma "Build · Meta Finisher" (288:1096, D-62 option B, the "stat strip" card): the build's in-game face, or the
// ProBuilds mannequin when it has none (D-89, D-98); a Meta pick or Recommended tag; the name; position chips with
// level, height and weight; the six key stats in one ruled row; the PlayStyles+. Under them, the version tag and
// credit line every recorded build carries (D-05, D-08; not drawn on the Figma card, whose builds are samples: a
// sample card has no Draft tag, version tag or credit, and the page's note marks it, D-107, D-113). The card is a
// subgrid of three rows, or four with the footer, so headers in a row share one height and the stat rows line up (D-62).
// Expand card (motion-bookmarks.pdf #22): the picture and the name are shared with the build page's (BuildPageView), so
// opening a card carries them across in a View Transition where the browser has one; elsewhere the page just opens.
// The whole card opens the build: a link laid over it, named by the build's title, under the PlayStyle+ badges, which
// are buttons that open what each does (D-121 (4)); a button can't sit inside a link. Hover (D-121 (1)): the card's
// surface takes the faint hover fill (pointer only), press 0.98 (emil-design-eng: a card is larger, so a smaller step).
export const CARD_STATE =
  "transition-[background-color,scale] duration-(--dur-fast) ease-(--ease-out) hover:bg-hover-fill has-[>a:active]:scale-[0.98] motion-reduce:has-[>a:active]:scale-100";
export const LIME = "bg-accent-fill text-accent-on-fill light:ring-1 light:ring-accent-on-fill light:ring-inset";
// Position chips are neutral: lime is kept for the badge, the main action and the selection (DESIGN.md "one accent", D-115).
export const POSITION = "bg-bg-raised text-text-primary ring-1 ring-border-subtle ring-inset";

/** The card's rows: three when no card on the page has a footer (every card a sample), else four. */
export const CARD_ROWS = { 3: "row-span-3", 4: "row-span-4" } as const;

export function BuildCard({ card, rows }: { card: BuildCardView; rows: keyof typeof CARD_ROWS }) {
  const draft = card.draft && !card.sample;
  return (
    <li className={`${CARD_ROWS[rows]} grid grid-rows-subgrid`}>
      <div
        data-testid={`build-card-${card.id}`}
        className={`relative ${CARD_ROWS[rows]} grid grid-rows-subgrid gap-y-3.5 rounded-lg border border-border-subtle bg-bg-surface p-4 ${CARD_STATE}`}
      >
        <Link href={card.href} aria-labelledby={`build-card-title-${card.id}`} className="absolute inset-0 z-1 rounded-lg" />
        <div className="flex items-center gap-3.5">
          <ViewTransition name={`build-${card.id}-picture`} share="build-expand" default="none">
            <div className="size-19 shrink-0 overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export; an SVG or a sized WebP */}
              <img
                src={card.picture?.src ?? "/art/probuilds-face.svg"}
                alt={card.picture?.alt ?? ""}
                width={76}
                height={76}
                className="size-full object-cover"
              />
            </div>
          </ViewTransition>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            {(card.badge || draft) && (
              <div className="flex flex-wrap gap-1.5">
                {/* Figma draws this tag 24 px tall on phone (288:1100) and 26 px, like Recommended, from tablet (290:952). */}
                {card.badge === "Meta pick" && <span className={`type-caption rounded-full px-2.5 py-0.5 tablet:py-[3px] ${LIME}`}>Meta pick</span>}
                {card.badge === "Recommended" && (
                  <span className="type-caption rounded-full border border-border-strong bg-bg-raised px-2.5 py-0.5 text-text-primary">Recommended</span>
                )}
                {draft && <DraftTag />}
              </div>
            )}
            <h2 id={`build-card-title-${card.id}`} className="type-h3 max-w-full break-words text-text-primary uppercase">
              {/* The name travels as a box that hugs its words, so the two snapshots keep one shape and only scale. */}
              <ViewTransition name={`build-${card.id}-title`} share="build-expand" default="none">
                <span className="inline-block max-w-full">{card.title}</span>
              </ViewTransition>
            </h2>
            <div className="flex w-full flex-wrap items-center gap-1.5">
              {card.positions.map((p) => (
                <span key={p} className={`type-caption rounded-xs px-1.5 py-px ${POSITION}`}>
                  {p}
                </span>
              ))}
              <span className="type-caption text-text-secondary">{card.body}</span>
            </div>
          </div>
        </div>
        <KeyStats stats={card.keyStats} />
        <div className="flex flex-col gap-2">
          <h3 className="type-caption text-text-secondary">PlayStyles+</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {card.playStylesPlus.map((p) => (
              <li key={p.name} className="flex">
                {/* Above the card's link; 10 px around the 24 px badge make the 44 px target. */}
                <PlayStyleButton name={p.name} tier="plus" on="surface" className="relative z-2 -m-2.5 flex items-center gap-1.5 p-2.5">
                  {p.icon && (
                    // eslint-disable-next-line @next/next/no-img-element -- static export, files already sized (2x)
                    <img src={p.icon} alt="" width={24} height={24} className="size-6 shrink-0" />
                  )}
                  <span className="type-caption text-text-primary">{p.name}</span>
                </PlayStyleButton>
              </li>
            ))}
          </ul>
        </div>
        {rows === 4 &&
          (card.sample ? (
            <div />
          ) : (
            <div className="flex flex-col">
              <p className="type-caption text-text-muted">{card.versionTag}</p>
              {card.olderSeason && <p className="type-caption text-status-warning">{card.olderSeason}</p>}
              {card.credit && <p className="type-caption text-text-muted">{card.credit}</p>}
            </div>
          ))}
      </div>
    </li>
  );
}
