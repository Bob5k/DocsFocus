# DocsFocus

DocsFocus is a Chrome Manifest V3 extension designed to help developers with ADHD (and anyone scanning dense documentation) stay focused. It collapses long paragraphs, surfaces code first, and highlights critical terms – all locally in the browser with zero telemetry.

## Features

- **ADHD Mode toggle** – enable/disable all behaviors instantly (default OFF after install).
- **Smart text collapse** – paragraphs longer than a configurable threshold (default 400 chars) show a concise summary with accessible expand/collapse controls.
- **TL;DR code preview** – first relevant code block appears at the top of each section with a deep-link to the original context.
- **Semantic highlighting** – keywords in prose and code receive subtle emphasis; keyword list and code overlay toggle are configurable.
- **Per-domain overrides** – use the popup to manually enable/disable DocsFocus for any site; permissions are requested only when needed and overrides persist per domain.
- **Settings page** – adjust collapse threshold, keyword list, TL;DR preview, and code highlighting (English UI).

## Installation (Unpacked)

1. Run `npm run package` (optional) or ensure the `extension/` folder is present.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` directory.
4. Pin the extension and use the popup toggle to activate ADHD Mode on documentation pages.

## Development

```bash
npm run lint        # Static analysis via Biome (fetches @biomejs/biome on demand)
npm run package     # Zips the extension into dist/docsfocus.zip using the zip CLI
```

Project structure (key folders):

- `extension/` – Manifest, background worker, content script, popup/options UI, icons, and shared helpers.
- `openspec/` – Specification and approved change (`add-docsfocus-mvp`) describing requirements.
- `docs/manual-test-plan.md` – Manual regression checklist covering target sites and accessibility.

## Continuous Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on pushes and pull requests:

1. Checks out the repository.
2. Runs `npm run lint` (Biome check over `extension/` and `openspec/`).
3. Packages the extension (`dist/docsfocus.zip`).
4. Uploads the packaged artifact.

## Privacy & Performance Guarantees

- No external network requests; all adjustments happen locally via DOM manipulation.
- Activation target <150 ms per page with batched DOM writes and observers.
- Optional host permissions are requested only when you manually enable DocsFocus for a new domain.

## Manual Testing

Refer to [docs/manual-test-plan.md](docs/manual-test-plan.md) for detailed instructions covering MDN, GitHub Docs, npm, Read the Docs, overrides, settings, accessibility, and packaging verification.

## License

MIT License – see `LICENSE` (to be added) or use your preferred OSS license before releasing.
