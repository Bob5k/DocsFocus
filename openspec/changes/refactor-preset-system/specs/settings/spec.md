# Settings Capability Delta

## MODIFIED Requirements

### Requirement: Built-in Presets
The system SHALL provide two built-in reading presets that configure multiple settings at once: Deep Focus (optimized for concentrated reading with maximum focus aids) and Skim (optimized for quick scanning).

#### Scenario: Deep Focus preset configuration
- **WHEN** Deep Focus preset is selected
- **THEN** the system SHALL apply:
  - collapseThreshold: 340
  - readingMask: true with focusHeightRatio 0.35
  - trimChrome: true
  - dyslexiaMode: true
  - collapseCodeParagraphs: true
  - previewTlDr: true
  - sectionTracker: true
  - keyboardShortcuts: true
  - collapsibleSections: true

#### Scenario: Skim preset configuration
- **WHEN** Skim preset is selected
- **THEN** the system SHALL apply:
  - collapseThreshold: 280
  - readingMask: false
  - trimChrome: true
  - dyslexiaMode: false
  - collapseCodeParagraphs: true
  - previewTlDr: true
  - sectionTracker: true
  - keyboardShortcuts: true
  - collapsibleSections: true

#### Scenario: Default preset for new users
- **WHEN** a new user installs the extension
- **THEN** the system SHALL set Deep Focus as the default preset

### Requirement: Preset Visibility Control
Users SHALL be able to toggle visibility of built-in presets (Deep Focus, Skim) to reduce cognitive load in preset selection interfaces.

#### Scenario: Hide built-in preset
- **WHEN** user disables visibility for a built-in preset
- **THEN** the preset SHALL not appear in preset selection dropdowns
- **AND** the preset SHALL remain available if already selected

#### Scenario: Show built-in preset
- **WHEN** user enables visibility for a built-in preset
- **THEN** the preset SHALL appear in all preset selection dropdowns

#### Scenario: Default visibility state
- **WHEN** a new user installs the extension
- **THEN** both Deep Focus and Skim presets SHALL be visible by default

## ADDED Requirements

### Requirement: Custom Preset Management
Users SHALL be able to create, name, save, and delete custom presets based on their current settings configuration.

#### Scenario: Save custom preset
- **WHEN** user provides a valid preset name and saves current settings
- **THEN** the system SHALL store the preset with all current setting values
- **AND** the custom preset SHALL appear in all preset selection dropdowns

#### Scenario: Apply custom preset
- **WHEN** user selects a saved custom preset
- **THEN** the system SHALL apply all settings from that preset
- **AND** the active preset SHALL be set to the custom preset name

#### Scenario: Delete custom preset
- **WHEN** user deletes a custom preset
- **THEN** the system SHALL remove the preset from storage
- **AND** the preset SHALL no longer appear in selection dropdowns
- **AND** if the deleted preset was currently active, the system SHALL revert to Deep Focus preset

#### Scenario: Custom preset name validation
- **WHEN** user attempts to save a custom preset
- **THEN** the system SHALL reject empty names
- **AND** the system SHALL reject duplicate names (case-insensitive)
- **AND** the system SHALL reject reserved names: "deepfocus", "skim", "custom"

#### Scenario: Custom preset persistence
- **WHEN** user saves a custom preset
- **THEN** the preset SHALL persist across browser sessions
- **AND** the preset SHALL sync across devices (when using chrome.storage.sync)

### Requirement: Domain-Specific Preset Selection
Users SHALL be able to apply any preset (built-in or custom) to specific domains, overriding their global settings for those sites.

#### Scenario: Apply preset to domain
- **WHEN** user selects a preset for a specific domain from the popup
- **THEN** the system SHALL store domain-specific settings derived from that preset
- **AND** the domain SHALL use those settings when visited
- **AND** the system SHALL display which preset is active for that domain

#### Scenario: Clear domain-specific preset
- **WHEN** user clears domain-specific settings
- **THEN** the domain SHALL revert to using global settings and preset
- **AND** the domain-specific storage SHALL be removed

#### Scenario: Domain preset with hidden built-in
- **WHEN** a domain uses a built-in preset that has been hidden via visibility controls
- **THEN** the preset SHALL continue to function for that domain
- **AND** the preset name SHALL still display in the popup for that domain

## REMOVED Requirements

### Requirement: Balanced Preset
**Reason**: Consolidating similar presets to reduce decision paralysis for ADHD users. Deep Focus replaces both Balanced and Focus with optimized middle-ground settings.

### Requirement: Focus Preset
**Reason**: Consolidating similar presets to reduce decision paralysis for ADHD users. Deep Focus replaces both Balanced and Focus with optimized middle-ground settings.

### Requirement: Global Preset Option for Domains
**Reason**: Simplified model—domains either have a specific preset applied or use global settings. The "global" option in domain dropdowns is redundant; clearing domain settings achieves the same result.
