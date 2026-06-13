function byId(id) {
  return document.getElementById(id);
}

function render(result) {
  byId("score").textContent = result ? `${result.score}%` : "--%";
  byId("verdict").textContent = result?.verdict || "No analysis yet.";
  byId("explanation").textContent =
    result?.explanation || "Scan the current page to estimate synthetic contamination.";
  byId("badUse").textContent = result?.badUse || "";
  byId("meta").textContent = result
    ? `SOURCE: ${String(result.source || "unknown").toUpperCase()} · MODEL: ${result.model || "n/a"}`
    : "";

  const highlights = byId("highlights");
  highlights.innerHTML = "";

  for (const item of result?.highlights || []) {
    const entry = document.createElement("li");
    entry.textContent = item;
    highlights.appendChild(entry);
  }
}

async function getLatestAnalysis() {
  const response = await chrome.runtime.sendMessage({ type: "get-latest-analysis" });
  if (response?.ok && response.result) {
    render(response.result);
  }
}

async function scanCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found.");
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: "arcadia-scan-page" });
  if (!response?.ok) {
    throw new Error(response?.error || "Arcadia could not scan this page.");
  }

  render(response.result);
}

document.addEventListener("DOMContentLoaded", () => {
  byId("scan").addEventListener("click", () => {
    scanCurrentPage().catch((error) => {
      render({
        score: 0,
        verdict: "Scan failed",
        explanation: String(error.message || error),
        badUse: "Arcadia needs page access and a page worth scanning.",
        source: "local",
        model: "n/a",
        highlights: []
      });
    });
  });

  byId("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
  getLatestAnalysis().catch(() => {});
});
