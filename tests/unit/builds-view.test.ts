import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BuildsView } from "@/components/builds/BuildsView";
import { archetypeViews, buildsHref } from "@/lib/builds";
import type { ArchetypeFile } from "@/lib/content/types";

// The Builds page as the static export renders it (Figma 241:556 / 279:1399 / 276:1073), Finisher picked.
const file = JSON.parse(readFileSync(join(process.cwd(), "content", "archetypes", "fc27.json"), "utf8")) as ArchetypeFile;
const views = archetypeViews(file);
const html = renderToStaticMarkup(createElement(BuildsView, { archetypes: views, initial: "finisher" }));

describe("BuildsView", () => {
  it("has the page title and line", () => {
    expect(html).toMatch(/<h1[^>]*>Builds<\/h1>/);
    expect(html).toContain("Pick your archetype to see its builds");
  });

  it("shows 13 emblem buttons named by archetype, with the selected one pressed", () => {
    expect(html.match(/data-testid="emblem-[a-z-]+"/g)).toHaveLength(13);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-label="Finisher"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*aria-label="Finisher"/);
    // Every slot shows its archetype's emblem (D-106): 13 in the rail, plus the selected Stance card's plate.
    for (const { id } of views) {
      expect(html).toContain(`/art/archetypes/${id}.svg`);
      expect(existsSync(join(process.cwd(), "public", "art", "archetypes", `${id}.svg`))).toBe(true);
    }
  });

  it("labels the four groups", () => {
    for (const g of ["Keeper", "Defender", "Midfielder", "Forward"]) expect(html).toContain(`>${g}<`);
  });

  it("shows the selected stance card and its neighbours", () => {
    expect(html).toContain('data-testid="stance-card-finisher"');
    expect(html).toContain('data-testid="stance-card-magician"');
    expect(html).toContain('data-testid="stance-card-target"');
    expect(html).toContain("/art/stances/finisher.webp");
    expect(html).toContain("/art/stances/finisher-pattern.webp");
  });

  it("lists the facts, the button to the builds and the sources", () => {
    expect(html).toContain("Forward · Archetype 12 of 13");
    expect(html).toContain("Not yet checked in game");
    expect(html).toContain("Low Driven Shot");
    expect(html).toContain("Since Season 2");
    expect(html).toContain("/art/playstyles/first-touch.webp");
    // Specializations replace the Mastery and AP cost tiles (D-121 (3)).
    expect(html).not.toContain("Mastery attributes");
    expect(html).not.toContain("6 up · 4 down");
    expect(html).toContain("Specializations");
    expect(html).toContain("Presser");
    expect(html).toContain("/art/playstyles-plus/gamechanger.webp");
    expect(html).toContain("Stamina");
    expect(html).toContain("12 of 13");
    // The lime primary button with an arrow (D-121 (3)).
    const see = /<a[^>]*data-testid="see-builds"[^>]*>.*?<\/a>/.exec(html)?.[0] ?? "";
    expect(see).toContain('href="/builds/finisher"');
    expect(see).toContain("See Finisher builds");
    expect(see).toContain("bg-accent-fill");
    expect(see).toContain("/icons/arrow-right.svg");
    expect(html).toContain("Pro Clubs HQ");
  });

  it("the front Stance card opens the archetype's builds, as its button does, without a second tab stop (D-121 (3))", () => {
    expect(buildsHref({ id: "finisher" })).toBe("/builds/finisher");
    const open = /<a[^>]*data-testid="stance-card-open"[^>]*>/.exec(html)?.[0] ?? "";
    expect(open).toContain('href="/builds/finisher"');
    expect(open).toContain('tabindex="-1"');
    expect(open).toContain('aria-hidden="true"');
    expect(html.match(/data-testid="stance-card-open"/g)).toHaveLength(1);
  });

  it("starts on the first archetype when none is asked for", () => {
    const first = renderToStaticMarkup(createElement(BuildsView, { archetypes: views }));
    expect(first).toContain("Keeper · Archetype 1 of 13");
  });
});
