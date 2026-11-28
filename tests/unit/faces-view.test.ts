import { existsSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FacesView } from "@/components/faces/FacesView";
import { loadContent } from "@/lib/content/load";
import { faceCards, type FaceCardView } from "@/lib/faces";

// The Faces library as the static export renders it (Figma 333:1139 / 345:1310 / 345:1391, no results 372:1853 /
// 427:9875 / 427:9960), from the real content with drafts on (the preview): Figma's five sample faces with their
// stand-in pictures (D-107, D-108), then Zidane and Olise, sample faces added for their creators' turns (D-123).
const content = loadContent(join(process.cwd(), "content"), { includeDrafts: true });
const cards = faceCards(content.faces, (file) => existsSync(join(process.cwd(), "public", file)));
const DEMO_NOTE = "Demo: stand-in faces from Xaiiros&#x27;s and CodeName Max&#x27;s YouTube tutorials. Each real card shows our own in-game recreation.";
/** A draft that isn't one of Figma's samples: Chime's own face before it is published. */
const ownDraft: FaceCardView = { ...(cards[0] as FaceCardView), id: "own", href: "/faces/own", sample: false, picture: null };
const render = (list: FaceCardView[]) => renderToStaticMarkup(createElement(FacesView, { cards: list }));
const html = render(cards);
const empty = render([]);

describe("FacesView", () => {
  it("has the header from the design, with Figma's demo note while sample faces are listed (D-108)", () => {
    expect(html).toMatch(/<h1[^>]*>Faces<\/h1>/);
    expect(html).toContain("Lookalike and era faces, each a step-by-step recipe with a build to match.");
    expect(html).toContain(`>${DEMO_NOTE}<`);
    // Our own faces only: no stand-ins, so no note.
    expect(render([ownDraft])).not.toContain("Demo:");
  });

  it("has the search field, labelled, with the design's placeholder", () => {
    expect(html).toMatch(/<input[^>]*type="search"/);
    expect(html).toMatch(/<input[^>]*data-testid="search-input"/);
    expect(html).toMatch(/<input[^>]*placeholder="Search faces by name"/);
    expect(html).toMatch(/<input[^>]*aria-label="Search faces by name"/);
    // Clear shows only once something is typed.
    expect(html).not.toContain('aria-label="Clear search"');
  });

  it("has the four kind chips with counts, All pressed (D-68)", () => {
    const chip = (n: number, label: string, count: number, pressed: boolean) =>
      new RegExp(`<button[^>]*data-testid="filter-chip-${n}"[^>]*aria-pressed="${pressed}"[^>]*>.*?${label}.*?>${count}<`);
    expect(html).toMatch(chip(1, "All", 7, true));
    expect(html).toMatch(chip(2, "Footballers", 5, false));
    expect(html).toMatch(chip(3, "Athletes", 1, false));
    expect(html).toMatch(chip(4, "Musicians", 1, false));
  });

  it("shows the seven sample faces in their order: kind, plain title, page, stand-in picture, no Draft tag", () => {
    const drawn = [
      ["cristiano-ronaldo-2008", "Footballer", "2008 Ronaldo"],
      ["neymar-jr-mohawk", "Footballer", "Neymar Jr (Mohawk)"],
      ["lamine-yamal", "Footballer", "Lamine Yamal"],
      ["lebron-james", "Athlete", "LeBron James"],
      ["michael-jackson", "Musician", "Michael Jackson"],
      ["zinedine-zidane", "Footballer", "Zinedine Zidane"],
      ["michael-olise", "Footballer", "Michael Olise"],
    ];
    drawn.forEach(([slug, kind, title], i) => {
      const card = html.match(new RegExp(`<a[^>]*data-testid="face-card-${i + 1}"[^>]*>.*?</a>`))?.[0] ?? "";
      expect(card).toContain(`href="/faces/${slug}"`);
      expect(card).toMatch(new RegExp(`<img[^>]*src="/sample/faces/${slug}.webp"`));
      expect(card).toContain(`>${kind}<`);
      expect(card).toContain(`>${title}<`);
    });
    // The demo note marks the samples; Figma draws no Draft tag on them (D-113, amending D-104 (2)).
    expect(html).not.toContain(">Draft<");
    expect(html).not.toContain("In-game screenshot");
  });

  it("still tags a draft that isn't a sample, and shows the empty slot when it has no picture (D-104 (2))", () => {
    const own = render([ownDraft]);
    expect(own).toContain(">Draft<");
    expect(own).toContain("In-game screenshot");
    expect(own).not.toContain("<img");
  });

  it("shows a face's own picture, with its alt, when there is one", () => {
    const withPicture = render([{ ...(cards[0] as FaceCardView), picture: { src: "/faces/x-1.webp", alt: "Chime's Pro in FC 27, front view" } }]);
    expect(withPicture).toMatch(/<img[^>]*src="\/faces\/x-1.webp"/);
    expect(withPicture).toMatch(/<img[^>]*alt="Chime&#x27;s Pro in FC 27, front view"/);
    expect(withPicture).not.toContain("In-game screenshot");
  });

  it("ends the grid with the dashed Missing a face tile, opening Submit's Request tab (D-70, D-121 (5))", () => {
    expect(html).toMatch(/<a[^>]*href="\/submit\/request"[^>]*data-testid="missing-face-tile"|<a[^>]*data-testid="missing-face-tile"[^>]*href="\/submit\/request"/);
    expect(html).toContain("Missing a face?");
    expect(html).toContain("Suggest one on Submit");
  });

  it("has the Who should we make next panel with Request a face (D-97 (5))", () => {
    expect(html).toContain("Who should we make next?");
    expect(html).toContain("Ask for a face, or vote for one someone already asked for");
    expect(html).toMatch(/<a[^>]*href="\/submit\/request"[^>]*data-testid="request-face-link"|<a[^>]*data-testid="request-face-link"[^>]*href="\/submit\/request"/);
    expect(html).toContain("Request a face");
  });

  it("with no faces shows the no-results card and Request a face, without the grid, tile or panel", () => {
    expect(empty).toContain('data-testid="faces-empty"');
    expect(empty).toContain("No faces here yet");
    expect(empty).toContain("Ask for it, and vote for what we make next");
    expect(empty).toMatch(/<a[^>]*href="\/submit\/request"[^>]*>.*?Request a face/);
    expect(empty).not.toContain("face-card-");
    expect(empty).not.toContain("missing-face-tile");
    expect(empty).not.toContain("Who should we make next?");
    expect(empty).toMatch(/data-testid="filter-chip-1"[^>]*>.*?All.*?>0</);
  });
});
