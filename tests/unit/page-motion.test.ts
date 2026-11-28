import { describe, expect, it } from "vitest";
import { pageMotion } from "@/lib/page-motion";

// D-121 (2), DESIGN.md Motion: a page change slides the new page 40 px in from the side it came from. Which side
// follows the site's map: the five sections in the nav's order (Home … Submit, then the footer's own pages), and
// within a section a page deeper in comes from the right, one further out from the left.
describe("pageMotion", () => {
  it("a section further right in the nav comes in from the right, one further left from the left", () => {
    expect(pageMotion("/", "/faces")).toBe("forward");
    expect(pageMotion("/faces", "/builds")).toBe("forward");
    expect(pageMotion("/submit", "/changelog")).toBe("back");
    expect(pageMotion("/changelog/", "/")).toBe("back");
  });

  it("deeper in a section is forward, further out is back, whatever the trailing slash", () => {
    expect(pageMotion("/faces", "/faces/lamine-yamal")).toBe("forward");
    expect(pageMotion("/faces/lamine-yamal/", "/faces")).toBe("back");
    expect(pageMotion("/builds/finisher", "/builds")).toBe("back");
    expect(pageMotion("/submit", "/submit/request")).toBe("forward");
    expect(pageMotion("/submit/request", "/submit")).toBe("back");
  });

  it("a page across a section from a deep page compares sections, not depth", () => {
    expect(pageMotion("/faces/lamine-yamal", "/builds")).toBe("forward");
    expect(pageMotion("/builds/finisher/meta-finisher", "/faces")).toBe("back");
  });

  it("the footer's pages and Search sit after the sections", () => {
    expect(pageMotion("/submit", "/about")).toBe("forward");
    expect(pageMotion("/about", "/faces")).toBe("back");
    expect(pageMotion("/about", "/takedown")).toBe("forward");
    expect(pageMotion("/takedown", "/about")).toBe("back");
  });

  it("the same page (a query or a hash) doesn't move", () => {
    expect(pageMotion("/search", "/search?q=neymar")).toBe("still");
    expect(pageMotion("/builds", "/builds#finisher")).toBe("still");
    expect(pageMotion("/faces/", "/faces")).toBe("still");
  });

  it("a keyboard press never moves the page (DESIGN.md: none on key press)", () => {
    expect(pageMotion("/", "/faces", { byKey: true })).toBe("still");
  });

  it("a build card opening its build expands instead (the card's picture and name travel, the page fades)", () => {
    expect(pageMotion("/builds/finisher", "/builds/finisher/meta-finisher", { expand: true })).toBe("expand");
    // Only a real page change expands.
    expect(pageMotion("/builds/finisher", "/builds/finisher", { expand: true })).toBe("still");
  });
});
