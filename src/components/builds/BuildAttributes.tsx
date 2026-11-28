import { RollingNumber } from "@/components/ui/RollingNumber";
import type { AttributeGroupView, BuildPageView } from "@/lib/build-page";

// Figma "Section - Attributes" (298:3850, D-63 (4)): the heading, the mastery line and its source, then the build's
// attributes by group, each with its gauge and one row per attribute: name, a "Mastery +2" pill on the archetype's
// mastery attributes, the value and a bar at value % of the track. One column on phone and tablet, two on desktop
// (40 px apart, rows 32 px apart).
// TODO(Chime): Figma's group names and values are 18 px Barlow Condensed with no text style; built as drawn.
export const NUMBER_SM = "font-display text-[18px] leading-[18px] font-extrabold";

export function BuildAttributes({ groups, mastery }: { groups: AttributeGroupView[]; mastery: BuildPageView["mastery"] }) {
  return (
    <section aria-labelledby="attributes" className="flex flex-col pt-12 pb-4 tablet:pt-4">
      <h2 id="attributes" className="type-h3 text-text-primary">
        Attributes
      </h2>
      {mastery && (
        <div className="flex flex-col gap-1 pt-2 pb-1">
          <p className="type-caption text-text-secondary">{mastery.note}</p>
          {mastery.source && (
            <p className="type-caption text-text-muted">
              {"Sources: "}
              <a href={mastery.source.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                {mastery.source.label}
              </a>
              {" (level 10); levels 30 and 55 seen in game footage, 22 Oct."}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 pt-4 desktop:grid-cols-2 desktop:gap-x-10 desktop:gap-y-8">
        {groups.map((g) => (
          <section key={g.code} aria-labelledby={`group-${g.code}`} className="flex flex-col">
            <div className="flex h-7.5 items-center justify-between">
              <h3 id={`group-${g.code}`} className={`${NUMBER_SM} text-text-primary uppercase`}>
                {g.name}
              </h3>
              <Gauge value={g.value} />
            </div>
            <ul className="flex flex-col pt-2">
              {g.attributes.map((a) => (
                <li key={a.name} className="relative flex min-h-[35.297px] items-start justify-between gap-2 pt-1.75">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-0.75">
                    <span className="type-caption text-text-primary">{a.name}</span>
                    {a.mastery && (
                      <span className="type-caption rounded-full border border-border-strong bg-bg-raised px-1.75 text-text-primary">Mastery +2</span>
                    )}
                  </div>
                  <span className={`${NUMBER_SM} -mt-px text-text-primary`}>{a.value}</span>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0.5 h-0.75 overflow-hidden rounded-[2px] bg-bg-surface light:bg-border-subtle">
                    <span className="block h-full rounded-[2px] bg-text-secondary" style={{ width: `${a.percent}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

/**
 * The group's rating on a half-circle gauge (48 × 30, Figma "Icon" 298:3882), or a dash while it is unknown (A-18). Its
 * number rolls when it changes (Stat card, #13). TODO(Chime): group ratings don't change with the level yet, so the
 * arc has no motion of its own.
 */
function Gauge({ value }: { value: number | null }) {
  const arc = "M6 25.8a18 18 0 0 1 36 0";
  return (
    <span aria-hidden={value === null} className="relative block h-7.5 w-12 shrink-0">
      <svg width="48" height="30" viewBox="0 0 48 30" fill="none" aria-hidden="true" className="absolute inset-0">
        <path d={arc} strokeWidth="4.8" strokeLinecap="round" className="stroke-bg-raised light:stroke-border-subtle" />
        {value !== null && <path d={arc} pathLength={100} strokeDasharray={`${value} 100`} strokeWidth="4.8" strokeLinecap="round" className="stroke-accent-fill light:stroke-accent-text" />}
      </svg>
      <span className={`${NUMBER_SM} absolute inset-x-0 top-3.5 text-center text-text-primary tabular-nums`}>
        <RollingNumber value={value === null ? "–" : String(value)} />
      </span>
    </span>
  );
}
