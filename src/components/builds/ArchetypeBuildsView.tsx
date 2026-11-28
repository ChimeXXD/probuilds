import Link from "next/link";
import { Icon } from "@/components/shell/Icon";
import { type BuildCardView, buildCountLabel, SAMPLE_CARDS_NOTE, submitTile } from "@/lib/archetype-page";
import type { ArchetypeView } from "@/lib/builds";
import { BuildCard, CARD_ROWS } from "./BuildCard";
import { Emblem } from "./Emblem";

// Figma "Archetype · Finisher" (phone 288:1031, tablet 290:796, desktop 290:1084; D-62): the breadcrumb, the
// archetype's emblem, name and "<group> · N builds", then its builds as stat strip cards, one column on phone, two
// on tablet, three in the 1200 px column on desktop, 24 px apart (12 between phone cards). A gap in the last row
// is filled with a "Submit a build" tile. Content: 8 / 20 / 32 px on phone, 24 / 40 / 64 on tablet and desktop.
// Figma's builds are samples (D-107): "Sample values: not real builds yet" sits once above them (288:1094).
const TILE_DESKTOP = { 0: "desktop:hidden", 1: "desktop:flex", 2: "desktop:flex desktop:col-span-2" } as const;

export function ArchetypeBuildsView({ archetype, cards }: { archetype: ArchetypeView; cards: BuildCardView[] }) {
  const tile = submitTile(cards.length);
  const rows = cards.every((c) => c.sample) ? 3 : 4;
  return (
    <main className="flex flex-col gap-5 px-5 pt-2 pb-8 tablet:gap-6 tablet:px-10 tablet:pt-6 tablet:pb-16 desktop:mx-auto desktop:w-full desktop:max-w-(--layout-content-max) desktop:px-0">
      <nav aria-label="Breadcrumb">
        <ol className="type-caption flex gap-1.5">
          <li>
            <Link href={`/builds#${archetype.id}`} className="tap-target text-text-secondary transition-colors duration-(--dur-fast) ease-(--ease-out) hover:text-text-primary">
              Builds
            </Link>
          </li>
          <li aria-hidden="true" className="text-text-muted">
            /
          </li>
          <li aria-current="page" className="text-text-primary">
            {archetype.name}
          </li>
        </ol>
      </nav>
      <header className="flex items-center gap-3.5">
        <span role="img" aria-label={archetype.name} data-testid="archetype-emblem" className="flex size-14 shrink-0">
          <Emblem id={archetype.id} className="size-full" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="type-h1 break-words text-text-primary">{archetype.name}</h1>
          <p className="type-caption text-text-secondary">{buildCountLabel(archetype.groupLabel, cards.length)}</p>
        </div>
      </header>
      {cards.some((c) => c.sample) && <p className="type-caption text-text-muted">{SAMPLE_CARDS_NOTE}</p>}
      {/* TODO(Chime): no empty state in Figma for an archetype with no builds yet; the list is left out. */}
      {cards.length > 0 && (
        <ul className="grid grid-cols-1 gap-y-3 tablet:grid-cols-2 tablet:gap-6 desktop:grid-cols-3">
          {cards.map((card) => (
            <BuildCard key={card.id} card={card} rows={rows} />
          ))}
          {(tile.tablet || tile.desktopSpan > 0) && (
            <li
              className={`${CARD_ROWS[rows]} hidden ${tile.tablet ? "tablet:flex" : "tablet:hidden"} ${TILE_DESKTOP[tile.desktopSpan]}`}
            >
              {/* Figma "Submit tile" (290:1067): a dashed hairline box, the plus icon and "Submit a build". */}
              <Link
                href="/submit"
                data-testid="submit-tile"
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-subtle text-text-primary transition-[background-color,border-color,scale] duration-(--dur-fast) ease-(--ease-out) hover:border-border-strong hover:bg-hover-fill-page active:scale-[0.98] motion-reduce:active:scale-100"
              >
                <Icon name="plus" size={24} />
                <span className="type-label">Submit a build</span>
              </Link>
            </li>
          )}
        </ul>
      )}
    </main>
  );
}
