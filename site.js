document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const nav = document.querySelector(".new-nav .nav") || document.querySelector(".nav");
  if (nav) {
    const links = [
      ["index.html", "首頁"],
      ["about.html", "文藝廳について"],
      ["support.html", "文藝振興・作家支援"],
      ["awards.html", "文藝賞・表彰"],
      ["archive.html", "文藝資料室"],
      ["jinbutsuroku.html", "文學・藝術人物録"],
      ["notices.html", "告示・公表資料"],
      ["staff.html", "組織・人事"],
      ["links.html", "関連機關"],
      ["sitemap.html", "サイトマップ"]
    ];

    const pathPart = decodeURIComponent(window.location.pathname).split("/").filter(Boolean).pop() || "";
    const current = /\.html?$/i.test(pathPart) ? pathPart : "index.html";
    const fragment = document.createDocumentFragment();

    links.forEach(([href, label]) => {
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.textContent = label;
      if (current === href) {
        anchor.setAttribute("aria-current", "page");
        anchor.setAttribute("aria-label", label + "（現在のページ）");
      }
      fragment.append(anchor);
    });

    nav.replaceChildren(fragment);
  }

  const overlay = document.querySelector("#index-overlay");
  const opener = document.querySelector("[data-open-index]");
  const closer = document.querySelector("[data-close-index]");
  const search = document.querySelector("#index-search");
  const resultsRoot = document.querySelector("#index-results");
  const results = resultsRoot ? [...resultsRoot.querySelectorAll("a")] : [];
  let previousFocus = null;
  let previousOverflow = "";

  let emptyMessage = null;
  if (overlay && search && resultsRoot) {
    emptyMessage = document.createElement("p");
    emptyMessage.className = "index-empty";
    emptyMessage.setAttribute("role", "status");
    emptyMessage.textContent = "該當スル案内ハ見ツカリマセン。別ノ言葉デ検索シテクダサイ。";
    emptyMessage.hidden = true;
    resultsRoot.after(emptyMessage);
  }

  const normalize = value => String(value || "").normalize("NFKC").trim().toLocaleLowerCase("ja-JP");

  const filterResults = () => {
    if (!search) return;
    const query = normalize(search.value);
    let visible = 0;
    results.forEach(anchor => {
      const keywords = anchor.dataset.keywords || "";
      const haystack = normalize(anchor.textContent + " " + keywords);
      anchor.hidden = Boolean(query) && !haystack.includes(query);
      if (!anchor.hidden) visible += 1;
    });
    if (emptyMessage) emptyMessage.hidden = visible !== 0;
  };

  const getFocusable = () => {
    if (!overlay) return [];
    return [...overlay.querySelectorAll(
      'a[href]:not([hidden]), button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"]):not([hidden])'
    )].filter(element => element.getClientRects().length > 0);
  };

  const openIndex = () => {
    if (!overlay) return;
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (search) search.value = "";
    results.forEach(anchor => { anchor.hidden = false; });
    if (emptyMessage) emptyMessage.hidden = true;
    window.requestAnimationFrame(() => {
      if (search) search.focus();
      else if (closer) closer.focus();
    });
  };

  const closeIndex = () => {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = previousOverflow;
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  };

  if (opener) opener.addEventListener("click", openIndex);
  if (closer) closer.addEventListener("click", closeIndex);
  if (overlay) {
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeIndex();
    });
  }
  if (search) search.addEventListener("input", filterResults);

  document.addEventListener("keydown", event => {
    if (!overlay || overlay.getAttribute("aria-hidden") !== "false") return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeIndex();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const copy = document.querySelector("[data-copy-year]");
  if (copy) copy.textContent = String(new Date().getFullYear());
});
