import Link from "next/link";
import { CARD_STATE, LIME, POSITION } from "@/components/builds/BuildCard";
import { KeyStats } from "@/components/builds/KeyStats";
import { PlayStyleButton } from "@/components/builds/PlayStyleInfo";
import { hasKeyStats, type BuildPreviewView } from "@/lib/build-preview";

// D-62's stat-strip card as a preview: the matching build on a finished face (Figma 374:2045, D-79) and Home's meta
// builds (364:2220, D-75). bg/surface, 1 px border/subtle, 16 px corners, 16 px in, 14 px apart. The build's in-game
// face or the ProBuilds mannequin (76 px, D-98); the tag, if any; the name (H3) over the position chips and "Level …"
// or "… · not recorded yet"; the six key stats; the PlayStyles+. On a real face's page the version tag and credit
// follow (rules 4, 5); beside Figma's samples they are left out, as drawn. As BuildCard: a link laid over the card
// opens the build, and the PlayStyle+ badges above it open what each does (D-121 (4)).

export function BuildPreviewCard({ build, testId, className = "" }: { build: BuildPreviewView; testId: string; className?: string }) {
  return (
    <div data-testid={testId} className={`relative flex flex-col gap-3.5 rounded-lg border border-border-subtle bg-bg-surface p-4 ${CARD_STATE} ${className}`}>
      <Link href={build.href} aria-labelledby={`${testId}-title`} className="absolute inset-0 z-1 rounded-lg" />
      <div className="flex items-center gap-3.5">
        <div className="size-19 shrink-0 overflow-hidden rounded-md">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export; an SVG or a sized WebP */}
          <img src={build.picture?.src ?? "/art/probuilds-face.svg"} alt={build.picture?.alt ?? ""} width={76} height={76} className="size-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          {build.tag && <span className={`type-caption rounded-full px-2.5 py-0.5 ${LIME}`}>{build.tag}</span>}
          <h3 id={`${testId}-title`} className="type-h3 max-w-full break-words text-text-primary uppercase">
            {build.title}
          </h3>
          <div className="flex w-full flex-wrap items-center gap-1.5">
            {build.positions.map((p) => (
              <span key={p} className={`type-caption rounded-xs px-1.5 py-px ${POSITION}`}>
                {p}
              </span>
            ))}
            <span className="type-caption text-text-secondary">{build.line}</span>
          </div>
        </div>
      </div>
      {hasKeyStats(build.keyStats) && <KeyStats stats={build.keyStats} />}
      <div className="flex flex-col gap-2">
        <h4 className="type-caption text-text-secondary">PlayStyles+</h4>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {build.playStylesPlus.map((p) => (
            <li key={p.name} className="flex">
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
      {(build.versionTag || build.credit) && (
        <div className="flex flex-col">
          {build.versionTag && <p className="type-caption text-text-muted">{build.versionTag}</p>}
          {build.credit && <p className="type-caption text-text-muted">{build.credit}</p>}
        </div>
      )}
    </div>
  );
}
