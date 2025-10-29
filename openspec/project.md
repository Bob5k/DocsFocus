# Project Context

## Purpose
DocsFocus is an open‑source Chrome Extension that helps developers (especially those with ADHD, dyslexia, or difficulty focusing) read technical documentation faster and with less cognitive load. It does this locally in the browser, without AI and without tracking, by collapsing long paragraphs, surfacing code examples early, and highlighting key technical terms.

## Tech Stack
- Chrome Manifest V3 (MV3)
- Vanilla JavaScript (ES6+), no frameworks
- CSS with CSS Variables (light/dark friendly styles, WCAG AA contrast)
- Storage: `chrome.storage.sync` with local fallback; optional `localStorage` cache
- Optional build: Webpack 5 for minification and tree‑shaking (MVP can ship unbundled if within size budget)
- CI/CD: GitHub Actions (lint, build, zip artifact)

## Project Conventions

### Code Style
- Keep it small and readable; avoid premature abstractions and external deps
- Use ES modules where helpful; prefer single‑purpose modules per feature
- Naming: kebab‑case for files, camelCase for JS, BEM‑ish or utility classes for CSS as needed
- CSS: prefer CSS Variables for theme‑sensitive highlights; avoid heavy resets
- Comments: explain non‑obvious DOM handling and performance considerations (batch reads/writes)

### Architecture Patterns
- MV3 extension shell:
  - `content/` script performs DOM detection and enhancements
  - `popup/` provides ADHD Mode toggle (global feature enable/disable)
  - `options/` (Settings) provides configuration UI for thresholds, keyword list, TL;DR preview and code highlighting toggles
  - `background/service-worker.js` optional (sync, versioning)
- Feature flags controlled by ADHD Mode and per‑setting toggles
- Detection patterns gate activation to documentation‑like sites, plus a manual override in the popup (persist per domain where feasible)
- DOM safety first: do not break anchors, semantics, or copy/paste; avoid layout thrash (batch mutations)

### Testing Strategy
- Manual testing across a representative set of docs sites (MDN, GitHub Docs, npm, Python, Rust/docs.rs, ReadTheDocs, go.dev/pkg.go.dev, nodejs.org/api, Microsoft Learn, etc.)
- Performance: measure activation time; target < 150 ms per page on typical docs
- Accessibility: keyboard navigation (popup/options), visible focus, ARIA roles/labels, contrast ratios (WCAG 2.1 AA)
- Copy/paste integrity: highlighted code must copy identical characters

### Git Workflow
- Branch naming: `feat/<short-name>` for features, `fix/<short-name>` for fixes
- Commits: concise, imperative subject lines; group related changes
- PRs: explain why + what; reference relevant OpenSpec change IDs

## Domain Context
- Target content: technical documentation websites where developers learn APIs/libraries
- Core behaviors (MVP):
  - ADHD Mode (global toggle, default OFF)
  - Hide Long Paragraphs (configurable threshold; default 400 chars)
  - Code Examples First as TL;DR preview (clone + jump link; original remains in place)
  - Semantic Keyword Highlighting (prose and line‑level in code; configurable keyword list; non‑destructive)
- Safety: no network requests, no telemetry, minimal permissions

## Important Constraints
- Privacy: zero external data; all processing local; MV3 compliant
- Performance: activation under ~150 ms on typical docs pages; batch DOM updates
- Size budget: total < 100 KB (gzipped < 30 KB), excluding icons
- Compatibility: Chrome 100+ (MV3), later cross‑browser considered post‑MVP
- Accessibility: WCAG 2.1 AA (contrast, focus management, ARIA)
- Language: EN‑only UI in MVP

## External Dependencies
- None at runtime (no external libraries, no remote services)
- Dev/CI optional: Webpack 5, ESLint/Prettier (if used), GitHub Actions for lint/build/archive

## Capabilities (MVP, proposed via OpenSpec change)
- `extension-shell` — MV3 shell, minimal permissions, structure
- `adhd-mode` — global enable/disable; default OFF
- `text-collapse` — configurable threshold; show more/less
- `code-first` — TL;DR preview clone + jump link; configurable toggle
- `keyword-highlighting` — prose and line‑level code highlighting; configurable list and toggle
- `settings` — Options page with inputs and reset
- `site-detection` — curated pattern list + manual override
- `privacy-performance` — privacy guarantees and performance/size budgets
