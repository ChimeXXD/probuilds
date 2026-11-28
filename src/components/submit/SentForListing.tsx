"use client";

import { Icon } from "@/components/shell/Icon";
import { ButtonLabel, buttonClass } from "@/components/ui/Button";

// "Sent for listing" (Figma 429:5828 / 429:6034 / 429:6146; D-97 (3)): the tick, the headline, what happens to the
// build, and the queue in three steps (it's in the queue, Chime plays one match with it, it goes live credited to
// you). Share card still opens the sheet; Submit another build starts again. Tablet and desktop put the queue on the
// right (362 / 360 px, 32 apart; 584 / 520, 96 apart).
const STEPS = [
  { title: "It's in the queue", text: "Builds are checked in the order they arrive" },
  { title: "Chime plays one match with it", text: "Values are checked against the game first" },
  { title: "It goes live, credited to you", text: "Listed under its archetype with your name on the card" },
];

export function SentForListing({ onShare, onAnother }: { onShare: (from: HTMLElement) => void; onAnother: () => void }) {
  return (
    <div data-testid="sent-for-listing" className="flex flex-col tablet:flex-row tablet:items-start tablet:gap-8 desktop:gap-24">
      <div className="contents tablet:flex tablet:w-90.5 tablet:shrink-0 tablet:flex-col desktop:w-146">
        <span className="flex size-15 items-center justify-center rounded-full bg-status-success-bg text-accent-text">
          <Icon name="check" size={32} />
        </span>
        <h1 tabIndex={-1} className="type-h1 pt-5 text-text-primary outline-none">
          Sent for listing
        </h1>
        <p className="type-body-lg pt-2 text-text-secondary">Chime plays your build in game before it&apos;s listed. Your card stays yours to share, marked “Not yet checked in game”.</p>
        <div className="order-last flex flex-col gap-3 pt-6 tablet:order-none tablet:flex-row tablet:pt-7">
          <button type="button" data-testid="share-card" aria-haspopup="dialog" className={buttonClass("primary", "w-full tablet:min-w-0 tablet:flex-1 tablet:px-0")} onClick={(e) => onShare(e.currentTarget)}>
            <ButtonLabel icon="share" iconSide="left">
              Share card
            </ButtonLabel>
          </button>
          <button type="button" className={buttonClass("secondary", "w-full tablet:min-w-0 tablet:flex-1 tablet:px-0")} onClick={onAnother}>
            Submit another build
          </button>
        </div>
      </div>
      <ol aria-label="What happens next" className="mt-7 flex flex-col rounded-lg bg-bg-surface px-5 py-1.5 tablet:mt-0 tablet:w-90 tablet:shrink-0 desktop:w-130">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3.5 border-b border-system-divider py-4 last:border-0">
            <span
              aria-hidden="true"
              className={`type-label flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] ${i === 0 ? "border-accent-fill text-accent-text light:border-accent-text" : "border-border-strong text-text-secondary"}`}
            >
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="type-label text-text-primary">{s.title}</span>
              <span className="type-caption text-text-secondary">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
