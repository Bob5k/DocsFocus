## ADDED Requirements
### Requirement: Privacy and Performance Constraints
The system MUST operate locally with strong privacy guarantees and meet strict performance and size budgets.

#### Scenario: Zero external data
- **WHEN** the extension runs
- **THEN** it MUST NOT send or request any data from external services; all processing is local in the browser

#### Scenario: Manifest V3 compliance
- **WHEN** packaging the extension
- **THEN** it SHALL comply with MV3 (service worker background, no persistent background pages)

#### Scenario: Activation performance budget
- **WHEN** a supported page loads with ADHD Mode ON
- **THEN** initial activation (DOM scanning + rewrites) SHOULD complete within 150 ms on a typical docs page and SHOULD avoid layout thrash (batch DOM writes)

#### Scenario: Bundle size budget
- **WHEN** building the extension
- **THEN** total uncompressed size SHOULD be < 100 KB and gzipped assets SHOULD be < 30 KB (excluding icons)

#### Scenario: Accessibility baseline
- **WHEN** features render controls or highlights
- **THEN** they SHALL meet WCAG 2.1 AA for contrast and focus visibility and expose ARIA semantics where applicable
