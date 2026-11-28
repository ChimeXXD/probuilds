"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { seasonParts } from "@/lib/content/version";
import { PRESS, QUIET_LINK, STATE_TRANSITION } from "@/components/ui/interaction";
import { isCurrent, SECTIONS } from "@/lib/nav";
import { Logo } from "./Logo";
import { ThemeSwitch } from "./ThemeSwitch";
import { TopSearch } from "./TopSearch";

// Figma Top bar (205:407) with the theme switch (option A, 499:11455, D-114). Phone: logo, season, theme, search,
// 60 px tall. Tablet and desktop: the four sections join, 72 px tall, border included as in Figma; the content is
// 1200 px wide on desktop. The season chip links to the changelog.
// Figma's frames are 393 and 834 wide. Narrower screens lack room for everything at full size, so: under 390 px the
// chip shows "Season 2" (the game's name stays for screen readers), and from 744 to 833 px (iPad mini) the gaps
// tighten (nav 18 px, bar 12 px), keeping every control at 44 px.
// Hover (D-121 (1)): a section link turns text/primary over the page's faint fill (8 px each side, taken back by a
// negative margin so nothing moves); the season chip's border, fill and text step up; the logo dims a little.
const season = seasonParts();
export function TopBar() {
  const pathname = usePathname();
  return (
    <header data-testid="top-bar" className="h-[60px] border-b border-system-divider bg-bg-page tablet:h-[72px]">
      <div className="mx-auto flex h-full items-center gap-2 px-5 tablet:gap-3 tablet:px-10 min-[834px]:gap-4 desktop:max-w-(--layout-content-max) desktop:px-0">
        <Link href="/" aria-label="ProBuilds home" className={`flex min-h-11 shrink-0 items-center hover:opacity-80 ${STATE_TRANSITION} ${PRESS}`}>
          <Logo size="header" />
        </Link>
        {/* No spacer elements: each would add two gaps, which 360 px phones and the 744 px iPad mini lack. The nav
            centres itself (mx-auto) and the actions push right on phone (ml-auto). */}
        <nav aria-label="Sections" className="hidden gap-[18px] tablet:mx-auto tablet:flex min-[834px]:gap-8">
          {SECTIONS.filter((s) => s.href !== "/").map((s) => {
            const current = isCurrent(s.href, pathname);
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={current ? "page" : undefined}
                className={`type-label tap-target -mx-2 rounded-sm px-2 py-3 hover:bg-hover-fill-page ${QUIET_LINK} ${current ? "text-text-primary" : "text-text-secondary"}`}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
        {/* Figma 499:11455 / 499:11705 (D-114): phone sets the chip, the theme switch and search side by side; from
            tablet the switch and search are a pair, 4 px apart, 16 px after the chip. */}
        <div className="ml-auto flex shrink-0 items-center tablet:ml-0 tablet:gap-4">
          <Link
            href="/changelog"
            data-testid="season-chip"
            className={`type-caption tap-target shrink-0 rounded-full border border-border-strong px-3 py-1.5 text-text-secondary hover:border-input-border-hovered hover:bg-hover-fill-page hover:text-text-primary ${STATE_TRANSITION} ${PRESS}`}
          >
            <span className="max-[390px]:sr-only">{season.game} · </span>
            {season.season}
          </Link>
          <div className="flex items-center tablet:gap-1">
            <ThemeSwitch />
            <TopSearch />
          </div>
        </div>
      </div>
    </header>
  );
}
