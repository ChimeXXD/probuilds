"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/shell/Icon";
import { shake } from "@/components/ui/ActionIcon";
import { Spinner } from "@/components/builds/ShareSheet";
import { buttonClass } from "@/components/ui/Button";
import { PRESS, STATE_TRANSITION } from "@/components/ui/interaction";
import { plural } from "@/lib/face-page";
import { KIND_LABEL } from "@/lib/faces";
import type { FaceRequest } from "@/lib/requests";
import { RequestNameField } from "./RequestNameField";

// Figma "New request" (402:3451) and its states: typing a name already asked for (430:6093: "Already asked for",
// Vote, and "Ask for “Kanye” as a new face"), request sent (430:6517) and request failed (441:9598: the red row and
// Try again, keeping what was typed; D-100 (3)). The placeholder wraps to two lines on phone as Figma draws it, so
// it is drawn over the field; the field's own placeholder stays for screen readers (RequestNameField).
// Loading to success (motion-bookmarks #19): Request shows the spinner while sending; once sent, the "Request sent"
// card's check draws in from the left (the check-in keyframe, 160 ms, --ease-out). A request that fails shakes the
// button 4 px twice as the red row appears (ActionIcon's shake, shared with Save images; feedback for an error).
// Reduced motion: the check fades in, no shake. The button has no icon in Figma, so ActionIcon's icon slot isn't used:
// the success check lives in the "Request sent" card that replaces the form.

export type FormState = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; name: string } | { kind: "failed" };

export function RequestForm({
  value,
  state,
  match,
  voted,
  onChange,
  onRequest,
  onVote,
  onAnother,
}: {
  value: string;
  state: FormState;
  match: FaceRequest | null;
  voted: boolean;
  onChange: (value: string) => void;
  onRequest: () => void;
  onVote: (request: FaceRequest) => void;
  onAnother: () => void;
}) {
  // The shake plays when sending turns into a failure (not when a page opens on the failed state).
  const submit = useRef<HTMLButtonElement>(null);
  const was = useRef(state.kind);
  useEffect(() => {
    if (was.current === "sending" && state.kind === "failed") shake(submit);
    was.current = state.kind;
  }, [state.kind]);

  if (state.kind === "sent")
    return (
      <section aria-label="Request sent" data-testid="request-sent" className="flex flex-col gap-3 rounded-lg bg-bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-accent-text">
            <span data-testid="sent-check" className="flex animate-[check-in_160ms_var(--ease-out)_both] motion-reduce:animate-[fade-in_150ms_var(--ease-out)_both]">
              <Icon name="check" size={20} />
            </span>
          </span>
          <div role="status" className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="type-label text-text-primary">{`Asked for ${state.name}`}</p>
            <p className="type-caption text-text-secondary">New requests show in the list once we&apos;ve checked them</p>
          </div>
        </div>
        <button type="button" className={buttonClass("secondary", "w-full", "large", "surface")} onClick={onAnother}>
          Ask for another
        </button>
      </section>
    );

  const typed = value.trim();
  const showMatch = match !== null && state.kind !== "failed";
  return (
    <form
      data-testid="request-form"
      className="flex flex-col gap-3 rounded-lg bg-bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (typed) onRequest();
      }}
    >
      <label htmlFor="request-name" className="type-label text-text-primary">
        Who do you want?
      </label>
      <RequestNameField value={value} suggestion={showMatch ? match.name : null} onChange={onChange} />
      {showMatch ? (
        <>
          <div data-testid="already-asked" className="flex flex-col rounded-md bg-bg-raised px-3 pt-2.5 pb-1">
            <p className="type-caption text-text-muted">Already asked for</p>
            <div className="flex items-center gap-3 py-2">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="type-label text-text-primary">{match.name}</p>
                <p className="type-caption text-text-secondary">{`${KIND_LABEL[match.kind]} · ${plural(match.votes, "vote")}`}</p>
              </div>
              <button
                type="button"
                aria-pressed={voted}
                aria-label={`Vote for ${match.name}`}
                onClick={() => onVote(match)}
                className={`type-button-md flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-accent-fill pr-3.5 pl-3 text-accent-on-fill hover:bg-accent-fill-hover light:ring-1 light:ring-accent-on-fill light:ring-inset ${STATE_TRANSITION} ${PRESS}`}
              >
                <Icon name="chevron-up" size={18} />
                Vote
              </button>
            </div>
          </div>
          <button type="submit" className={buttonClass("secondary", "w-full", "large", "surface")}>
            {`Ask for “${typed}” as a new face`}
          </button>
        </>
      ) : (
        <>
          {state.kind === "failed" ? (
            <p role="alert" data-testid="request-failed" className="type-caption flex items-center gap-2.5 rounded-md bg-status-danger-bg py-3 pr-3.5 pl-3 text-text-primary">
              <span className="flex text-status-danger">
                <Icon name="error" size={20} />
              </span>
              <span className="min-w-0 flex-1">Couldn&apos;t send your request. Check your connection and try again.</span>
            </p>
          ) : (
            <p className="type-caption text-text-muted">If someone asked already, you&apos;ll see it here and can vote instead.</p>
          )}
          <button
            type="submit"
            aria-busy={state.kind === "sending" || undefined}
            disabled={state.kind === "sending"}
            ref={submit}
            className={buttonClass("primary", "w-full")}
          >
            {state.kind === "failed" ? "Try again" : "Request"}
            {state.kind === "sending" && <Spinner />}
          </button>
        </>
      )}
    </form>
  );
}
