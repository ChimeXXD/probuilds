"use client";

import { useEffect, useState } from "react";
import { ActionIcon, useFor } from "@/components/ui/ActionIcon";
import { buttonClass } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

const TOAST_MS = 4000;
// TODO(Chime): no Figma frame shows Takedown's copied state; this follows the design's "Link copied" toast.
const COPIED = "Email copied";

/** Copies the takedown address and confirms it with a toast; its icon turns to a check for 2 s (Copy button, #20). */
export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(0);
  const checked = useFor(copied, 2000);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(0), TOAST_MS);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <>
      <button
        type="button"
        className={buttonClass("secondary", "flex-1", "large", "surface")}
        onClick={async () => {
          // The clipboard is missing outside a secure context and can be refused; the address stays on screen
          // and the Email button still works, so a failed copy just shows no toast.
          try {
            await navigator.clipboard.writeText(email);
            setCopied(Date.now());
          } catch {
            setCopied(0);
          }
        }}
      >
        <ActionIcon icon="copy" state={checked ? "done" : "idle"} />
        Copy
      </button>
      <Toast id={copied} message={copied !== 0 ? COPIED : null} />
    </>
  );
}
