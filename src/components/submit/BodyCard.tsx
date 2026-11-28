"use client";

import { bodyChanges, bodyRange, heightImperial, signed, type SubmitDraft, weightImperial } from "@/lib/submit/editor";
import { RoundButton, useRollGate } from "./controls";
import { Slider } from "./Slider";

// Figma "Height and weight" (component 431:1129, on the start step 436:8531; D-90 (1)): height and weight, each with
// − / +, a slider across the archetype's range with its middle marked, and the range under it; then "What your body
// changes" and the AcceleRATE it gives. Those last two are Figma's sample figures, shown only for the sample's own
// body (src/lib/submit/editor.ts): no other body's effects are known yet (RESEARCH §10.3).
// Range slider (motion-bookmarks.pdf #15): held, the knob grows 1.1× with the value in a bubble on it, on the follow
// spring; a tap on − / + slides the knob one step on the same spring; key presses and fast taps move it at once.
// Height reads in feet and inches first, centimetres small beside it (D-121 (6): "change the prominent value for height
// to feet"), on the value, the bubble and the range's ends; it still steps by 1 cm, as the game does. Weight stays kg
// first, pounds small.
export function BodyCard({ draft, archetypeName, onChange }: { draft: SubmitDraft; archetypeName: string; onChange: (next: Partial<SubmitDraft>) => void }) {
  const range = bodyRange(draft.archetype);
  const body = bodyChanges(draft);
  return (
    <div data-testid="submit-body" className="flex flex-col gap-4 rounded-lg bg-bg-surface p-4">
      <Measure
        label="Height"
        value={draft.heightCm}
        show={heightImperial}
        small={(cm) => `${cm} cm`}
        range={range.height}
        archetypeName={archetypeName}
        onChange={(heightCm) => onChange({ heightCm })}
      />
      <hr className="border-system-divider" />
      <Measure
        label="Weight"
        value={draft.weightKg}
        show={(kg) => `${kg} kg`}
        small={weightImperial}
        range={range.weight}
        archetypeName={archetypeName}
        onChange={(weightKg) => onChange({ weightKg })}
      />
      {body && (
        <div data-testid="body-changes" className="flex flex-col gap-2.5 rounded-md bg-bg-raised p-3.5">
          <p className="type-label text-text-primary">What your body changes</p>
          <ul className="flex flex-wrap gap-1.5">
            {body.changes.map((c) => (
              <li key={c.attribute} className="flex items-center gap-1.5 rounded-full border border-border-strong px-2.5 py-1.5">
                <span className="type-caption text-text-secondary">{c.attribute}</span>
                <span className={`type-label ${c.delta < 0 ? "text-status-danger" : "text-status-success"}`}>{signed(c.delta)}</span>
              </li>
            ))}
          </ul>
          <p className="type-caption text-text-muted">Added in a match, on top of the values you type. Measured from the middle of the range.</p>
          <div className="flex items-center gap-2 border-t border-system-divider pt-2.5">
            <p className="type-caption min-w-0 flex-1 text-text-muted">AcceleRATE</p>
            <p className="type-label text-text-primary">{body.accelerate}</p>
          </div>
          <p className="type-caption text-text-muted">{body.rule}</p>
        </div>
      )}
    </div>
  );
}

function Measure({
  label,
  value,
  show,
  small,
  range,
  archetypeName,
  onChange,
}: {
  label: string;
  value: number;
  /** The value as the big number shows it (and the bubble and the range's ends). */
  show: (value: number) => string;
  /** The same value in the other unit, small beside it. */
  small: (value: number) => string;
  range: { min: number; max: number };
  archetypeName: string;
  onChange: (value: number) => void;
}) {
  const [still, gate] = useRollGate(value);
  const set = (next: number, at: number, byKey: boolean) => {
    const clamped = Math.min(Math.max(next, range.min), range.max);
    gate(at, byKey, clamped);
    onChange(clamped);
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="type-caption text-text-muted">{label}</p>
          <p className="flex items-baseline gap-2" aria-live="polite">
            <span data-testid={`${label.toLowerCase()}-value`} className="type-number-lg text-text-primary">
              {show(value)}
            </span>
            <span className="type-caption text-text-muted">{small(value)}</span>
          </p>
        </div>
        <RoundButton sign="minus" label={`${label} down`} size={44} disabled={value <= range.min} onPress={(e) => set(value - 1, e.timeStamp, e.detail === 0)} />
        <RoundButton sign="plus" label={`${label} up`} size={44} disabled={value >= range.max} onPress={(e) => set(value + 1, e.timeStamp, e.detail === 0)} />
      </div>
      <Slider
        label={label}
        min={range.min}
        max={range.max}
        value={value}
        onChange={(v, { held, at }) => set(v, at, !held)}
        fill={false}
        mark
        motion="follow"
        still={still}
        bubble={show(value)}
        valueText={`${show(value)}, ${small(value)}`}
      />
      <div className="type-caption grid grid-cols-[1fr_auto_1fr] text-text-muted">
        <span>{show(range.min)}</span>
        <span>{`${archetypeName} range`}</span>
        <span className="text-right">{show(range.max)}</span>
      </div>
    </div>
  );
}
