# DocsFocus - Focus-Friendly Documentation Reader

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome)](https://github.com/Bob5k/DocsFocus)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

DocsFocus is a Chrome extension built to keep developers in flow while skimming dense technical documentation. It transforms busy pages into focused, readable layouts without AI services, telemetry, or external network calls — everything runs locally in the browser.

## ✨ Focus Helpers

### Core Features

- 🎯 **Focus Mode on demand** – toggle DocsFocus per tab to collapse distractions while preserving context. Use the toolbar popup or global keyboard shortcut (`Alt+Shift+F` / `Option+Shift+F` on macOS) to activate instantly.

- ✂️ **Adaptive text collapsing** – automatically shorten paragraphs above your threshold (default: 340 characters) with accessible "Show more/less" controls. Distinguishes between regular prose and code-containing paragraphs with separate toggles for each.

- 🔍 **TL;DR code preview** – surfaces the first relevant code block at the top of documentation sections, creating a quick-reference with a deep-link back to its original context. Maintains full copy-paste functionality.

- 🪄 **Keyword highlighting** – dual-mode system that emphasizes technical terms:
  - **Prose highlighting**: highlights keywords like `function`, `const`, `API`, `endpoint` in regular text
  - **Code block highlighting**: uses non-destructive overlay system to highlight keywords within code blocks without breaking copy/paste
  - Fully configurable keyword list with 20+ defaults

- 🎭 **Reading mask overlay** – creates a focused reading window by dimming content above and below your cursor position. Highly configurable with adjustable window size (32-35% of viewport), opacity (50-68%), and positioning. Follows your mouse smoothly for natural reading flow.

- 🧼 **Smart layout trimming** – intelligently detects and hides distracting page elements using multiple heuristics:
  - Auto-detects sticky banners, sidebars, and floating panels
  - Uses keyword hints (announcement, promo, newsletter, cookie, feedback)
  - Includes preview toggle button to temporarily show/hide trimmed elements
  - Preserves navigation and table-of-contents when essential

- 📑 **Collapsible sections** – adds expand/collapse controls to documentation sections (H2-H6 headings). Supports keyboard navigation (Enter/Space to toggle) with full ARIA accessibility labels for improved document scanning.

- 🧭 **Navigation aids** – comprehensive navigation system including:
  - Floating section tracker showing current position ("Section X of Y")
  - Previous/Next section buttons
  - Minimize/restore functionality
  - Integration with keyboard shortcuts for seamless navigation
  - Auto-generates heading IDs for reliable deep-linking

- 🔤 **Dyslexia-friendly typography** – optional typography adjustments designed to improve readability for users with dyslexia or reading challenges. Applies system-wide CSS improvements without modifying page content.

### Flexibility

- 🧩 **Per-site overrides & presets** – complete domain-specific settings system that remembers your preferences per documentation site. Apply different presets or individual feature toggles to each domain independently from global settings.

- 🔒 **Privacy-first** – zero external network requests, no telemetry, no analytics. All processing happens locally in your browser using vanilla JavaScript.

## 🎯 Presets & Modes

DocsFocus ships with two built-in presets optimized for different reading scenarios, plus a flexible custom system to match your exact preferences.

### Preset Comparison

| Feature | Deep Focus 🧠 | Skim ⚡ |
|---------|--------------|---------|
| **Best for** | Detailed reading, learning | Quick scanning, reference lookup |
| Collapse threshold | 340 characters | 280 characters |
| Text collapsing | ✅ Enabled | ✅ Enabled |
| Code paragraph collapsing | ✅ Enabled | ✅ Enabled |
| Keyword highlighting | ✅ Enabled | ✅ Enabled |
| TL;DR code preview | ✅ Enabled | ✅ Enabled |
| Reading mask | ✅ Enabled (35% height, 68% opacity) | ❌ Disabled |
| Collapsible sections | ✅ Enabled | ✅ Enabled |
| Layout trimming | ✅ Enabled | ✅ Enabled |
| Section tracker | ✅ Enabled | ✅ Enabled |
| Keyboard shortcuts | ✅ Enabled | ✅ Enabled |
| Dyslexia mode | ✅ Enabled | ❌ Disabled |

### 🧠 Deep Focus (default)

The **Deep Focus** preset is designed for concentrated reading sessions where you're learning new concepts or studying documentation in depth:

- Aggressive text collapsing at **340 characters** keeps paragraphs scannable
- **Reading mask** with 35% viewport window height and 68% overlay opacity creates a focused reading tunnel
- **Dyslexia-friendly typography** for improved readability
- All navigation aids and helpers enabled for comprehensive support
- **When to use**: Learning new APIs, understanding complex concepts, deep technical reading

### ⚡ Skim (fast scan)

The **Skim** preset optimizes for quick reference lookups and rapid scanning:

- More aggressive collapsing at **280 characters** for faster scanning
- **No reading mask** for maximum viewport visibility
- Standard typography for lighter visual weight
- All navigation and structure helpers remain active
- **When to use**: Looking up syntax, checking API signatures, quick fact-finding

### 🛠️ Custom Presets

Create and save your own presets with any combination of features:

- **Save configurations** from the options page with custom names
- **Sync automatically** via `chrome.storage.sync` across your devices
- **Apply or delete** custom presets from both popup and options UI
- **Validation** prevents duplicates and conflicts with built-in preset names
- **Preset visibility** – hide built-in presets you don't use to simplify your dropdown menus

### Domain-Specific Presets

Apply different presets to different documentation sites:

- **Per-domain settings** – choose a specific preset for each site from the popup
- **Independent configuration** – domain settings override global defaults
- **Quick switching** – change presets without affecting other sites
- **Easy reset** – clear overrides to revert to global preset
- **Persistent** – domain preferences are remembered across browser sessions

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
3. Toggle **Focus Mode** to activate helpers or press `Alt+Shift+F` (`Option+Shift+F` on macOS) anywhere to switch instantly
4. Pick a preset or custom profile that matches your current task
5. Fine-tune settings from the options page when you need deeper control

## 🌐 Site Detection & Manual Activation

DocsFocus auto-detects documentation experiences on 20+ popular domains through a multi-layered detection system:

### Supported Documentation Sites

- **Official docs**: MDN Web Docs, GitHub Docs, Microsoft Learn, Node.js, Python, Go, Rust, Oracle, Kotlin, Qt
- **Package ecosystems**: npm, RubyDoc
- **Framework guides**: Laravel, Django
- **Aggregators**: Read the Docs (supports all `*.readthedocs.io` wildcard domains)

### Detection System

The extension uses three complementary approaches to identify documentation pages:

1. **URL pattern matching**: Explicit regex patterns for known documentation domains (e.g., `/developer\.mozilla\.org/`, `/docs\.github\.com/`)
2. **Host and path analysis**: Keyword-based detection for URLs containing terms like `docs`, `documentation`, `api`, `reference`, `manual`
3. **DOM structure examination**: Content pattern recognition to identify documentation-style layouts

This multi-layer approach ensures DocsFocus activates reliably across various documentation formats and can follow you into nested sections.

### Manual Activation

If a site is not detected automatically:

1. Open the popup while on the site and use **Enable for this site** to grant host permissions
2. DocsFocus stores the override and immediately injects Focus Mode
3. Clear the override from the popup to remove permissions and return to the default behavior

Manual overrides work independently from domain-specific preset settings, giving you full control over which sites can access DocsFocus features.

## ⚙️ Customization

DocsFocus provides extensive customization options accessible via the options page (right-click the extension icon → **Options**).

### Basic Settings

- **Collapse threshold**: Set the character count (120-2000) that triggers paragraph collapsing
- **Custom keyword list**: Add or remove technical terms to highlight in prose and code
- **Feature toggles**: Enable/disable any feature independently:
  - Keyword highlighting in prose
  - Keyword highlighting in code blocks
  - Code paragraph collapsing
  - TL;DR code preview
  - Reading mask overlay
  - Collapsible sections
  - Layout trimming
  - Section tracker
  - Keyboard shortcuts
  - Dyslexia-friendly typography

### Advanced Reading Mask Configuration

Fine-tune the reading mask behavior for custom presets:

- **Focus window height**: Percentage of viewport (default: 32-35%)
- **Minimum/maximum height**: Constrain the window size (160px min, 360px max)
- **Overlay opacity**: Adjust darkness level (50-68%, where higher = darker)
- **Vertical positioning**: Default cursor position (33-35% from top)

### Custom Preset Management

Create, manage, and organize your presets:

- **Create presets**: Save any configuration with a custom name
- **Apply presets**: Switch between presets from popup or options
- **Delete presets**: Remove custom presets you no longer need
- **Preset visibility**: Hide built-in presets (Deep Focus, Skim) from dropdown menus to reduce clutter
- **Validation**: Automatic checks prevent duplicate names and conflicts

### Domain-Specific Settings

Configure different behaviors for different documentation sites:

- **Per-domain presets**: Apply specific presets to individual sites
- **Per-domain toggles**: Override specific features (like keyword highlighting) on a site-by-site basis
- **Independent from manual enable**: Domain settings work separately from the manual site activation system
- **Persistent storage**: All domain preferences sync across browser sessions

### Storage & Sync

All settings are stored locally and automatically sync across your devices:

- **Primary**: `chrome.storage.sync` (preferred, syncs across devices)
- **Fallback**: `chrome.storage.local` (local-only if sync unavailable)
- **Bridge**: localStorage (final fallback for compatibility)

## 🎮 Keyboard Shortcuts

### Global Shortcuts

- `Alt + Shift + F` (Windows/Linux) or `Option + Shift + F` (macOS): **Toggle Focus Mode** on/off for the current tab from anywhere

### Navigation Shortcuts

When Focus Mode is active:

- `Shift + J`: Jump to the **next section** heading
- `Shift + K`: Jump to the **previous section** heading
- `Shift + C`: Jump to the **first code block** on the page with a brief highlight flash for easy location
- `Shift + T`: **Toggle section tracker** visibility (show/hide the floating navigation widget)

**Smart behavior:**
- All shortcuts automatically respect focused form elements (won't interfere when you're typing)
- Can be completely disabled from the options page if you prefer
- Section jumps integrate with the section tracker to show your current position

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

### Privacy Guarantees

- **Zero external network requests** – all processing happens locally in your browser's content script. No data ever leaves your device.
- **No telemetry or analytics** – DocsFocus includes no tracking, no usage statistics, no error reporting to external servers. Ever.
- **Permission minimization** – the extension only requests optional host permissions when you manually enable a site that isn't in the default detection list.
- **Transparent data storage** – all settings are stored in browser storage (sync or local) with no server-side components.
- **Three-tier storage fallback** ensures data persistence:
  1. `chrome.storage.sync` (preferred) – syncs settings across your Chrome browsers
  2. `chrome.storage.local` (fallback) – stores locally if sync is unavailable
  3. `localStorage` (final fallback) – browser storage bridge for maximum compatibility

### Performance Optimization

- **Fast activation** – optimized DOM operations target <150ms activation time per page
- **Efficient updates** – uses MutationObserver for dynamic content with throttling to prevent excessive updates
- **Smooth animations** – leverages `requestAnimationFrame` for fluid reading mask movement and transitions
- **Low memory overhead** – proper cleanup and lifecycle management prevent memory leaks
- **Non-blocking execution** – features activate asynchronously without blocking page rendering
- **Minimal DOM impact** – non-destructive manipulation preserves original page structure and content

### Technical Approach

- **Vanilla JavaScript** – zero external dependencies or libraries
- **Manifest V3** – latest Chrome extension standards for security and performance
- **Feature module system** – each feature activates/deactivates cleanly with independent lifecycle management
- **Content-only processing** – all computation happens in the content script layer, no background processing needed for core features

## 🏗️ Architecture

DocsFocus uses a modular feature system designed for clean activation, updates, and deactivation:

**Feature lifecycle:**
- Each feature is a self-contained module with `activate()`, `update()`, and `deactivate()` methods
- Features register cleanup callbacks that run automatically when Focus Mode is toggled off
- Settings changes trigger selective feature updates without full page reloads
- MutationObserver patterns handle dynamic content while respecting performance budgets

**Why this matters:**
- **Extensibility**: New features can be added without touching existing code
- **Reliability**: Proper cleanup prevents memory leaks and state conflicts
- **Performance**: Features only run when needed and clean up after themselves
- **Maintainability**: Each feature's logic is isolated and testable

This architecture ensures DocsFocus enhances documentation pages without leaving traces when disabled, maintaining a clean browsing experience.

## 🐛 Troubleshooting

**DocsFocus isn't activating:**

1. Confirm Focus Mode is toggled on in the popup.
2. Check whether the domain is in the supported list or enable it manually.
3. Refresh the page after changing presets or overrides.

**Reading mask is missing:**

1. Ensure the current preset has the mask enabled (Skim disables it by design).
2. Verify the reading mask toggle in settings or try a custom preset.

**Preset changes aren't sticking:**

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
