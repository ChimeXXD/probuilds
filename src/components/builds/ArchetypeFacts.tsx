import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { type ArchetypeView, buildsHref } from "@/lib/builds";
import { PlayStyleArt } from "./PlayStyleArt";

// The selected archetype's facts under or beside its Stance card, all from content/archetypes/fc27.json.

function Badge({ icon }: { icon: string }) {
  // EA's PlayStyle badge (D-39), 48 px, from Figma PlayStyle/… (Tier=PlayStyle). The name beside it is the label.
  // The badge is a white diamond, which vanishes on the cream light-mode page, so light mode tints it text/primary,
  // as Figma tints it on the light story cards (D-114 (4)).
  return <PlayStyleArt src={icon} className="size-12" />;
}

function BuildsLink({ archetype, className }: { archetype: ArchetypeView; className: string }) {
  // /builds/<archetype> is a preview page for now (D-105): on the live export the link opens the 404 until it ships.
  return (
    <Link href={buildsHref(archetype)} className={buttonClass("secondary", className)}>
      {`See ${archetype.name} builds`}
    </Link>
  );
}

/** Phone (Figma "Detail" 241:717): centred under the card. The name is on the card itself (option E, D-57). */
export function PhoneFacts({ archetype }: { archetype: ArchetypeView }) {
  return (
    <div className="flex flex-col items-center gap-5 px-5 pt-2 pb-10 tablet:hidden">
      <div className="flex flex-col items-center gap-3">
        <p className="type-caption text-center text-text-muted">Signature PlayStyles</p>
        <ul className="flex gap-8">
          {archetype.signature.map((p) => (
            <li key={p.name} className="flex flex-col items-center gap-2">
              <Badge icon={p.icon} />
              <span className="type-label text-center text-text-primary">{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* All 13 have them (EA's Pitch Notes table); a file without them leaves the line out. */}
      {archetype.mastery && (
        <p className="type-caption text-center text-text-secondary">{`Mastery attributes: ${archetype.mastery}`}</p>
      )}
      <BuildsLink archetype={archetype} className="w-full" />
    </div>
  );
}

/** Tablet and desktop (Figma "Facts" 279:1464 / 276:1233, D-60): beside the card. */
export function WideFacts({ archetype }: { archetype: ArchetypeView }) {
  const tiles = [
    archetype.mastery && { label: "Mastery attributes", value: archetype.mastery },
    archetype.apChange && { label: "AP cost changes, 22 Oct", value: archetype.apChange },
  ].filter((t): t is { label: string; value: string } => Boolean(t));
  return (
    <div className="hidden min-w-0 flex-1 flex-col gap-6 tablet:flex desktop:gap-7">
      <div className="flex flex-col gap-1">
        <p className="type-label text-text-secondary">{`${archetype.groupLabel} · Archetype ${archetype.place} of ${archetype.total}`}</p>
        <h2 className="type-h2 text-text-primary">{archetype.name}</h2>
        {/* TODO(Chime): no wording yet for an archetype checked in game; only the unchecked line shows. */}
        {!archetype.checked && <p className="type-caption text-text-muted">Not yet checked in game</p>}
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="type-label text-text-secondary">Signature PlayStyles</h3>
        <ul className="flex gap-10">
          {archetype.signature.map((p) => (
            <li key={p.name} className="flex flex-col items-center gap-2 text-center">
              <Badge icon={p.icon} />
              <span className="type-label text-text-primary">{p.name}</span>
              <span className="type-caption text-text-muted">{p.since}</span>
            </li>
          ))}
        </ul>
      </div>
      {tiles.length > 0 && (
        <div className="flex flex-col gap-3 desktop:flex-row desktop:gap-4">
          {tiles.map((t) => (
            <div key={t.label} className="flex flex-1 flex-col gap-1.5 rounded-lg border border-border-subtle bg-bg-surface px-5 py-[18px]">
              <p className="type-caption text-text-secondary">{t.label}</p>
              <p className="type-h4 text-text-primary">{t.value}</p>
            </div>
          ))}
        </div>
      )}
      <BuildsLink archetype={archetype} className="w-full desktop:w-[360px]" />
      {archetype.sources.length > 0 && (
        <p className="type-caption text-text-muted">
          Sources:{" "}
          {archetype.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {s.label}
              </a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
