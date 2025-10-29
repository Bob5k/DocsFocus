# DocsFocus Manual Test Plan

## Browsing Scenarios

1. **MDN Reference Page**
   - Navigate to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
   - Enable Focus Mode.
   - Confirm paragraphs > threshold collapse with Show more/less controls.
   - Verify first code example preview is injected near the section heading with Jump link.
   - Check highlighted keywords (promise, async) appear in prose and code overlay.

2. **GitHub REST API Documentation**
   - Visit https://docs.github.com/en/rest
   - Ensure automatic detection activates features.
   - Toggle Focus Mode OFF → DOM reverts (no previews/highlights).
   - Use the `Alt+Shift+F` shortcut (`Option+Shift+F` on macOS) to toggle Focus Mode on/off without the popup and confirm highlights disappear immediately when disabled.
   - Toggle back ON → enhancements return without page reload.

3. **npm Package Page**
   - Open https://www.npmjs.com/package/react
   - Confirm detection works and long paragraphs collapse.
   - Adjust Settings → Collapse threshold to 600 → reload tab → verify fewer collapses.

4. **Read the Docs (Manual Override)**
   - Visit https://requests.readthedocs.io/en/latest/
   - Observe status: “not detected”.
   - Use “Enable on this domain” button in popup.
   - Grant host permission when prompted.
   - Verify features activate immediately.
   - Close and reopen page → confirm override persists.

5. **Disable for Domain**
   - On an auto-detected site (e.g., MDN), press “Disable on this domain”.
   - Confirm features deactivate even with Focus Mode ON.
   - Press “Re-enable on this domain” to restore default behavior.

## Settings Regression

1. **Keyword List Edit**
   - Open Options page.
   - Remove `async`, add `observer`.
   - Save and review a docs page → highlight moves accordingly.
   - Reset to defaults → confirm original list restored.

2. **Code Highlight Toggle**
   - Disable “Highlight keywords inside code blocks”.
   - Reload MDN page → overlay disappears but prose highlight remains.

3. **TL;DR Preview Toggle**
   - Disable “Show TL;DR code preview”.
   - Reload docs page → previews absent, original code position unchanged.

## Accessibility & UX

1. **Keyboard Navigation**
   - Navigate popup using Tab/Shift+Tab: toggle, site button, footer link are reachable with visible focus.
   - In Options page, use keyboard to edit inputs and toggles.

2. **ARIA & Labels**
   - Inspect collapsed paragraphs: check toggle `aria-expanded` updates.
   - Verify TL;DR preview `role="region"` includes label.

3. **Dark Mode**
   - Switch OS/browser to dark theme.
   - Confirm highlight backgrounds remain legible and accessible.

## Performance & Privacy Spot Checks

1. **Activation Budget**
   - On first load of a docs page, open DevTools Performance profiler.
   - Measure initialization (<150 ms budget) focusing on script execution time and layout thrash (should cluster).

2. **Network Requests**
   - Monitor Network tab while toggling features → ensure no external requests fired by extension.

## Packaging & Release

1. **Build Artifact**
   - Run `npm run package` locally or inspect GitHub Action artifact.
   - Confirm `dist/docsfocus.zip` contains manifest, icons, content, popup, options, background, utils.

2. **Extension Load**
   - Load unpacked extension in Chrome using `extension/` directory.
   - Smoke test popup, settings, manual override workflows.
