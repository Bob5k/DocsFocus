# DocsFocus - Focus-Friendly Documentation Reader

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome)](https://github.com/Bob5k/DocsFocus)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

DocsFocus is a Chrome extension built to keep developers in flow while skimming dense technical documentation. It transforms busy pages into focused, readable layouts without AI services, telemetry, or external network calls — everything runs locally in the browser.

## ✨ Focus Helpers

- 🎯 **Focus Mode on demand** – toggle DocsFocus per tab to collapse distractions while preserving context.
- ✂️ **Adaptive text collapsing** – shorten long paragraphs above your threshold with accessible “Show more” controls.
- 🔍 **TL;DR code preview** – surface the first relevant code block at the top of each section.
- 🪄 **Keyword highlighting everywhere** – emphasize technical terms inline and inside code blocks.
- 🎭 **Reading mask overlay** – dim the periphery and follow your cursor to maintain focus.
- 🧼 **Trimmed chrome & layout cleanup** – hide sticky banners, sidebars, and other UI noise.
- 🧭 **Section tracker & shortcuts** – floating “you are here” indicator plus keyboard shortcuts for quick control.
- 🧩 **Per-site overrides & presets** – remember settings per domain, including custom presets you create.
- 🔒 **Privacy-first** – no external requests, no telemetry, no data leaves the page.

## 🎯 Presets & Modes

DocsFocus ships with two built-in presets and a flexible custom system so you can match any reading style.

### 🧠 Deep Focus (default)

- Collapse threshold: **340** characters
- Reading mask enabled with a 35% viewport window
- Trim Chrome, TL;DR preview, section tracker, keyboard shortcuts, and collapsible sections enabled
- Dyslexia-friendly typography and code paragraph collapsing enabled

### ⚡ Skim (fast scan)

- Collapse threshold: **280** characters
- Reading mask disabled for maximum visibility
- Trim Chrome, TL;DR preview, section tracker, keyboard shortcuts, and collapsible sections enabled
- Dyslexia mode disabled for lighter typography

### 🛠️ Custom presets

- Save any configuration from the options page with a custom name (syncs via `chrome.storage.sync`)
- Apply or delete custom presets from both the options UI and popup
- Preset names are validated to avoid duplicates and reserved values

- **Preset visibility controls** – hide built-in presets you do not use to keep dropdowns minimal.
- **Domain-specific overrides** – apply any preset (built-in or custom) to the current site from the popup; clearing overrides reverts the site to your global preset.

## 🚀 Getting Started

### Installation

1. **Chrome Web Store**: Install DocsFocus from the [Chrome Web Store](https://chrome.google.com/webstore) (listing coming soon).
2. **Developer Mode**:
   - Clone or download this repository
   - Open `chrome://extensions`, enable **Developer mode**
   - Click **Load unpacked** and select the `extension/` directory

### Using Focus Mode

1. Navigate to a supported documentation site (or enable DocsFocus manually)
2. Click the DocsFocus toolbar icon
3. Toggle **Focus Mode** to activate helpers
4. Pick a preset or custom profile that matches your current task
5. Fine-tune settings from the options page when you need deeper control

## 🌐 Site Detection & Manual Activation

DocsFocus auto-detects documentation experiences on 20+ popular domains, including:

- **Official docs**: MDN, GitHub Docs, Microsoft Learn, Node.js, Python, Go, Rust, Oracle, Kotlin, Qt
- **Package ecosystems**: npm, RubyDoc
- **Framework guides**: Laravel, Django
- **Aggregators**: Read the Docs

Detection combines URL patterns with DOM heuristics so the extension can follow you into nested documentation sections.

If a site is not detected automatically:

1. Open the popup while on the site and use **Enable for this site** to grant host permissions.
2. DocsFocus stores the override and immediately injects Focus Mode.
3. Clear the override from the popup to remove permissions and return to the default behavior.

## ⚙️ Customization

Open the options page (right-click the icon → **Options**) to tune every helper:

- **Collapse threshold** and custom keyword list
- Feature toggles: keyword highlighting (with code support), code paragraph collapsing, TL;DR preview, reading mask, collapsible sections, Trim Chrome, section tracker, keyboard shortcuts, dyslexia mode
- **Reading mask tuning** when using custom presets: adjust mask height and darkness
- **Custom preset management**: name, save, apply, and delete presets; manage visibility of built-ins

All settings are stored locally and sync via Chrome when available.

## 🎮 Keyboard Shortcuts

When Focus Mode is active:

- `Shift + J`: Jump to the next section heading
- `Shift + K`: Jump to the previous section heading
- `Shift + C`: Scroll to the first code block on the page
- `Shift + T`: Show or hide the floating section tracker

Shortcuts respect focused form elements and can be disabled from the options page.

## 🔧 Development

```bash
npm run lint     # Static analysis with Biome across extension and specs
npm run format   # Check formatting without writing changes
npm run package  # Bundle the extension into dist/docsfocus.zip
```

- The extension is plain JavaScript/HTML/CSS; no bundler required.
- `scripts/package-extension.js` zips the `extension/` directory for manual installation.
- Manual regression scenarios live in `docs/manual-test-plan.md`.

## 🛡️ Privacy & Performance

- **No telemetry** – there is no analytics or tracking of any kind.
- **Offline by design** – focus helpers run entirely in the content script; no network requests are issued.
- **Permission minimization** – DocsFocus requests optional host permissions only when you enable a site manually.
- **Lightweight** – optimized DOM operations target <150 ms activation per page with low memory overhead.

## 🐛 Troubleshooting

**DocsFocus isn’t activating:**

1. Confirm Focus Mode is toggled on in the popup.
2. Check whether the domain is in the supported list or enable it manually.
3. Refresh the page after changing presets or overrides.

**Reading mask is missing:**

1. Ensure the current preset has the mask enabled (Skim disables it by design).
2. Verify the reading mask toggle in settings or try a custom preset.

**Preset changes aren’t sticking:**

1. Save settings in the options page after adjusting controls.
2. When using custom presets, reapply the preset from the popup or options page.
3. Clear site overrides if a domain-specific preset overrides your global choice.

Check Chrome DevTools for `[DocsFocus]` logs to inspect active settings.

## 📄 License

MIT License – see `LICENSE`.

## 🙏 Acknowledgments

Built for developers seeking focus-friendly reading experiences and the broader neurodivergent community. Inspired by the challenges of parsing dense technical manuals while maintaining privacy-first principles and accessible design.

## 📞 Support & Feedback

- **Repository**: <https://github.com/Bob5k/DocsFocus>
- **Issues**: <https://github.com/Bob5k/DocsFocus/issues>
- **Discussions**: <https://github.com/Bob5k/DocsFocus/discussions>

---

DocsFocus — making technical documentation calmer, one page at a time.
