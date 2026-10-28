#!/usr/bin/env python3
"""Fast static-site smoke checks: links, metadata, headings, CSS balance and sitemap."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://8fgb66gmt2-stack.github.io/-Bungeicho-offical-web-site-"
ERRORS: list[str] = []


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()
        self.duplicate_ids: set[str] = set()
        self.references: list[tuple[str, str]] = []
        self.meta: dict[tuple[str, str], list[str]] = {}
        self.link_rel: dict[str, list[str]] = {}
        self.h1_count = 0
        self.title_parts: list[str] = []
        self.in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): (value or "") for key, value in attrs}
        tag = tag.lower()
        element_id = values.get("id")
        if element_id:
            if element_id in self.ids:
                self.duplicate_ids.add(element_id)
            self.ids.add(element_id)
        if tag == "h1":
            self.h1_count += 1
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            key = values.get("name") or values.get("property")
            if key:
                self.meta.setdefault((values.get("property") and "property" or "name", key), []).append(values.get("content", ""))
        if tag == "link":
            for rel in values.get("rel", "").lower().split():
                self.link_rel.setdefault(rel, []).append(values.get("href", ""))
        for attribute in ("href", "src", "poster"):
            reference = values.get(attribute)
            if reference:
                self.references.append((attribute, reference))

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())


def fail(message: str) -> None:
    ERRORS.append(message)


html_paths = sorted(ROOT.glob("*.html"))
if not html_paths:
    fail("No HTML pages found at repository root.")

parsers: dict[str, PageParser] = {}
for path in html_paths:
    parser = PageParser()
    try:
        parser.feed(path.read_text(encoding="utf-8"))
        parser.close()
    except Exception as exc:  # report parsing failures as CI failures
        fail(f"{path.name}: HTML parsing failed: {exc}")
        continue
    parsers[path.name] = parser
    if not parser.title:
        fail(f"{path.name}: missing <title>.")
    if parser.h1_count != 1:
        fail(f"{path.name}: expected one primary <h1>, found {parser.h1_count}.")
    for value in sorted(parser.duplicate_ids):
        fail(f"{path.name}: duplicate id={value!r}.")
    for required in ("description", "theme-color"):
        if not parser.meta.get(("name", required)):
            fail(f"{path.name}: missing meta name={required!r}.")
    for required in ("og:title", "og:description", "og:url"):
        if not parser.meta.get(("property", required)):
            fail(f"{path.name}: missing Open Graph {required!r}.")
    if not parser.link_rel.get("icon"):
        fail(f"{path.name}: missing favicon.")
    if not parser.link_rel.get("canonical"):
        fail(f"{path.name}: missing canonical URL.")
    if not parser.link_rel.get("sitemap"):
        fail(f"{path.name}: missing sitemap link.")

    expected_canonical = BASE_URL + "/" if path.name == "index.html" else BASE_URL + "/" + path.name
    actual_canonical = parser.link_rel.get("canonical", [""])[0]
    if actual_canonical != expected_canonical:
        fail(f"{path.name}: canonical URL mismatch ({actual_canonical!r}).")

# Validate local assets, page links and in-page/cross-page fragments.
for page_name, parser in parsers.items():
    for attribute, reference in parser.references:
        parsed = urlsplit(reference)
        if parsed.scheme or parsed.netloc or reference.startswith("//"):
            continue
        raw_path = unquote(parsed.path)
        if raw_path.startswith("/"):
            target = (ROOT / raw_path.lstrip("/")).resolve()
        elif raw_path:
            target = (ROOT / raw_path).resolve()
        else:
            target = ROOT / page_name
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            fail(f"{page_name}: {attribute} escapes the site root: {reference!r}.")
            continue
        if not target.is_file():
            fail(f"{page_name}: local {attribute} target not found: {reference!r}.")
            continue
        if parsed.fragment and target.suffix.lower() == ".html":
            destination = parsers.get(target.name)
            if destination is None:
                destination = PageParser()
                try:
                    destination.feed(target.read_text(encoding="utf-8"))
                    destination.close()
                    parsers[target.name] = destination
                except Exception as exc:
                    fail(f"{target.name}: cannot inspect anchor target: {exc}")
                    continue
            anchor = unquote(parsed.fragment)
            if anchor not in destination.ids:
                fail(f"{page_name}: missing anchor #{anchor} in {target.name}.")

# CSS sanity: catch unbalanced blocks/parentheses before a stylesheet ships.
for css_path in sorted(ROOT.glob("*.css")):
    source = css_path.read_text(encoding="utf-8")
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.S)
    source = re.sub(r"""'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*" """.strip(), "", source)
    for opening, closing, label in (("{", "}", "braces"), ("(", ")", "parentheses")):
        depth = 0
        for char in source:
            if char == opening:
                depth += 1
            elif char == closing:
                depth -= 1
            if depth < 0:
                break
        if depth != 0:
            fail(f"{css_path.name}: unbalanced CSS {label} ({depth}).")

# The XML sitemap should parse and list each HTML page exactly once.
sitemap_path = ROOT / "sitemap.xml"
try:
    tree = ET.parse(sitemap_path)
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locations = [node.text or "" for node in tree.findall(".//sm:loc", namespace)]
    expected_locations = sorted(
        BASE_URL + "/" if page.name == "index.html" else BASE_URL + "/" + page.name
        for page in html_paths
    )
    if sorted(locations) != expected_locations:
        fail("sitemap.xml: location list does not match the HTML pages.")
    if len(locations) != len(set(locations)):
        fail("sitemap.xml: duplicate URL entries.")
except (ET.ParseError, OSError) as exc:
    fail(f"sitemap.xml: invalid or missing XML sitemap: {exc}")

if ERRORS:
    print("SITE QUALITY CHECK FAILED")
    for error in ERRORS:
        print(f" - {error}")
    sys.exit(1)

print(f"SITE QUALITY CHECK PASSED: {len(html_paths)} HTML pages, local links and anchors, metadata, CSS structure, sitemap.")
