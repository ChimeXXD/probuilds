"use client";

import { useLayoutEffect, useRef } from "react";
import { Icon } from "@/components/shell/Icon";
import { NAME_MAX } from "@/lib/requests";

// The "Who do you want?" field (Figma "New request", 402:3451). The placeholder wraps to two lines on phone as Figma
// draws it, so it is drawn over the field; the field's own placeholder stays for screen readers.
// Ghost suggestion (motion-bookmarks #28): while the typed name is the start of one already asked for, the rest of
// that name shows after the caret in text/muted; Tab or → (at the end) takes it. It appears and goes with each key,
// instantly: nothing animates on typing. Hidden once the text scrolls inside the field, where it would sit wrong.
// Letter limit (#29): the field takes NAME_MAX characters (src/lib/requests.ts). The count is UTF-16 units, as the
// field's maxLength counts them, so the ring is full exactly when the field stops taking keys (never more than the
// database's code-point limit). Past half of it a small ring at the field's right edge shows how much is used; in the
// last 10 characters it turns status/warning and the number left shows beside it. It changes with each key, so it
// never animates.
const PLACEHOLDER = "A name and the look, e.g. 2006 Ronaldinho";
const RING_FROM = NAME_MAX / 2;
const WARN_AT = NAME_MAX - 10;
const R = 8;
const C = 2 * Math.PI * R;

export function RequestNameField({ value, suggestion, onChange }: { value: string; suggestion: string | null; onChange: (value: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const ghost = useRef<HTMLSpanElement>(null);
  const rest = suggestion && value && suggestion.toLowerCase().startsWith(value.toLowerCase()) ? suggestion.slice(value.length) : "";
  const length = value.length;
  const left = NAME_MAX - length;
  const warn = length > WARN_AT;

  // The ghost lines up with the typed text only while the field hasn't scrolled it: checked after each key and each
  // caret move (Home or a tap can scroll the field without a render).
  const hideIfScrolled = () => {
    if (ghost.current && input.current) ghost.current.hidden = input.current.scrollLeft > 0;
  };
  useLayoutEffect(hideIfScrolled);

  return (
    // The input is one 26 px line in the middle of the 52 px box: a tap anywhere on the box (the icon, the padding, the
    // drawn placeholder) puts the caret in it, so the whole field is the target (D-125 (2)). Keys reach the input itself.
    <div
      onClick={(e) => e.target !== input.current && input.current?.focus()}
      className="relative flex h-13 cursor-text items-center gap-2.5 rounded-md border border-input-border bg-input-bg px-4 hover:border-input-border-hovered focus-within:border-2 focus-within:border-input-border-focused focus-within:px-[15px]">
      <span className="flex shrink-0 text-text-muted">
        <Icon name="search" size={20} />
      </span>
      <span className="relative flex min-w-0 flex-1">
        <input
          ref={input}
          id="request-name"
          type="text"
          autoComplete="off"
          enterKeyHint="send"
          maxLength={NAME_MAX}
          placeholder={PLACEHOLDER}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={hideIfScrolled}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            const atEnd = e.currentTarget.selectionStart === value.length && e.currentTarget.selectionEnd === value.length;
            if (rest && suggestion && ((e.key === "Tab" && !e.shiftKey) || (e.key === "ArrowRight" && atEnd))) {
              e.preventDefault();
              onChange(suggestion);
            }
          }}
          className="type-body peer min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-transparent"
        />
        {rest && (
          <span ref={ghost} data-testid="name-ghost" aria-hidden="true" className="type-body pointer-events-none absolute inset-0 overflow-hidden whitespace-pre">
            <span className="invisible">{value}</span>
            <span className="text-text-muted">{rest}</span>
          </span>
        )}
      </span>
      {!value && (
        <span aria-hidden="true" className="type-body pointer-events-none absolute top-1/2 right-4 left-[46px] line-clamp-2 -translate-y-1/2 text-text-muted">
          {PLACEHOLDER}
        </span>
      )}
      {length > RING_FROM && (
        // TODO(Chime): no wording for screen readers ("N characters left"?) is decided, so the ring and count are
        // hidden from them; the field's maxLength still stops at the limit.
        <span data-testid="name-limit" aria-hidden="true" className={`flex shrink-0 items-center gap-1.5 ${warn ? "text-status-warning" : "text-text-muted"}`}>
          {warn && <span className="type-caption">{left}</span>}
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" className="-rotate-90">
            <circle cx="10" cy="10" r={R} fill="none" strokeWidth="2" className="stroke-border-strong" />
            <circle cx="10" cy="10" r={R} fill="none" strokeWidth="2" stroke="currentColor" strokeDasharray={C} strokeDashoffset={C * (1 - length / NAME_MAX)} strokeLinecap="round" />
          </svg>
        </span>
      )}
    </div>
  );
}
