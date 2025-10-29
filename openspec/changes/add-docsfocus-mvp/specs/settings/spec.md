## ADDED Requirements
### Requirement: Global Settings
Users SHALL be able to configure DocsFocus behavior via an Options (Settings) UI, with safe defaults.

#### Scenario: Options page availability
- **WHEN** the user opens the extension’s Options page
- **THEN** a Settings UI SHALL be presented with controls for behavior configuration; the UI SHALL be in English (EN)

#### Scenario: Collapse threshold configuration
- **WHEN** adjusting the collapse threshold
- **THEN** users SHALL be able to set an integer value within a safe range (e.g., 120–2000), default 400, persisted via `chrome.storage.sync`

#### Scenario: Keyword list management
- **WHEN** editing the keyword list
- **THEN** users SHALL be able to add/remove terms (e.g., `function`, `async`, `API`), with a robust default set provided; changes SHALL persist

#### Scenario: Default keyword set
- **WHEN** restoring defaults or on first run
- **THEN** the keyword list SHALL include a sensible cross-language set such as: `function`, `const`, `let`, `var`, `class`, `interface`, `type`, `import`, `export`, `async`, `await`, `return`, `throw`, `try`, `catch`, `promise`, `API`, `endpoint`, `method`, `route`, `request`, `response`

#### Scenario: Code highlighting toggle
- **WHEN** toggling code highlighting
- **THEN** users SHALL be able to enable/disable highlighting in code blocks; default ON

#### Scenario: TL;DR preview toggle
- **WHEN** toggling the TL;DR preview
- **THEN** users SHALL be able to enable/disable preview-at-top behavior for code examples; default ON

#### Scenario: Reset to defaults
- **WHEN** selecting “Reset to defaults”
- **THEN** settings SHALL revert to initial defaults without affecting unrelated browser data

#### Scenario: Persistence and validation
- **WHEN** saving settings
- **THEN** values SHALL be validated and stored via `chrome.storage.sync` with local fallback; invalid values SHALL be rejected with inline error messaging
