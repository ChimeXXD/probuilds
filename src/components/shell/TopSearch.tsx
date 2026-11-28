"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { iconButtonClass } from "@/components/ui/interaction";
import { type SearchIndex, searchResults } from "@/lib/search";
import { Icon } from "./Icon";
import { panelItems, SearchPanel } from "./SearchPanel";

// The top bar's search. Phone: the 44 px search link to the Search page, as before.
// Command button (motion-bookmarks #25), tablet and desktop: the search icon widens into a field in place. The field
// is always full size (320 px, 360 on desktop) and is revealed by clip-path from a 44 px circle round the icon to the
// whole box (--dur-base, --ease-out), so its text never reflows. The icon stays where it was, at the field's right end. Enter goes to the Search page with what was typed;
// Esc closes it at once (nothing animates on keyboard input); a click elsewhere closes it, quicker than it opened.
// Reduced motion: the field fades in, nothing widens.
// Command palette (#26), desktop: results open under the field (SearchPanel); ↑ ↓ move the highlight, Enter opens it.
// TODO(Chime): no frame draws the widened field; it is the Design System's Search field, for your OK.
const OPEN = "inset(0 round 8px)";
const SHUT = "inset(2px 0 2px calc(100% - 44px) round 22px)";
// Opening shows it at once (a focus needs it visible on the same tap) and widens it, opaque from the first frame so
// nothing behind it shows through; closing keeps it drawn while it narrows and fades, then hides it (visibility as a
// discrete transition), quicker than it opened. Reduced motion: opacity only, both ways.
const OPENING = "visible opacity-100 transition-[clip-path] duration-(--dur-base) motion-reduce:transition-opacity";
const CLOSING =
  "invisible opacity-0 transition-[clip-path,opacity,visibility] transition-discrete duration-(--dur-fast) motion-reduce:transition-[opacity,visibility]";
const desktopQuery = "(min-width: 1280px)";
const subscribe = (on: () => void) => {
  const m = matchMedia(desktopQuery);
  m.addEventListener("change", on);
  return () => m.removeEventListener("change", on);
};

export function TopSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [active, setActive] = useState({ at: 0, glide: false });
  const [page, setPage] = useState(pathname);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const loading = useRef(false);
  const desktop = useSyncExternalStore(subscribe, () => matchMedia(desktopQuery).matches, () => false);

  // Another page: the field closes and forgets.
  if (page !== pathname) {
    setPage(pathname);
    setInstant(true);
    setOpen(false);
    setQuery("");
  }

  const close = (at: "once" | "eased") => {
    setInstant(at === "once");
    setOpen(false);
  };

  // A click or tap outside closes it.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && close("eased");
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const groups = open && desktop && index ? panelItems(searchResults(index, query)) : null;
  const items = groups ? [...groups.faces, ...groups.builds] : [];
  const showPanel = open && groups !== null && query.trim() !== "";
  const listed = showPanel && items.length > 0;

  const openIt = () => {
    // Render it open and focus it inside the tap: iOS and iPadOS raise the keyboard only for a focus made there.
    flushSync(() => {
      setInstant(false);
      setOpen(true);
    });
    input.current?.focus();
  };

  // The panel's index loads the first time the field opens on a computer (or the window widens to one while open).
  useEffect(() => {
    if (!open || !desktop || loading.current) return;
    loading.current = true;
    fetch("/search-index.json")
      .then((r) => (r.ok ? (r.json() as Promise<SearchIndex>) : null))
      .then((data) => data && setIndex(data))
      .catch(() => {
        // No index (the live site has no Search page yet): Enter still goes to the Search page.
      });
  }, [open, desktop]);

  const go = (href: string) => {
    close("once");
    // The Search page reads ?q= when it loads, so a new search from it loads it again.
    if (pathname.replace(/\/+$/, "") === "/search" && href.startsWith("/search?")) window.location.assign(href);
    else router.push(href);
  };

  const style = { clipPath: open ? OPEN : SHUT, ...(instant ? { transitionDuration: "0ms" } : {}) } as CSSProperties;
  return (
    <>
      <Link href="/search" aria-label="Search" className={`flex size-11 shrink-0 items-center justify-center rounded-sm text-text-primary tablet:hidden ${iconButtonClass("page")}`}>
        <Icon name="search" size={20} />
      </Link>
      {/* Keys are read here, not on the form, so Esc and the arrows still work once focus is in the panel. */}
      <div
        ref={box}
        className="relative hidden tablet:block"
        onKeyDown={(e) => {
          if (open && e.key === "Escape") {
            e.preventDefault();
            close("once");
            trigger.current?.focus();
          } else if (listed && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActive((a) => ({ at: (a.at + step + items.length) % items.length, glide: false }));
          }
        }}
      >
        <button
          ref={trigger}
          type="button"
          aria-label="Search"
          aria-expanded={open}
          aria-controls="top-search"
          onClick={openIt}
          className={`flex size-11 shrink-0 items-center justify-center rounded-sm text-text-primary ${iconButtonClass("page")}`}
        >
          <Icon name="search" size={20} />
        </button>
        <form
          id="top-search"
          role="search"
          data-testid="top-search"
          inert={!open}
          style={style}
          onSubmit={(e) => {
            e.preventDefault();
            const picked = showPanel ? items[active.at] : undefined;
            if (picked) go(picked.href);
            else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
          }}
          className={`absolute top-1/2 right-0 z-20 -mt-6 w-[320px] ease-(--ease-out) desktop:w-[360px] ${
            open ? OPENING : CLOSING
          }`}
        >
          <div className="flex h-12 items-center rounded-sm border border-input-border bg-input-bg pl-4 has-focus-visible:border-input-border-focused">
            <input
              ref={input}
              type="search"
              data-testid="top-search-input"
              aria-label="Search faces and builds"
              placeholder="Search faces and builds"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              role={desktop ? "combobox" : undefined}
              aria-expanded={desktop ? listed : undefined}
              aria-controls={listed ? "top-search-results" : undefined}
              aria-activedescendant={listed ? `top-search-option-${active.at}` : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive({ at: 0, glide: false });
              }}
              className="type-body h-full min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
            <span aria-hidden="true" className="-mr-px flex size-11 shrink-0 items-center justify-center text-text-primary">
              <Icon name="search" size={20} />
            </span>
          </div>
        </form>
        {showPanel && groups && (
          <SearchPanel
            query={query}
            groups={groups}
            active={active.at}
            glide={active.glide}
            onHover={(at) => setActive({ at, glide: true })}
            onPick={() => close("once")}
          />
        )}
      </div>
    </>
  );
}
