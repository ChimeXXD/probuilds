"use client";

import { useRef } from "react";
import { Icon } from "@/components/shell/Icon";

// Figma Search field (200:410): a 48 px box, input/bg fill, 1 px input/border, 8 px corners, a 20 px muted search
// icon, Body/Default text with a muted placeholder. Filled, it gains the 18 px Clear (200:391) on the right, inside a
// 44 px tap area that overhangs the 16 px padding. The focus ring sits on the box, not the bare input (Figma's note).
// Full width on phone; 300 px on tablet, 360 px on desktop (D-70).
// Search (376:2295) uses the same field, 560 px wide from tablet, with the component's own placeholder.
// Hover (D-121 (1)): the box's border steps to input/border-hovered; Clear turns text/primary.
const PLACEHOLDER = "Search faces by name";
const WIDTH = "tablet:w-[300px] desktop:w-[360px]";

export function FaceSearch({
  value,
  onChange,
  placeholder = PLACEHOLDER,
  width = WIDTH,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      data-testid="search-field"
      className={`flex h-12 shrink-0 items-center gap-2 rounded-sm border border-input-border bg-input-bg px-4 hover:border-input-border-hovered has-focus-visible:border-input-border-focused has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring ${width}`}
    >
      <span className="flex text-text-muted">
        <Icon name="search" size={20} />
      </span>
      <input
        ref={input}
        type="search"
        data-testid="search-input"
        aria-label={placeholder}
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="type-body h-full min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            input.current?.focus();
          }}
          className="-mr-[13px] flex size-11 shrink-0 items-center justify-center text-text-muted transition-colors duration-(--dur-fast) ease-(--ease-out) hover:text-text-primary"
        >
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
}
