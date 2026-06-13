const DEFAULT_SETTINGS = {
  apiKey: "",
  model: "gemini-2.0-flash",
  autoScan: true
};

function option(id) {
  return document.getElementById(id);
}

function showStatus(message) {
  option("status").textContent = message;
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    option("apiKey").value = settings.apiKey || "";
    option("model").value = settings.model || DEFAULT_SETTINGS.model;
    option("autoScan").checked = settings.autoScan !== false;
  });
}

function saveSettings() {
  chrome.storage.sync.set(
    {
      apiKey: option("apiKey").value.trim(),
      model: option("model").value,
      autoScan: option("autoScan").checked
    },
    () => {
      showStatus("Settings saved.");
      window.setTimeout(() => showStatus(""), 1500);
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  option("save").addEventListener("click", saveSettings);
  loadSettings();
});
