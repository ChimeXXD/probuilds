import type { BuildPageView, SpecializationView } from "@/lib/build-page";
import { NUMBER_SM } from "./BuildAttributes";
import { PlayStyleArt } from "./PlayStyleArt";
import { PlayStyleButton } from "./PlayStyleInfo";

// The build page's details (Figma 298:3733 to 298:3849, D-63): "All of it at level N" (the sample's, D-107), the
// specialization card, body and skills, PlayStyles+ and PlayStyles. Returned as siblings so the details column's 24 px gap (tablet, desktop) falls between them. Two
// columns on phone and tablet (159 px each, as drawn), three on desktop.
// TODO(Chime): Figma's specialization values are 18 px Barlow Condensed with no text style; built as drawn, in
// status/warning, the nearest token to the drawn gold, which is not a token.
const COLUMNS = "grid grid-cols-[repeat(2,minmax(0,159px))] gap-x-3 desktop:grid-cols-3 desktop:gap-x-6";

export function BuildDetails({ view }: { view: BuildPageView }) {
  return (
    <>
      {view.allOfIt && (
        <section aria-labelledby="all-of-it" data-testid="all-of-it" className="pt-4">
          <div className="flex flex-col rounded-sm bg-bg-surface p-3">
            <h2 id="all-of-it" className="type-label text-text-secondary">
              {view.allOfIt.heading}
            </h2>
            <p className="type-caption min-h-[29px] pt-2 text-text-primary">{view.allOfIt.text}</p>
          </div>
        </section>
      )}
      {view.specialization && <Specialization spec={view.specialization} />}
      {/* Figma's rows are 41.14 px on phone and tablet (a 2 px-padded description overflows them) and 44 px on desktop. */}
      <dl className={`${COLUMNS} auto-rows-[41.14px] gap-y-3 pt-4 desktop:auto-rows-[44px]`}>
        {view.facts.map((f) => (
          <div key={f.term} className="flex flex-col">
            <dt className="type-label text-text-secondary">{f.term}</dt>
            <dd className="type-label pt-0.5 text-text-primary">
              {f.label === undefined || f.label === f.value ? (
                f.value
              ) : (
                <>
                  {f.stars !== undefined ? (
                    <Stars count={f.stars} />
                  ) : (
                    <span aria-hidden="true">{f.value}</span>
                  )}
                  <span className="sr-only">{f.label}</span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <h2 className="type-label pt-4 text-text-secondary">PlayStyles+</h2>
      {/* Figma's phone and tablet lists are 36 px tall around 36.8 px items (298:3630, 306:794); desktop's hug them. */}
      <ul className={`${COLUMNS} -mb-[0.8px] gap-y-2 pt-2 desktop:mb-0`}>
        {view.playStylesPlus.map((p) => (
          <li key={p.name} className="flex min-w-0">
            <PlayStyleButton name={p.name} tier="plus" className="-m-1 flex min-w-0 items-center gap-2 p-1">
              <Badge icon={p.icon} />
              <span className="flex min-w-0 flex-col">
                {/* Figma's name line is 16.8 px tall, so "Signature" sits 3.2 px into it (298:3811). */}
                <span className={`type-label break-words text-text-primary ${p.signature ? "-mb-[3.2px]" : ""}`}>{p.name}</span>
                {p.signature && <span className="type-label text-text-secondary">Signature</span>}
              </span>
            </PlayStyleButton>
          </li>
        ))}
      </ul>
      <h2 className="type-label pt-4 text-text-secondary">PlayStyles</h2>
      {/* TODO(Chime): no design for a build with no regular PlayStyles; the heading then stands over an empty list. */}
      <ul className={`${COLUMNS} gap-y-2 pt-2 pb-4`}>
        {view.playStyles.map((p) => (
          <li key={p.name} className="flex min-w-0">
            <PlayStyleButton name={p.name} tier="playStyle" className="-m-1 flex min-w-0 items-center gap-2 p-1">
              <Badge icon={p.icon} tinted />
              <span className="type-label min-w-0 break-words text-text-primary">{p.name}</span>
            </PlayStyleButton>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * The PlayStyle badge (EA's art, D-39), 36 px; a placeholder or a badge not exported yet keeps the slot empty. The
 * white regular badges are `tinted` (text/primary in light mode, D-114 (4)); the gold PlayStyle+ ones stay pictures.
 */
function Badge({ icon, tinted = false }: { icon: string | null; tinted?: boolean }) {
  if (!icon) return <span aria-hidden="true" className="size-9 shrink-0" />;
  if (tinted) return <PlayStyleArt src={icon} className="size-9" />;
  // eslint-disable-next-line @next/next/no-img-element -- static export, files already sized
  return <img src={icon} alt="" width={36} height={36} className="size-9 shrink-0" />;
}

/** Figma "Section" 298:3740: the specialization, its PlayStyle+, the build's value beside each unlock target. */
function Specialization({ spec }: { spec: SpecializationView }) {
  return (
    <section aria-labelledby="specialization" className="pt-4">
      <div className="flex flex-col rounded-sm bg-bg-surface p-3">
        <h2 id="specialization" className="type-label text-text-secondary">
          Specialization
        </h2>
        <div className="flex h-[49px] items-center gap-2 pt-2">
          {spec.icon && (
            // The badge opens what the PlayStyle+ does (D-121 (4)); 4 px around it make the 44 px target.
            <PlayStyleButton name={spec.plus?.replace(/\+$/, "") ?? ""} tier="plus" on="surface" className="-m-1 flex shrink-0 p-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, files already sized */}
              <img src={spec.icon} alt="" width={36} height={36} className="size-9 shrink-0" />
            </PlayStyleButton>
          )}
          <div className="flex min-w-0 flex-col">
            <p className="type-number-md break-words text-text-primary uppercase">{spec.name}</p>
            {spec.plus && <p className="type-label text-text-secondary">{spec.plus}</p>}
          </div>
        </div>
        {/* Figma sets the sample's two notes 305 px wide on phone (298:3750, 298:3771). */}
        {spec.note && <p className="type-caption max-w-[305px] pt-2 text-text-secondary tablet:max-w-none">{spec.note}</p>}
        {spec.targets.length > 0 && (
          // Figma's target rows are 20.3 px tall, 4 px apart (every Build frame).
          <ul aria-label="Unlock targets" className="flex flex-col gap-1 pt-2">
            {spec.targets.map((t) => (
              <li key={t.attribute} className="flex h-[20.3px] items-start justify-between gap-3">
                <span className="type-caption text-text-primary">{t.attribute}</span>
                <span className="leading-[18px] whitespace-nowrap">
                  <span className={`${NUMBER_SM} text-text-primary`}>{t.value ?? "–"}</span>
                  <span className="font-text text-[14px] leading-[18px] font-semibold text-text-muted">{` / ${t.target ?? "–"}`}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {/* TODO(Chime): no design says when a build's values fall short of a target; the line is left out then. */}
        {spec.reachedAt !== null && <p className="type-label h-7.5 pt-2 text-text-primary">{`Reached at level ${spec.reachedAt}`}</p>}
        {spec.reachedFrom && <p className="type-caption max-w-[305px] pt-2 text-text-secondary tablet:max-w-none">{spec.reachedFrom}</p>}
      </div>
    </section>
  );
}

/* Barlow has no ★, so the glyph fell back to a system font that differs by device and drew bigger, heavier stars
   than Figma (4 stars span 54 px at 11 px tall there). Drawn as one shape instead, so every device matches. */
function Stars({ count }: { count: number }) {
  return (
    <span aria-hidden="true" className="flex h-5 items-center gap-[3px]">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} viewBox="2 2 20 19.02" width={11.6} height={11} className="shrink-0 fill-current">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
        </svg>
      ))}
    </span>
  );
}
