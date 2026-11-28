"use client";

import { Icon } from "@/components/shell/Icon";
import { PRESS, PRESS_CARD, QUIET_LINK, STATE_TRANSITION } from "@/components/ui/interaction";
import { PlayStyleArt } from "@/components/builds/PlayStyleArt";
import { PlayStyleListButton } from "@/components/builds/PlayStyleInfo";
import { playStylePlusIcon } from "@/lib/archetype-page";
import { playStyleBadge } from "@/lib/build-page";
import type { Archetype } from "@/lib/content/types";
import { PLAYSTYLE_CATEGORIES, pickPlus, plusOptions, regularOf, stepLine, type SubmitDraft } from "@/lib/submit/editor";
import { StepLine } from "./controls";

// Step 3 of 4, PlayStyles (Figma 406:3024 / 418:5876 / 418:6127; D-87, D-88). Two PlayStyle+ slots: tapping one
// lists only the archetype's PlayStyle+ (its two signatures and its specializations'), so picking one picks the
// specialization. Then the regular PlayStyles as 44 px chips by category, ticked when on; the two PlayStyle+ show as
// lime chips that can't be tapped. The sticky header keeps the two counts. Desktop: a 400 px side column with the
// header and the slots, 64 px from the chips.
const PlusArt = ({ name, size }: { name: string; size: string }) => {
  const src = playStylePlusIcon(name);
  // eslint-disable-next-line @next/next/no-img-element -- static export; EA's gold PlayStyle+ badge (D-39)
  return src ? <img src={src} alt="" className={`${size} shrink-0`} /> : <span aria-hidden="true" className={`${size} shrink-0`} />;
};

export function StepPlayStyles({
  draft,
  archetype,
  open,
  onOpen,
  onChange,
}: {
  draft: SubmitDraft;
  archetype: Archetype;
  open: 0 | 1 | null;
  onOpen: (slot: 0 | 1 | null) => void;
  onChange: (next: Partial<SubmitDraft> | ((d: SubmitDraft) => SubmitDraft)) => void;
}) {
  const options = plusOptions(archetype);
  const regular = regularOf(draft);
  const toggle = (name: string) =>
    onChange((d) => ({ ...d, regular: d.regular.includes(name) ? d.regular.filter((r) => r !== name) : [...d.regular, name] }));
  const sourceOf = (name: string) => options.find((o) => o.name === name);

  const header = (
    <div className="sticky top-0 z-10 -mx-5 flex flex-col gap-3 border-b border-system-divider bg-bg-page px-5 pt-4 pb-3.5 tablet:mx-0 tablet:border-0 tablet:px-0 tablet:pt-0 desktop:static">
      <StepLine label={stepLine(draft, archetype, "PlayStyles")} step={3} />
      <div className="flex gap-2">
        <Count value={`${draft.plus.filter(Boolean).length} of 2`} label="PlayStyle+" tone="text-text-primary" />
        <Count value={String(regular.length)} label="PlayStyles" tone="text-text-primary" />
      </div>
    </div>
  );

  const slots = (
    <section aria-labelledby="submit-plus" className="flex flex-col pt-5">
      <h2 id="submit-plus" className="type-h3 text-text-primary">
        PlayStyle+
      </h2>
      <p className="type-caption pt-1 text-text-muted">{`Two slots, from ${archetype.name} only. Tap a slot to swap in a specialization.`}</p>
      <div className="flex items-start gap-2.5 pt-3">
        {([0, 1] as const).map((slot) => {
          const name = draft.plus[slot];
          const src = sourceOf(name);
          const isOpen = open === slot;
          return (
            <button
              key={slot}
              type="button"
              data-testid="plus-slot"
              aria-expanded={isOpen}
              aria-label={`PlayStyle+ slot ${slot + 1}: ${name}+`}
              onClick={() => onOpen(isOpen ? null : slot)}
              className={`flex min-w-0 flex-1 flex-col items-stretch gap-2 rounded-[14px] bg-bg-surface p-3 text-left hover:bg-hover-fill ${STATE_TRANSITION} ${PRESS_CARD} ${isOpen ? "h-30 border-2 border-accent-fill" : "h-[118px] border border-border-strong hover:border-input-border-hovered"}`}
            >
              <span className="flex h-9 items-center justify-between">
                <PlusArt name={name} size="size-9" />
                <span className="flex text-text-primary">
                  <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={20} />
                </span>
              </span>
              <span className="type-label text-text-primary">{`${name}+`}</span>
              <span className={`type-caption ${src?.specialization ? "text-text-secondary" : "text-text-muted"}`}>{src?.source ?? ""}</span>
            </button>
          );
        })}
      </div>
      {open !== null && (
        <ul data-testid="plus-menu" aria-label={`PlayStyle+ for slot ${open + 1}`} className="mt-2 flex flex-col rounded-[14px] bg-bg-raised p-1.5">
          {options
            .filter((o) => o.name !== draft.plus[open === 0 ? 1 : 0])
            .map((o) => {
              const picked = draft.plus[open] === o.name;
              return (
                <li key={o.name}>
                  <button
                    type="button"
                    aria-pressed={picked}
                    onClick={() => {
                      onChange((d) => ({ ...d, plus: pickPlus(d.plus, archetype, open, o.name) }));
                      onOpen(null);
                    }}
                    className={`flex h-12 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left ${STATE_TRANSITION} ${picked ? "bg-bg-surface" : "hover:bg-hover-fill-raised"}`}
                  >
                    <PlusArt name={o.name} size="size-6.5" />
                    <span className="type-label min-w-0 flex-1 text-text-primary">{`${o.name}+`}</span>
                    <span className="type-caption text-text-muted">{o.source}</span>
                    <span className="flex size-5 text-accent-text">{picked && <Icon name="check" size={20} />}</span>
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );

  const chips = (
    <section aria-labelledby="submit-playstyles" className="flex flex-col pt-7 desktop:pt-0">
      <h2 id="submit-playstyles" className="type-h3 text-text-primary">
        PlayStyles
      </h2>
      <p className="type-caption pt-1 text-text-muted">Tap to add or remove</p>
      {PLAYSTYLE_CATEGORIES.map((c) => (
        <div key={c.name} className="flex flex-col gap-2 pt-4">
          {/* Each category's one "What these do" opens its PlayStyles in EA's words (D-122 (5)). */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="type-caption text-text-muted uppercase">{c.name}</h3>
            <PlayStyleListButton title={c.name} names={c.playStyles} plus={draft.plus} label={`What these do: ${c.name}`} className={`type-caption tap-target shrink-0 text-text-secondary ${QUIET_LINK}`}>
              What these do
            </PlayStyleListButton>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {c.playStyles.map((name) => (
              <ChipItem key={name} name={name} plus={draft.plus.includes(name)} on={regular.includes(name)} onPress={() => toggle(name)} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );

  return (
    <div className="flex flex-col desktop:flex-row desktop:items-start desktop:gap-16">
      <h1 tabIndex={-1} className="sr-only">Submit a build: PlayStyles</h1>
      <div className="contents desktop:flex desktop:w-100 desktop:shrink-0 desktop:flex-col">
        {header}
        {slots}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{chips}</div>
    </div>
  );
}

function Count({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-md bg-bg-surface px-3 py-2.5">
      <p className={`type-number-md ${tone}`}>{value}</p>
      <p className="type-caption text-text-muted">{label}</p>
    </div>
  );
}

// A tap on a chip picks it (D-122 (5): the chips carry no info button; their category's "What these do" explains them).
function ChipItem({ name, plus, on, onPress }: { name: string; plus: boolean; on: boolean; onPress: () => void }) {
  return (
    <li className="flex">
      {plus ? (
        <span data-testid="playstyle-chip" data-state="plus" className="flex h-11 items-center gap-1.5 rounded-full bg-bg-surface pr-3 pl-2">
          <PlusArt name={name} size="size-6.5" />
          <span className="type-caption text-text-primary">{`${name}+`}</span>
        </span>
      ) : (
        <Chip name={name} on={on} onPress={onPress} />
      )}
    </li>
  );
}

/** Figma "PlayStyle chip" (431:950): off (border, art at 60 %), on (raised, 1.5 px cream ring, a tick). */
function Chip({ name, on, onPress }: { name: string; on: boolean; onPress: () => void }) {
  const badge = playStyleBadge(name);
  return (
    <button
      type="button"
      data-testid="playstyle-chip"
      data-state={on ? "on" : "off"}
      aria-pressed={on}
      onClick={onPress}
      className={`flex h-11 items-center gap-1.5 rounded-full pr-3 pl-2 ${STATE_TRANSITION} ${PRESS} ${on ? "border-[1.5px] border-text-primary bg-bg-raised text-text-primary" : "border border-border-strong text-text-secondary hover:border-input-border-hovered hover:bg-hover-fill-page hover:text-text-primary"}`}
    >
      {badge ? <PlayStyleArt src={badge} className={`size-6.5 ${on ? "" : "opacity-60"}`} /> : <span aria-hidden="true" className="size-6.5" />}
      <span className="type-caption">{name}</span>
      {on && (
        <span className="flex text-accent-text">
          <Icon name="check" size={18} />
        </span>
      )}
    </button>
  );
}
