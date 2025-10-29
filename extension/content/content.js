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
      getDomainSettings,
      getAdhdMode,
      getManualOverrides,
      mergeSettings,
      matchesDocsPattern,
      describeDocsMatch,
      getDomainFromUrl
    } = helpers;

    const baseSettings = normalizeSettings(DEFAULT_SETTINGS);
    const state = {
      initialized: false,
      adhdMode: false,
      settings: baseSettings,
      globalSettings: baseSettings,
      manualOverrides: {},
      siteEligible: false,
      domain: getDomainFromUrl(window.location.href),
      featuresActive: false,
      autoDetected: matchesDocsPattern(window.location.href, { document }),
      autoDetectedInfo: describeDocsMatch?.(window.location.href, { document }) ?? null,
      eligibilitySource: 'unknown',
      eligibilityMessage: '',
      domainSettingsMap: {},
      domainSettings: null,
      domainPreset: baseSettings.preset
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
        logDiagnostics('activate');
      } else if (state.featuresActive) {
        teardownFeatures();
        logDiagnostics('teardown');
      } else {
        logDiagnostics('not-eligible');
      }
    }

    function getStateSnapshot() {
      return {
        adhdMode: state.adhdMode,
        settings: state.settings,
        globalSettings: state.globalSettings,
        manualOverrides: state.manualOverrides,
        siteEligible: state.siteEligible,
        featuresActive: state.featuresActive,
        domain: state.domain,
        autoDetected: state.autoDetected,
        autoDetectedInfo: state.autoDetectedInfo,
        domainSettings: state.domainSettings,
        domainPreset: state.domainPreset,
        eligibilitySource: state.eligibilitySource,
        eligibilityMessage: state.eligibilityMessage,
        url: window.location.href
      };
    }

    function evaluateEligibility(overrides) {
      state.autoDetectedInfo = describeDocsMatch
        ? describeDocsMatch(window.location.href, { document })
        : { matched: matchesDocsPattern(window.location.href, { document }), label: null };
      state.autoDetected = Boolean(state.autoDetectedInfo?.matched);

      const overrideEntry = overrides?.[state.domain];
      if (overrideEntry && typeof overrideEntry.enabled === 'boolean') {
        if (overrideEntry.enabled) {
          return {
            eligible: true,
            source: 'manual-allow',
            message: 'Manually enabled for this domain.'
          };
        }
        return {
          eligible: false,
          source: 'manual-block',
          message: 'Manually disabled for this domain.'
        };
      }
      if (state.autoDetected) {
        return {
          eligible: true,
          source: 'auto',
          message: state.autoDetectedInfo?.label ?? 'Recognized documentation patterns.'
        };
      }
      return {
        eligible: false,
        source: 'not-detected',
        message: 'DocsFocus did not detect documentation signals.'
      };
    }

    async function bootstrapState() {
      const [manualOverrides, adhdMode, settings, domainSettingsMap] = await Promise.all([
        getManualOverrides(),
        getAdhdMode(),
        getSettings(),
        getDomainSettings()
      ]);
      const normalizedGlobal = normalizeSettings(settings);
      const domainMap = domainSettingsMap && typeof domainSettingsMap === 'object' ? domainSettingsMap : {};
      const domainOverride = state.domain ? domainMap[state.domain] ?? null : null;

      state.manualOverrides = manualOverrides;
      state.adhdMode = adhdMode;
      state.globalSettings = normalizedGlobal;
      state.domainSettingsMap = domainMap;
      state.domainSettings = domainOverride;
      state.settings = domainOverride ? mergeSettings(normalizedGlobal, domainOverride) : normalizedGlobal;
      state.domainPreset = domainOverride?.preset ?? normalizedGlobal.preset;

      const eligibility = evaluateEligibility(manualOverrides);
      state.siteEligible = eligibility.eligible;
      state.eligibilitySource = eligibility.source;
      state.eligibilityMessage = eligibility.message;
      state.initialized = true;
      logDiagnostics('bootstrap');
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
        state.globalSettings = normalizeSettings(value);
        const domainOverride = state.domain ? state.domainSettingsMap?.[state.domain] ?? null : null;
        state.settings = domainOverride
          ? mergeSettings(state.globalSettings, domainOverride)
          : state.globalSettings;
        state.domainPreset = domainOverride?.preset ?? state.globalSettings.preset;
        applyActivation();
      });

      maybeUpdate(STORAGE_KEYS.MANUAL_OVERRIDES, (value) => {
        const overrides = value && typeof value === 'object' ? value : {};
        state.manualOverrides = overrides;
        const eligibility = evaluateEligibility(overrides);
        state.siteEligible = eligibility.eligible;
        state.eligibilitySource = eligibility.source;
        state.eligibilityMessage = eligibility.message;
        applyActivation();
      });

      maybeUpdate(STORAGE_KEYS.DOMAIN_SETTINGS, (value) => {
        const map = value && typeof value === 'object' ? value : {};
        const normalizedMap = {};
        Object.entries(map).forEach(([domainKey, entry]) => {
          if (entry && typeof entry === 'object') {
            normalizedMap[domainKey] = normalizeSettings(entry);
          }
        });
        state.domainSettingsMap = normalizedMap;
        const domainOverride = state.domain ? normalizedMap[state.domain] ?? null : null;
        state.domainSettings = domainOverride;
        state.settings = domainOverride
          ? mergeSettings(state.globalSettings, domainOverride)
          : state.globalSettings;
        state.domainPreset = domainOverride?.preset ?? state.globalSettings.preset;
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
            const eligibility = evaluateEligibility(state.manualOverrides);
            state.siteEligible = eligibility.eligible;
            state.eligibilitySource = eligibility.source;
            state.eligibilityMessage = eligibility.message;
            applyActivation();
          }
          sendResponse({ ok: true, state: getStateSnapshot() });
          return false;
        }
        case MESSAGE_TYPES.DOMAIN_SETTINGS: {
          if (state.domain && message.payload?.domain === state.domain) {
            const nextMap = { ...state.domainSettingsMap };
            if (message.payload?.clear) {
              delete nextMap[state.domain];
              state.domainSettings = null;
              state.settings = state.globalSettings;
              state.domainPreset = state.globalSettings.preset;
            } else if (message.payload?.settings) {
              const normalized = normalizeSettings(message.payload.settings);
              nextMap[state.domain] = normalized;
              state.domainSettings = normalized;
              state.settings = mergeSettings(state.globalSettings, normalized);
              state.domainPreset = normalized.preset;
            }
            state.domainSettingsMap = nextMap;
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
    function logDiagnostics(context) {
      try {
        const payload = {
          context,
          domain: state.domain,
          adhdMode: state.adhdMode,
          siteEligible: state.siteEligible,
          eligibilitySource: state.eligibilitySource,
          autoDetected: state.autoDetected,
          reason: state.eligibilityMessage,
          preset: state.domainPreset,
          hasDomainOverride: Boolean(state.domainSettings)
        };
        console.debug('[DocsFocus]', payload);
      } catch {
        // Ignore logging errors (e.g., JSON stringify issues).
      }
    }
