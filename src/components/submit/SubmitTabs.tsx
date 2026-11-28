"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { chipClass, FilterChipGhost } from "@/components/ui/FilterChip";
import { PillRow } from "@/components/ui/PillRow";
import { isCurrent } from "@/lib/nav";
import { SUBMIT_TABS } from "@/lib/submit/tabs";

// Submit's two flows as two tabs at the top (D-121 (5)): "Submit a build" (/submit) and "Request a face"
// (/submit/request). They are links, one page each, in the Chip look (Figma Chip 200:337, Size=medium) with the site's
// one sliding pill (PillRow, motion-bookmarks #6), which starts on the tap, as the bottom nav's does, rather than when
// the next page arrives. Between the two tabs the bar holds still while the page under it slides (its own
// View Transition group, page-tabs, in globals.css). Each flow's own content is unchanged below it.
// TODO(Chime): Figma draws no tab bar yet; its spacing (16 px above, 24 px from tablet) is ours, to mirror.
export function SubmitTabs() {
  const pathname = usePathname();
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  if (tapped && tapped.from !== pathname) setTapped(null);
  const at = (href: string) => (tapped ? tapped.href === href : current(href, pathname));
  const selected = SUBMIT_TABS.findIndex((t) => at(t.href));
  return (
    <nav
      aria-label="Submit"
      data-testid="submit-tabs"
      className="px-5 pt-4 [view-transition-name:page-tabs] tablet:px-10 tablet:pt-6 desktop:mx-auto desktop:w-full desktop:max-w-(--layout-content-max) desktop:px-0"
    >
      <PillRow
        selected={selected === -1 ? null : selected}
        className="flex flex-wrap gap-2"
        chips={(pill) =>
          SUBMIT_TABS.map((t) => {
            const here = current(t.href, pathname);
            return (
              <Link
                key={t.href}
                href={t.href}
                data-testid="submit-tab"
                aria-current={here ? "page" : undefined}
                onClick={(e) => {
                  // A new tab or window (or a link Next won't follow) leaves this page, and its pill, where they are.
                  if (here || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  setTapped({ href: t.href, from: pathname });
                }}
                className={chipClass(at(t.href) && !pill)}
              >
                {t.label}
              </Link>
            );
          })
        }
        ghosts={SUBMIT_TABS.map((t) => (
          <FilterChipGhost key={t.href} label={t.label} />
        ))}
      />
    </nav>
  );
}

/** "/submit" is current only on itself; "/submit/request" on itself. */
function current(href: string, pathname: string) {
  return href === "/submit" ? pathname.replace(/\/+$/, "") === "/submit" : isCurrent(href, pathname);
}
