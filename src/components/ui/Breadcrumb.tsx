import Link from "next/link";
import { Fragment } from "react";
import { QUIET_LINK } from "./interaction";

// Figma "Navigation - Breadcrumb" (build page, 298:3641): caption links and "/" in text/secondary,
// the current page last in text/primary, 8 px apart. Each link has a 44 px tap area (D-102 (4)). `muted` draws the
// current page in text/secondary, as the shared build's "Builds / Shared build" does (439:8850).
// The face page draws its own (427:8652): every part text/muted, 6 px apart (tone="muted"). A link turns
// text/primary on hover (D-121 (1)).
export function Breadcrumb({
  links,
  current,
  muted = false,
  tone = "default",
}: {
  links: { href: string; label: string }[];
  current: string;
  muted?: boolean;
  tone?: "default" | "muted";
}) {
  const quiet = tone === "muted";
  const part = quiet ? "text-text-muted" : "text-text-secondary";
  const here = quiet ? "text-text-muted" : muted ? "text-text-secondary" : "text-text-primary";
  return (
    <nav aria-label="Breadcrumb">
      <ol className={`type-caption flex flex-wrap ${quiet ? "gap-x-1.5" : "gap-x-2"}`}>
        {links.map((l) => (
          <Fragment key={l.href}>
            <li>
              <Link href={l.href} className={`tap-target ${part} ${QUIET_LINK}`}>
                {l.label}
              </Link>
            </li>
            <li aria-hidden="true" className={part}>
              /
            </li>
          </Fragment>
        ))}
        <li aria-current="page" className={`min-w-0 break-words ${here}`}>
          {current}
        </li>
      </ol>
    </nav>
  );
}
