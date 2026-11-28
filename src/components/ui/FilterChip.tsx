import { PRESS, STATE_TRANSITION } from "./interaction";

// Figma Chip (200:337), Size=medium: a real, clickable filter, 40 px tall with a 44 px tap area; selected is lime
// (with a dark ring in light mode, where lime barely shows on the page, D-37). An optional count follows the label
// in Label/Caption: muted when off, on-fill when selected. In a PillRow the row's sliding pill draws the selected
// look (`pill`), and FilterChipGhost is the chip as the pill shows it. Picked and unpicked chips are the same size
// (a transparent border on the picked one), as Figma's inside strokes are, so the pill's copy lines up.
const SHAPE = "type-label inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border px-4 whitespace-nowrap";
const CHIP = `${SHAPE} tap-target touch-manipulation select-none [-webkit-tap-highlight-color:transparent] ${STATE_TRANSITION} ${PRESS}`;
const CHIP_ON = "border-transparent bg-accent-fill text-accent-on-fill light:ring-1 light:ring-accent-on-fill light:ring-inset";
// Hover (D-121 (1)): the surface's faint fill and the hovered border. Under the pill, the picked chip draws unpicked;
// its hover sits under the pill's copy, unseen.
const CHIP_OFF = "border-border-strong bg-bg-surface text-text-primary hover:border-input-border-hovered hover:bg-hover-fill";

export function FilterChip({
  testId,
  label,
  count,
  pressed,
  pill = false,
  onPress,
}: {
  testId: string;
  label: string;
  count?: number;
  pressed: boolean;
  /** The row's pill draws the selected look. */
  pill?: boolean;
  onPress: () => void;
}) {
  const on = pressed && !pill;
  return (
    <button type="button" data-testid={testId} aria-pressed={pressed} onClick={onPress} className={`${CHIP} ${on ? CHIP_ON : CHIP_OFF}`}>
      {label}
      {/* The separator keeps a screen reader from reading "Footballers1" as one word; it is out of the flex flow. */}
      {count !== undefined && <span className="sr-only">, </span>}
      {count !== undefined && <span className={`type-caption ${on ? "" : "text-text-muted"}`}>{count}</span>}
    </button>
  );
}

/** The chip as the sliding pill shows it: ink on the pill's lime, the same size as the real chip. */
export function FilterChipGhost({ label, count }: { label: string; count?: number }) {
  return (
    <span className={`${SHAPE} border-transparent`}>
      {label}
      {count !== undefined && <span className="type-caption">{count}</span>}
    </span>
  );
}
