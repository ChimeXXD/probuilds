import Link from "next/link";
import type { ReactNode } from "react";
import { FaceCard } from "@/components/faces/FaceCard";
import { ButtonLabel, buttonClass } from "@/components/ui/Button";
import { BuildPreviewCard } from "@/components/ui/BuildPreviewCard";
import { PRESS, PRESS_CARD, STATE_TRANSITION, TEXT_LINK } from "@/components/ui/interaction";
import { NEXT_SEASON } from "@/lib/changelog";
import type { HomeView as View } from "@/lib/home";
import { SITE_NAME } from "@/lib/site";

// Figma Home (phone 364:2118, tablet 367:1629, desktop 367:1836; D-75 to D-78, "Quick picks, builds first"). Phone, one
// column 28 px apart: Faces (four round avatars), Face of the week, Meta builds (a rail to swipe), What changed, the
// season card. Tablet and desktop, 40 px apart: Faces as poster cards across the width (D-78), the week (half the width
// plus 14 px) beside What changed, the builds in two columns with a "View all builds" tile (tablet) or three (desktop),
// the season card. The DOM keeps the phone's order; the wider grid places the week and the changes side by side.
// Hover (D-121 (1)): links underline; a round face's ring and name brighten; the "View all builds" tile takes the page's
// faint fill and a brighter dashed border. Presses scale (interaction.ts).
const LINK = `type-label tap-target text-text-primary ${TEXT_LINK}`;

export function HomeView({ view }: { view: View }) {
  return (
    <main className="grid grid-cols-[minmax(0,1fr)] gap-7 px-5 pt-4 pb-8 tablet:grid-cols-[calc((100%-24px)/2+14px)_minmax(0,1fr)] tablet:gap-x-6 tablet:gap-y-10 tablet:px-10 tablet:pt-8 tablet:pb-16 desktop:mx-auto desktop:w-full desktop:max-w-(--layout-content-max) desktop:px-0">
      <h1 className="sr-only">{SITE_NAME}</h1>
      <Section id="home-faces" title="Faces" link={{ href: "/faces", label: "See all" }} className="tablet:col-span-2">
        <ul className="grid grid-cols-4 gap-2 tablet:hidden">
          {view.faces.map((face, i) => (
            <li key={face.id}>
              <Link href={face.href} data-testid={`home-face-${i + 1}`} className={`group flex flex-col items-center gap-2 text-center ${STATE_TRANSITION} ${PRESS}`}>
                <span className={`size-18 overflow-hidden rounded-full border-2 border-border-strong bg-bg-surface group-hover:border-input-border-hovered ${STATE_TRANSITION}`}>
                  {face.picture && (
                    // eslint-disable-next-line @next/next/no-img-element -- static export; our own sized capture
                    <img src={face.picture.src} alt="" width={72} height={72} className="size-full object-cover" />
                  )}
                </span>
                <span className={`type-caption text-text-secondary group-hover:text-text-primary ${STATE_TRANSITION}`}>{face.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="hidden grid-cols-4 gap-6 tablet:grid">
          {view.faces.map((face, i) => (
            <FaceCard key={face.id} card={face} place={i + 1} />
          ))}
        </ul>
      </Section>
      <section
        data-testid="face-of-the-week"
        aria-labelledby="week-title"
        className="flex items-center gap-3.5 rounded-[20px] bg-bg-surface p-3.5 tablet:col-start-1 tablet:row-start-2 tablet:h-[242px]"
      >
        <div className="h-35 w-28 shrink-0 overflow-hidden rounded-md bg-bg-raised tablet:h-[214px] tablet:w-[171px]">
          {view.week.picture && (
            // eslint-disable-next-line @next/next/no-img-element -- static export; our own sized capture
            <img src={view.week.picture.src} alt={view.week.picture.alt} width={171} height={214} className="size-full object-cover" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <p className="type-caption text-text-secondary">Face of the week</p>
          <h2 id="week-title" className="type-h3 break-words text-text-primary">
            {view.week.title}
          </h2>
          <p className="type-caption text-text-muted">{view.week.line}</p>
          <Link href={view.week.href} className={buttonClass("primary", "", "small")}>
            <ButtonLabel icon="arrow-right" iconSize={16}>
              Start
            </ButtonLabel>
          </Link>
        </div>
      </section>
      <Section id="home-builds" title="Meta builds" link={{ href: "/builds", label: "View all builds" }} className="tablet:col-span-2 tablet:row-start-3">
        <ul className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 rail tablet:mx-0 tablet:grid tablet:grid-cols-2 tablet:gap-6 tablet:overflow-visible tablet:px-0 desktop:grid-cols-3">
          {view.builds.map((build, i) => (
            <li key={build.href} className="flex w-80 shrink-0 snap-start tablet:w-auto">
              {/* Cards in a row share one height: an unrecorded line has no stat row (D-115). */}
              <BuildPreviewCard build={build} testId={`build-preview-${i + 1}`} className="w-full" />
            </li>
          ))}
          <li className="hidden self-stretch tablet:flex desktop:hidden">
            <Link
              href="/builds"
              data-testid="view-all-builds-tile"
              className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong p-4 text-center hover:border-input-border-hovered hover:bg-hover-fill-page ${STATE_TRANSITION} ${PRESS_CARD}`}
            >
              <span className="type-label text-text-primary">View all builds</span>
              <span className="type-caption text-text-muted">Pick an archetype, then a build</span>
            </Link>
          </li>
        </ul>
        {view.sampleNote && <p className="type-caption text-text-muted">{view.sampleNote}</p>}
      </Section>
      <Section id="home-changes" title="What changed" link={{ href: "/changelog", label: "Changelog" }} className="tablet:col-start-2 tablet:row-start-2">
        <ul className="flex flex-col rounded-lg bg-bg-surface">
          {view.changes.map((c) => (
            <li key={c.id} className="flex flex-col gap-0.5 border-b border-system-divider px-4 py-3 last:border-b-0">
              <span className="type-caption text-text-muted">{c.line}</span>
              <span className="type-label text-text-primary">{c.title}</span>
            </li>
          ))}
        </ul>
      </Section>
      <section data-testid="home-season" className="flex flex-col gap-1 rounded-lg border border-bg-raised p-4 tablet:col-span-2 tablet:row-start-4">
        <p className="type-label text-text-primary">{NEXT_SEASON}</p>
        <p className="type-body text-text-secondary">Every face and build gets re-checked in game, and older ones say so.</p>
      </section>
    </main>
  );
}

/** A section with Figma's head (364:2122): the title (H3) and a lime link, baseline to baseline, 12 px above the rest. */
function Section({ id, title, link, className, children }: { id: string; title: string; link: { href: string; label: string }; className: string; children: ReactNode }) {
  return (
    <section data-testid={id} aria-labelledby={`${id}-title`} className={`flex min-w-0 flex-col gap-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`${id}-title`} className="type-h3 text-text-primary">
          {title}
        </h2>
        <Link href={link.href} className={LINK}>
          {link.label}
        </Link>
      </div>
      {children}
    </section>
  );
}
