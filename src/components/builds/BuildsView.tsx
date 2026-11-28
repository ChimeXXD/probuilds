"use client";

import { useEffect, useState } from "react";
import { type ArchetypeView, groupViews } from "@/lib/builds";
import { PhoneFacts, WideFacts } from "./ArchetypeFacts";
import { EmblemRail } from "./EmblemRail";
import { StanceStage } from "./StanceStage";

// Figma "Builds · 13 archetypes" (phone 241:556, tablet 279:1399, desktop 276:1073): option E on phone (D-57), the
// Stance card beside the facts on tablet and desktop (D-60). The page opens on the first archetype, or on the one
// a link names (/builds#finisher); picking one updates that hash so a shared link opens on it.
export function BuildsView({ archetypes, initial }: { archetypes: ArchetypeView[]; initial?: string }) {
  const [selected, setSelected] = useState(() => Math.max(0, archetypes.findIndex((a) => a.id === initial)));
  // Whether the last pick came from the keyboard (Enter or Space: a click with detail 0): then nothing moves.
  const [still, setStill] = useState(false);
  const groups = groupViews(archetypes);
  const current = archetypes[selected];

  useEffect(() => {
    const fromHash = () => {
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return; // a malformed hash (/builds#%E0) names no archetype
      }
      const i = archetypes.findIndex((a) => a.id === id);
      if (i >= 0) {
        // The page opening on a linked archetype is a change nobody made: the deck puts it in place (userInitiated).
        setSelected(i);
        setStill(false);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [archetypes]);

  const pick = (i: number, byKey = false) => {
    const a = archetypes[i];
    if (!a) return;
    setSelected(i);
    setStill(byKey);
    window.history.replaceState(null, "", `#${a.id}`);
  };

  return (
    <main>
      <header className="flex flex-col gap-2 px-5 pt-6 pb-5 tablet:px-10 tablet:pt-10 desktop:mx-auto desktop:max-w-(--layout-content-max) desktop:px-0">
        <h1 className="type-h1 text-text-primary">Builds</h1>
        <p className="type-body text-text-secondary">Pick your archetype to see its builds</p>
      </header>
      {current && (
        <>
          <EmblemRail
            groups={groups}
            selectedId={current.id}
            still={still}
            onSelect={(id, byKey) => pick(archetypes.findIndex((a) => a.id === id), byKey)}
          />
          <div className="tablet:flex tablet:gap-10 tablet:px-10 tablet:pt-6 tablet:pb-16 desktop:mx-auto desktop:max-w-(--layout-content-max) desktop:items-center desktop:gap-20 desktop:px-0 desktop:pb-20">
            <StanceStage archetypes={archetypes} selected={selected} still={still} onSelect={pick} />
            <PhoneFacts archetype={current} />
            <WideFacts archetype={current} />
          </div>
        </>
      )}
    </main>
  );
}
