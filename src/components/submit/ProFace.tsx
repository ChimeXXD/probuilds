"use client";

import { type DragEvent, useRef, useState } from "react";
import { ButtonLabel, buttonClass } from "@/components/ui/Button";

// "Your Pro's face" (Figma 401:3616, picture added 412:2989; D-89 (4)): a screenshot of the player's Pro that stays in
// this browser and goes on their card only. Add a picture opens the file picker (phone and computer alike).
// File drop (motion-bookmarks.pdf #27). Purpose: feedback that the slot will take the picture, then a picture that
// arrives instead of appearing.
// - On a computer a picture can also be dropped on the card. While a file is dragged over it, the card lifts 4 px
//   (translate) with a soft shadow layer fading in under it and a tint layer over it (opacity only), --dur-fast,
//   ease-out; leaving or dropping settles it back. Reduced motion keeps the tint and the shadow, without the lift.
// - The picture fades in over the mannequin, at its final crop, --dur-base ease-out; Remove fades it back out to the
//   mannequin (the last picture stays drawn under the fade; the editor frees its address a moment later).
export function ProFace({ picture, onPicture }: { picture: string | null; onPicture: (file: File | null) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  // The last picture shown, kept while it fades out after Remove, then dropped.
  const [shown, setShown] = useState(picture);
  if (picture && picture !== shown) setShown(picture);
  const pick = () => fileInput.current?.click();
  const hasFile = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");
  // dragenter and dragleave also fire for each child the file crosses, and Safari leaves dragleave's relatedTarget
  // null, so a count of entries (not relatedTarget) says when the file has really left the card.
  const depth = useRef(0);
  const dragOver = (e: DragEvent<HTMLElement>) => {
    if (!hasFile(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setOver(true);
  };
  const enter = (e: DragEvent<HTMLElement>) => {
    if (hasFile(e)) depth.current += 1;
    dragOver(e);
  };
  const leave = () => {
    depth.current = Math.max(depth.current - 1, 0);
    if (depth.current === 0) setOver(false);
  };
  const drop = (e: DragEvent<HTMLElement>) => {
    depth.current = 0;
    setOver(false);
    if (!hasFile(e)) return;
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (file) onPicture(file);
  };
  return (
    <section
      aria-labelledby="pro-face"
      data-testid="pro-face"
      data-over={over || undefined}
      onDragEnter={enter}
      onDragOver={dragOver}
      onDragLeave={leave}
      onDrop={drop}
      className={`relative isolate mt-7 flex flex-col gap-3 rounded-lg bg-bg-surface p-4 transition-transform duration-(--dur-fast) ease-(--ease-out) motion-reduce:translate-y-0 ${over ? "-translate-y-1" : ""}`}
    >
      {/* The lift's shadow and the tint: fixed layers that only fade (no animated box-shadow). */}
      <span
        aria-hidden="true"
        data-part="drop-shadow"
        className={`pointer-events-none absolute inset-0 -z-10 rounded-lg shadow-elevation-2 transition-opacity duration-(--dur-fast) ease-(--ease-out) ${over ? "" : "opacity-0"}`}
      />
      <span
        aria-hidden="true"
        data-part="drop-tint"
        className={`pointer-events-none absolute inset-0 rounded-lg bg-action-selected ring-1 ring-border-strong ring-inset transition-opacity duration-(--dur-fast) ease-(--ease-out) ${over ? "" : "opacity-0"}`}
      />
      <h2 id="pro-face" className="type-label relative text-text-primary">
        Your Pro&apos;s face
      </h2>
      <div className="relative flex items-center gap-3.5">
        <span className="relative grid size-18 shrink-0 overflow-hidden rounded-md bg-bg-raised">
          {/* eslint-disable-next-line @next/next/no-img-element -- static art, the mannequin under the picture */}
          <img src="/art/probuilds-face.svg" alt="" className="col-start-1 row-start-1 size-18 object-cover" />
          {shown && (
            // eslint-disable-next-line @next/next/no-img-element -- the player's own picture, from this browser only
            <img
              key={shown}
              src={shown}
              alt={picture ? "Your Pro's face" : ""}
              aria-hidden={picture ? undefined : true}
              data-part="picture"
              // Once Remove's fade has ended the picture leaves the page, so it never points at a freed address.
              onTransitionEnd={(e) => {
                if (!picture && e.propertyName === "opacity") setShown(null);
              }}
              className={`col-start-1 row-start-1 size-18 object-cover transition-opacity duration-(--dur-base) ease-(--ease-out) starting:opacity-0 ${picture ? "" : "opacity-0"}`}
            />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-label text-text-primary">{picture ? "Your picture" : "No picture yet"}</p>
          <p className="type-caption text-text-secondary">{picture ? "On your card. Swap it any time." : "Your card uses the ProBuilds face until you add one"}</p>
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="face-file"
        onChange={(e) => {
          onPicture(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {picture ? (
        <div className="relative flex gap-2.5">
          <button type="button" className={buttonClass("secondary", "flex-1", "medium", "surface")} onClick={pick}>
            Change
          </button>
          <button type="button" className={buttonClass("secondary", "flex-1 border-transparent", "medium", "surface")} onClick={() => onPicture(null)}>
            Remove
          </button>
        </div>
      ) : (
        <button type="button" data-testid="face-upload" className={buttonClass("secondary", "relative w-full", "medium", "surface")} onClick={pick}>
          <ButtonLabel icon="plus" iconSide="left">
            Add a picture
          </ButtonLabel>
        </button>
      )}
      <p className="type-caption relative text-text-muted">A screenshot of your Pro&apos;s face from the game. It goes on your card only, never on the site.</p>
    </section>
  );
}
