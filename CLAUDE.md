<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# DocsFocus Chrome Extension Documentation

## Project Overview

**DocsFocus** is a specialized Chrome Extension designed to help developers stay focused (especially when scanning dense documentation) read technical documentation faster and with less cognitive load. It processes content locally in the browser without AI, telemetry, or external network requests.

### Target Audience
- **Primary users**: Developers who need stronger focus support, including readers with dyslexia or attention-related challenges
- **Secondary users**: Any developer who wants to scan technical documentation more efficiently
- **Target sites**: Curated documentation websites (MDN, GitHub Docs, npm, Python docs, etc.)

## Architecture

### Chrome Manifest V3 Extension Structure
```
extension/
├── manifest.json           # Extension manifest and permissions
├── content/
│   ├── content.js          # Main orchestrator script
│   ├── styles.css          # Core styles for features
│   └── features/           # Individual feature modules
│       ├── collapsible-sections.js
│       ├── dyslexia-mode.js
│       ├── index.js        # Feature registry
│       ├── layout-trim.js
│       ├── navigation-aids.js
│       └── reading-mask.js
├── popup/                  # Extension popup interface
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/                # Options page for detailed settings
│   ├── options.html
│   ├── options.js
│   └── options.css
├── background/             # Background service worker
│   └── service-worker.js
└── utils/
    └── helpers.js          # Shared utilities and constants
```

### Core Components
- **Content Script**: `extension/content/content.js` - Main orchestrator that detects docs pages and manages features
- **Feature Modules**: `extension/content/features/` - Individual feature implementations with unified lifecycle
- **Popup UI**: `extension/popup/` - Quick toggle and site-specific controls
- **Options Page**: `extension/options/` - Detailed settings configuration
- **Background Worker**: `extension/background/service-worker.js` - Optional background sync
- **Utilities**: `extension/utils/helpers.js` - Shared helper functions and constants

## Key Features

### 1. Focus Mode Toggle (Global Control)
- Main enable/disable mechanism for all features
- Persistent across browser sessions
- Default OFF to avoid unexpected behavior

### 2. Smart Text Collapse
- Collapses paragraphs longer than configurable threshold (default: 400 chars)
- Shows concise summary with accessible expand/collapse controls
- Uses DOM mutation observers for real-time updates
- Preserves original content structure

### 3. TL;DR Code Preview
- Surfaces first relevant code block at top of sections
- Creates deep-link back to original context
- Clones code with enhanced accessibility attributes
- Maintains copy-paste functionality

### 4. Semantic Keyword Highlighting
- Highlights technical keywords in prose and code blocks
- Default keywords: `function`, `const`, `class`, `API`, `endpoint`, etc.
- Configurable via options page
- Non-intrusive highlighting approach

### 5. Reading Mask Overlay
- Visual focus overlay to reduce distractions
- Follows cursor/scroll position
- Configurable size and opacity
- Helpful for maintaining focus on current content

### 6. Collapsible Sections
- Allows expanding/collapsing documentation sections
- Improves navigation through long documents
- Maintains section context and structure
- Keyboard navigation support

### 7. Layout Trimming
- Hides noisy banners and sidebars
- Reduces cognitive load from page chrome
- Focuses content area for better reading
- Reversible on-demand

### 8. Navigation Aids
- Floating current-section tracker
- Keyboard shortcuts support
- Quick jump to section functionality
- Progress indicators for long pages

## Site Detection & Activation System

### Multi-Layer Detection Approach
1. **URL Pattern Matching**: Explicit allowlist for known documentation domains
2. **Host and Path Analysis**: Keyword-based detection
3. **DOM Structure Examination**: Content pattern recognition

### Supported Documentation Sites
The extension supports 20+ major documentation platforms including:
- **MDN Web Docs** (developer.mozilla.org)
- **GitHub Docs** (docs.github.com)
- **npm** (npmjs.com/package)
- **Python** (docs.python.org)
- **Rust** (doc.rust-lang.org, docs.rs)
- **Go** (go.dev, pkg.go.dev)
- **Node.js** (nodejs.org/api)
- **Microsoft Learn** (learn.microsoft.com)
- **Laravel** (laravel.com/docs)
- **Django** (docs.djangoproject.com)

### Activation Flow
```
URL Detection → Manual Override Check → Focus Mode Check → Feature Activation
```

### Manual Overrides
- Users can enable/disable per-domain
- Persists across browser sessions
- Shows recognition status in popup
- Quick enable for non-detected sites

## Configuration & Presets

### Built-in Presets
1. **Balanced**: Default moderate approach (400 chars threshold)
2. **Skim**: Fast scanning with aggressive collapse (280 chars, trim chrome)
3. **Focus**: Deep reading with dyslexia mode (340 chars, reading mask)
4. **Deep**: Comprehensive analysis (520 chars, all features)

### Customizable Options
- Collapse threshold (120-2000 characters)
- Keyword highlighting list
- Feature toggles for each enhancement
- Domain-specific presets
- Visual appearance settings

## Privacy & Security

### Privacy First Approach
- **Zero external network requests**: All processing happens locally
- **No telemetry or analytics**: No data collection or tracking
- **Optional host permissions**: Requested only when enabling manually
- **Local storage only**: Settings stored in browser storage

### Performance Guarantees
- Target activation under 150ms per page
- Batch DOM writes and mutation observers
- Clean activation/deactivation cycles
- Memory management with proper cleanup

## Development Guidelines

### Technical Stack
- **Vanilla JavaScript (ES6+)**: No external dependencies
- **Manifest V3**: Latest Chrome extension standards
- **WCAG 2.1 AA**: Accessibility compliance
- **Modern CSS**: Feature-based styling with proper cascade

### Code Quality Standards
- **Non-destructive DOM manipulation**: All features preserve original content
- **Accessibility first**: Proper ARIA labels, keyboard navigation, focus management
- **Performance optimized**: Efficient DOM operations and event handling
- **Comprehensive error handling**: Graceful degradation and cleanup

### Development Workflow
1. **Feature Development**: Create modular features in `features/` directory
2. **Local Testing**: Manual testing across target documentation sites
3. **Accessibility Validation**: Ensure WCAG compliance
4. **Performance Monitoring**: Check activation times and memory usage
5. **Cross-site Compatibility**: Test across supported documentation platforms

### Testing Strategy
- Manual testing across target documentation sites
- Focus on copy/paste integrity and functionality preservation
- Performance monitoring for activation times
- Accessibility validation
- Cross-browser compatibility checks

## Unique Implementation Approaches

### 1. Feature Management Pattern
- Unified activation/deactivation lifecycle
- Clean initialization and cleanup procedures
- Feature dependency management
- Status tracking and reporting

### 2. Smart Content Detection
- Distinguishes between example code and inline code snippets
- Identifies documentation structure patterns
- Adaptive content analysis based on site
- Context-aware feature application

### 3. Fallback Systems
- Graceful degradation from chrome.storage.sync to localStorage
- Feature-specific error handling
- Progressive enhancement approach
- Compatibility across browser versions

### 4. Accessibility-First Design
- Proper ARIA labeling and semantic markup
- Keyboard navigation support
- Focus management and visual indicators
- Screen reader compatibility

## Usage Instructions

### For Users
1. Install the DocsFocus extension from Chrome Web Store
2. Navigate to supported documentation site
3. Click extension icon to enable Focus Mode
4. Choose appropriate preset (Balanced, Skim, Focus, Deep)
5. Fine-tune settings in options page if needed

### For Developers
1. Features are modular - check `extension/content/features/` directory
2. Each feature follows standard lifecycle: init(), activate(), deactivate(), cleanup()
3. Use `extension/utils/helpers.js` for shared utilities
4. Test across multiple documentation sites
5. Ensure accessibility compliance in all implementations

## Future Enhancement Areas

### Potential Features
- Custom user keyword lists
- Reading speed estimation
- Content summarization
- Cross-session reading position memory
- Export/share reading configurations
- Integration with developer tools

### Platform Expansion
- Firefox extension support
- Safari extension support
- Edge extension support
- Mobile browser considerations

### Advanced Functionality
- Machine learning for content classification
- User behavior analysis and optimization
- Collaborative filtering recommendations
- Integration with documentation APIs
