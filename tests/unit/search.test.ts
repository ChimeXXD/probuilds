import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "@/lib/content/load";
import { resultsLine, searchIndex, searchResults } from "@/lib/search";

// Search results (Figma 376:2282 / 376:2393 / 376:2491; D-80 (3)): faces and builds that match what was typed. A build
// also matches through a matching face it is paired with, so "Ronaldo" finds the 2008 Winger build (376:2319).
const index = searchIndex(loadContent(join(process.cwd(), "content"), { includeDrafts: true }), () => true);

describe("search", () => {
  it("finds 2008 Ronaldo and its matching build for “Ronaldo”, as Figma draws", () => {
    const r = searchResults(index, "Ronaldo");
    expect(r.faces.map((f) => f.title)).toEqual(["2008 Ronaldo"]);
    expect(r.builds.map((b) => b.href)).toEqual(["/builds/spark/spark-2008-winger"]);
    expect(resultsLine(r, "Ronaldo")).toBe("2 results for “Ronaldo”");
  });

  it("finds builds by their name, archetype or positions", () => {
    // Leski's Finisher draft has no title yet (D-123 (2)).
    expect(searchResults(index, "finisher").builds.map((b) => b.title)).toEqual(["PLACEHOLDER", "Meta Finisher", "Quick Finisher", "Tall Finisher"]);
    expect(searchResults(index, "meta").builds.map((b) => b.title)).toEqual(["Meta Finisher"]);
    // "CF" is a whole position: Tall Finisher plays ST only.
    expect(searchResults(index, "CF").builds.map((b) => b.title)).toEqual(["Meta Finisher", "Quick Finisher"]);
    expect(searchResults(index, "spark").builds.map((b) => b.href)).toEqual(["/builds/spark/spark-2008-winger"]);
  });

  it("ignores case and accents, and needs every word", () => {
    expect(searchResults(index, "lamine YAMAL").faces.map((f) => f.title)).toEqual(["Lamine Yamal"]);
    expect(searchResults(index, "lamine ronaldo").faces).toEqual([]);
  });

  it("finds nothing for an empty search, and says 1 result in the singular", () => {
    expect(searchResults(index, "  ")).toEqual({ faces: [], builds: [] });
    expect(resultsLine({ faces: [], builds: [] }, "Zidane")).toBe("0 results for “Zidane”");
    expect(resultsLine({ faces: [index.faces[0]!], builds: [] }, "x")).toBe("1 result for “x”");
  });
});
