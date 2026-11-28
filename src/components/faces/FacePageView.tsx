import { Icon } from "@/components/shell/Icon";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Callout } from "@/components/ui/Callout";
import type { FacePageView as View } from "@/lib/face-view";
import { EmbedFacade } from "./EmbedFacade";
import { FacePicture } from "./FacePicture";
import { FaceSteps } from "./FaceSteps";
import { StickyColumn } from "@/components/ui/StickyColumn";

// Figma "Face" (phone 353:1410, tablet 427:8649, desktop 427:8767; D-71 to D-74) and its states (353:1524, 353:1648,
// 372:1984, 372:2108 and their tablet and desktop frames). Phone: the picture full width, 480 px tall, with a sheet
// over its foot, then one column 18 px apart: title, progress, step card, "Next:", limits, tutorial. Tablet: the
// breadcrumb, then a 300 px summary column (the picture as a 4:5 card, the title) and the steps beside it, 40 px apart,
// 20 px between blocks; desktop's summary is 400 px, 64 px from the steps, in the 1200 px column.
export function FacePageView({ view }: { view: View }) {
  return (
    <main className="flex flex-col">
      <div className="tablet:hidden">
        <FacePicture view={view} variant="hero" />
      </div>
      <div className="flex flex-col gap-6 px-5 pt-1 pb-8 tablet:px-10 tablet:pt-6 tablet:pb-16 desktop:mx-auto desktop:w-full desktop:max-w-(--layout-content-max) desktop:px-0">
        <div className="hidden tablet:block">
          <Breadcrumb tone="muted" links={[{ href: "/faces", label: "Faces" }]} current={view.title} />
        </div>
        <div className="flex flex-col gap-[18px] tablet:flex-row tablet:items-start tablet:gap-10 desktop:gap-16">
          <StickyColumn testId="face-summary" className="flex flex-col gap-5 tablet:w-75 tablet:shrink-0 desktop:w-100">
            <div className="hidden tablet:block">
              <FacePicture view={view} variant="card" />
            </div>
            <FaceTitle view={view} />
          </StickyColumn>
          <div data-testid="face-steps" className="flex min-w-0 flex-1 flex-col gap-[18px] tablet:gap-5">
            <FaceSteps recipe={view.recipe} storage={view.storage} paired={view.paired} />
            {view.limits.map((limit, i) => (
              <Callout key={`${i}-${limit}`} testId="limits-callout">
                {limit}
              </Callout>
            ))}
            {view.embed && (
              <section aria-labelledby="tutorial-title" className="flex flex-col gap-3">
                <h2 id="tutorial-title" className="type-h3 text-text-primary">
                  Tutorial
                </h2>
                <EmbedFacade embed={view.embed} />
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Figma "Title" (353:1435): the kind (Label/Caption, muted), the plain name (H1, D-69), the credit line (203:265) and
 * the sample note, 4 px apart. The version tag (rule 4, D-69 (3)) sits under the name, as on the build page: the face
 * frames draw none, the Design System's Version tag (203:264) is used.
 */
function FaceTitle({ view }: { view: View }) {
  const tone = view.checked && !view.olderSeason ? "text-text-secondary" : "text-status-warning";
  return (
    <div className="flex flex-col gap-1">
      <p className="type-caption text-text-muted">{view.kindLabel}</p>
      <h1 className="type-h1 break-words text-text-primary uppercase">{view.title}</h1>
      <p data-testid="version-tag" className={`type-caption flex items-center gap-2 ${tone}`}>
        <Icon name={view.olderSeason ? "history" : view.checked ? "check-circle" : "warning"} size={16} />
        {view.versionTag}
      </p>
      {view.olderSeason && <p className="type-caption text-status-warning">{view.olderSeason}</p>}
      {(view.madeBy || view.tutorial) && (
        <p data-testid="credit-line" className="type-caption flex flex-wrap items-center gap-x-2">
          {view.madeBy && <span className="text-text-secondary">{view.madeBy}</span>}
          {view.tutorial && (
            <>
              {view.madeBy && (
                <span aria-hidden="true" className="text-text-muted">
                  ·
                </span>
              )}
              {view.tutorial.url ? (
                <a href={view.tutorial.url} target="_blank" rel="noopener noreferrer" className="tap-target text-text-primary underline hover:decoration-2">
                  {view.tutorial.label}
                </a>
              ) : (
                <span className="text-text-primary">{view.tutorial.label}</span>
              )}
            </>
          )}
        </p>
      )}
      {view.sampleNote && <p className="type-caption text-text-muted">{view.sampleNote}</p>}
    </div>
  );
}
