## ADDED Requirements
### Requirement: Focus Mode Global Toggle
Users SHALL be able to enable or disable all DocsFocus behaviors with a single toggle exposed via the extension popup.

#### Scenario: Toggle on enables features
- **WHEN** the user turns Focus Mode ON in the popup
- **THEN** content behaviors (text collapse, code first, keyword highlighting) SHALL activate on supported pages without reloading

#### Scenario: Toggle off disables features
- **WHEN** Focus Mode is OFF
- **THEN** no DOM modifications SHALL be applied and previously applied modifications SHALL be reverted where feasible (e.g., un-collapse, clear highlights)

#### Scenario: Persisted state
- **WHEN** the user changes the toggle
- **THEN** the state SHALL persist across tabs and sessions using `chrome.storage.sync` with local fallback

#### Scenario: Default OFF after install
- **WHEN** the extension is installed or reset to defaults
- **THEN** Focus Mode SHALL be OFF by default until the user enables it

#### Scenario: Accessibility of popup control
- **WHEN** navigating the popup with keyboard
- **THEN** the toggle SHALL be reachable via Tab, have a visible focus state, and include accessible label text in English (EN)
