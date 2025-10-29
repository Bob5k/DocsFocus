# DocsFocus - ADHD-Friendly Documentation Reader

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome)](https://github.com/Bob5k/DocsFocus)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**DocsFocus** is a specialized Chrome extension designed to help developers with ADHD (and anyone scanning dense documentation) read technical documentation faster and with less cognitive load. It transforms overwhelming documentation pages into focused, readable content without AI, telemetry, or external network requests.

## ✨ Key Features

- 🎯 **Smart Text Collapse** - Automatically collapses long paragraphs with expandable summaries
- 🔍 **TL;DR Code Preview** - Surfaces the first relevant code block at the top of sections
- 🌟 **Keyword Highlighting** - Highlights technical terms for better scanning
- 🎭 **Reading Mask** - Visual focus overlay that follows your cursor
- 📐 **Layout Trimming** - Removes distracting UI elements
- 🧭 **Navigation Aids** - Floating section tracker and keyboard shortcuts
- ♿ **Accessibility First** - WCAG 2.1 AA compliant with full keyboard navigation
- 🔒 **Privacy-Focused** - Zero external requests, all processing happens locally

## 🎯 Presets - Tailored Reading Experiences

DocsFocus includes four carefully crafted presets for different reading scenarios:

### 📖 **Balanced** (Default)
Perfect for everyday documentation reading with moderate assistance.

- **Text Collapse**: 400 characters threshold
- **Reading Mask**: Medium focus window (32% of viewport height)
- **Layout**: Keeps all UI elements visible
- **Best for**: General technical documentation, tutorials, reference materials

### ⚡ **Skim**
Designed for rapid scanning and finding specific information quickly.

- **Text Collapse**: Aggressive 280 characters threshold
- **Reading Mask**: **Disabled** for maximum content visibility
- **Layout**: Trims distracting sidebars and banners
- **Best for**: Quick lookups, API references, finding specific syntax

### 🎯 **Focus**
Optimized for deep reading with enhanced readability features.

- **Text Collapse**: Moderate 340 characters threshold
- **Reading Mask**: Smaller focus window (28% of viewport)
- **Layout**: Clean interface with trimmed distractions
- **Dyslexia Mode**: Enhanced typography for easier reading
- **Best for**: Learning new concepts, detailed tutorials, comprehensive guides

### 🔬 **Deep**
Maximum assistance for thorough comprehension and analysis.

- **Text Collapse**: Generous 520 characters threshold
- **Reading Mask**: Large focus window (40% of viewport)
- **Layout**: Full content retention with enhanced features
- **Dyslexia Mode**: Enhanced typography
- **Code Highlighting**: Highlights programming keywords in code blocks
- **Best for**: Complex documentation, language specifications, in-depth research

## 🚀 Getting Started

### Installation
1. **Chrome Web Store**: Install DocsFocus from the [Chrome Web Store](https://chrome.google.com/webstore)
2. **Developer Mode**: Load unpacked from the [GitHub repository](https://github.com/Bob5k/DocsFocus)

### Basic Usage
1. Navigate to any supported documentation site
2. Click the DocsFocus icon in your browser toolbar
3. Toggle **ADHD Mode** to enable features
4. Select a preset that matches your reading goal
5. Fine-tune settings in the options page if needed

## 🌐 Supported Sites

DocsFocus automatically detects and activates on 20+ major documentation platforms:

### Official Documentation
- **MDN Web Docs** (developer.mozilla.org)
- **GitHub Docs** (docs.github.com)
- **Microsoft Learn** (learn.microsoft.com)
- **Node.js** (nodejs.org/api)
- **Python** (docs.python.org)
- **Go** (go.dev, pkg.go.dev)
- **Rust** (doc.rust-lang.org, docs.rs)
- **Kotlin** (kotlinlang.org/docs)
- **Qt** (doc.qt.io)

### Package Management
- **npm** (npmjs.com/package)
- **Ruby** (ruby-doc.org)

### Frameworks
- **Laravel** (laravel.com/docs)
- **Django** (docs.djangoproject.com)

### Community
- **Read the Docs** (readthedocs.io)

### Manual Override
If a site isn't automatically detected, you can manually enable DocsFocus for any domain using the popup interface.

## ⚙️ Customization

### Options Page
Access detailed settings by right-clicking the DocsFocus icon and selecting "Options":

#### Text Settings
- **Collapse Threshold**: Adjust paragraph length trigger (120-2000 characters)
- **Keywords**: Customize highlighted technical terms

#### Feature Toggles
- **Reading Mask**: Enable/disable visual focus overlay
- **Code Preview**: Show TL;DR code blocks at section tops
- **Layout Trimming**: Hide distracting UI elements
- **Dyslexia Mode**: Enhanced typography
- **Section Tracker**: Floating navigation aid
- **Keyboard Shortcuts**: Quick navigation controls

#### Appearance
- **Highlight in Code**: Apply keyword highlighting to code blocks
- **Collapsible Sections**: Expand/collapse document sections

### Domain-Specific Settings
Configure different presets and settings for specific documentation sites:
1. Navigate to the documentation site
2. Open DocsFocus popup
3. Select domain-specific settings
4. Choose preset and customize options
5. Settings persist for future visits

## 🎮 Keyboard Shortcuts

When DocsFocus is active:

- **Alt + D**: Toggle ADHD Mode on/off
- **Alt + S**: Cycle through presets (Balanced → Skim → Focus → Deep)
- **Alt + R**: Toggle reading mask
- **Alt + C**: Toggle text collapse
- **Alt + L**: Toggle layout trimming
- **Escape**: Disable all features temporarily

## 🔧 Development

### Setup
```bash
npm run lint        # Static analysis via Biome (fetches @biomejs/biome on demand)
npm run package     # Zips the extension into dist/docsfocus.zip using the zip CLI
```

### Installation (Unpacked)
1. Run `npm run package` (optional) or ensure the `extension/` folder is present
2. Open `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the `extension/` directory
4. Pin the extension and use the popup toggle to activate ADHD Mode on documentation pages

### Project Structure
- `extension/` – Manifest, background worker, content script, popup/options UI, icons, and shared helpers
- `openspec/` – Specification and approved change describing requirements
- `docs/manual-test-plan.md` – Manual regression checklist covering target sites and accessibility

## 🛡️ Privacy & Security

### Privacy First
- **Zero external network requests** - all processing happens locally
- **No telemetry or analytics** - no data collection or tracking
- **Optional host permissions** - only requested when manually enabling sites
- **Local storage only** - settings stored in browser storage

### Performance
- **Fast activation**: Under 150ms per page
- **Memory efficient**: Clean feature lifecycle
- **Smooth interactions**: RequestAnimationFrame-based updates
- **Minimal overhead**: Optimized DOM operations

## 🐛 Troubleshooting

### Common Issues

**Extension not activating on documentation site:**
1. Check if ADHD Mode is enabled (toggle in popup)
2. Verify site is supported or manually enable for the domain
3. Refresh the page after changing settings

**Reading mask not visible:**
1. Ensure "Skim" preset isn't selected (it disables reading mask)
2. Check that reading mask is enabled in settings
3. Try switching to "Balanced", "Focus", or "Deep" preset

**Features not working after update:**
1. Refresh the active documentation page
2. Check Chrome console for any error messages
3. Try disabling and re-enabling ADHD Mode

### Debug Information
Enable debug logging by:
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for `[DocsFocus]` prefixed messages
4. Check diagnostics information in popup

## 📄 License

MIT License – see `LICENSE` (to be added) or use your preferred OSS license before releasing.

## 🙏 Acknowledgments

- Built for developers with ADHD and the broader neurodivergent community
- Inspired by the challenges of reading dense technical documentation
- Privacy-focused approach respecting user autonomy
- Accessibility standards ensuring inclusive design

## 📞 Support & Feedback

- **Repository**: [https://github.com/Bob5k/DocsFocus](https://github.com/Bob5k/DocsFocus)
- **Issues**: [GitHub Issues](https://github.com/Bob5k/DocsFocus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Bob5k/DocsFocus/discussions)

---

**DocsFocus** - Making technical documentation more accessible, one focused paragraph at a time.
