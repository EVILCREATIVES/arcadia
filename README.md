# arcadia

Arcadia is a zero-dependency browser extension prototype that treats synthetic content like a social virus:
it scans pages, estimates how much of the visible copy looks machine-generated, flags suspicious sections and
links in-place, and explains why the detected usage weakens trust, voice, and accountability.

## What it does

- uses a Gemini model when an API key is configured
- falls back to an on-device heuristic when Gemini is unavailable
- assigns an AI-usage assertion as a percentage
- overlays brutalist warning panels and inline flags directly on pages
- highlights suspicious blocks, social-style posts, and links
- stores the latest analysis for the popup

## Files

- `/manifest.json` – extension manifest
- `/background.js` – Gemini + heuristic analysis pipeline
- `/content.js` – page extraction and on-page flagging
- `/content.css` – brutalist overlays and badges
- `/popup.html` + `/popup.js` – manual scan UI and latest verdict
- `/options.html` + `/options.js` – Gemini API key and auto-scan settings

## Load locally

1. Open Chromium-based extensions.
2. Enable developer mode.
3. Load unpacked from this repository root directory.
4. Open the Arcadia options page and add a Gemini API key if you want live model analysis.

Without a Gemini API key, Arcadia still runs a local heuristic detector.
