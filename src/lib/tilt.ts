// The share card's hover tilt (D-125 (1)), after the designbookmark "Parallax ticket": on a mouse or pen the card
// turns a few degrees so the side under the pointer sinks away, its contents slide a few pixels toward the pointer
// (they float above the frame: depth), and a soft light sits under the pointer. The feel is the reference's; the
// values are ours: 8° (the ticket's 14° is for a 264 px card, ours is 311 × 552 and would swing its top 67 px), 6 px
// of depth (its front layer moves 0.9 × 12 px), no idle float (apple-design §14: no slow looping oscillation).

export const TILT = {
  /** Degrees at the card's edge. */
  maxDeg: 8,
  /** Px the contents move at full tilt. */
  depthPx: 6,
  /** The card's scale while pressed (emil-design-eng: 0.95–0.98 for a pressable surface this large). */
  press: 0.98,
} as const;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const round = (n: number) => Math.round(n * 1000) / 1000 || 0;

/** Where the pointer is on the card, −1…1 on each axis, 0 at the centre. */
export function pointerRatio(clientX: number, clientY: number, rect: Rect): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  return {
    x: round(clamp(((clientX - rect.left) / rect.width) * 2 - 1)),
    y: round(clamp(((clientY - rect.top) / rect.height) * 2 - 1)),
  };
}

/** The turn for a pointer at `p`: the pointer's side goes away from the viewer. */
export function tiltFor(p: { x: number; y: number }, max: number = TILT.maxDeg): { rx: number; ry: number } {
  return { rx: round(-p.y * max), ry: round(p.x * max) };
}

/** The contents' shift, in px, for a turn (rx, ry): toward the side that sank, as a layer above the card would. */
export function parallax(rx: number, ry: number): { x: number; y: number } {
  return { x: round((ry / TILT.maxDeg) * TILT.depthPx), y: round((-rx / TILT.maxDeg) * TILT.depthPx) };
}

/** The light's shift, in % of the card, for a turn: its centre under the pointer. */
export function sheenShift(rx: number, ry: number): { x: number; y: number } {
  return { x: round((ry / TILT.maxDeg) * 50), y: round((-rx / TILT.maxDeg) * 50) };
}

export const tiltTransform = (rx: number, ry: number, scale: number) => `rotateX(${round(rx)}deg) rotateY(${round(ry)}deg) scale(${round(scale)})`;

let fine: MediaQueryList | undefined;
/** Whether this device hovers with a fine pointer (a mouse or trackpad), read at the moment of use (the query is
 *  made once: it's asked on every pointer move). */
export const finePointer = () => typeof window !== "undefined" && (fine ??= window.matchMedia("(hover: hover) and (pointer: fine)")).matches;
