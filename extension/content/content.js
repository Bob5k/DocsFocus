(async function initDocsFocusContentScript() {
  try {
    if (window.DocsFocus?.initializing || window.DocsFocus?.initialized) {
      return;
    }
    window.DocsFocus = {
      ...(window.DocsFocus || {}),
      initializing: true
    };

    const helpers = await import(chrome.runtime.getURL('utils/helpers.js'));
    const {
      STORAGE_KEYS,
      MESSAGE_TYPES,
      DEFAULT_SETTINGS,
      normalizeSettings,
      getSettings,
      getAdhdMode,
      getManualOverrides,
      matchesDocsPattern,
      getDomainFromUrl
    } = helpers;

    const state = {
      initialized: false,
      adhdMode: false,
      settings: DEFAULT_SETTINGS,
      manualOverrides: {},
      siteEligible: false,
      domain: getDomainFromUrl(window.location.href),
      featuresActive: false,
      autoDetected: matchesDocsPattern(window.location.href)
    };

    const cleanupCallbacks = new Set();
    let featureManagerPromise = null;

    function registerCleanup(fn) {
      cleanupCallbacks.add(fn);
      return () => cleanupCallbacks.delete(fn);
    }

    function ensureFeatureManager() {
      if (!featureManagerPromise) {
        featureManagerPromise = import(chrome.runtime.getURL('content/features/index.js'))
          .then(({ createFeatureManager }) => createFeatureManager({ document, helpers }))
          .catch((error) => {
            console.error('[DocsFocus] Failed to load feature manager:', error);
            featureManagerPromise = null;
            throw error;
          });
      }
      return featureManagerPromise;
    }

    async function teardownFeatures() {
      cleanupCallbacks.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.warn('[DocsFocus] Error during feature cleanup', error);
        }
      });
      cleanupCallbacks.clear();

      try {
        if (featureManagerPromise) {
          const manager = await featureManagerPromise;
          manager?.deactivate();
        }
      } catch (error) {
        console.warn('[DocsFocus] Failed to deactivate features:', error);
      }

      document.documentElement.classList.remove('docsfocus-active');
      delete document.documentElement.dataset.docsfocusActive;
      state.featuresActive = false;
    }

    async function activateFeatures() {
      try {
        const manager = await ensureFeatureManager();
        if (state.featuresActive) {
          manager.update(state.settings);
          return;
        }
        document.documentElement.classList.add('docsfocus-active');
        document.documentElement.dataset.docsfocusActive = 'true';
        manager.activate(state.settings);
        state.featuresActive = true;
      } catch (error) {
        console.error('[DocsFocus] Unable to activate features:', error);
      }
    }

    function applyActivation() {
      const shouldActivate = state.adhdMode && state.siteEligible;
      if (shouldActivate) {
        activateFeatures();
      } else if (state.featuresActive) {
        teardownFeatures();
      }
    }

    function getStateSnapshot() {
      return {
        adhdMode: state.adhdMode,
        settings: state.settings,
        manualOverrides: state.manualOverrides,
        siteEligible: state.siteEligible,
        featuresActive: state.featuresActive,
        domain: state.domain,
        autoDetected: state.autoDetected,
        url: window.location.href
      };
    }

    function evaluateEligibility(overrides) {
      state.autoDetected = matchesDocsPattern(window.location.href);
      const overrideEntry = overrides?.[state.domain];
      if (overrideEntry && typeof overrideEntry.enabled === 'boolean') {
        return overrideEntry.enabled;
      }
      return state.autoDetected;
    }

    async function bootstrapState() {
      const [manualOverrides, adhdMode, settings] = await Promise.all([
        getManualOverrides(),
        getAdhdMode(),
        getSettings()
      ]);
      state.manualOverrides = manualOverrides;
      state.adhdMode = adhdMode;
      state.settings = normalizeSettings(settings);
      state.siteEligible = evaluateEligibility(manualOverrides);
      state.initialized = true;
    }

    function handleStorageChanges(changes, areaName) {
      if (!changes) {
        return;
      }
      const maybeUpdate = (key, apply) => {
        if (Object.prototype.hasOwnProperty.call(changes, key)) {
          const { newValue } = changes[key];
          apply(newValue);
        }
      };

      maybeUpdate(STORAGE_KEYS.ADHD_MODE, (value) => {
        state.adhdMode = Boolean(value);
        applyActivation();
      });

      maybeUpdate(STORAGE_KEYS.SETTINGS, (value) => {
        state.settings = normalizeSettings(value);
        // Feature modules will react to updated settings in tasks 1.5-1.7.
        applyActivation();
      });

      maybeUpdate(STORAGE_KEYS.MANUAL_OVERRIDES, (value) => {
        const overrides = value && typeof value === 'object' ? value : {};
        state.manualOverrides = overrides;
        state.siteEligible = evaluateEligibility(overrides);
        applyActivation();
      });
    }

    function handleMessage(message, sender, sendResponse) {
      if (!message || typeof message.type !== 'string') {
        return;
      }
      switch (message.type) {
        case MESSAGE_TYPES.GET_STATE: {
          sendResponse({ ok: true, state: getStateSnapshot() });
          return false;
        }
        case MESSAGE_TYPES.TOGGLE_ADHD: {
          state.adhdMode = Boolean(message.payload?.enabled);
          applyActivation();
          sendResponse({ ok: true, state: getStateSnapshot() });
          return false;
        }
        case MESSAGE_TYPES.SETTINGS_UPDATED: {
          state.settings = normalizeSettings(message.payload);
          applyActivation();
          sendResponse({ ok: true, state: getStateSnapshot() });
          return false;
        }
        case MESSAGE_TYPES.MANUAL_OVERRIDE: {
          if (state.domain && message.payload?.domain === state.domain) {
            const overrides = { ...state.manualOverrides };
            if (message.payload?.enabled === null) {
              delete overrides[state.domain];
            } else {
              overrides[state.domain] = {
                enabled: Boolean(message.payload.enabled),
                timestamp: Date.now()
              };
            }
            state.manualOverrides = overrides;
            state.siteEligible = evaluateEligibility(state.manualOverrides);
            applyActivation();
          }
          sendResponse({ ok: true, state: getStateSnapshot() });
          return false;
        }
        default:
          break;
      }
      return undefined;
    }

    await bootstrapState();
    applyActivation();

    chrome.storage.onChanged.addListener(handleStorageChanges);
    chrome.runtime.onMessage.addListener(handleMessage);

    // Expose a minimal API for future feature modules to register cleanups.
    window.DocsFocus = {
      ...(window.DocsFocus || {}),
      registerCleanup,
      teardownFeatures,
      activateFeatures,
      initialized: true,
      initializing: false,
      get state() {
        return getStateSnapshot();
      }
    };
  } catch (error) {
    console.error('[DocsFocus] Failed to initialize content script:', error);
  }
})();
