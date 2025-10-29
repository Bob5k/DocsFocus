## ADDED Requirements
### Requirement: Code Examples First (TL;DR Preview)
The system SHALL surface a TL;DR preview of code examples at the beginning of a section while preserving the original code-location and its descriptive context.

#### Scenario: Preview clone at section start
- **WHEN** a section contains code blocks (`<pre>`, `<code>`, or elements with `.highlight`)
- **THEN** a short preview (clone) of the first relevant code block SHALL be rendered at the beginning of the section, with a “Jump to full example” link anchoring to the original location

#### Scenario: Preserve anchors and context
- **WHEN** rendering previews
- **THEN** the feature SHALL preserve heading anchors and intra-page links; original code SHALL remain in place adjacent to its descriptive text

#### Scenario: Skip non-content code
- **WHEN** encountering code blocks clearly marked as non-examples (e.g., shell prompts in headers, navigation snippets)
- **THEN** the feature SHOULD skip preview to avoid noise

#### Scenario: Configurable TL;DR preview
- **WHEN** opening Settings
- **THEN** users SHALL be able to enable/disable the TL;DR preview behavior (default ON); when disabled, no previews are added and no nodes are moved
