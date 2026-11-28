"use client";

import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { COPIED, ShareSheet, type ShareSheetHandle } from "@/components/builds/ShareSheet";
import { Toast } from "@/components/ui/Toast";
import type { ArchetypeFile, PositionGroup } from "@/lib/content/types";
import { SITE_DOMAIN } from "@/lib/site";
import { submitShareCards, toSubmission } from "@/lib/submit/document";
import { type SubmitDraft, titleOf } from "@/lib/submit/editor";
import { makeShareLink, sendForListing, type StandIn, standInFrom } from "@/lib/submit/send";
import { reducedMotion } from "@/lib/motion";
import { SUPABASE } from "@/lib/supabase/client";
import { ActionsBar, StepFrom } from "./controls";
import { liftIntoSheet } from "./liftCard";
import { SentForListing } from "./SentForListing";
import { hasAttributeError, StepAttributes } from "./StepAttributes";
import { StepNameShare } from "./StepNameShare";
import { StepPlayStyles } from "./StepPlayStyles";
import { StepStart } from "./StepStart";

// Submit a build (D-85 to D-90, D-99, D-100): four steps and "Sent for listing", all on /submit. On a phone the bottom
// nav stays on every step; steps 1 to 3 dock their actions bar just above it (D-125 (2), ActionsBar). On the preview,
// ?state= opens each state Figma draws (start, attributes, attributes-error, playstyles, name, share, sent,
// send-failed), and ?send=fail / ?share=fail make the stand-in fail (src/lib/submit/send.ts).
type Step = 1 | 2 | 3 | 4 | "sent";
const FAILED = "Couldn't send. Check your connection and try again.";
const TOAST_MS = 4000;
// Loading to success (#19): after a send goes through, the button's check draws in (--dur-base) and holds a beat before
// "Sent for listing" replaces the step.
const SENT_HOLD_MS = 450;
const today = () => new Date().toISOString().slice(0, 10);

// `preview`: the build shows drafts (SHOW_DRAFTS is read on the server; the browser bundle doesn't have it).
export function SubmitEditor({ file, initial, preview }: { file: ArchetypeFile; initial: SubmitDraft; preview: boolean }) {
  const [step, setStep] = useState<Step>(1);
  // The step left by the last move, for the step line's roll (#9); a move from the keyboard doesn't roll.
  const [from, setFrom] = useState<{ step: number; still: boolean } | null>(null);
  const [draft, setDraft] = useState(initial);
  const [group, setGroup] = useState<PositionGroup>(() => file.archetypes.find((a) => a.id === initial.archetype)?.positionGroup ?? "attacker");
  const [active, setActive] = useState("PAC");
  const [open, setOpen] = useState<0 | 1 | null>(null);
  const [picture, setPicture] = useState<string | null>(null);
  const [link, setLink] = useState<{ key: string; id: string } | null>(null);
  const [send, setSend] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [toast, setToast] = useState<{ id: number; message: string; tone: "success" | "danger" } | null>(null);
  const standIn = useRef<{ send: StandIn | null; share: StandIn | null }>({ send: null, share: null });
  const sheet = useRef<ShareSheetHandle>(null);
  const main = useRef<HTMLElement>(null);
  // The short link being made for a version of the build, so a second tap doesn't store it twice.
  const making = useRef<{ key: string; promise: Promise<string> } | null>(null);
  // The picture's object URL, revoked when it is swapped or the editor goes away.
  const pictureUrl = useRef<string | null>(null);
  // The hold between a send going through and "Sent for listing", cleared if the editor goes away first.
  const sentHold = useRef<ReturnType<typeof setTimeout> | null>(null);

  const archetype = file.archetypes.find((a) => a.id === draft.archetype) ?? file.archetypes[0]!;
  const submission = useMemo(() => toSubmission(draft, file, today()), [draft, file]);
  const key = useMemo(() => JSON.stringify(submission.document), [submission]);
  const shareId = link?.key === key ? link.id : null;
  const cards = useMemo(() => submitShareCards(draft, file, { link: shareId, picture }), [draft, file, shareId, picture]);
  const change = (next: Partial<SubmitDraft> | ((d: SubmitDraft) => SubmitDraft)) =>
    setDraft((d) => (typeof next === "function" ? next(d) : { ...d, ...next }));

  /** One of Figma's states, opened from the address on the preview (?state=). */
  const openState = (state: string | null) => {
    if (state === "attributes" || state === "attributes-error") {
      setStep(2);
      setActive("SHO");
      if (state === "attributes-error") change((d) => ({ ...d, attributes: d.attributes.map((a) => (a.name === "Finishing" ? { ...a, value: 100 } : a)) }));
      else
        requestAnimationFrame(() => {
          // Figma 399:3121 draws Finishing being typed in: focused, the caret after "92".
          const input = document.getElementById("attr-finishing") as HTMLInputElement | null;
          input?.focus({ preventScroll: true });
          input?.setSelectionRange(input.value.length, input.value.length);
        });
    } else if (state === "playstyles") {
      setStep(3);
      setOpen(1);
    } else if (state === "name" || state === "share" || state === "send-failed") {
      setStep(4);
      if (state === "send-failed") setSend("failed");
      if (state === "share") requestAnimationFrame(() => sheet.current?.open(null));
    } else if (state === "sent") setStep("sent");
  };
  const openStateOnce = useRef(openState);

  // The preview's stand-in and its sample states, read once from the address.
  useEffect(() => {
    const where = { drafts: preview, config: SUPABASE, search: window.location.search };
    standIn.current = { send: standInFrom(where, "send"), share: standInFrom(where, "share") };
    if (preview) openStateOnce.current(new URLSearchParams(window.location.search).get("state"));
  }, [preview]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  // A new step starts at the top, with focus on its heading for screen readers. `e` is the tap or click that moved it
  // (none, or detail 0 for Enter and Space: the step line then changes without its roll).
  const go = (next: Step, e?: MouseEvent) => {
    setFrom(typeof step === "number" && typeof next === "number" ? { step, still: !e || e.detail === 0 } : null);
    setStep(next);
    setOpen(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      main.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    });
  };

  /** The build's short link, made once per version of the build (D-99 (2)); throws when it can't be made. */
  const makeLink = async (): Promise<string> => {
    if (submission.problems.length > 0) throw new Error(submission.problems.map((p) => `${p.path}: ${p.message}`).join("; "));
    if (shareId) return `https://${SITE_DOMAIN}/b/${shareId}`;
    if (making.current?.key !== key) {
      const promise = makeShareLink(submission.document, { config: SUPABASE, standIn: standIn.current.share }).then((id) => {
        setLink({ key, id });
        return id;
      });
      // A failed try is forgotten, so the next tap tries again.
      promise.catch(() => {
        if (making.current?.promise === promise) making.current = null;
      });
      making.current = { key, promise };
    }
    return `https://${SITE_DOMAIN}/b/${await making.current.promise}`;
  };
  /** The same, for the page's Copy link: null, with the red toast, when it can't be made. */
  const resolveLink = async (): Promise<string | null> => {
    try {
      return await makeLink();
    } catch (error) {
      console.warn("Share link wasn't made", error);
      setToast({ id: Date.now(), message: FAILED, tone: "danger" });
      return null;
    }
  };
  // The link starts being made as the sheet opens; a failure shows only when the sheet asks for it (its own toast,
  // since a page toast sits under the open sheet).
  const share = (from: HTMLElement | null) => {
    sheet.current?.open(from);
    makeLink().catch((error) => console.warn("Share link wasn't made", error));
  };
  // Fan cards (#2): Your card opens the sheet like Share card, and a pointer's tap lifts the card into it.
  // The sheet's reset to the card's front (setCard(0)) is committed first, so the lift measures and copies that card.
  const lift = (button: HTMLElement, card: HTMLElement, e: MouseEvent) => {
    flushSync(() => share(button));
    if (e.detail !== 0 && !reducedMotion()) liftIntoSheet(card);
  };
  const copy = async (): Promise<boolean> => {
    const url = await resolveLink();
    if (!url) return false;
    try {
      await navigator.clipboard.writeText(url);
      setToast({ id: Date.now(), message: COPIED, tone: "success" });
      return true;
    } catch {
      // The clipboard was refused: nothing changes.
      return false;
    }
  };
  const sendIt = async (): Promise<boolean> => {
    if (send === "sending" || send === "sent") return true;
    setSend("sending");
    try {
      if (submission.problems.length > 0) throw new Error(submission.problems.map((p) => `${p.path}: ${p.message}`).join("; "));
      await sendForListing(submission.document, { config: SUPABASE, standIn: standIn.current.send });
      setSend("sent");
      sentHold.current = setTimeout(
        () => {
          sentHold.current = null;
          setSend("idle");
          go("sent");
        },
        reducedMotion() ? 150 : SENT_HOLD_MS,
      );
      return true;
    } catch (error) {
      console.warn("Send for listing didn't go through", error);
      setSend("failed");
      return false;
    }
  };
  const setPictureFile = (f: File | null) => {
    // The old picture's address is freed after its fade out (File drop, #27: Remove fades it back to the mannequin).
    const old = pictureUrl.current;
    if (old) setTimeout(() => URL.revokeObjectURL(old), 1000);
    pictureUrl.current = f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
    setPicture(pictureUrl.current);
  };
  useEffect(
    () => () => {
      if (pictureUrl.current) URL.revokeObjectURL(pictureUrl.current);
      pictureUrl.current = null;
      if (sentHold.current) clearTimeout(sentHold.current);
    },
    [],
  );
  const another = () => {
    setDraft(initial);
    setGroup(file.archetypes.find((a) => a.id === initial.archetype)?.positionGroup ?? "attacker");
    setPictureFile(null);
    setLink(null);
    making.current = null;
    setSend("idle");
    go(1);
  };

  const wide = step === 2 || step === 3;
  return (
    <main ref={main} data-testid="submit" data-step={step} className="flex flex-col">
      <div
        className={`flex flex-col px-5 tablet:px-10 desktop:mx-auto desktop:w-full desktop:max-w-(--layout-content-max) desktop:px-0 ${
          step === "sent"
            ? "pt-14 pb-12 tablet:pt-18 tablet:pb-30"
            : wide
              ? `pb-6 tablet:pt-16 ${step === 3 ? "tablet:pb-6 desktop:pb-0" : "tablet:pb-0"}`
              : step === 4
                ? "pt-10 pb-8 tablet:pt-16 tablet:pb-30"
                : "pt-10 pb-8 tablet:pt-16 tablet:pb-0"
        }`}
      >
        <StepFrom.Provider value={from}>
          {step === 1 && <StepStart file={file} draft={draft} group={group} onGroup={setGroup} onChange={change} />}
          {step === 2 && <StepAttributes draft={draft} archetype={archetype} active={active} onActive={setActive} onChange={change} />}
          {step === 3 && <StepPlayStyles draft={draft} archetype={archetype} open={open} onOpen={setOpen} onChange={change} />}
          {step === 4 && (
            <StepNameShare
              draft={draft}
              cards={cards}
              picture={picture}
              sending={send === "sending"}
              sent={send === "sent"}
              failed={send === "failed"}
              onChange={change}
              onPicture={setPictureFile}
              onShare={share}
              onLift={lift}
              onCopy={copy}
              onSend={sendIt}
            />
          )}
          {step === "sent" && <SentForListing onShare={share} onAnother={another} />}
        </StepFrom.Provider>
      </div>
      {typeof step === "number" && step < 4 && (
        // Sticky on the wrapper, a child of the whole step (main), so it can stick: on the bar itself, inside a box
        // only as tall as the bar, it never did.
        <div className="sticky bottom-0 z-10 tablet:static tablet:px-10 tablet:pb-30 desktop:mx-auto desktop:w-full desktop:max-w-(--layout-content-max) desktop:px-0">
          {step === 1 && <ActionsBar next={{ label: "Attributes", onPress: (e) => go(2, e) }} nextWidth="tablet:w-70 desktop:w-80" gap="tablet:pt-8 desktop:pt-10" />}
          {step === 2 && <ActionsBar back={(e) => go(1, e)} next={{ label: "PlayStyles", onPress: (e) => go(3, e), disabled: hasAttributeError(draft) }} />}
          {step === 3 && <ActionsBar back={(e) => go(2, e)} next={{ label: "Review", onPress: (e) => go(4, e) }} />}
        </div>
      )}
      <ShareSheet ref={sheet} title={titleOf(draft, archetype)} share={cards} linkUrl={makeLink} linkFailed={FAILED} />
      <Toast id={toast?.id} message={toast?.message ?? null} tone={toast?.tone} />
    </main>
  );
}
