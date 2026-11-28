import type { Metadata, Viewport } from "next";
import { type ReactNode, ViewTransition } from "react";
import { BottomNav } from "@/components/shell/BottomNav";
import { PageMotion } from "@/components/shell/PageMotion";
import { PreviewBar } from "@/components/shell/PreviewBar";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { TopBar } from "@/components/shell/TopBar";
import { SHOW_DRAFTS } from "@/lib/drafts";
import { SITE_NAME } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";
import { barlow, barlowCondensed } from "./fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  // The preview site (drafts) stays out of search results.
  ...(SHOW_DRAFTS ? { robots: { index: false, follow: false } } : {}),
};

// viewport-fit=cover lets the bottom nav sit above the iPhone's home indicator (env(safe-area-inset-bottom)).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The inline script sets data-theme="light" before paint when the user picked light (D-112, D-114), so React's
    // render of <html> can differ from what it finds: suppressHydrationWarning covers that one attribute.
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`} suppressHydrationWarning>
      <head>
        {/* Our own constant, no user input. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-bg-page text-text-primary">
        <TopBar />
        <PreviewBar />
        {/* Each page is one View Transition group, so a page change eases in (PageMotion, globals.css). */}
        <ViewTransition name="page">
          <div data-testid="page" className="flex-1">
            {children}
          </div>
        </ViewTransition>
        <PageMotion />
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
