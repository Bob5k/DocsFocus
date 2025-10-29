export const STORAGE_KEYS = {
  ADHD_MODE: 'docsfocusAdhdMode',
  SETTINGS: 'docsfocusSettings',
  MANUAL_OVERRIDES: 'docsfocusManualOverrides',
  DOMAIN_SETTINGS: 'docsfocusDomainSettings'
};

export const MESSAGE_TYPES = {
  GET_STATE: 'docsfocus:getState',
  TOGGLE_ADHD: 'docsfocus:toggleAdhd',
  SETTINGS_UPDATED: 'docsfocus:settingsUpdated',
  MANUAL_OVERRIDE: 'docsfocus:manualOverride',
  REQUEST_SETTINGS: 'docsfocus:requestSettings',
  DOMAIN_SETTINGS: 'docsfocus:domainSettings'
};

export const DEFAULT_KEYWORDS = [
  'function',
  'const',
  'let',
  'var',
  'class',
  'interface',
  'type',
  'import',
  'export',
  'async',
  'await',
  'return',
  'throw',
  'try',
  'catch',
  'promise',
  'API',
  'endpoint',
  'method',
  'route',
  'request',
  'response'
];

export const DEFAULT_SETTINGS = {
  collapseThreshold: 350,
  keywords: DEFAULT_KEYWORDS,
  highlightInCode: true,
  previewTlDr: true,
  readingMask: true,
  collapsibleSections: true,
  trimChrome: false,
  sectionTracker: true,
  keyboardShortcuts: true,
  dyslexiaMode: false,
  collapseCodeParagraphs: true,
  preset: 'balanced'
};

export const SETTINGS_PRESETS = {
  balanced: {
    collapseThreshold: 350,
    readingMask: true,
    trimChrome: false,
    previewTlDr: true,
    sectionTracker: true,
    keyboardShortcuts: true,
    collapsibleSections: true,
    dyslexiaMode: false,
    collapseCodeParagraphs: true,
    readingMaskConfig: {
      enabled: true,
      focusHeightRatio: 0.32,
      minFocusHeight: 160,
      maxFocusHeight: 360,
      defaultPositionRatio: 0.33
    }
  },
  skim: {
    collapseThreshold: 280,
    readingMask: false,
    trimChrome: true,
    previewTlDr: true,
    sectionTracker: true,
    keyboardShortcuts: true,
    collapsibleSections: true,
    dyslexiaMode: false,
    collapseCodeParagraphs: true,
    readingMaskConfig: {
      enabled: false
    }
  },
  focus: {
    collapseThreshold: 340,
    readingMask: true,
    trimChrome: true,
    previewTlDr: true,
    sectionTracker: true,
    keyboardShortcuts: true,
    collapsibleSections: true,
    dyslexiaMode: true,
    collapseCodeParagraphs: false,
    readingMaskConfig: {
      enabled: true,
      focusHeightRatio: 0.28,
      minFocusHeight: 140,
      maxFocusHeight: 320,
      defaultPositionRatio: 0.35
    }
  }
};

const PRESET_COMPARISON_KEYS = [
  'collapseThreshold',
  'highlightInCode',
  'previewTlDr',
  'readingMask',
  'collapsibleSections',
  'trimChrome',
  'sectionTracker',
  'keyboardShortcuts',
  'dyslexiaMode',
  'collapseCodeParagraphs'
];

export const DOCS_PATTERNS = [
  /developer\.mozilla\.org/,
  /docs\.github\.com/,
  /npmjs\.com\/package/,
  /docs\.python\.org/,
  /doc\.rust-lang\.org/,
  /docs\.rs/,
  /readthedocs\.io/,
  /go\.dev/,
  /pkg\.go\.dev/,
  /nodejs\.org\/api/,
  /docs\.oracle\.com/,
  /learn\.microsoft\.com/,
  /docs\.djangoproject\.com/,
  /kotlinlang\.org\/docs/,
  /doc\.qt\.io/,
  /laravel\.com\/docs/,
  /ruby-doc\.org/
];

const DOCS_HOST_KEYWORDS = [
  'docs',
  'doc',
  'developer',
  'devdocs',
  'api',
  'reference',
  'manual'
];

const DOCS_PATH_KEYWORDS = [
  'docs',
  'documentation',
  'reference',
  'api',
  'guide',
  'manual',
  'tutorial',
  'handbook'
];

const DOCS_DOM_HINTS = [
  'article',
  'main',
  '[data-docs-root]',
  '[data-nav-type="docs"]',
  '[class*="doc"]',
  '[class*="Docs"]',
  'nav.breadcrumb',
  'div.breadcrumbs',
  'div.sidebar',
  'aside[role="complementary"]'
];

const DOCS_DOM_KEYWORD_REGEX = /\b(api|docs?|guide|reference|manual|sdk|cookbook|tutorial)\b/i;

export const DEFAULT_OVERRIDE_ENTRY = {
  enabled: true,
  timestamp: Date.now()
};

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && !!chrome.storage;
}

function storageGet(area, keys) {
  return new Promise((resolve, reject) => {
    try {
      area.get(keys, (result) => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function storageSet(area, values) {
  return new Promise((resolve, reject) => {
    try {
      area.set(values, () => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

function storageRemove(area, keys) {
  return new Promise((resolve, reject) => {
    try {
      area.remove(keys, () => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function withFallback(fn) {
  if (!hasChromeStorage()) {
    throw new Error('chrome.storage unavailable in this context');
  }

  try {
    return await fn(chrome.storage.sync);
  } catch (error) {
    console.warn('[DocsFocus] Falling back to chrome.storage.local:', error);
    try {
      return await fn(chrome.storage.local);
    } catch (localError) {
      console.warn('[DocsFocus] Falling back to window.localStorage:', localError);
      if (typeof window !== 'undefined' && window.localStorage) {
        return fn(createLocalStorageBridge(window.localStorage));
      }
      throw localError;
    }
  }
}

function createLocalStorageBridge(localStorage) {
  return {
    async get(keys, callback) {
      const result = {};
      const keyArray = Array.isArray(keys) ? keys : Object.keys(keys ?? {});
      keyArray.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            result[key] = JSON.parse(value);
          } catch (err) {
            result[key] = value;
          }
        } else if (keys && !Array.isArray(keys) && Object.prototype.hasOwnProperty.call(keys, key)) {
          result[key] = keys[key];
        }
      });
      callback(result);
    },
    async set(values, callback) {
      Object.entries(values).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      callback();
    },
    async remove(keys, callback) {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach((key) => localStorage.removeItem(key));
      callback();
    }
  };
}

export async function getAdhdMode() {
  const result = await withFallback((area) => storageGet(area, [STORAGE_KEYS.ADHD_MODE])).catch(() => ({}));
  const value = result?.[STORAGE_KEYS.ADHD_MODE];
  return typeof value === 'boolean' ? value : false;
}

export async function setAdhdMode(enabled) {
  await withFallback((area) => storageSet(area, { [STORAGE_KEYS.ADHD_MODE]: enabled }));
}

export async function getSettings() {
  const result = await withFallback((area) => storageGet(area, [STORAGE_KEYS.SETTINGS])).catch(() => ({}));
  const stored = result?.[STORAGE_KEYS.SETTINGS];
  return normalizeSettings(stored);
}

export async function setSettings(settings) {
  const normalized = normalizeSettings(settings);
  await withFallback((area) => storageSet(area, { [STORAGE_KEYS.SETTINGS]: normalized }));
  return normalized;
}

export async function resetSettings() {
  await withFallback((area) => storageRemove(area, [STORAGE_KEYS.SETTINGS]));
  return DEFAULT_SETTINGS;
}

export function normalizeSettings(settings) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...(settings ?? {})
  };

  // Ensure keywords is a unique, non-empty array of strings
  merged.keywords = Array.isArray(merged.keywords)
    ? Array.from(new Set(
        merged.keywords
          .map((keyword) => (typeof keyword === 'string' ? keyword.trim() : ''))
          .filter(Boolean)
      ))
    : [...DEFAULT_KEYWORDS];

  // Constrain collapseThreshold to sensible range
  const threshold = Number(merged.collapseThreshold);
  merged.collapseThreshold = Number.isFinite(threshold)
    ? Math.min(Math.max(threshold, 120), 2000)
    : DEFAULT_SETTINGS.collapseThreshold;

  merged.highlightInCode = Boolean(merged.highlightInCode);
  merged.previewTlDr = Boolean(merged.previewTlDr);
  merged.readingMask = Boolean(merged.readingMask);
  merged.collapsibleSections = Boolean(merged.collapsibleSections);
  merged.trimChrome = Boolean(merged.trimChrome);
  merged.sectionTracker = Boolean(merged.sectionTracker);
  merged.keyboardShortcuts = Boolean(merged.keyboardShortcuts);
  merged.dyslexiaMode = Boolean(merged.dyslexiaMode);
  merged.collapseCodeParagraphs = Boolean(merged.collapseCodeParagraphs);
  const desiredPreset = typeof merged.preset === 'string' ? merged.preset : DEFAULT_SETTINGS.preset;
  const presetMatch = settingsMatchPreset(merged, desiredPreset) ? desiredPreset : findMatchingPreset(merged);
  merged.preset = presetMatch;

  return merged;
}

export async function getManualOverrides() {
  const result = await withFallback((area) => storageGet(area, [STORAGE_KEYS.MANUAL_OVERRIDES])).catch(() => ({}));
  const overrides = result?.[STORAGE_KEYS.MANUAL_OVERRIDES];
  if (overrides && typeof overrides === 'object') {
    return overrides;
  }
  return {};
}

export async function updateManualOverride(domain, enabled) {
  if (!domain) {
    return getManualOverrides();
  }
  const key = domain.toLowerCase();
  const overrides = await getManualOverrides();
  const next = { ...overrides };
  if (enabled === null) {
    delete next[key];
  } else {
    next[key] = {
      enabled,
      timestamp: Date.now()
    };
  }
  await withFallback((area) => storageSet(area, { [STORAGE_KEYS.MANUAL_OVERRIDES]: next }));
  return next;
}

export async function getDomainSettings() {
  const result = await withFallback((area) => storageGet(area, [STORAGE_KEYS.DOMAIN_SETTINGS])).catch(() => ({}));
  const stored = result?.[STORAGE_KEYS.DOMAIN_SETTINGS];
  if (stored && typeof stored === 'object') {
    const normalized = {};
    Object.entries(stored).forEach(([domain, value]) => {
      if (value && typeof value === 'object') {
        normalized[domain] = normalizeSettings(value);
      }
    });
    return normalized;
  }
  return {};
}

export async function setDomainSettings(domain, settings) {
  if (!domain) {
    return getDomainSettings();
  }
  const key = domain.toLowerCase();
  const current = await getDomainSettings();
  const next = { ...current, [key]: normalizeSettings(settings) };
  await withFallback((area) => storageSet(area, { [STORAGE_KEYS.DOMAIN_SETTINGS]: next }));
  return next;
}

export async function clearDomainSettings(domain) {
  if (!domain) {
    const empty = {};
    await withFallback((area) => storageSet(area, { [STORAGE_KEYS.DOMAIN_SETTINGS]: empty }));
    return empty;
  }
  const key = domain.toLowerCase();
  const current = await getDomainSettings();
  if (Object.prototype.hasOwnProperty.call(current, key)) {
    delete current[key];
    await withFallback((area) => storageSet(area, { [STORAGE_KEYS.DOMAIN_SETTINGS]: current }));
  }
  return current;
}

export function mergeSettings(baseSettings = DEFAULT_SETTINGS, overrides = {}) {
  return normalizeSettings({
    ...baseSettings,
    ...(overrides ?? {})
  });
}

export function applyPresetSettings(presetName, baseSettings = DEFAULT_SETTINGS) {
  const preset = SETTINGS_PRESETS[presetName];
  if (!preset) {
    return normalizeSettings(baseSettings);
  }
  return normalizeSettings({
    ...baseSettings,
    ...preset,
    preset: presetName
  });
}

export function settingsMatchPreset(settings, presetName) {
  if (!settings || !SETTINGS_PRESETS[presetName]) {
    return false;
  }
  const baseline = {
    ...DEFAULT_SETTINGS,
    ...SETTINGS_PRESETS[presetName]
  };
  return PRESET_COMPARISON_KEYS.every((key) => {
    const baselineValue = baseline[key];
    const currentValue = settings[key];
    if (typeof baselineValue === 'boolean') {
      return Boolean(currentValue) === baselineValue;
    }
    return currentValue === baselineValue;
  });
}

export function determinePreset(settings) {
  const normalized = normalizeSettings(settings);
  return normalized.preset;
}

function findMatchingPreset(settings) {
  const presetNames = Object.keys(SETTINGS_PRESETS);
  for (const name of presetNames) {
    if (settingsMatchPreset(settings, name)) {
      return name;
    }
  }
  return 'custom';
}

export function analyzeDocsMatch(url, metadata = {}) {
  const result = {
    matched: false,
    reason: null,
    signals: []
  };

  let parsedUrl;
  try {
    parsedUrl = typeof url === 'string' ? new URL(url) : url;
  } catch (error) {
    console.warn('[DocsFocus] Unable to parse URL for matching:', error);
    return result;
  }

  const href = parsedUrl.href;
  const host = parsedUrl.host;
  const pathname = parsedUrl.pathname || '';

  const patternMatch = DOCS_PATTERNS.find((pattern) => pattern.test(href) || pattern.test(host));
  if (patternMatch) {
    result.matched = true;
    result.reason = 'pattern';
    result.signals.push(`Matched allowlist pattern ${patternMatch}`);
    return result;
  }

  const hostTokens = host
    .split('.')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (hostTokens.some((token) => DOCS_HOST_KEYWORDS.includes(token))) {
    result.matched = true;
    result.reason = 'host-keyword';
    result.signals.push(`Host contains keyword: ${host}`);
    return result;
  }

  const pathSegments = pathname
    .split('/')
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
  if (pathSegments.some((segment) => DOCS_PATH_KEYWORDS.includes(segment))) {
    result.matched = true;
    result.reason = 'path-keyword';
    result.signals.push(`Path contains documentation keyword: ${pathname}`);
    return result;
  }

  const documentRef = metadata.document ?? (typeof document !== 'undefined' ? document : null);
  if (documentRef && documentRef.body) {
    const hasDomHint = DOCS_DOM_HINTS.some((selector) => documentRef.querySelector(selector));
    if (hasDomHint) {
      const headline = documentRef.querySelector('h1, h2');
      const headingText = headline?.textContent?.trim();
      if (!headingText || DOCS_DOM_KEYWORD_REGEX.test(headingText)) {
        result.matched = true;
        result.reason = 'dom-structure';
        result.signals.push('DOM structure resembles documentation layout');
        return result;
      }
    }
  }

  return result;
}

export function matchesDocsPattern(url, metadata = {}) {
  return analyzeDocsMatch(url, metadata).matched;
}

export function describeDocsMatch(url, metadata = {}) {
  const analysis = analyzeDocsMatch(url, metadata);
  if (!analysis.matched) {
    return {
      matched: false,
      label: 'No documentation signals detected.',
      signals: analysis.signals
    };
  }

  let label = 'Recognized documentation site';
  switch (analysis.reason) {
    case 'pattern':
      label = 'Recognized known documentation domain';
      break;
    case 'host-keyword':
      label = 'Host looks like documentation';
      break;
    case 'path-keyword':
      label = 'URL path looks like documentation';
      break;
    case 'dom-structure':
      label = 'Page structure looks like documentation';
      break;
    default:
      break;
  }

  return {
    matched: true,
    label,
    reason: analysis.reason,
    signals: analysis.signals
  };
}

export function getDomainFromUrl(url = window.location.href) {
  try {
    const targetUrl = typeof url === 'string' ? new URL(url) : url;
    return targetUrl.hostname;
  } catch (error) {
    console.warn('[DocsFocus] Unable to resolve domain from URL:', error);
    return null;
  }
}

export function composeClassName(base, modifier, enabled) {
  if (!enabled) {
    return base;
  }
  return `${base} ${base}--${modifier}`.trim();
}

export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) {
    el.className = options.className;
  }
  if (options.textContent) {
    el.textContent = options.textContent;
  }
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        el.setAttribute(key, value);
      }
    });
  }
  return el;
}
