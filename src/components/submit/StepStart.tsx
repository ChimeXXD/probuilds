"use client";

import { type CSSProperties, useState } from "react";
import { Emblem } from "@/components/builds/Emblem";
import type { Archetype, ArchetypeFile, Position, PositionGroup } from "@/lib/content/types";
import { apAtLevel, archetypesIn, LEVEL_MAX, levelLine, POSITIONS_BY_GROUP, type SubmitDraft, withArchetype } from "@/lib/submit/editor";
import { BodyCard } from "./BodyCard";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { PRESS_CARD } from "@/components/ui/interaction";
import { SmallChip } from "@/components/ui/SmallChip";
import { RoundButton, SectionTitle, StepLine, useRollGate } from "./controls";
import { GroupChips } from "./GroupChips";
import { Slider } from "./Slider";

// Segmented control (motion-bookmarks.pdf #7): when the group changes, its archetype tiles fade and rise 8 px into
// place one after another, the first at once, then 45, 80 and 105 ms (gaps that shrink, so the row lands as one wave,
// not a metronome; choreograph). They are the support to the pill's lead; the section around them stays still. Not
// on the first view, not from the keyboard; reduced motion fades them in together.
const TILE_DELAYS = [0, 45, 80, 105];
const TILE_ENTER =
  "animate-[fade-rise_var(--dur-base)_var(--ease-out)_var(--delay)_both] motion-reduce:animate-[fade-in_var(--dur-fast)_linear_both]";

// Step 1 of 4, "Your build" (Figma 400:3219 / 418:3972 / 418:4161): archetype (group chips over the group's
// archetype tiles), positions, level and height and weight. Phone stacks them; tablet too, with the four tiles in a
// row; desktop puts archetype and positions in the left column and level and body in the right (568 px each, 64
// apart). The level fills in its AP from RESEARCH §10.1 (D-85 (1)).
export function StepStart({
  file,
  draft,
  group,
  onGroup,
  onChange,
}: {
  file: ArchetypeFile;
  draft: SubmitDraft;
  group: PositionGroup;
  onGroup: (group: PositionGroup) => void;
  onChange: (next: Partial<SubmitDraft> | ((d: SubmitDraft) => SubmitDraft)) => void;
}) {
  const archetype = file.archetypes.find((a) => a.id === draft.archetype);
  // The group a pointer last picked: its tiles enter. Any other change of group (the keyboard, a reset) doesn't.
  const [enterGroup, setEnterGroup] = useState<PositionGroup | null>(null);
  const entering = enterGroup === group;
  const line = levelLine(draft.level);
  // Number stepper (#12) and Exposure slider (#16): the level rolls and the knob settles on a tap; a key press, or a
  // change faster than the roll (a drag across levels), sets them at once.
  const [still, gate] = useRollGate(draft.level);
  const setLevel = (level: number, at: number, byKey: boolean) => {
    const next = Math.min(Math.max(level, 1), LEVEL_MAX);
    gate(at, byKey, next);
    onChange({ level: next });
  };
  const togglePosition = (p: Position) =>
    onChange((d) => {
      const on = d.positions.includes(p);
      // At least one position stays picked: a build needs one (FORMAT §Build).
      if (on && d.positions.length === 1) return d;
      return { ...d, positions: on ? d.positions.filter((x) => x !== p) : [...d.positions, p] };
    });
  const positions = archetype ? POSITIONS_BY_GROUP[archetype.positionGroup] : [];
  return (
    <div className="flex flex-col">
      <StepLine label="Submit a build" step={1} />
      <h1 tabIndex={-1} className="type-h1 pt-3 text-text-primary outline-none">Your build</h1>
      <p className="type-body-lg pt-2 text-text-secondary">Archetype, positions, level, height and weight. The level fills in your AP.</p>
      <div className="flex flex-col pt-7 desktop:flex-row desktop:gap-16 desktop:pt-8">
        <div className="flex flex-col desktop:w-142 desktop:shrink-0">
          <section aria-labelledby="submit-archetype" className="flex flex-col">
            <SectionTitle id="submit-archetype">Archetype</SectionTitle>
            <div className="flex flex-col gap-3.5">
              <GroupChips
                group={group}
                onGroup={(g, still) => {
                  setEnterGroup(still ? null : g);
                  onGroup(g);
                }}
              />
              <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4 desktop:grid-cols-2">
                {archetypesIn(file, group).map((a, i) => (
                  <ArchetypeTile
                    key={a.id}
                    archetype={a}
                    selected={a.id === draft.archetype}
                    enter={entering ? (TILE_DELAYS[i] ?? TILE_DELAYS.at(-1)!) : null}
                    onPick={() => onChange((d) => (d.archetype === a.id ? d : withArchetype(d, a)))}
                  />
                ))}
              </div>
            </div>
          </section>
          <section aria-labelledby="submit-positions" className="flex flex-col pt-7">
            <SectionTitle id="submit-positions" aside="Tap all you play">
              Positions
            </SectionTitle>
            <div className="flex flex-wrap gap-x-1.5 gap-y-2">
              {positions.map((p) => (
                <SmallChip key={p} testId="submit-position" label={p} pressed={draft.positions.includes(p)} onPress={() => togglePosition(p)} />
              ))}
            </div>
          </section>
        </div>
        <div className="flex min-w-0 flex-1 flex-col pt-7 desktop:pt-0">
          <section aria-labelledby="submit-level" className="flex flex-col">
            <SectionTitle id="submit-level">Level</SectionTitle>
            <div className="flex flex-col gap-3.5 rounded-lg bg-bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex min-w-0 flex-1 flex-col">
                  <p data-testid="level-number" className="type-number-xl text-text-primary tabular-nums" aria-live="polite">
                    <RollingNumber value={String(draft.level)} still={still} />
                  </p>
                  <p className="type-caption text-text-muted">{`of ${LEVEL_MAX}`}</p>
                </div>
                <div className="flex gap-1.5">
                  <RoundButton sign="minus" label="Level down" size={48} disabled={draft.level <= 1} onPress={(e) => setLevel(draft.level - 1, e.timeStamp, e.detail === 0)} />
                  <RoundButton sign="plus" label="Level up" size={48} disabled={draft.level >= LEVEL_MAX} onPress={(e) => setLevel(draft.level + 1, e.timeStamp, e.detail === 0)} />
                </div>
              </div>
              <Slider
                label="Level"
                min={0}
                max={LEVEL_MAX}
                value={draft.level}
                onChange={(v, { held, at }) => setLevel(v, at, !held)}
                motion="settle"
                still={still}
                ticks
              />
              <div data-testid="submit-ap" className="flex flex-col gap-0.5 rounded-md bg-bg-raised px-3.5 py-3" data-ap={apAtLevel(draft.level)}>
                <p className="type-label text-text-primary">{line.spend}</p>
                {line.next && <p className="type-caption text-text-secondary">{line.next}</p>}
              </div>
            </div>
          </section>
          <section aria-labelledby="submit-body" className="flex flex-col pt-7">
            <SectionTitle id="submit-body">Height and weight</SectionTitle>
            <BodyCard draft={draft} archetypeName={archetype?.name ?? ""} onChange={(next) => onChange(next)} />
          </section>
        </div>
      </div>
    </div>
  );
}

/** Figma "Archetype tile" (component 205:330): the emblem in a 40 px page-coloured circle, the name, its two signature PlayStyles. */
function ArchetypeTile({ archetype, selected, enter, onPick }: { archetype: Archetype; selected: boolean; enter: number | null; onPick: () => void }) {
  return (
    <button
      type="button"
      data-testid="archetype-tile"
      aria-pressed={selected}
      onClick={onPick}
      style={enter === null ? undefined : ({ "--delay": `${enter}ms` } as CSSProperties)}
      className={`flex flex-col items-start gap-2 rounded-lg p-4 text-left transition-[background-color,box-shadow,scale] duration-(--dur-fast) ease-(--ease-out) ${PRESS_CARD} ${selected ? "bg-action-selected ring-2 ring-accent-fill ring-inset light:ring-accent-text" : "bg-bg-surface ring-1 ring-border-subtle ring-inset hover:bg-hover-fill hover:ring-border-strong"} ${enter === null ? "" : TILE_ENTER}`}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-bg-page">
        <Emblem id={archetype.id} className="size-6.5" />
      </span>
      <span className="type-h4 text-text-primary">{archetype.name}</span>
      <span className={`type-caption flex flex-col text-text-muted ${selected ? "light:text-text-secondary" : ""}`}>
        {archetype.signaturePlayStyles.map((s) => (
          <span key={s.name}>{s.name}</span>
        ))}
      </span>
    </button>
  );
}
