"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { playStyleIcon, playStylePlusIcon } from "@/lib/builds";
import type { PlayStyleInfo, Tier } from "@/lib/content/playstyles";
import type { Source } from "@/lib/content/types";
import { PlayStyleArt } from "./PlayStyleArt";

// What a PlayStyle or PlayStyle+ does (D-121 (4), Chime: "clicking every playstyle should explain what the playstyle
// actually does"): every badge on the site opens one sheet per page, a bottom sheet on phone and a centred dialog on
// tablet and desktop, with the badge, the name, "PlayStyle" or "PlayStyle+", EA's own words for what it does and
// the EA page they come from. FUT.GG's PlayStyle modal is the pattern only; its text is never used (rule 9). A
// PlayStyle with no EA wording found says "To check in game". The sheet is ShareSheet's: a native <dialog> opened
// with showModal() (focus moves in, Escape closes it, focus returns to the badge), sliding up over 250 ms on the
// drawer curve on phone and growing from 0.96 on the ease-out from tablet; reduced motion only fades (animate,
// emil-design-eng: modals stay centred, no origin; exit is the browser's instant close). Opened from the keyboard it
// appears at once (D-120 (2)).
export type { Tier };
type Open = (name: string, tier: Tier, from: HTMLElement | null, byKey: boolean) => void;

// The page's sheet, and the PlayStyles it has words for: a name with no entry (a draft's placeholder) stays plain.
const InfoContext = createContext<{ open: Open; known: Set<string> } | null>(null);

/** One sheet for the page; `infos` are the descriptions of the PlayStyles the page shows (content/playstyles.json). */
export function PlayStyleInfoProvider({ infos, children }: { infos: PlayStyleInfo[]; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState<{ name: string; tier: Tier } | null>(null);
  const open = useCallback<Open>((name, tier, from, byKey) => {
    opener.current = from;
    setShown({ name, tier });
    const d = dialog.current;
    if (!d) return;
    if (byKey) d.dataset.instant = "";
    else delete d.dataset.instant;
    d.showModal();
  }, []);
  const value = useMemo(() => ({ open, known: new Set(infos.map((i) => i.name)) }), [open, infos]);
  const info = shown && infos.find((i) => i.name === shown.name);
  const text = shown && info ? info[shown.tier] : null;
  const close = () => dialog.current?.close();
  const plus = shown?.tier === "plus";
  const badge = shown && (plus ? playStylePlusIcon(shown.name) : playStyleIcon(shown.name));

  return (
    <InfoContext.Provider value={value}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="playstyle-info-title"
        aria-describedby={info?.caveat ? "playstyle-info-text playstyle-info-caveat" : "playstyle-info-text"}
        data-testid="playstyle-info"
        onClose={() => opener.current?.focus()}
        // A click on the backdrop lands on the dialog itself (its content fills it); that closes it.
        onClick={(e) => e.target === dialog.current && close()}
        className="mt-auto mb-0 w-full max-w-none rounded-t-xl border-0 bg-bg-raised p-0 text-text-primary shadow-elevation-3 transition-[translate,scale,opacity] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-system-backdrop starting:open:translate-y-full tablet:m-auto tablet:w-[440px] tablet:max-w-[calc(100%-48px)] tablet:rounded-xl tablet:ease-(--ease-out) tablet:starting:open:translate-y-0 tablet:starting:open:scale-[0.96] tablet:starting:open:opacity-0 motion-reduce:starting:open:translate-y-0 motion-reduce:starting:open:scale-100 motion-reduce:starting:open:opacity-0 data-instant:transition-none"
      >
        {shown && (
          <div className="flex flex-col gap-4 px-5 pt-3.5 pb-[calc(32px+env(safe-area-inset-bottom))] tablet:px-7 tablet:pt-6 tablet:pb-7">
            <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-[2px] bg-text-muted tablet:hidden" />
            <div className="flex items-start gap-3">
              {badge && plus ? (
                // eslint-disable-next-line @next/next/no-img-element -- static export; EA's gold PlayStyle+ badge (D-39)
                <img src={badge} alt="" width={56} height={56} className="size-14 shrink-0" />
              ) : badge ? (
                <PlayStyleArt src={badge} className="size-14 shrink-0" />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1.5">
                <h2 id="playstyle-info-title" className="type-h3 break-words text-text-primary">
                  {shown.name}
                </h2>
                <p className="type-label text-text-secondary">{plus ? "PlayStyle+" : "PlayStyle"}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-sm text-text-primary transition-colors duration-(--dur-fast) ease-(--ease-out) hover:bg-action-hovered"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <p id="playstyle-info-text" className={`type-body ${text ? "text-text-primary" : "text-text-muted"}`}>
              {text ? text.text : "To check in game"}
            </p>
            {text && (
              <p className="type-caption text-text-muted">
                {"Source: "}
                <SourceLink source={text.source} />
              </p>
            )}
            {/* EA's own pages disagreeing on this PlayStyle: what each says, with links (D-122). */}
            {info?.caveat && (
              <div className="flex flex-col gap-1 border-t border-border-subtle pt-3">
                <p id="playstyle-info-caveat" className="type-caption text-text-secondary">
                  {info.caveat.text}
                </p>
                <p className="type-caption text-text-muted">
                  {info.caveat.sources.length > 1 ? "Sources: " : "Source: "}
                  {info.caveat.sources.map((source, i) => (
                    <span key={source.url}>
                      {i > 0 && " · "}
                      <SourceLink source={source} />
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
        )}
      </dialog>
    </InfoContext.Provider>
  );
}

/** An EA page cited in the sheet, opened in a new tab. */
function SourceLink({ source }: { source: Source }) {
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-text-secondary underline-offset-4 hover:underline">
      {source.title}
    </a>
  );
}

// Hover (D-121 (1), DESIGN.md Color): the faint grey fill of the surface the badge sits on, from the hover tokens
// (gated to a mouse by the hover variant), over --dur-fast; press 0.97, none under reduced motion (emil-design-eng).
// Written out in full so Tailwind finds each class.
const HOVER = { page: "hover:bg-hover-fill-page", surface: "hover:bg-hover-fill", raised: "hover:bg-hover-fill-raised" } as const;
const STATE =
  "transition-[background-color,scale] duration-(--dur-fast) ease-(--ease-out) active:scale-[0.97] motion-reduce:active:scale-100";

/** Whether the page's sheet has words for this PlayStyle, so a control laid beside it (Submit's info button) shows. */
export function useKnowsPlayStyle(name: string): boolean {
  return useContext(InfoContext)?.known.has(name) ?? false;
}

/**
 * A PlayStyle or PlayStyle+ badge (and its name, when given as children) as a button that opens the info sheet.
 * Without a provider on the page (a story image, a test), or for a name the page has no words for, it is drawn as
 * plain content. Its accessible name is the PlayStyle's name with "+" for a PlayStyle+, and it says it opens a dialog.
 */
export function PlayStyleButton({
  name,
  tier,
  on = "page",
  className = "",
  children,
}: {
  name: string;
  tier: Tier;
  /** The surface it sits on, for its hover fill. */
  on?: keyof typeof HOVER;
  className?: string;
  children: ReactNode;
}) {
  const info = useContext(InfoContext);
  if (!info || !info.known.has(name)) return <span className={className}>{children}</span>;
  const { open } = info;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${name}${tier === "plus" ? "+" : ""}: what it does`}
      data-testid="playstyle-button"
      onClick={(e) => open(name, tier, e.currentTarget, e.detail === 0)}
      className={`cursor-pointer rounded-md text-left ${STATE} ${HOVER[on]} ${className}`}
    >
      {children}
    </button>
  );
}
