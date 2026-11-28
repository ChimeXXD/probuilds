// Tiny static server for the built site (out/), used by Playwright. No dependencies.
// Resolves clean URLs the way static hosts do: /about and /about/ -> about.html, /dir/ -> dir/index.html.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";

const OUT = join(import.meta.dirname, "..", "out");
const port = Number(process.argv[2] ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ics": "text/calendar; charset=utf-8",
};

function resolve(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null; // malformed percent-encoding: answer 404, do not crash the server
  }
  const base = join(OUT, normalize(decoded));
  if (base !== OUT && !base.startsWith(OUT + sep)) return null;
  const bare = base.endsWith(sep) ? base.slice(0, -1) : base; // "/faces/" -> faces.html (no trailingSlash)
  const candidates = [base, join(base, "index.html")];
  if (bare !== OUT) candidates.splice(1, 0, `${bare}.html`); // never "out.html", outside out/
  return candidates.find((p) => existsSync(p) && statSync(p).isFile()) ?? null;
}

// The 200 rewrites in out/_redirects ("/b/*  /b  200"), as Cloudflare Pages applies them: a path under the rule's
// prefix is answered with the target page, and the address stays as it was.
const RULES = existsSync(join(OUT, "_redirects"))
  ? readFileSync(join(OUT, "_redirects"), "utf8")
      .split("\n")
      .map((line) => line.trim().split(/\s+/))
  : [];
const REWRITES = RULES.filter(([from, to, status]) => from?.endsWith("/*") && to && status === "200").map(([from, to]) => ({
  prefix: from.slice(0, -1),
  to,
}));

// The exact-path 301 and 302 redirects in out/_redirects ("/faces/request  /submit/request  301"), as Cloudflare
// Pages sends them: the browser is told to go to the target, and the query goes with it.
const REDIRECTS = new Map(
  RULES.filter(([from, to, status]) => from?.startsWith("/") && !from.includes("*") && to && (status === "301" || status === "302")).map(
    ([from, to, status]) => [from, { to, status: Number(status) }],
  ),
);

function rewrite(url) {
  const path = url.split("?")[0];
  const rule = REWRITES.find((r) => path.startsWith(r.prefix) && path.length > r.prefix.length);
  return rule ? rule.to : url;
}

createServer((req, res) => {
  const [path, query] = (req.url ?? "/").split(/\?(.*)/s);
  const moved = REDIRECTS.get(path);
  if (moved) {
    res.writeHead(moved.status, { location: moved.to + (query ? `?${query}` : "") });
    res.end();
    return;
  }
  const file = resolve(rewrite(req.url ?? "/"));
  if (!file) {
    const notFound = join(OUT, "404.html");
    res.writeHead(404, { "content-type": TYPES[".html"] });
    res.end(existsSync(notFound) ? readFileSync(notFound) : "Not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(port, "127.0.0.1", () => console.log(`Serving out/ on http://127.0.0.1:${port}`));
