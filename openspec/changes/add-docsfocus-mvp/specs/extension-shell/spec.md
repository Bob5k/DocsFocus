## ADDED Requirements
### Requirement: Chrome MV3 Extension Shell
The product SHALL be delivered as a Chrome Extension using Manifest V3 with a minimal, privacy-preserving setup.

#### Scenario: Manifest V3 structure
- **WHEN** the extension is built
- **THEN** it SHALL include `manifest_version: 3`, a `service_worker` under `background/`, and register a `content_scripts` entry for docs pages

#### Scenario: Minimal permissions
- **WHEN** reviewing `manifest.json`
- **THEN** it SHALL request only the minimal necessary permissions (e.g., `storage`, `activeTab` if needed), and SHALL NOT request host permissions broader than required patterns

#### Scenario: Directory layout
- **WHEN** the repository is opened
- **THEN** the extension code SHALL be organized as:
  - `extension/manifest.json`
  - `extension/content/` (content script, injected CSS)
  - `extension/popup/` (popup UI)
  - `extension/options/` (options UI)
  - `extension/background/service-worker.js`
  - `extension/icons/` (16/48/128)

#### Scenario: No external network by default
- **WHEN** the extension runs
- **THEN** it MUST NOT perform any outbound network requests (telemetry, analytics, remote config)
