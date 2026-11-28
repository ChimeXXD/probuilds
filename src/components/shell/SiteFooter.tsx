import Link from "next/link";
import { QUIET_LINK } from "@/components/ui/interaction";
import { FOOTER_LINKS } from "@/lib/nav";
import { NOTICE } from "@/lib/site";
import { Logo } from "./Logo";

// Figma Footer notice (205:434): the small logo, four links and the notice, which is on every page (CLAUDE.md
// rule 3). On phone a 96 px space (plus the home indicator's inset, which the bottom nav also sits above)
// follows it so the floating bottom nav never covers the notice. A link turns text/primary on hover (D-121 (1)).
export function SiteFooter() {
  return (
    <>
      <footer className="border-t border-system-divider bg-bg-page">
        <div className="mx-auto flex flex-col gap-4 p-5 tablet:px-10 tablet:py-12 desktop:max-w-(--layout-content-max) desktop:px-0">
          <Logo size="footer" />
          {/* Wraps on a 320 px phone, where the four links ran 17 px into the right gutter; rows 24 px apart keep the
              44 px tap areas from overlapping (D-125 (2)). */}
          <nav aria-label="Site" className="flex flex-wrap gap-6">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`type-label tap-target text-text-secondary ${QUIET_LINK}`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <p data-testid="site-notice" className="type-caption text-text-muted">
            {NOTICE}
          </p>
        </div>
      </footer>
      <div aria-hidden="true" data-testid="bottom-nav-space" className="h-nav-clear tablet:hidden" />
    </>
  );
}
