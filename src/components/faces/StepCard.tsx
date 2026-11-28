import { ButtonLabel, buttonClass, NudgedIcon } from "@/components/ui/Button";
import { PRESS_ENABLED, STATE_TRANSITION } from "@/components/ui/interaction";
import type { RecipeScreen, RecipeValue } from "@/lib/face-page";

// Figma "Step card" (353:1449): bg/surface, 1 px border/subtle, 20 px corners, 18 px in, 12 px apart. "In the game" and
// the menu path; the screen's title (H3); its values in the game's order, each a row with a divider above, the label
// left (Label/Default, secondary) and the value right, large in lime (Number/Large; the value is the hero); one hint;
// then Back (52 px icon button, disabled on the first step) and "Done, next". Back hovers as a secondary button on a
// card does (D-121 (1)).
export function StepCard({ screen, onBack, onNext }: { screen: RecipeScreen; onBack: (() => void) | null; onNext: () => void }) {
  return (
    <section
      data-testid="step-card"
      aria-labelledby="step-title"
      className="flex flex-col gap-3 rounded-[20px] border border-border-subtle bg-bg-surface p-[18px]"
    >
      <div className="flex flex-col gap-0.5">
        <p className="type-caption text-text-muted">In the game</p>
        <p className="type-label text-text-primary">{screen.where}</p>
      </div>
      <h2 id="step-title" className="type-h3 text-text-primary">
        {screen.title}
      </h2>
      <dl className="flex flex-col">
        {screen.values.map((v, i) => (
          <ValueRow key={`${v.label}-${i}`} value={v} place={i + 1} />
        ))}
      </dl>
      <p className="type-caption text-text-muted">{screen.hint}</p>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          aria-label="Back"
          disabled={onBack === null}
          onClick={onBack ?? undefined}
          className={`group/button flex size-13 shrink-0 items-center justify-center rounded-sm border-[1.5px] border-border-strong text-text-primary not-disabled:hover:border-input-border-hovered not-disabled:hover:bg-hover-fill ${PRESS_ENABLED} disabled:border-0 disabled:bg-action-disabled-bg disabled:text-action-disabled ${STATE_TRANSITION}`}
        >
          <NudgedIcon name="chevron-left" size={24} />
        </button>
        <button type="button" onClick={onNext} className={buttonClass("primary", "flex-1")}>
          <ButtonLabel icon="arrow-right">Done, next</ButtonLabel>
        </button>
      </div>
    </section>
  );
}

/** One value as the game shows it (A-09, A-12): the number or name; a control with no number is a drawn track. */
function ValueRow({ value, place }: { value: RecipeValue; place: number }) {
  return (
    <div data-testid={`value-chip-${place}`} className="flex min-h-[53px] items-center justify-between gap-4 border-t border-system-divider py-2.5">
      <dt className="type-label text-text-secondary">{value.label}</dt>
      <dd className="type-number-lg text-right break-words text-accent-text">
        {value.position === null ? (
          value.value
        ) : (
          // FORMAT §Value: a knob's place along the track, drawn, never a game number (Design System Value chip 203:284).
          <span role="img" aria-label={`Knob at ${value.position}% of the track`} className="relative flex h-3.5 w-[126px] items-center">
            <span className="h-1.5 w-full rounded-full bg-action-selected" />
            <span className="absolute size-3.5 -translate-x-1/2 rounded-full bg-accent-fill" style={{ left: `${value.position}%` }} />
          </span>
        )}
      </dd>
    </div>
  );
}
