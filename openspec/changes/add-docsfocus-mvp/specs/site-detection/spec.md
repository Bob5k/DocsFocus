## ADDED Requirements
### Requirement: Documentation Site Detection
The system SHALL enable behaviors only on documentation-like pages identified by safe URL/domain patterns, with a manual override in the popup.

#### Scenario: Pattern-based detection (comprehensive defaults)
- **WHEN** the current URL matches known patterns
- **THEN** DocsFocus features SHALL be eligible to activate (subject to Focus Mode)
- Known patterns SHALL include, at minimum: `developer.mozilla.org`, `docs.github.com`, `npmjs.com/package`, `docs.python.org`, `doc.rust-lang.org`, `docs.rs`, `devdocs.io`, `readthedocs.io`, `go.dev`, `pkg.go.dev`, `nodejs.org/api`, `docs.oracle.com`, `learn.microsoft.com`, `docs.djangoproject.com`, `kotlinlang.org/docs`, `doc.qt.io`, `laravel.com/docs`, `ruby-doc.org`, paths containing `/docs/`, subdomains starting with `api.`

#### Scenario: Manual override
- **WHEN** a page is not automatically detected
- **THEN** the user MAY manually enable DocsFocus for the current tab via popup; this preference SHOULD persist per domain

#### Scenario: Safety defaults
- **WHEN** detection is uncertain
- **THEN** the system SHALL default to non-invasive behavior (do nothing) and SHALL NOT request host permissions beyond necessary patterns

#### Scenario: Maintainable pattern list
- **WHEN** updating detection logic
- **THEN** the pattern list SHALL be organized for easy maintenance and extension (e.g., central constants, comments), and changes SHALL not require new permissions for unrelated domains
