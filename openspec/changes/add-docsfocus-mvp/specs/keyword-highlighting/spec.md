## ADDED Requirements
### Requirement: Semantic Keyword Highlighting
The system SHALL subtly highlight important technical terms in descriptive text and code to guide attention.

#### Scenario: Highlight terms in prose
- **WHEN** scanning non-code text nodes
- **THEN** occurrences of terms like `function`, `const`, `class`, `import`, `export`, `async`, `await`, `return`, `throw`, `API`, `endpoint`, `method`, `route` SHALL receive a subtle background emphasis consistent with theme

#### Scenario: Include code blocks (line-level)
- **WHEN** processing `<pre>`/`<code>` blocks
- **THEN** lines containing configured keywords SHALL receive a non-destructive highlight (e.g., wrap line elements or apply a background via spans per line) without altering the characters of the code itself

#### Scenario: Preserve copy/paste semantics
- **WHEN** a user copies highlighted code
- **THEN** the copied text SHALL be identical to the original source code characters

#### Scenario: Accessibility and theming
- **WHEN** applying highlight styles
- **THEN** contrast ratios SHALL meet WCAG AA; themes SHALL degrade gracefully in dark and light modes

#### Scenario: Configurable keywords and code-highlighting toggle
- **WHEN** opening Settings
- **THEN** users SHALL be able to edit the keyword list and toggle code-block highlighting ON/OFF (default ON)

#### Scenario: Defaults applied when unset
- **WHEN** keywords are not configured
- **THEN** the system SHALL use the default keyword set defined in Settings
