import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicPages = [
  "index.html", "about.html", "support.html", "awards.html", "archive.html",
  "jinbutsuroku.html", "notices.html", "staff.html", "links.html", "sitemap.html"
];
const htmlFiles = [...publicPages, "404.html"];
const errors = [];
const warn = [];
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const idsByPage = new Map();

function fail(message) { errors.push(message); }
function attrs(tag) {
  const out = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return out;
}
function pageIds(html) {
  return new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]));
}
function stripQuery(value) { return value.split(/[?#]/, 1)[0]; }

for (const file of htmlFiles) {
  if (!fs.existsSync(path.join(root, file))) { fail(`Missing HTML file: ${file}`); continue; }
  const html = read(file);
  idsByPage.set(file, pageIds(html));
  if (!/^\s*<!doctype html>/i.test(html)) fail(`${file}: missing HTML5 doctype`);
  if (!/<html\b[^>]*\blang=["']ja["']/i.test(html)) fail(`${file}: missing lang="ja"`);
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) fail(`${file}: missing viewport metadata`);
  if (!/<title>\s*[^<]+\s*<\/title>/i.test(html)) fail(`${file}: missing page title`);
  if (!/<main\b/i.test(html)) fail(`${file}: missing main landmark`);
  if (!/<h1\b/i.test(html)) fail(`${file}: missing primary heading`);
  if (!/<a\b[^>]*class=["'][^"']*skip-link/i.test(html)) warn.push(`${file}: no skip link detected`);
  if (publicPages.includes(file)) {
    if (!/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(html)) fail(`${file}: missing meta description`);
    if (!/<link\b[^>]*rel=["']canonical["'][^>]*href=["']https:\/\//i.test(html)) fail(`${file}: missing absolute canonical URL`);
    for (const property of ["og:title", "og:description", "og:url", "og:site_name"]) {
      if (!new RegExp(`<meta\\b[^>]*property=["']${property}["']`, "i").test(html)) fail(`${file}: missing ${property}`);
    }
  }
}

const knownHtml = new Set(htmlFiles);
for (const file of htmlFiles) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const html = read(file);
  for (const match of html.matchAll(/<(?:a|link|script|img|source)\b[^>]*>/gi)) {
    const tag = match[0], a = attrs(tag), raw = a.href ?? a.src;
    if (!raw || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue;
    let url;
    try { url = new URL(raw, `https://site-check.invalid/${file}`); }
    catch { fail(`${file}: invalid local URL ${raw}`); continue; }
    const target = decodeURIComponent(url.pathname.replace(/^\//, "")) || "index.html";
    const cleanTarget = path.posix.normalize(target);
    if (cleanTarget.startsWith("../")) { fail(`${file}: local link escapes site root: ${raw}`); continue; }
    if (!fs.existsSync(path.join(root, cleanTarget))) {
      fail(`${file}: missing local target ${raw} -> ${cleanTarget}`);
      continue;
    }
    if (url.hash && knownHtml.has(cleanTarget)) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (fragment && !idsByPage.get(cleanTarget)?.has(fragment)) {
        fail(`${file}: missing fragment ${raw} -> #${fragment} in ${cleanTarget}`);
      }
    }
  }
}

for (const file of fs.readdirSync(root).filter(name => name.endsWith(".css"))) {
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  let depth = 0;
  for (const char of css) {
    if (char === "{") depth++;
    if (char === "}") depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) fail(`${file}: unbalanced CSS braces (depth ${depth})`);
}

const sitemapPath = path.join(root, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) fail("Missing sitemap.xml");
else {
  const sitemap = read("sitemap.xml");
  for (const page of publicPages) {
    const expected = page === "index.html"
      ? "https://8fgb66gmt2-stack.github.io/-Bungeicho-offical-web-site-/"
      : `https://8fgb66gmt2-stack.github.io/-Bungeicho-offical-web-site-/${page}`;
    if (!sitemap.includes(`<loc>${expected}</loc>`)) fail(`sitemap.xml: missing ${page}`);
  }
}
if (!fs.existsSync(path.join(root, "robots.txt"))) fail("Missing robots.txt");
else if (!read("robots.txt").includes("sitemap.xml")) fail("robots.txt: sitemap URL missing");

for (const warning of warn) console.warn("WARN", warning);
if (errors.length) {
  for (const error of errors) console.error("FAIL", error);
  console.error(`Site checks failed: ${errors.length} error(s), ${warn.length} warning(s).`);
  process.exitCode = 1;
} else {
  console.log(`Site checks passed: ${publicPages.length} public pages, ${htmlFiles.length} HTML files, local links and assets checked.`);
}
