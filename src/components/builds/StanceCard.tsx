import type { ArchetypeView } from "@/lib/builds";
import { Emblem } from "./Emblem";

// Figma Stance card (258:585, D-56): the archetype's pattern (our own drawing), Chime's AI stance (D-54, D-55), an
// inner frame line, and a name plate with the emblem, name and group. The card is art that scales as one piece,
// as Figma rescales its instances (252 px wide on phone, 280 on tablet, 392 on desktop), so every size inside is a
// share of the card's 252 × 348 design box (cqw of the card, or % for the stance). Figma's card uses the green/900
// and green/950 primitives, which are not tokens in code; bg/surface and bg/page are their dark values, so in light
// mode the plate turns cream with ink text (TODO(Chime): no light-mode Stance card in Figma yet).
const pct = (n: number, of: number) => `${(n / of) * 100}%`;
const cqw = (px: number) => `${(px / 252) * 100}cqw`;

export function StanceCard({ archetype, eager = false }: { archetype: ArchetypeView; eager?: boolean }) {
  const { box } = archetype.stance;
  return (
    <div className="absolute inset-0 [container-type:inline-size]">
      <div
        className="absolute inset-0 overflow-hidden bg-bg-surface"
        style={{ borderRadius: cqw(16) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, files already sized (2x) */}
        <img
          src={archetype.pattern}
          alt=""
          loading={eager ? "eager" : "lazy"}
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute border border-border-strong"
          style={{ inset: cqw(8), borderRadius: cqw(10) }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, files already sized (2x) */}
        <img
          src={archetype.stance.src}
          alt=""
          loading={eager ? "eager" : "lazy"}
          draggable={false}
          className="absolute object-cover"
          style={{ left: pct(box.left, 252), top: pct(box.top, 348), width: pct(box.width, 252), height: pct(box.height, 348) }}
        />
        <div
          className="absolute flex items-center bg-bg-page"
          style={{
            left: cqw(8),
            right: cqw(8),
            bottom: cqw(8),
            height: cqw(64),
            gap: cqw(8),
            paddingInline: cqw(10),
            borderBottomLeftRadius: cqw(10),
            borderBottomRightRadius: cqw(10),
          }}
        >
          <Emblem id={archetype.id} className="shrink-0" style={{ width: cqw(28), height: cqw(28) }} />
          <span className="flex flex-col">
            <span
              className="font-display font-extrabold text-text-primary uppercase"
              style={{ fontSize: cqw(28), lineHeight: cqw(30) }}
            >
              {archetype.name}
            </span>
            <span className="font-text font-medium text-text-secondary" style={{ fontSize: cqw(14), lineHeight: cqw(20) }}>
              {archetype.groupLabel}
            </span>
          </span>
        </div>
        {/* The card's own 1 px edge, drawn over everything as Figma draws a frame's stroke. On the front card it
            brightens under a mouse: the card opens its builds (D-121 (1), (3)). */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border border-border-strong transition-colors duration-(--dur-fast) ease-(--ease-out) group-hover/stance:border-input-border-hovered"
          style={{ borderRadius: cqw(16) }}
        />
      </div>
    </div>
  );
}
