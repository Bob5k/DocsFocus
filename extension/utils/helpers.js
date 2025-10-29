export const STORAGE_KEYS = {
  ADHD_MODE: 'docsfocusAdhdMode',
  SETTINGS: 'docsfocusSettings',
  MANUAL_OVERRIDES: 'docsfocusManualOverrides'
};

export const MESSAGE_TYPES = {
  GET_STATE: 'docsfocus:getState',
  TOGGLE_ADHD: 'docsfocus:toggleAdhd',
  SETTINGS_UPDATED: 'docsfocus:settingsUpdated',
  MANUAL_OVERRIDE: 'docsfocus:manualOverride',
  REQUEST_SETTINGS: 'docsfocus:requestSettings'
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
  collapseThreshold: 400,
  keywords: DEFAULT_KEYWORDS,
  highlightInCode: true,
  previewTlDr: true
};

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
  /ruby-doc\.org/,
  /\/docs\//,
  /^https?:\/\/api\./
];

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

export function matchesDocsPattern(url) {
  try {
    const targetUrl = typeof url === 'string' ? new URL(url) : url;
    const href = targetUrl.href;
    const host = targetUrl.host;
    return DOCS_PATTERNS.some((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern.test(href) || pattern.test(host);
      }
      return false;
    });
  } catch (error) {
    console.warn('[DocsFocus] Unable to parse URL for matching:', error);
    return false;
  }
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
