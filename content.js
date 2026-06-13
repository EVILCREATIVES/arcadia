const ARC_ROOT_CLASS = "arcadia-root-flag";
const ARC_INLINE_CLASS = "arcadia-inline-flag";
const ARC_LINK_CLASS = "arcadia-link-flag";
const ARC_ANALYZED_ATTR = "data-arcadia-analysed";
const CANDIDATE_SELECTOR = "article, main, p, blockquote, li, h1, h2, h3";

function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function collectCandidates() {
  const nodes = [...document.querySelectorAll(CANDIDATE_SELECTOR)];
  const entries = nodes
    .map((node) => ({
      node,
      text: cleanText(node.innerText)
    }))
    .filter((entry) => entry.text.length >= 80)
    .sort((left, right) => right.text.length - left.text.length);

  return entries.slice(0, 12);
}

function collectLinks() {
  return [...document.querySelectorAll("a[href]")]
    .map((link) => ({
      text: cleanText(link.innerText).slice(0, 160),
      href: link.href
    }))
    .filter((entry) => entry.text || entry.href)
    .slice(0, 30);
}

function buildPayload() {
  const candidates = collectCandidates();
  return {
    url: window.location.href,
    title: document.title,
    text: cleanText(document.body?.innerText || "").slice(0, 12000),
    candidates: candidates.map((entry) => entry.text.slice(0, 800)),
    links: collectLinks()
  };
}

function removeExistingFlags() {
  document.querySelectorAll(`.${ARC_ROOT_CLASS}, .${ARC_INLINE_CLASS}, .${ARC_LINK_CLASS}`).forEach((node) => node.remove());
  document.querySelectorAll(`[${ARC_ANALYZED_ATTR}]`).forEach((node) => node.removeAttribute(ARC_ANALYZED_ATTR));
  document.querySelectorAll(".arcadia-flagged-block").forEach((node) => node.classList.remove("arcadia-flagged-block"));
}

function addRootFlag(result) {
  const rootFlag = document.createElement("aside");
  rootFlag.className = ARC_ROOT_CLASS;
  rootFlag.innerHTML = `
    <div class="arcadia-root-score">${result.score}% AI</div>
    <div class="arcadia-root-verdict">${result.verdict}</div>
    <div class="arcadia-root-text">${result.explanation}</div>
    <div class="arcadia-root-text">${result.badUse}</div>
    <div class="arcadia-root-meta">SOURCE: ${result.source.toUpperCase()}</div>
  `;
  document.body.appendChild(rootFlag);
}

function createInlineFlag(label) {
  const badge = document.createElement("span");
  badge.className = ARC_INLINE_CLASS;
  badge.textContent = label;
  return badge;
}

function markCandidateNodes(result) {
  const highlights = (result.highlights || []).map((value) => value.toLowerCase());
  const candidates = collectCandidates();
  let flagged = 0;

  for (const entry of candidates) {
    if (flagged >= 5) {
      break;
    }

    const lowerText = entry.text.toLowerCase();
    const hit = highlights.find((highlight) => highlight && lowerText.includes(highlight));

    if (!hit && result.score < 55) {
      continue;
    }

    if (entry.node.hasAttribute(ARC_ANALYZED_ATTR)) {
      continue;
    }

    entry.node.setAttribute(ARC_ANALYZED_ATTR, "true");
    entry.node.classList.add("arcadia-flagged-block");
    entry.node.prepend(createInlineFlag(hit ? `AI SIGNAL: ${hit}` : `AI SIGNAL: ${result.score}%`));
    flagged += 1;
  }
}

function markLinks(result) {
  if (result.score < 45) {
    return;
  }

  const highlights = (result.highlights || []).map((value) => value.toLowerCase());
  const links = [...document.querySelectorAll("a[href]")];
  let flagged = 0;

  for (const link of links) {
    if (flagged >= 6) {
      break;
    }

    const signature = `${cleanText(link.innerText)} ${link.href}`.toLowerCase();
    const hit = highlights.find((highlight) => highlight && signature.includes(highlight));

    if (!hit && signature.length < 40) {
      continue;
    }

    if (link.hasAttribute(ARC_ANALYZED_ATTR)) {
      continue;
    }

    link.setAttribute(ARC_ANALYZED_ATTR, "true");
    const badge = document.createElement("span");
    badge.className = ARC_LINK_CLASS;
    badge.textContent = hit ? `FLAGGED LINK: ${hit}` : "FLAGGED LINK";
    link.insertAdjacentElement("afterend", badge);
    flagged += 1;
  }
}

function applyAnalysis(result) {
  removeExistingFlags();
  addRootFlag(result);
  markCandidateNodes(result);
  markLinks(result);
}

async function analyzePage() {
  const response = await chrome.runtime.sendMessage({
    type: "analyze-page",
    payload: buildPayload()
  });

  if (!response?.ok) {
    throw new Error(response?.error || "Arcadia could not analyze this page.");
  }

  applyAnalysis(response.result);
  return response.result;
}

function scheduleAutoScan() {
  chrome.storage?.sync?.get({ autoScan: true }, (settings) => {
    if (settings.autoScan === false || document.body?.dataset.arcadiaAutoscan === "done") {
      return;
    }

    document.body.dataset.arcadiaAutoscan = "done";
    window.setTimeout(() => {
      analyzePage().catch(() => {});
    }, 1200);
  });
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "arcadia-scan-page") {
      analyzePage()
        .then((result) => sendResponse({ ok: true, result }))
        .catch((error) => sendResponse({ ok: false, error: String(error.message || error) }));
      return true;
    }

    return false;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleAutoScan, { once: true });
} else {
  scheduleAutoScan();
}
