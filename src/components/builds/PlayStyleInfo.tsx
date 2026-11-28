"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { iconButtonClass } from "@/components/ui/interaction";
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
// A group's PlayStyles in one sheet (Submit's categories, D-122 (5)): the title and the names, in order; `plus` are
// the names picked as PlayStyle+, explained as such (as a chip's own info button did, D-121 (4)).
type OpenList = (title: string, names: readonly string[], plus: readonly string[], from: HTMLElement | null, byKey: boolean) => void;

// The page's sheet, and the PlayStyles it has words for: a name with no entry (a draft's placeholder) stays plain.
const InfoContext = createContext<{ open: Open; openList: OpenList; known: Set<string> } | null>(null);

const badgeOf = (name: string, tier: Tier) => (tier === "plus" ? playStylePlusIcon(name) : playStyleIcon(name));

/** One sheet for the page; `infos` are the descriptions of the PlayStyles the page shows (content/playstyles.json). */
export function PlayStyleInfoProvider({ infos, children }: { infos: PlayStyleInfo[]; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState<{ name: string; tier: Tier } | null>(null);
  const [list, setList] = useState<{ title: string; names: readonly string[]; plus: readonly string[] } | null>(null);
  const show = useCallback((from: HTMLElement | null, byKey: boolean) => {
    opener.current = from;
    const d = dialog.current;
    if (!d) return;
    if (byKey) d.dataset.instant = "";
    else delete d.dataset.instant;
    d.showModal();
  }, []);
  const open = useCallback<Open>(
    (name, tier, from, byKey) => {
      setList(null);
      setShown({ name, tier });
      show(from, byKey);
    },
    [show],
  );
  const openList = useCallback<OpenList>(
    (title, names, plus, from, byKey) => {
      setShown(null);
      setList({ title, names, plus });
      show(from, byKey);
    },
    [show],
  );
  const value = useMemo(() => ({ open, openList, known: new Set(infos.map((i) => i.name)) }), [open, openList, infos]);
  const info = shown && infos.find((i) => i.name === shown.name);
  const text = shown && info ? info[shown.tier] : null;
  const close = () => dialog.current?.close();

  return (
    <InfoContext.Provider value={value}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="playstyle-info-title"
        aria-describedby={list ? undefined : info?.caveat ? "playstyle-info-text playstyle-info-caveat" : "playstyle-info-text"}
        data-testid="playstyle-info"
        onClose={() => opener.current?.focus()}
        // A click on the backdrop lands on the dialog itself (its content fills it); that closes it.
        onClick={(e) => e.target === dialog.current && close()}
        className="mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-xl border-0 bg-bg-raised p-0 text-text-primary shadow-elevation-3 transition-[translate,scale,opacity] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-system-backdrop starting:open:translate-y-full tablet:m-auto tablet:w-[440px] tablet:max-w-[calc(100%-48px)] tablet:rounded-xl tablet:ease-(--ease-out) tablet:starting:open:translate-y-0 tablet:starting:open:scale-[0.96] tablet:starting:open:opacity-0 motion-reduce:starting:open:translate-y-0 motion-reduce:starting:open:scale-100 motion-reduce:starting:open:opacity-0 data-instant:transition-none"
      >
        {shown && (
          <SheetBody
            title={shown.name}
            kind={shown.tier === "plus" ? "PlayStyle+" : "PlayStyle"}
            art={<Badge name={shown.name} tier={shown.tier} size="size-14" />}
            onClose={close}
          >
            <p id="playstyle-info-text" className={`type-body ${text ? "text-text-primary" : "text-text-muted"}`}>
              {text ? text.text : "To check in game"}
            </p>
            {text && <SourceLine source={text.source} />}
            {info?.caveat && <Caveat caveat={info.caveat} id="playstyle-info-caveat" />}
          </SheetBody>
        )}
        {list && (
          <SheetBody title={list.title} kind="PlayStyles" art={null} onClose={close}>
            <ul className="flex flex-col">
              {list.names.map((name) => (
                <ListItem key={name} name={name} tier={list.plus.includes(name) ? "plus" : "playStyle"} info={infos.find((i) => i.name === name)} />
              ))}
            </ul>
          </SheetBody>
        )}
      </dialog>
    </InfoContext.Provider>
  );
}

/** The sheet's frame: the phone's handle, the art, the title over its kind and Close, then the body. */
function SheetBody({ title, kind, art, onClose, children }: { title: string; kind: string; art: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 px-5 pt-3.5 pb-[calc(32px+env(safe-area-inset-bottom))] tablet:px-7 tablet:pt-6 tablet:pb-7">
      <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-[2px] bg-text-muted tablet:hidden" />
      <div className="flex items-start gap-3">
        {art}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1.5">
          <h2 id="playstyle-info-title" className="type-h3 break-words text-text-primary">
            {title}
          </h2>
          <p className="type-label text-text-secondary">{kind}</p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={`-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-sm text-text-primary ${iconButtonClass("raised")}`}
        >
          <Icon name="close" size={20} />
        </button>
      </div>
      {children}
    </div>
  );
}

/** A PlayStyle's badge, or EA's gold PlayStyle+ badge (D-39); `blank` keeps its room when there is none. */
function Badge({ name, tier, size, blank = false }: { name: string; tier: Tier; size: string; blank?: boolean }) {
  const src = badgeOf(name, tier);
  if (!src) return blank ? <span aria-hidden="true" className={`${size} shrink-0`} /> : null;
  // eslint-disable-next-line @next/next/no-img-element -- static export; EA's gold PlayStyle+ badge (D-39)
  if (tier === "plus") return <img src={src} alt="" width={56} height={56} className={`${size} shrink-0`} />;
  return <PlayStyleArt src={src} className={`${size} shrink-0`} />;
}

/** EA's own pages disagreeing on a PlayStyle: what each says, with links (D-122 (3)). */
function Caveat({ caveat, id }: { caveat: NonNullable<PlayStyleInfo["caveat"]>; id?: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-border-subtle pt-3">
      <p id={id} className="type-caption text-text-secondary">
        {caveat.text}
      </p>
      <p className="type-caption text-text-muted">
        {caveat.sources.length > 1 ? "Sources: " : "Source: "}
        {caveat.sources.map((source, i) => (
          <span key={source.url}>
            {i > 0 && " · "}
            <SourceLink source={source} />
          </span>
        ))}
      </p>
    </div>
  );
}

/**
 * One PlayStyle in a group's sheet (Submit's "What these do", D-122 (5)): its badge, name and EA's words with their
 * page, in the chips' order, and EA's disagreement where there is one; "To check in game" where EA's words weren't
 * found. The sheet scrolls when the group is taller than the screen allows.
 */
function ListItem({ name, tier, info }: { name: string; tier: Tier; info: PlayStyleInfo | undefined }) {
  const text = info?.[tier] ?? null;
  return (
    <li data-testid="playstyle-info-item" className="flex gap-3 py-3">
      <Badge name={name} tier={tier} size="size-10" blank />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="type-label text-text-primary">{tier === "plus" ? `${name}+` : name}</h3>
        <p className={`type-body ${text ? "text-text-secondary" : "text-text-muted"}`}>{text ? text.text : "To check in game"}</p>
        {text && <SourceLine source={text.source} />}
        {info?.caveat && <Caveat caveat={info.caveat} />}
      </div>
    </li>
  );
}

/** A button that opens the page's sheet on a group of PlayStyles (Submit's "What these do", D-122 (5)). */
export function PlayStyleListButton({
  title,
  names,
  plus = [],
  label,
  className = "",
  children,
}: {
  title: string;
  names: readonly string[];
  /** The names picked as PlayStyle+, explained as PlayStyle+. */
  plus?: readonly string[];
  /** The accessible name, starting with the visible words (WCAG label in name). */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const info = useContext(InfoContext);
  if (!info) return null;
  const { openList } = info;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={label}
      onClick={(e) => openList(title, names, plus, e.currentTarget, e.detail === 0)}
      className={className}
    >
      {children}
    </button>
  );
}

/** "Source:" and the EA page EA's words come from. */
function SourceLine({ source }: { source: Source }) {
  return (
    <p className="type-caption text-text-muted">
      {"Source: "}
      <SourceLink source={source} />
    </p>
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
