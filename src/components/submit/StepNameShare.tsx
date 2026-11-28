"use client";

import { type MouseEvent, useRef, useState } from "react";
import { Spinner } from "@/components/builds/ShareSheet";
import { Icon } from "@/components/shell/Icon";
import { ActionIcon, shake, useFor } from "@/components/ui/ActionIcon";
import { ButtonLabel, buttonClass } from "@/components/ui/Button";
import type { ShareCardsView } from "@/lib/share-cards";
import type { SubmitDraft } from "@/lib/submit/editor";
import { letterLimit } from "@/lib/submit/motion";
import { StepLine } from "./controls";
import { LetterLimit } from "./LetterLimit";
import { ProFace } from "./ProFace";
import { YourCard } from "./YourCard";

// Step 4 of 4, "Name it and share" (Figma 401:3616 / 418:6420 / 418:6599; picture added 412:2989 / 418:6778 /
// 418:6957; send failed 441:8928 / 441:9162 / 441:9380; D-86, D-89). The build's name and the player's name for the
// credit, "Your Pro's face" (a screenshot that stays in this browser and goes on their card only, D-89 (4)), then
// "Your card" (the share story card, D-89 (3)), Share card and Copy link (D-86: shared at once, "Not yet checked in
// game"), and "Want it listed on ProBuilds?" with Send for listing (D-99 (1)). A send that doesn't go through shows
// Figma's red row and the button becomes Try again, keeping everything typed (D-100 (3)).
// Tablet: name, credit and face on the left (369 px), the card and its buttons on the right (353), 32 apart;
// desktop 664 and 440, 96 apart.
const FIELD = "type-body h-13 w-full rounded-md border border-input-border bg-input-bg px-4 text-text-primary placeholder:text-text-muted focus:border-2 focus:border-input-border-focused focus:px-[15px] focus:outline-none";
const NAME_MAX = 40;

export function StepNameShare({
  draft,
  cards,
  picture,
  sending,
  sent,
  failed,
  onChange,
  onPicture,
  onShare,
  onLift,
  onCopy,
  onSend,
}: {
  draft: SubmitDraft;
  cards: ShareCardsView;
  picture: string | null;
  sending: boolean;
  /** Sent: the button's check shows for a moment before the editor moves to "Sent for listing". */
  sent: boolean;
  failed: boolean;
  onChange: (next: Partial<SubmitDraft>) => void;
  onPicture: (file: File | null) => void;
  onShare: (from: HTMLElement) => void;
  /** Your card was tapped: open the sheet from `button`, lifting `card` into it (Fan cards, #2). */
  onLift: (button: HTMLElement, card: HTMLElement, e: MouseEvent) => void;
  /** Resolves true when the link is on the clipboard. */
  onCopy: () => Promise<boolean>;
  /** Resolves false when the build didn't go through. */
  onSend: () => Promise<boolean>;
}) {
  // Copy button (#20): the copy icon turns into a check for 2 s after the link is copied (the toast still says so).
  const [copiedAt, setCopiedAt] = useState(0);
  const copied = useFor(copiedAt, 2000);
  // Loading to success (#19): the spinner, then a check that draws in; a send that fails shakes the button 4 px twice.
  const sendButton = useRef<HTMLButtonElement>(null);
  const shareButton = useRef<HTMLButtonElement>(null);
  const copy = async () => {
    if (await onCopy()) setCopiedAt(Date.now());
  };
  const send = async () => {
    if (!(await onSend())) shake(sendButton);
  };
  return (
    <div className="flex flex-col tablet:flex-row tablet:items-start tablet:gap-8 desktop:gap-24">
      <div className="flex flex-col tablet:w-92.25 tablet:shrink-0 desktop:w-166">
        <StepLine label="Submit a build" step={4} />
        <h1 tabIndex={-1} className="type-h1 pt-3 text-text-primary outline-none">Name it and share</h1>
        <div className="flex flex-col gap-2 pt-6">
          <label htmlFor="build-name" className="type-label text-text-primary">
            Build name
          </label>
          {/* Letter limit (#29): the ring sits in the field's right edge, so the text stops short of it. */}
          <span className="relative flex">
            <input
              id="build-name"
              className={`${FIELD} pr-14 focus:pr-[55px]`}
              placeholder="Name your build"
              maxLength={NAME_MAX}
              aria-describedby={letterLimit(draft.title.length, NAME_MAX).warn ? "build-name-left" : undefined}
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
            <LetterLimit length={draft.title.length} max={NAME_MAX} id="build-name-left" />
          </span>
        </div>
        <div className="flex flex-col gap-2 pt-4.5">
          <label htmlFor="build-credit" className="type-label text-text-primary">
            Your name for the credit
          </label>
          <input
            id="build-credit"
            className={FIELD}
            placeholder="As you want it shown"
            maxLength={40}
            autoComplete="nickname"
            aria-describedby="build-credit-note"
            value={draft.credit}
            onChange={(e) => onChange({ credit: e.target.value })}
          />
          <p id="build-credit-note" className="type-caption text-text-muted">
            Shown on the card as “Made by …”.
          </p>
        </div>
        <ProFace picture={picture} onPicture={onPicture} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col pt-7 tablet:pt-0">
        <h2 className="type-h3 pb-3 text-text-primary">Your card</h2>
        {/* The sheet gives focus back to Share card, the keyboard's way to the same sheet. */}
        <YourCard card={cards.overview} onOpen={(button, card, e) => onLift(shareButton.current ?? button, card, e)} />
        <div className="flex flex-col gap-3 pt-7">
          <button ref={shareButton} type="button" data-testid="share-card" aria-haspopup="dialog" className={buttonClass("primary", "w-full")} onClick={(e) => onShare(e.currentTarget)}>
            <ButtonLabel icon="share" iconSide="left">
              Share card
            </ButtonLabel>
          </button>
          <button type="button" data-testid="copy-link" className={buttonClass("secondary", "w-full")} onClick={copy}>
            <ActionIcon icon="copy" state={copied ? "done" : "idle"} />
            Copy link
          </button>
        </div>
        <section aria-labelledby="listing" className="mt-6 flex flex-col gap-2.5 rounded-lg bg-bg-surface p-4">
          <h2 id="listing" className="type-label text-text-primary">
            Want it listed on ProBuilds?
          </h2>
          <p className="type-caption text-text-secondary">Chime plays it in game first. Until then it&apos;s yours to share, marked “Not yet checked in game”.</p>
          {failed && (
            <p role="alert" data-testid="send-failed" className="type-caption flex items-center gap-2.5 rounded-md bg-status-danger-bg py-3 pr-3.5 pl-3 text-text-primary">
              <span className="flex text-status-danger">
                <Icon name="error" size={20} />
              </span>
              <span className="min-w-0 flex-1">Couldn&apos;t send. Check your connection and try again. Your build is still here.</span>
            </p>
          )}
          <button
            ref={sendButton}
            type="button"
            data-testid="submit-listing"
            aria-busy={sending || undefined}
            disabled={sending || sent}
            className={buttonClass("secondary", "w-full border-transparent", "large", "surface")}
            onClick={send}
          >
            {failed ? "Try again" : "Send for listing"}
            <ActionIcon icon="arrow-right" state={sending ? "busy" : sent ? "done" : "idle"} busy={<Spinner />} draw />
          </button>
        </section>
      </div>
    </div>
  );
}
