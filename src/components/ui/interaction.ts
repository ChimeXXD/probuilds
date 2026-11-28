// Hover and press, one vocabulary for every clickable thing (D-121 (1): "anything that is clickable should have a
// hover state"; emil-design-eng). Hover is a colour step, never movement of the whole control: it happens tens of
// times a visit, so it stays quiet (a fill a few per cent lighter, a border one step brighter, secondary text turning
// primary) and only an arrow inside a button nudges 2 px towards where it goes. Hover is gated to a mouse or trackpad
// by the hover variant in globals.css. Grey fills come only from the hover tokens: --hover-fill on a surface,
// --hover-fill-raised on a raised surface, --hover-fill-page on the page (DESIGN.md Color).
// Press: buttons, chips and icon buttons scale to 0.97, cards to 0.98 (emil-design-eng: "the interface heard you"),
// on touch as well; reduced motion keeps the colour and drops the scale. Transitions name their properties and run
// over --dur-fast with the house ease-out.

/** The properties a hover or press changes, over --dur-fast. */
export const STATE_TRANSITION =
  "transition-[background-color,border-color,color,scale,opacity] duration-(--dur-fast) ease-(--ease-out) motion-reduce:transition-[background-color,border-color,color,opacity]";

/** Press feedback for buttons, chips and icon buttons. */
export const PRESS = "active:scale-[0.97] motion-reduce:active:scale-100";

/** Press feedback for a control that can be disabled: a disabled one does not answer. */
export const PRESS_ENABLED = "not-disabled:active:scale-[0.97] motion-reduce:not-disabled:active:scale-100";

/** A colour-only hover (text, borders, fills that never scale), over --dur-fast. */
export const COLOR_TRANSITION = "transition-colors duration-(--dur-fast) ease-(--ease-out)";

/** Press feedback for cards and tiles (larger, so a smaller step reads the same). */
export const PRESS_CARD = "active:scale-[0.98] motion-reduce:active:scale-100";

/** Which hover fill matches the surface a control sits on. */
export const HOVER_FILL = {
  page: "hover:bg-hover-fill-page",
  surface: "hover:bg-hover-fill",
  raised: "hover:bg-hover-fill-raised",
} as const;
export type Surface = keyof typeof HOVER_FILL;

/** A 44 px ghost icon button (theme, search, close): a faint fill on hover and a press. */
export const iconButtonClass = (on: Surface = "page") => `${STATE_TRANSITION} ${PRESS} ${HOVER_FILL[on]}`;

/** A text link drawn in text/secondary (footer, nav, breadcrumbs): it turns text/primary on hover. */
export const QUIET_LINK = `${COLOR_TRANSITION} hover:text-text-primary`;

/** A text link already in text/primary ("See all", "View all builds", sources): an underline on hover. */
export const TEXT_LINK = "underline-offset-4 decoration-1 hover:underline";
