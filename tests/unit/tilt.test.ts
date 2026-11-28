import { describe, expect, it } from "vitest";
import { SPRINGS, simulate } from "@/lib/motion";
import { TILT, parallax, pointerRatio, sheenShift, tiltFor, tiltTransform } from "@/lib/tilt";

// The share card's hover tilt (D-125 (1), the designbookmark "Parallax ticket"): the side under the pointer sinks
// away, the card's contents float above it and a soft light follows the pointer.
describe("pointerRatio", () => {
  const rect = { left: 100, top: 50, width: 300, height: 600 };
  it("maps the pointer to −1…1 across the card, 0 at its centre", () => {
    expect(pointerRatio(250, 350, rect)).toEqual({ x: 0, y: 0 });
    expect(pointerRatio(100, 50, rect)).toEqual({ x: -1, y: -1 });
    expect(pointerRatio(400, 650, rect)).toEqual({ x: 1, y: 1 });
    expect(pointerRatio(325, 200, rect)).toEqual({ x: 0.5, y: -0.5 });
  });
  it("clamps a pointer outside the card (its edge, or a card mid-scale)", () => {
    expect(pointerRatio(0, 2000, rect)).toEqual({ x: -1, y: 1 });
  });
  it("is 0 for a card with no size yet", () => {
    expect(pointerRatio(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({ x: 0, y: 0 });
  });
});

describe("tiltFor", () => {
  it("turns the pointer's side away: right of centre turns about Y, below about −X, at most TILT.maxDeg", () => {
    expect(tiltFor({ x: 1, y: 0 })).toEqual({ rx: 0, ry: TILT.maxDeg });
    expect(tiltFor({ x: 0, y: 1 })).toEqual({ rx: -TILT.maxDeg, ry: 0 });
    expect(tiltFor({ x: -0.5, y: -0.5 })).toEqual({ rx: TILT.maxDeg / 2, ry: -TILT.maxDeg / 2 });
  });
  it("is a few degrees, as the brief asks", () => {
    expect(TILT.maxDeg).toBeGreaterThanOrEqual(4);
    expect(TILT.maxDeg).toBeLessThanOrEqual(10);
  });
});

describe("parallax and sheen", () => {
  it("moves the contents toward the pointer by up to TILT.depthPx, so they float above the frame", () => {
    expect(parallax(0, TILT.maxDeg)).toEqual({ x: TILT.depthPx, y: 0 });
    expect(parallax(-TILT.maxDeg, 0)).toEqual({ x: 0, y: TILT.depthPx });
    expect(parallax(0, 0)).toEqual({ x: 0, y: 0 });
  });
  it("puts the light's centre under the pointer: half the card's size at full tilt", () => {
    expect(sheenShift(0, TILT.maxDeg)).toEqual({ x: 50, y: 0 });
    expect(sheenShift(TILT.maxDeg, 0)).toEqual({ x: 0, y: -50 });
  });
});

describe("tiltTransform", () => {
  it("writes rotateX, rotateY and the press scale, rounded short", () => {
    expect(tiltTransform(1.23456, -2.5, 1)).toBe("rotateX(1.235deg) rotateY(-2.5deg) scale(1)");
    expect(tiltTransform(0, 0, 0.98)).toBe("rotateX(0deg) rotateY(0deg) scale(0.98)");
  });
});

describe("the springs it uses", () => {
  it("follow tracks the pointer without overshoot; settle lands back with one small overshoot", () => {
    const follow = simulate(SPRINGS.follow, { value: 0, velocity: 0 }, TILT.maxDeg).map((s) => s.value);
    expect(Math.max(...follow)).toBeLessThanOrEqual(TILT.maxDeg * 1.01);
    const settle = simulate(SPRINGS.settle, { value: TILT.maxDeg, velocity: 0 }, 0).map((s) => s.value);
    expect(Math.min(...settle)).toBeLessThan(0);
    expect(Math.min(...settle)).toBeGreaterThan(-TILT.maxDeg * 0.1);
  });
});
