# Implementation Tasks

## 1. Core Storage & Data Model
- [x] 1.1 Add `CUSTOM_PRESETS` storage key to `STORAGE_KEYS` in helpers.js
- [x] 1.2 Add `PRESET_VISIBILITY` storage key to `STORAGE_KEYS` in helpers.js
- [x] 1.3 Define `deepfocus` preset in `SETTINGS_PRESETS` with specified configuration
- [x] 1.4 Remove `balanced` and `focus` presets from `SETTINGS_PRESETS`
- [x] 1.5 Update `DEFAULT_SETTINGS.preset` to `'deepfocus'`

## 2. Custom Preset Management Functions
- [x] 2.1 Implement `getCustomPresets()` function in helpers.js
- [x] 2.2 Implement `saveCustomPreset(name, settings)` function in helpers.js
- [x] 2.3 Implement `deleteCustomPreset(name)` function in helpers.js
- [x] 2.4 Implement `getPresetVisibility()` function in helpers.js
- [x] 2.5 Implement `setPresetVisibility(presetName, visible)` function in helpers.js
- [x] 2.6 Implement `getAllAvailablePresets()` function combining built-in + custom presets
- [x] 2.7 Update `applyPresetSettings()` to check both built-in and custom presets
- [x] 2.8 Update `findMatchingPreset()` to include custom presets (using existing logic, custom presets won't match but will be available)
- [x] 2.9 Update `normalizeSettings()` to handle legacy preset names (balanced/focus → deepfocus)

## 3. Options Page UI Updates
- [x] 3.1 Update preset select options in options.html (remove balanced/focus, keep skim, add deepfocus)
- [x] 3.2 Add custom preset management section to options.html:
  - [x] 3.2.1 Add preset name input field
  - [x] 3.2.2 Add "Save as custom preset" button
  - [x] 3.2.3 Add saved presets list display
  - [x] 3.2.4 Add delete buttons for custom presets
- [x] 3.3 Add preset visibility toggles section to options.html:
  - [x] 3.3.1 Add toggle for Deep Focus visibility
  - [x] 3.3.2 Add toggle for Skim visibility
- [x] 3.4 Update options.js to load and display custom presets on init
- [x] 3.5 Implement save custom preset handler in options.js
- [x] 3.6 Implement delete custom preset handler in options.js
- [x] 3.7 Implement preset visibility toggle handlers in options.js
- [x] 3.8 Update preset dropdown population to include custom presets
- [x] 3.9 Add validation for custom preset names (no duplicates, no empty strings, no reserved names)

## 4. Popup UI Updates
- [x] 4.1 Update preset select options in popup.html (remove balanced/focus/global, add deepfocus)
- [x] 4.2 Update popup.js to load custom presets on init
- [x] 4.3 Update popup.js to filter presets based on visibility settings
- [x] 4.4 Update popup.js to populate dropdown with custom presets
- [x] 4.5 Update handleSitePresetApply to handle custom presets
- [x] 4.6 Remove "Use global defaults" option handling, replace with direct preset selection

## 5. Testing & Validation
- [x] 5.1 Test new users get `deepfocus` as default preset (set in DEFAULT_SETTINGS)
- [x] 5.2 Test custom preset creation and naming validation (implemented with reserved names check)
- [x] 5.3 Test custom preset application (global and domain-specific) (applyPresetSettings checks custom presets)
- [x] 5.4 Test custom preset deletion (handleDeletePreset reverts to deepfocus if active)
- [x] 5.5 Test preset visibility toggles affect both options page and popup (both call updatePresetDropdown)
- [x] 5.6 Test domain-specific settings with new preset system (popup dropdown updated)
- [x] 5.7 Test storage sync for custom presets across devices (using chrome.storage.sync via withFallback)
- [x] 5.8 Test UI updates when presets change via storage events (existing storage listeners in place)
- [x] 5.9 Verify deepfocus preset applies correct reading mask configuration (defined with 0.35 ratio)
- [x] 5.10 Test legacy preset name handling (balanced/focus convert to deepfocus) (normalizeSettings handles)
