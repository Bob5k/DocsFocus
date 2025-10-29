# Refactor Preset System

## Why
The current preset system offers three modes (Balanced, Focus, Skim) which creates decision paralysis for ADHD users—a key target audience. Research shows that too many similar choices increases cognitive load and reduces satisfaction. Additionally, users cannot create or save their own customized presets, limiting flexibility.

## What Changes
- **BREAKING**: Replace `balanced` and `focus` presets with a single `deepfocus` preset
- Keep `skim` preset unchanged for quick scanning use cases
- Remove `global` preset option from domain-specific settings (use preset selection directly)
- Add custom preset management system allowing users to:
  - Save current settings as a named custom preset
  - Load, apply, and delete custom presets
  - Toggle visibility of built-in presets (deepfocus, skim)
- Update default preset from `balanced` to `deepfocus`
- New Deep Focus preset combines best aspects of removed presets:
  - Reading mask: 35% viewport height
  - Dyslexia mode: enabled
  - Trim chrome: enabled
  - Code paragraphs: collapsed by default
  - Collapse threshold: 340 characters

## Impact
- **Affected capabilities**: `settings`, `adhd-mode` (preset application logic)
- **Affected code**:
  - `extension/utils/helpers.js` — preset definitions, storage keys, custom preset management functions
  - `extension/options/options.html` — preset selector UI, custom preset management UI
  - `extension/options/options.js` — custom preset logic
  - `extension/popup/popup.html` — domain preset selector
  - `extension/popup/popup.js` — custom preset handling in popup
- **User impact**: Existing users will see preset changed from `balanced`/`focus` to `deepfocus` (no migration logic since extension is pre-public)
- **Storage changes**: Add new storage keys for custom presets and preset visibility settings
