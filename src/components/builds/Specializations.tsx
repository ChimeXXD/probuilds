import type { SpecializationView } from "@/lib/builds";
import { NUMBER_SM } from "./BuildAttributes";
import { PlayStyleButton } from "./PlayStyleInfo";

// The archetype's specializations on the Builds page (D-121 (3), replacing the "Mastery attributes" and "AP cost
// changes" tiles): each one's name, the PlayStyle+ it gives (EA's gold badge and its name, text/secondary as D-115
// sets PlayStyle+ name lines) and the attribute targets that unlock it (text/primary, D-115), from
// content/archetypes/fc27.json (Chime's in-game check, RESEARCH §10.4). The tiles keep the old tiles' surface,
// border, padding and 12 / 16 px gaps; the header and target rows are the Build page's specialization card (298:3740).
// Stacked on phone and tablet, three across on desktop, where the badge sits over the name so "Gamechanger+" fits.
// Not drawn in Figma yet: to be mirrored there.
// TODO(Chime): the heading "Specializations" is the game's word (RESEARCH §10.4), not a Figma label.

export function Specializations({ items, heading }: { items: SpecializationView[]; heading: "phone" | "wide" }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={`specializations-${heading}`} className={`flex w-full flex-col gap-3 ${heading === "phone" ? "items-stretch" : ""}`}>
      <h3
        id={`specializations-${heading}`}
        className={heading === "phone" ? "type-caption text-center text-text-muted" : "type-label text-text-secondary"}
      >
        Specializations
      </h3>
      <ul data-testid="specializations" className="flex flex-col gap-3 desktop:flex-row desktop:gap-4">
        {items.map((s) => (
          <li
            key={s.name}
            data-testid="specialization"
            className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg border border-border-subtle bg-bg-surface px-5 py-[18px] desktop:px-4"
          >
            <div className="flex items-center gap-2.5 desktop:flex-col desktop:items-start desktop:gap-2">
              {s.plus.icon ? (
                // The badge opens what the PlayStyle+ does (D-121 (4)); 4 px around it make the 44 px target.
                <PlayStyleButton name={s.plus.name} tier="plus" on="surface" className="-m-1 flex shrink-0 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static export; EA's gold PlayStyle+ badge (D-39) */}
                  <img src={s.plus.icon} alt="" width={36} height={36} className="size-9 shrink-0" />
                </PlayStyleButton>
              ) : (
                <span aria-hidden="true" className="size-9 shrink-0" />
              )}
              <div className="flex min-w-0 flex-col">
                <p className="type-h4 break-words text-text-primary">{s.name}</p>
                <p className="type-label break-words text-text-secondary">{`${s.plus.name}+`}</p>
              </div>
            </div>
            {s.targets.length > 0 && (
              <ul aria-label={`${s.name} unlock targets`} className="flex flex-col gap-1">
                {s.targets.map((t) => (
                  <li key={t.attribute} className="flex min-h-[20.3px] items-start justify-between gap-3">
                    <span className="type-caption min-w-0 break-words text-text-primary">{t.attribute}</span>
                    {t.value !== null && <span className={`${NUMBER_SM} shrink-0 text-text-primary`}>{t.value}</span>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
