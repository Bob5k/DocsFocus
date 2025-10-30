# Privacy Policy for DocsFocus

**Last Updated: October 30, 2025**

## Overview

DocsFocus is a Chrome extension designed to help developers read technical documentation faster and with less cognitive load. We are committed to protecting your privacy and being transparent about our data practices.

## Data Collection

**DocsFocus does NOT collect, store, or transmit any personal data.**

- ❌ No analytics or telemetry
- ❌ No tracking of browsing history
- ❌ No user identification
- ❌ No external network requests
- ❌ No data sent to remote servers
- ✅ All processing happens locally in your browser

## Local Storage

DocsFocus stores configuration preferences locally on your device using Chrome's storage API (`chrome.storage.sync`). This data includes:

- Your selected preset (Balanced, Skim, Focus, or Deep)
- Text collapse threshold settings
- Keyword highlighting preferences
- Enabled/disabled feature toggles
- Per-domain manual overrides

**This data:**
- Remains on your device only
- Is never transmitted over the network
- Can be deleted by uninstalling the extension
- May sync across your Chrome browsers if you're signed into Chrome (using Chrome's built-in sync, which we don't control)

## Permissions Explained

DocsFocus requests the following permissions to function:

### Required Permissions

1. **`storage`** - Saves your settings locally so they persist between browser sessions
2. **`scripting`** - Injects content scripts to modify documentation pages and apply focus features
3. **`activeTab`** - Reads the current tab's URL when you click the extension icon to determine if it's a documentation page
4. **`tabs`** - Reads basic tab information (URL and title) to detect documentation sites automatically

### Host Permissions

DocsFocus requests access to specific documentation websites (MDN, GitHub Docs, npm, Python, Rust, Go, Node.js, Microsoft Learn, Django, Laravel, etc.) to automatically activate focus features on these sites.

**Optional host permissions** (`*://*/*`) allow you to manually enable DocsFocus on documentation sites not in our default list. This permission is only requested when you explicitly enable the extension on a new site.

## Third-Party Services

DocsFocus does NOT use any third-party services, including:

- Analytics services (Google Analytics, etc.)
- Crash reporting tools
- Advertising networks
- CDNs for loading remote code
- Any external APIs

## Code Transparency

All code runs locally in your browser. DocsFocus:

- Contains no obfuscated code
- Uses no remote code execution
- Includes no external script loading
- Is built with vanilla JavaScript (no external dependencies)

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last Updated" date at the top of this document and publish the new version. Significant changes will be communicated through the Chrome Web Store update notes.

## Open Source

DocsFocus is open source. You can review the complete source code at:
https://github.com/bob5k/DocsFocus

## Contact

If you have questions about this privacy policy or DocsFocus's data practices, please:

- Open an issue on GitHub: https://github.com/bob5k/DocsFocus/issues

## Your Rights

Since DocsFocus does not collect any personal data, there is no personal data to:
- Request access to
- Request deletion of
- Request correction of
- Export or port

All settings are stored locally on your device and can be reset by:
1. Opening the extension's options page
2. Clearing settings manually, or
3. Uninstalling the extension

## Compliance

DocsFocus complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

Since we don't collect personal data, most data protection regulations do not apply to our extension's operation.

---

**By installing and using DocsFocus, you agree to this privacy policy.**
