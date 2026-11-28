"use client";

import { type CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/shell/Icon";
import { ActionIcon, shake, useFor } from "@/components/ui/ActionIcon";
import { ButtonLabel, buttonClass } from "@/components/ui/Button";
import { iconButtonClass } from "@/components/ui/interaction";
import { Toast } from "@/components/ui/Toast";
import type { ShareCardsView } from "@/lib/share-cards";
import { SAVE_TOAST, type SaveState, saveState } from "@/lib/share-images";
import { FlipCard } from "./FlipCard";
import { AttributesCard, OverviewCard } from "./ShareCards";

// The "Share build" sheet (D-64, D-65): a bottom sheet on phone (Figma 319:904) and a centred dialog on tablet and
// desktop (319:2234 / 319:2952), opened by the Build page's Share build and by Submit a build's Share card (413:3113
// / 418:7348 / 418:8464). Both show the two story cards (316:888, 316:973) as one card that flips (FlipCard, D-117),
// which opens on its front. Copy link puts the build's address on the clipboard, closes the
// sheet and shows the "Link copied" toast (319:1674). "Share via…" (phone) and the share icon (tablet) open the
// device's own share menu with the link, shown only where the browser has one; desktop has none.
// "Save images" (D-111) turns the two cards on screen into 1080 × 1920 PNGs and shares them (phone) or downloads
// them (saveShareImages.ts, which loads html-to-image only on tap). While it works the button shows Figma's spinner
// and is busy (a second tap is ignored), and the cream toast says so; then it says where they went, or that they
// couldn't be made (493:9624 to 493:15977, D-114 (2)).
// A native <dialog> opened with showModal(): focus moves in, Escape closes it, the page behind is inert, and focus
// returns to the button that opened it. The sheet slides up and the dialog grows in, ease-out under 300 ms; with
// reduced motion both only fade. Save images' icon turns to a check that draws in when the images are saved, for
// 1.5 s, and the button shakes when they couldn't be made (Loading to success, #19); Copy link's icon crossfades to a
// check for 2 s (Copy button, #20). Both in ActionIcon.
const TOAST_MS = 4000;
export const COPIED = "Link copied. Paste it in any chat.";
// Whether the browser has a share menu: fixed for the page's life, and false in the static HTML.
const noSubscribe = () => () => {};
const hasShare = () => typeof navigator.share === "function";
// On the raised sheet: the raised hover fill and the shared press (D-121 (1), interaction.ts).
const ICON_BUTTON = `flex shrink-0 items-center justify-center rounded-sm ${iconButtonClass("raised")}`;
const SECONDARY = buttonClass("secondary", "", "large", "raised");

export interface ShareSheetHandle {
  /** Opens the sheet; focus goes back to `from` when it closes. */
  open: (from: HTMLElement | null) => void;
}

/** The page's own address, without a fragment or query: the Build page's link. */
export const pageUrl = async () => `${window.location.origin}${window.location.pathname}`;

// `linkUrl` gives the link to copy or share; when it throws (Submit's short link wasn't made), `linkFailed` shows as a
// red toast over the sheet.
export const ShareSheet = forwardRef<
  ShareSheetHandle,
  { title: string; share: ShareCardsView; linkUrl?: () => Promise<string | null>; linkFailed?: string }
>(function ShareSheet({ title, share, linkUrl = pageUrl, linkFailed }, ref) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(0);
  const [failed, setFailed] = useState(0);
  const [card, setCard] = useState<0 | 1>(0);
  const saving = useRef(false);
  const saveButton = useRef<HTMLButtonElement>(null);
  const [savedAt, setSavedAt] = useState(0);
  const saved = useFor(savedAt, 1500);
  const linkCopied = useFor(copied, 2000);
  const [save, setSave] = useState<{ state: SaveState; id: number } | null>(null);
  // Whether the sheet is open: a Save images result that ends after it was closed shows as a page toast instead.
  const [open, setOpen] = useState(false);
  const canShare = useSyncExternalStore(noSubscribe, hasShare, () => false);

  useImperativeHandle(ref, () => ({
    open: (from) => {
      opener.current = from;
      setCard(0);
      dialog.current?.showModal();
      setOpen(true);
    },
  }));

  // The outcome toasts leave by themselves after 4 s; "Making your images…" stays until it is done.
  useEffect(() => {
    if (!save || save.state === "saving") return;
    const t = setTimeout(() => setSave(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [save]);

  useEffect(() => {
    if (!failed) return;
    const t = setTimeout(() => setFailed(0), TOAST_MS);
    return () => clearTimeout(t);
  }, [failed]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(0), TOAST_MS);
    return () => clearTimeout(t);
  }, [copied]);

  const close = () => dialog.current?.close();

  /** The link, or null when there is none; a link that couldn't be made says so over the sheet. */
  const link = async () => {
    try {
      return await linkUrl();
    } catch (error) {
      console.warn("Share link wasn't made", error);
      if (linkFailed) setFailed(Date.now());
      return null;
    }
  };
  const copyLink = async () => {
    // The clipboard is missing outside a secure context and can be refused; the sheet then stays open, no toast.
    const url = await link();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      close();
      setCopied(Date.now());
    } catch {
      setCopied(0);
    }
  };
  const shareVia = async () => {
    const url = await link();
    if (!url) return;
    try {
      await navigator.share({ title, url });
    } catch {
      // Dismissed, or refused: nothing to undo.
    }
  };
  const saveImages = async () => {
    if (saving.current || !dialog.current) return;
    // Both sides of the flip card: the back is turned away, not display: none, so both are drawn.
    const cardNodes = Array.from(dialog.current.querySelectorAll<HTMLElement>("[data-share-card]")).filter((el) => el.getClientRects().length > 0);
    saving.current = true;
    // One id for the whole save: its toast turns from "Making your images…" into the result in place, not a stack.
    const id = Date.now();
    setSave({ state: "saving", id });
    try {
      const { saveShareImages } = await import("./saveShareImages");
      const done = saveState(await saveShareImages(cardNodes, share.files));
      setSave(done ? { state: done, id } : null);
      if (done) setSavedAt(Date.now());
    } catch (error) {
      console.error("Save images failed", error);
      setSave({ state: "failed", id });
      shake(saveButton);
    } finally {
      saving.current = false;
    }
  };

  // The Save images toast sits over the sheet while it is open, else on the page (the sheet was closed while saving).
  const inSheet = open ? save : null;
  const linkToast = open && !inSheet && failed !== 0 && linkFailed ? linkFailed : null;
  const onPage = !open && save && save.state !== "saving" ? save : null;

  return (
    <>
      <dialog
        ref={dialog}
        aria-labelledby="share-build-title"
        data-testid="share-dialog"
        onClose={() => {
          setOpen(false);
          // A finished result is not shown again when the sheet reopens; one still being made follows to the page.
          setSave((s) => (s?.state === "saving" ? s : null));
          setFailed(0);
          opener.current?.focus();
        }}
        // A click on the backdrop lands on the dialog itself (its content fills it); that closes it.
        onClick={(e) => e.target === dialog.current && close()}
        className="mt-auto mb-0 w-full max-w-none rounded-t-xl border-0 bg-bg-raised p-0 text-text-primary shadow-elevation-3 transition-[translate,scale,opacity] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop:bg-system-backdrop starting:open:translate-y-full tablet:m-auto tablet:w-[616px] tablet:max-w-[calc(100%-48px)] tablet:rounded-xl tablet:ease-out tablet:starting:open:translate-y-0 tablet:starting:open:scale-[0.96] tablet:starting:open:opacity-0 motion-reduce:starting:open:translate-y-0 motion-reduce:starting:open:scale-100 motion-reduce:starting:open:opacity-0"
      >
        <div className="flex flex-col gap-4 px-5 pt-3.5 pb-[calc(46px+env(safe-area-inset-bottom))] tablet:gap-5 tablet:px-7 tablet:pt-6 tablet:pb-7">
          <span aria-hidden="true" className="mx-auto h-1 w-10 rounded-[2px] bg-text-muted tablet:hidden" />
          <div className="flex items-center justify-between">
            {/* Figma sets the title at the top of the 52 px row from tablet (319:2703), centred in the 44 px row on phone. */}
            <h2 id="share-build-title" className="type-h3 text-text-primary tablet:self-start">
              Share build
            </h2>
            <button type="button" aria-label="Close" className={`${ICON_BUTTON} size-11 tablet:size-13`} onClick={close}>
              <span className="flex tablet:hidden">
                <Icon name="close" size={20} />
              </span>
              <span className="hidden tablet:flex">
                <Icon name="close" size={24} />
              </span>
            </button>
          </div>
          {/* One card that turns over (D-117): the Overview in front, the Attributes behind; the dots and "Tap to flip" under it. */}
          <div className="flex flex-col items-center gap-4">
            <FlipCard
              front={<OverviewCard card={share.overview} />}
              back={<AttributesCard card={share.attributes} link={share.overview.link} footer={share.overview.footer} />}
              side={card}
              onFlip={() => setCard((c) => (c === 0 ? 1 : 0))}
            />
            <div className="flex h-5 items-center gap-2" aria-hidden="true">
              {[0, 1].map((i) => (
                <span key={i} className={`rounded-full ${i === card ? "size-2 bg-text-primary" : "size-1.5 bg-text-muted"}`} />
              ))}
              <span className="type-caption text-text-secondary">Tap to flip</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 tablet:flex-row tablet:justify-center tablet:gap-3">
            <div className="flex gap-2 tablet:contents">
              <button
                ref={saveButton}
                type="button"
                aria-busy={save?.state === "saving" || undefined}
                className={`${SECONDARY} flex-1 tablet:flex-none`}
                onClick={saveImages}
              >
                <ActionIcon icon="download" state={save?.state === "saving" ? "busy" : saved ? "done" : "idle"} busy={<Spinner />} draw />
                Save images
              </button>
              <button type="button" className={`${SECONDARY} flex-1 tablet:flex-none`} onClick={copyLink}>
                <ActionIcon icon="copy" state={linkCopied ? "done" : "idle"} />
                Copy link
              </button>
            </div>
            {canShare && (
              <>
                <button type="button" className={`${SECONDARY} tablet:hidden`} onClick={shareVia}>
                  <ButtonLabel icon="share" iconSide="left">
                    Share via…
                  </ButtonLabel>
                </button>
                <button
                  type="button"
                  aria-label="Share via…"
                  className={`${ICON_BUTTON} hidden size-13 border-[1.5px] border-border-strong tablet:flex desktop:hidden`}
                  onClick={shareVia}
                >
                  <Icon name="share" size={24} />
                </button>
              </>
            )}
          </div>
          <p className="type-caption text-text-muted tablet:text-center">
            <span className="tablet:hidden">Saves both cards to your photos</span>
            <span className="hidden tablet:inline desktop:hidden">Saves both cards to your photos. The last button opens your device&apos;s share menu.</span>
            <span className="hidden desktop:inline">Saves both cards as images. Copy link to paste the build page anywhere.</span>
          </p>
        </div>
        {/* Always mounted, so the live region announces each message (see Toast). */}
        <Toast
          id={inSheet ? inSheet.id : failed}
          message={inSheet ? SAVE_TOAST[inSheet.state].message : linkToast}
          tone={inSheet ? SAVE_TOAST[inSheet.state].tone : linkToast ? "danger" : undefined}
          icon={inSheet ? SAVE_TOAST[inSheet.state].icon : undefined}
          placement="dialog"
        />
      </dialog>
      {/* One page region for "Link copied" and a Save images result that ended after the sheet closed. */}
      <Toast
        id={onPage ? onPage.id : copied}
        message={onPage ? SAVE_TOAST[onPage.state].message : copied !== 0 ? COPIED : null}
        tone={onPage ? SAVE_TOAST[onPage.state].tone : "success"}
        icon={onPage ? SAVE_TOAST[onPage.state].icon : undefined}
      />
    </>
  );
});

/** Figma's button spinner (199:351): a three-quarter ring, 22.5 px in a 20 px box, turning; slower with reduced motion. */
export function Spinner() {
  const style = { "--icon": "url(/icons/spinner.svg)" } as CSSProperties;
  return (
    <span data-testid="save-spinner" aria-hidden="true" className="relative size-5 shrink-0">
      <span
        className="icon-mask absolute inset-[-6.25%] animate-[spinner-turn_0.8s_linear_infinite] motion-reduce:animate-[spinner-turn_2.4s_linear_infinite]"
        style={style}
      />
    </span>
  );
}
