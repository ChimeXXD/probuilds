"use client";

import { useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { PRESS, STATE_TRANSITION } from "@/components/ui/interaction";
import { PillRow } from "@/components/ui/PillRow";
import { RollingNumber } from "@/components/ui/RollingNumber";
import { SmallChip, SmallChipGhost } from "@/components/ui/SmallChip";
import { useFlip } from "@/components/ui/useFlip";
import { plural } from "@/lib/face-page";
import { byKind, type FaceRequest, REQUEST_KINDS, type RequestKind, requestLine } from "@/lib/requests";
import { BURST_DOTS, burst } from "./voteBurst";

// "Most requested" (Figma 402:3451): the heading with "One vote each", the kind chips, and the requests ranked by
// votes (component "Request row" 431:1092: default, voted, being made). A vote box is lime once this browser has
// voted; a request being made says so in status/success. With no requests the chips give way to "No requests yet" (430:6931).
export function RequestList({
  requests,
  failed = false,
  voted,
  kind,
  onKind,
  onVote,
}: {
  requests: FaceRequest[] | null;
  /** The list didn't load (not drawn in Figma): just the heading. */
  failed?: boolean;
  voted: ReadonlySet<string>;
  kind: RequestKind | null;
  onKind: (kind: RequestKind | null) => void;
  onVote: (request: FaceRequest) => void;
}) {
  const empty = requests !== null && requests.length === 0;
  // The request last voted for from the keyboard: its count changes without rolling (nothing on keyboard input).
  const [byKey, setByKey] = useState<string | null>(null);
  // The list changes in place (D-121 (2)): a kind chip glides the rows that stay to their new places, rows that leave
  // fade where they were, new ones fade in (useFlip). From the keyboard it changes at once. A vote keeps the order
  // (the rank comes with the request), so it moves no row.
  const { list, layer, before } = useFlip<HTMLOListElement>();
  return (
    <section aria-labelledby="most-requested" aria-busy={(requests === null && !failed) || undefined} className="relative flex flex-col">
      <div ref={layer} aria-hidden="true" inert className="pointer-events-none absolute inset-0 z-1" />
      <div className="flex items-center gap-2">
        <h2 id="most-requested" className="type-h3 min-w-0 flex-1 text-text-primary">
          Most requested
        </h2>
        <p className="type-caption text-text-muted">One vote each</p>
      </div>
      {empty ? (
        <div data-testid="requests-empty" className="mt-5 flex flex-col items-center gap-1.5 rounded-lg bg-bg-surface px-5 py-8 text-center">
          <span className="flex text-text-muted">
            <Icon name="faces" size={28} />
          </span>
          <p className="type-h4 text-text-primary">No requests yet</p>
          <p className="type-body text-text-secondary">Be the first: ask for a face above</p>
        </div>
      ) : failed ? null : (
        <>
          <div className="pt-3">
            <PillRow
              selected={REQUEST_KINDS.findIndex((k) => k.kind === kind)}
              className="flex flex-wrap gap-1.5"
              chips={(pill) =>
                REQUEST_KINDS.map((k) => (
                  <SmallChip
                    key={k.label}
                    testId="request-kind"
                    label={k.label}
                    pressed={k.kind === kind}
                    pill={pill}
                    onPress={(e) => {
                      if (k.kind === kind) return;
                      before({ still: e.detail === 0 });
                      onKind(k.kind);
                    }}
                  />
                ))
              }
              ghosts={REQUEST_KINDS.map((k) => (
                <SmallChipGhost key={k.label} label={k.label} />
              ))}
            />
          </div>
          <ol ref={list} className="flex flex-col pt-2">
            {byKind(requests ?? [], kind).map((r) => {
              const on = voted.has(r.id);
              return (
                <li key={r.id} data-flip={r.id} data-testid="face-request" className="flex h-[85px] items-center gap-3.5 border-b border-system-divider">
                  <span className={`type-number-md w-5.5 shrink-0 ${r.beingMade ? "text-status-success" : "text-text-secondary"}`}>{r.rank}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="type-label text-text-primary">{r.name}</p>
                    <p className={`type-caption ${r.beingMade ? "text-status-success" : "text-text-muted"}`}>{requestLine(r)}</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Vote for ${r.name}, ${plural(r.votes, "vote")}`}
                    onClick={(e) => {
                      // A burst for a tap or click that votes (detail 0 is a keyboard press: no motion there).
                      if (!on && e.detail > 0) burst(e.currentTarget);
                      setByKey(e.detail === 0 ? r.id : null);
                      onVote(r);
                    }}
                    className={`type-label relative flex size-14 shrink-0 touch-manipulation flex-col items-center justify-center rounded-[14px] select-none [-webkit-tap-highlight-color:transparent] ${STATE_TRANSITION} ${PRESS} ${on ? "bg-accent-fill text-accent-on-fill hover:bg-accent-fill-hover light:ring-1 light:ring-accent-on-fill light:ring-inset" : "bg-bg-surface text-text-primary hover:bg-hover-fill"}`}
                  >
                    <span data-vote-arrow className="flex">
                      <Icon name="chevron-up" size={20} />
                    </span>
                    <RollingNumber value={String(r.votes)} still={byKey === r.id} />
                    {BURST_DOTS.map((a) => (
                      <span
                        key={a}
                        data-vote-dot
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-1/2 -mt-0.5 -ml-0.5 size-1 rounded-full bg-accent-fill opacity-0 light:bg-accent-text"
                      />
                    ))}
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}

/** "Chime and Sharon make the top requests in game, …" with the info icon (Figma "How it works"). */
export function HowItWorks({ className = "" }: { className?: string }) {
  return (
    <p className={`type-caption flex gap-2.5 text-text-muted ${className}`}>
      <span className="flex h-5 shrink-0 items-center">
        <Icon name="info" size={18} />
      </span>
      Chime and Sharon make the top requests in game, then they appear in Faces with their build.
    </p>
  );
}
