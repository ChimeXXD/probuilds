"use client";

import { forwardRef, useEffect, useState } from "react";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { attributeError, nextAttribute, signed } from "@/lib/submit/editor";
import { RoundButton, useRollGate } from "./controls";
import { Slider } from "./Slider";

// Figma "Attribute row" (component 431:1050: default, typing, error; D-85 (2)): the name, − / the value / +, and a
// slider at value ÷ 99. Any of the three sets the value. Typing: the box rings lime and the line under the name
// says what comes next ("Typing · next: Shot Power"); after two digits focus jumps to the next attribute, as the tip
// says. Over 99 the box and number turn red with "Attributes go up to 99" (428:5513). An attribute height and
// weight change says so under its name: "−2 from height and weight · 86 in a match" (D-90 (2)).
// Number stepper (motion-bookmarks.pdf #12): a tap on − / + (or on the slider) rolls the number in the box, up or
// down, 140 ms (RollingNumber, drawn over the box while it isn't being typed in; the input underneath keeps the
// value for typing, forms and screen readers). Typing, key presses and taps faster than the roll set it at once.
export const AttributeRow = forwardRef<
  HTMLInputElement,
  {
    name: string;
    value: number;
    body: number | undefined;
    onChange: (value: number) => void;
    onFocus: () => void;
    onAdvance: () => void;
  }
>(function AttributeRow({ name, value, body, onChange, onFocus, onAdvance }, ref) {
  const [text, setText] = useState(String(value));
  const [typing, setTyping] = useState(false);
  const [still, gate] = useRollGate(value);
  // The box follows − / + and the slider while it isn't being typed in.
  useEffect(() => {
    if (!typing) setText(String(value));
  }, [value, typing]);
  const error = attributeError(value);
  const next = nextAttribute(name);
  const note = error
    ? { text: error, tone: "text-status-danger" }
    : typing
      ? { text: next ? `Typing · next: ${next}` : "Typing", tone: "text-accent-text" }
      : body !== undefined
        ? { text: `${signed(body)} from height and weight · ${value + body} in a match`, tone: body < 0 ? "text-status-danger" : "text-status-success" }
        : null;
  const set = (v: number, at: number, byKey: boolean) => {
    const next = Math.min(Math.max(v, 0), 99);
    gate(at, byKey, next);
    onChange(next);
  };
  const tone = error ? "text-status-danger" : "text-text-primary";
  const box = `${error ? "border-2 border-status-danger" : typing ? "border-2 border-input-border-focused" : "border border-input-border hover:border-input-border-hovered"} ${typing ? tone : "text-transparent"}`;
  const id = `attr-${name.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div data-testid="attribute-row" className="flex flex-col gap-1.5 border-b border-system-divider pt-2 pb-3">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <label htmlFor={id} className="type-label text-text-primary">
            {name}
          </label>
          {note && (
            <p id={`${id}-note`} className={`type-caption ${note.tone}`}>
              {note.text}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <RoundButton sign="minus" label={`${name} down`} size={44} surface="surface" disabled={value <= 0} onPress={(e) => set(value - 1, e.timeStamp, e.detail === 0)} />
          <span className="relative flex">
            <input
              ref={ref}
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={3}
              value={text}
              aria-invalid={error ? true : undefined}
              aria-describedby={note ? `${id}-note` : undefined}
              onFocus={(e) => {
                setTyping(true);
                onFocus();
                e.currentTarget.select();
              }}
              onBlur={() => {
                setTyping(false);
                setText(String(value));
              }}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                setText(digits);
                if (digits === "") return;
                const v = Number(digits);
                gate(e.timeStamp, true, v);
                onChange(v);
                // Two digits are a whole value, except "10", which may be the start of 100 (shown as an error).
                if (digits.length === 2 && v !== 10 && !attributeError(v)) onAdvance();
              }}
              className={`type-number-md h-11 w-15 rounded-[10px] bg-input-bg text-center outline-none ${box}`}
            />
            {!typing && (
              <span aria-hidden="true" data-testid="attribute-value" className={`type-number-md pointer-events-none absolute inset-0 flex items-center justify-center tabular-nums ${tone}`}>
                <RollingNumber value={String(value)} still={still} />
              </span>
            )}
          </span>
          <RoundButton sign="plus" label={`${name} up`} size={44} surface="surface" disabled={value >= 99} onPress={(e) => set(value + 1, e.timeStamp, e.detail === 0)} />
        </div>
      </div>
      <Slider label={name} min={0} max={99} value={value} onChange={(v, { held, at }) => set(v, at, !held)} />
    </div>
  );
});
