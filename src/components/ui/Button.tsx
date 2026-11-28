import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/shell/Icon";
import { PRESS_ENABLED, STATE_TRANSITION, type Surface } from "./interaction";

// Figma Button (199:651). Large: 52 px tall, 24 px sides, Button/Large label; Medium: 44 px tall, 20 px sides,
// Button/Medium label; both with a 20 px icon. Primary is the lime fill for the one main action; Secondary is
// outlined (1.5 px border/strong).
// Hover (D-121 (1), interaction.ts): primary steps to accent/fill-hover; secondary gets the faint grey fill of the
// surface it sits on (`on`, the page unless a card holds it) and its border steps to the hovered border; a ghost
// (secondary with a transparent border) gets the fill. An arrow or chevron in the label nudges 2 px towards where it
// goes (ButtonLabel). Press: 0.97. A disabled button answers neither.
const VARIANT = {
  primary: "bg-accent-fill text-accent-on-fill not-disabled:hover:bg-accent-fill-hover",
  secondary: "border-[1.5px] border-border-strong text-text-primary not-disabled:hover:border-input-border-hovered",
} as const;

// Small (Figma 199:651, Size=small): 36 px tall, 16 px sides, Button/Small, a 16 px icon; it gets the 44 px tap area.
const SIZE = { large: "type-button-lg h-13 px-6", medium: "type-button-md h-11 px-5", small: "type-button-sm tap-target h-9 px-4" } as const;

// Written out in full (not built from HOVER_FILL) so Tailwind finds each class in the source.
const SECONDARY_FILL: Record<Surface, string> = {
  page: "not-disabled:hover:bg-hover-fill-page",
  surface: "not-disabled:hover:bg-hover-fill",
  raised: "not-disabled:hover:bg-hover-fill-raised",
};

export function buttonClass(variant: keyof typeof VARIANT, extra = "", size: keyof typeof SIZE = "large", on: Surface = "page") {
  const fill = variant === "secondary" ? SECONDARY_FILL[on] : "";
  return `${SIZE[size]} group/button inline-flex items-center justify-center gap-2 rounded-sm ${STATE_TRANSITION} ${PRESS_ENABLED} ${VARIANT[variant]} ${fill} ${extra}`;
}

// Where each icon nudges on hover: towards where the button goes. Icons with no direction stay put, and so does the
// icon of a disabled button (it answers no hover).
const NUDGE: Partial<Record<IconName, string>> = {
  "arrow-right": "group-not-disabled/button:group-hover/button:translate-x-0.5",
  "chevron-right": "group-not-disabled/button:group-hover/button:translate-x-0.5",
  "arrow-left": "group-not-disabled/button:group-hover/button:-translate-x-0.5",
  "chevron-left": "group-not-disabled/button:group-hover/button:-translate-x-0.5",
  download: "group-not-disabled/button:group-hover/button:translate-y-0.5",
  share: "group-not-disabled/button:group-hover/button:-translate-y-0.5",
  external: "group-not-disabled/button:group-hover/button:translate-x-px group-not-disabled/button:group-hover/button:-translate-y-px",
};

/** The label with its icon on the side the design puts it. */
export function ButtonLabel({
  children,
  icon,
  iconSide = "right",
  iconSize = 20,
}: {
  children: ReactNode;
  icon?: IconName;
  iconSide?: "left" | "right";
  iconSize?: 16 | 20;
}) {
  const drawn = icon && <NudgedIcon name={icon} size={iconSize} />;
  return (
    <>
      {iconSide === "left" && drawn}
      {children}
      {iconSide === "right" && drawn}
    </>
  );
}

/** A button's icon, nudged on the button's hover (transform only, --dur-fast; none under reduced motion). */
export function NudgedIcon({ name, size }: { name: IconName; size: 16 | 20 | 24 }) {
  const nudge = NUDGE[name];
  if (!nudge) return <Icon name={name} size={size} />;
  return (
    <span className={`flex transition-[translate] duration-(--dur-fast) ease-(--ease-out) motion-reduce:translate-none! ${nudge}`}>
      <Icon name={name} size={size} />
    </span>
  );
}
