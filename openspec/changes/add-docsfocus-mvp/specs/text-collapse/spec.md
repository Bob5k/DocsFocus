## ADDED Requirements
### Requirement: Hide Long Paragraphs
The system SHALL collapse long paragraphs to reduce cognitive load while preserving access to the full content.

#### Scenario: Collapse threshold (configurable)
- **WHEN** a paragraph’s text content exceeds the configured threshold
- **THEN** replace it with a collapsed view showing the first sentence (or first ~120 chars if no sentence delimiter) and a control “Show more”
- **AND** the default threshold SHALL be 400 characters and configurable in Settings within a safe range (e.g., 120–2000)

#### Scenario: Expand/Collapse interaction
- **WHEN** the user activates the expand control
- **THEN** the full paragraph SHALL be revealed; the control changes to “Show less” and toggles back to collapsed on activation

#### Scenario: Preserve semantics and accessibility
- **WHEN** rendering the collapsed view
- **THEN** controls SHALL have appropriate ARIA roles/labels and maintain text selection and copy behavior after expansion

#### Scenario: Scope and safety
- **WHEN** evaluating paragraphs to collapse
- **THEN** the feature SHALL skip elements inside code blocks and known non-content areas (e.g., nav, aside, footer) and avoid breaking page layout
