import Link from "next/link";
import { ViewTransition } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Callout } from "@/components/ui/Callout";
import { DraftTag } from "@/components/ui/DraftTag";
import { type BuildPageView as View, PICTURE_CAPTION, RAW_VALUES_NOTE } from "@/lib/build-page";
import { BuildAttributes } from "./BuildAttributes";
import { LIME, POSITION } from "./BuildCard";
import { BuildDetails } from "./BuildDetails";
import { ChosenLevel } from "./ChosenLevel";
import { Emblem } from "./Emblem";
import { KeyStats } from "./KeyStats";
import { LevelSwitch } from "./LevelSwitch";
import { ShareBuild } from "./ShareBuild";
import { StickyColumn } from "@/components/ui/StickyColumn";

// Figma "Build · Meta Finisher" (phone 298:3630, tablet 306:794, desktop 306:1286; D-63) and its states: level 32
// (371:1697), not yet checked (371:2208), older season (371:2719). Phone is one column: the tag, name, version tag,
// credit and Share build; the level switch; the raw-values note; the face block, key stats and caption; "All of it
// at level N", the specialization, body and skills, PlayStyles+, PlayStyles, attributes and the sample's footnote.
// Tablet splits into a 300 px summary column (title to stats) and the details, 40 px apart, 24 px between blocks;
// desktop's summary is 400 px, 64 px from the details.
export function BuildPageView({ view }: { view: View }) {
  const raw = <p className="type-caption pt-2 text-text-secondary">{RAW_VALUES_NOTE}</p>;
  return (
    // The level switch tells Share build which level the story cards show (D-114 (3)).
    <ChosenLevel>
      <main className="flex flex-col px-5 pt-6 pb-8 tablet:gap-6 tablet:px-10 tablet:pb-16 desktop:mx-auto desktop:w-full desktop:max-w-(--layout-content-max) desktop:px-0">
        {view.shared ? (
          // Figma 439:8850: "Builds / Shared build", both in text/secondary.
          <Breadcrumb links={[{ href: "/builds", label: "Builds" }]} current={view.shared.tag} muted />
        ) : (
          <Breadcrumb
            links={[
              { href: `/builds#${view.archetype.id}`, label: "Builds" },
              { href: `/builds/${view.archetype.id}`, label: view.archetype.name },
            ]}
            current={view.title}
          />
        )}
        <div className="flex flex-col tablet:flex-row tablet:items-start tablet:gap-10 desktop:gap-16">
          <StickyColumn className="flex flex-col tablet:w-75 tablet:shrink-0 tablet:gap-6 desktop:w-100">
            {/* Figma 371:2719 / 427:5557: the warning tops the summary column, above the badge. */}
            {view.olderSeason && (
              <div data-testid="older-season">
                <Callout>{view.olderSeason}</Callout>
              </div>
            )}
            <BuildHeader view={view} />
            {view.levels && <LevelSwitch levels={view.levels} />}
            <div className="tablet:hidden">{raw}</div>
            <BuildHero view={view} />
          </StickyColumn>
          <div className="flex min-w-0 flex-1 flex-col tablet:gap-6">
            <div className="hidden tablet:block">{raw}</div>
            <BuildDetails view={view} />
            <BuildAttributes groups={view.attributeGroups} mastery={view.mastery} />
            {view.footnote && <p className="type-caption py-1 text-text-secondary">{view.footnote}</p>}
          </div>
        </div>
      </main>
    </ChosenLevel>
  );
}

/** The tag, name, version tag (rule 4), credit (rule 5) and Share build (Figma 298:3653). */
function BuildHeader({ view }: { view: View }) {
  const tagTone = view.checked && !view.olderSeason ? "text-text-secondary" : "text-status-warning";
  // The sample's own line stands in for the Draft tag (D-107): Figma draws it under the badge.
  const draft = view.draft && !view.sampleLabel;
  return (
    <section aria-label="Build" className="flex flex-col gap-5 pt-4">
      <div className="flex flex-col">
        {view.shared && (
          // Figma 439:8864: the neutral "Shared build" tag over the player line.
          <div className="flex min-h-6 flex-col items-start gap-1.5">
            <span className="type-label rounded-full bg-bg-raised px-2.5 py-[3px] text-text-primary">{view.shared.tag}</span>
            <p className="type-label text-text-muted">{view.shared.line}</p>
          </div>
        )}
        {(view.badge || draft || view.sampleLabel) && (
          <div className="flex min-h-6 flex-col items-start gap-1.5">
            {(view.badge || draft) && (
              <div className="flex flex-wrap gap-1.5">
                {view.badge === "Meta pick" && <span className={`type-label rounded-full px-2.5 py-0.75 ${LIME}`}>Meta pick</span>}
                {view.badge === "Recommended" && (
                  <span className="type-label rounded-full border border-border-strong bg-bg-raised px-2.5 py-0.5 text-text-primary">Recommended</span>
                )}
                {draft && <DraftTag />}
              </div>
            )}
            {view.sampleLabel && <p className="type-label text-text-muted">{view.sampleLabel}</p>}
          </div>
        )}
        {/* Shared with the build card that opened this page (Expand card, #22; BuildCard). */}
        <h1 className="type-h1 pt-2 break-words text-text-primary uppercase">
          <ViewTransition name={`build-${view.id}-title`} share="build-expand" default="none">
            <span className="inline-block max-w-full">{view.title}</span>
          </ViewTransition>
        </h1>
        {/* TODO(Chime): the design colours the tag amber when unchecked or from an older season; a checked
            current-season tag isn't drawn, so it is text/secondary here. */}
        <p data-testid="version-tag" className={`type-label pt-3 ${tagTone}`}>
          {view.versionTag}
        </p>
        {view.credit && <p className="type-caption pt-1 text-text-secondary">{view.credit}</p>}
        {view.reference && (
          // Figma 371:2208 draws the sample's reference as "a creator"; a real one names the streamer (rule 5, D-66).
          <p className="type-caption pt-1 text-text-secondary">
            {`Read from ${view.reference.name}'s video`}
            {view.reference.url && (
              <>
                {" · "}
                <a href={view.reference.url} target="_blank" rel="noopener noreferrer" className="tap-target underline-offset-4 hover:underline">
                  Watch the video
                </a>
              </>
            )}
          </p>
        )}
      </div>
      {view.shared ? (
        // Figma 439:8862: on a shared build the note comes first, then Share build and Make your own build (1 px border).
        <>
          {view.uncheckedNote && <Callout testId="shared-note">{view.uncheckedNote}</Callout>}
          <ShareBuild title={view.title} share={view.share} />
          <Link
            href={view.shared.makeYourOwn.href}
            className="type-button-lg inline-flex h-13 w-full items-center justify-center rounded-sm border border-border-strong px-8 text-text-primary transition-[background-color,border-color,scale] duration-(--dur-fast) ease-(--ease-out) hover:border-input-border-hovered hover:bg-hover-fill-page active:scale-[0.97] motion-reduce:active:scale-100"
          >
            {view.shared.makeYourOwn.label}
          </Link>
        </>
      ) : (
        <>
          <ShareBuild title={view.title} share={view.share} />
          {view.uncheckedNote && <Callout testId="unchecked-note">{view.uncheckedNote}</Callout>}
        </>
      )}
    </section>
  );
}

/** The face, archetype, positions, level line, key stats and picture caption (Figma "Build hero" 304:787). */
function BuildHero({ view }: { view: View }) {
  return (
    <div className="flex flex-col gap-4 pt-8 tablet:pt-0">
      <div className="flex items-center gap-4">
        <ViewTransition name={`build-${view.id}-picture`} share="build-expand" default="none">
          <div className="size-28 shrink-0 overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export; an SVG or a sized WebP */}
            <img
              src={view.picture?.src ?? "/art/probuilds-face.svg"}
              alt={view.picture?.alt ?? ""}
              width={112}
              height={112}
              className="size-full object-cover"
            />
          </div>
        </ViewTransition>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <Emblem id={view.archetype.id} className="size-8" />
            <div className="flex flex-col">
              <p className="type-h4 text-text-primary uppercase">{view.archetype.name}</p>
              <p className="type-caption text-text-secondary">{view.archetype.groupLabel}</p>
            </div>
          </div>
          <ul aria-label="Positions" className="flex flex-wrap gap-1.5">
            {view.positions.map((p) => (
              <li key={p} className={`type-caption rounded-xs px-1.5 py-px ${POSITION}`}>
                {p}
              </li>
            ))}
          </ul>
          <p className="type-caption text-text-secondary">{view.body}</p>
        </div>
      </div>
      <KeyStats stats={view.keyStats} roll />
      {!view.picture && <p className="type-caption text-text-muted">{PICTURE_CAPTION}</p>}
    </div>
  );
}
