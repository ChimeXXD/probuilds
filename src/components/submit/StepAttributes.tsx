"use client";

import { useRef } from "react";
import { Icon } from "@/components/shell/Icon";
import { PRESS, STATE_TRANSITION } from "@/components/ui/interaction";
import type { Archetype } from "@/lib/content/types";
import { apCounter, attributeError, bodyChanges, EDITOR_GROUPS, groupAverage, nextAttribute, stepLine, type SubmitDraft } from "@/lib/submit/editor";
import { reducedMotion } from "@/lib/motion";
import { AttributeRow } from "./AttributeRow";
import { StepLine } from "./controls";
import { Stars } from "./Stars";

// Step 2 of 4, attributes (Figma 399:3121 / 418:4526 / 418:5198, error 428:5513 / 428:6137 / 428:6770; D-85).
// Phone: a sticky header (the step line, the AP counter and a jump to each group), the tip, the six groups in one
// column, the stars. Tablet: the header and tip over two columns of groups (Pace, Passing, Defending; Shooting,
// Dribbling, Physical), then the stars. Desktop: a 360 px side column (header, tip, stars) beside the two columns.
// The AP counter is Figma's "AP counter" (431:1035); its spend is the sample's until prices exist (D-85 (3), O-14).
// Storage meter (motion-bookmarks.pdf #14): the counter's bar is the share of the level's AP spent, drawn by scaleX
// from the left (never width), moving over --dur-base with --ease-out and no bounce (it is data), status/danger if a
// build ever spends more than the level gives. Until prices are recorded the spend only changes with the level, set
// on step 1, so on this step the bar holds still; it has no entrance (the step is opened often).
const ORDER: Record<string, string> = { PAC: "order-1", SHO: "order-2", PAS: "order-3", DRI: "order-4", DEF: "order-5", PHY: "order-6" };
const COLUMNS = [["PAC", "PAS", "DEF"], ["SHO", "DRI", "PHY"]];

export function StepAttributes({
  draft,
  archetype,
  active,
  onActive,
  onChange,
}: {
  draft: SubmitDraft;
  archetype: Archetype;
  active: string;
  onActive: (code: string) => void;
  onChange: (next: Partial<SubmitDraft> | ((d: SubmitDraft) => SubmitDraft)) => void;
}) {
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const ap = apCounter(draft);
  const body = bodyChanges(draft);
  const setValue = (name: string, value: number) =>
    onChange((d) => ({ ...d, attributes: d.attributes.map((a) => (a.name === name ? { ...a, value } : a)) }));
  // A group chip scrolls its group into view smoothly (D-121 (2): the jump moves instead of snapping); from the
  // keyboard (a click with detail 0) or under reduced motion it jumps at once.
  const jump = (code: string, byKey: boolean) => {
    onActive(code);
    document.getElementById(`group-${code}`)?.scrollIntoView({ block: "start", behavior: byKey || reducedMotion() ? "instant" : "smooth" });
  };

  const header = (
    <div className="sticky top-0 z-10 -mx-5 flex flex-col gap-3 border-b border-system-divider bg-bg-page px-5 pt-4 pb-3 tablet:mx-0 tablet:px-0 desktop:static desktop:border-0 desktop:pt-0">
      <StepLine label={stepLine(draft, archetype, "Attributes")} step={2} />
      <div data-testid="ap-counter" className="flex items-center gap-3.5 rounded-[14px] bg-bg-surface px-4 py-3">
        <div className="flex flex-col">
          <p className="type-number-lg text-accent-text">{ap.left}</p>
          <p className="type-caption text-text-muted">AP left</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex">
            <p className="type-caption min-w-0 flex-1 text-text-secondary">{ap.spent}</p>
            <p className="type-caption text-text-muted">{ap.total}</p>
          </div>
          <span aria-hidden="true" className="h-2 overflow-hidden rounded-xs bg-border-strong">
            <span
              data-testid="ap-meter-spent"
              className={`block h-full origin-left transition-transform duration-(--dur-base) ease-(--ease-out) motion-reduce:transition-none ${ap.percent > 100 ? "bg-status-danger" : "bg-accent-fill light:bg-accent-text"}`}
              style={{ transform: `scaleX(${Math.min(ap.percent, 100) / 100})` }}
            />
          </span>
        </div>
      </div>
      <nav aria-label="Attribute groups" className="flex gap-1.5">
        {EDITOR_GROUPS.map((g) => (
          <button
            key={g.code}
            type="button"
            aria-current={g.code === active ? "true" : undefined}
            onClick={(e) => jump(g.code, e.detail === 0)}
            className={`type-caption flex h-11 min-w-0 flex-1 items-center justify-center rounded-full border ${STATE_TRANSITION} ${PRESS} ${g.code === active ? "border-accent-fill bg-bg-raised text-accent-text light:border-accent-text" : "border-border-strong text-text-secondary hover:border-input-border-hovered hover:bg-hover-fill-page hover:text-text-primary"}`}
          >
            {g.code}
          </button>
        ))}
      </nav>
    </div>
  );
  const tip = (
    <div className="flex items-center gap-2.5 rounded-md bg-bg-raised px-3.5 py-3">
      <span className="flex text-accent-text">
        <Icon name="info" size={20} />
      </span>
      <p className="type-caption min-w-0 flex-1 text-text-primary">Type each number as Edit Attributes shows it. After two digits you jump to the next one.</p>
    </div>
  );
  const stars = (
    <div className="grid grid-cols-2 gap-3">
      {(["Skill Moves", "Weak Foot"] as const).map((label) => {
        const key = label === "Skill Moves" ? "skillMoves" : "weakFoot";
        return (
          <div key={label} className="flex flex-col gap-2.5 rounded-[14px] bg-bg-surface p-3.5">
            <p className="type-label text-text-primary">{label}</p>
            <Stars label={label} value={draft[key]} onChange={(v) => onChange({ [key]: v })} />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col desktop:flex-row desktop:items-start desktop:gap-14">
      <h1 tabIndex={-1} className="sr-only">Submit a build: attributes</h1>
      <div className="contents desktop:sticky desktop:top-4 desktop:flex desktop:w-90 desktop:shrink-0 desktop:flex-col desktop:gap-4">
        {header}
        <div className="pt-4 desktop:pt-0">{tip}</div>
        <div className="hidden desktop:block">{stars}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col tablet:flex-row tablet:gap-8">
        {COLUMNS.map((column, i) => (
          <div key={i} className="contents tablet:flex tablet:min-w-0 tablet:flex-1 tablet:flex-col tablet:gap-2">
            {column.map((code) => {
              const g = EDITOR_GROUPS.find((x) => x.code === code)!;
              return (
                <section key={code} aria-labelledby={`group-${code}`} className={`flex flex-col ${ORDER[code]} tablet:order-none`}>
                  <div className="flex items-center gap-2 pt-5 pb-1">
                    <h2 id={`group-${code}`} className="type-h3 min-w-0 flex-1 scroll-mt-52 text-text-primary tablet:scroll-mt-4">
                      {g.name}
                    </h2>
                    <p className="type-number-md text-text-secondary">{groupAverage(draft.attributes, code)}</p>
                  </div>
                  {(g.attributes as readonly string[]).map((name) => (
                    <AttributeRow
                      key={name}
                      ref={(el) => {
                        if (el) inputs.current.set(name, el);
                        else inputs.current.delete(name);
                      }}
                      name={name}
                      value={draft.attributes.find((a) => a.name === name)?.value ?? 0}
                      body={body?.changes.find((c) => c.attribute === name)?.delta}
                      onChange={(v) => setValue(name, v)}
                      onFocus={() => onActive(code)}
                      onAdvance={() => {
                        const next = nextAttribute(name);
                        if (next) inputs.current.get(next)?.focus();
                      }}
                    />
                  ))}
                </section>
              );
            })}
          </div>
        ))}
      </div>
      <div className="pt-7 desktop:hidden">{stars}</div>
    </div>
  );
}

/** True when a value would stop the step (Figma's error state: Next disabled). */
export const hasAttributeError = (draft: SubmitDraft) => draft.attributes.some((a) => attributeError(a.value) !== null);
