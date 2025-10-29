const popupState = {
  tabId: null,
  tabUrl: null,
  contentState: null,
  helpers: null,
  siteSection: null,
  siteStatusText: null,
  siteButton: null,
  idleEnableButton: null
};

document.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  try {
    popupState.helpers = await import(chrome.runtime.getURL('utils/helpers.js'));
  } catch (error) {
    console.error('[DocsFocus] Failed to load helpers in popup:', error);
    return;
  }

  const toggle = document.getElementById('adhd-toggle');
  const statusText = document.getElementById('status-text');
  popupState.siteSection = document.getElementById('site-section');
  popupState.siteStatusText = document.getElementById('site-status-text');
  popupState.siteButton = document.getElementById('site-toggle');
  popupState.idleEnableButton = document.getElementById('idle-enable');

  if (!toggle || !statusText) {
    console.warn('[DocsFocus] Popup markup missing expected elements.');
    return;
  }

  if (popupState.siteButton) {
    popupState.siteButton.addEventListener('click', handleSiteButtonClick);
  }

  if (popupState.idleEnableButton) {
    popupState.idleEnableButton.addEventListener('click', handleIdleEnableClick);
  }

  const activeTab = await resolveActiveTab();
  popupState.tabId = activeTab.id;
  popupState.tabUrl = activeTab.url;
  popupState.contentState = await requestContentState(popupState.tabId);

  if (!popupState.contentState) {
    popupState.contentState = await buildFallbackState();
  }

  toggle.checked = Boolean(popupState.contentState.adhdMode);
  renderStatus();
  updateSiteControls();

  toggle.addEventListener('change', async (event) => {
    const enabled = Boolean(event.target.checked);
    toggle.disabled = true;
    try {
      await popupState.helpers.setAdhdMode(enabled);
      if (popupState.tabId != null) {
        await sendMessageToTab(popupState.tabId, {
          type: popupState.helpers.MESSAGE_TYPES.TOGGLE_ADHD,
          payload: { enabled }
        });
        popupState.contentState = await requestContentState(popupState.tabId);
      } else {
        popupState.contentState = {
          ...popupState.contentState,
          adhdMode: enabled,
          featuresActive: enabled && popupState.contentState.siteEligible
        };
      }
    } catch (error) {
      console.error('[DocsFocus] Failed to toggle ADHD Mode:', error);
      event.target.checked = !enabled; // revert on failure
    } finally {
      toggle.disabled = false;
      renderStatus();
      updateSiteControls();
    }
  });

  chrome.storage.onChanged.addListener(handleStorageChanges);
  window.addEventListener('unload', () => {
    chrome.storage.onChanged.removeListener(handleStorageChanges);
  });
}

function renderStatus() {
  const statusText = document.getElementById('status-text');
  if (!popupState.contentState || !statusText) {
    return;
  }

  if (popupState.idleEnableButton) {
    popupState.idleEnableButton.hidden = true;
    popupState.idleEnableButton.disabled = false;
  }

  const {
    adhdMode,
    siteEligible,
    featuresActive,
    manualOverrides: storedOverrides,
    domain,
    autoDetected
  } = popupState.contentState;
  const manualOverrides = storedOverrides && typeof storedOverrides === 'object' ? storedOverrides : {};

  const canDeriveFromUrl =
    popupState.tabUrl &&
    popupState.tabUrl.startsWith('http') &&
    popupState.helpers?.getDomainFromUrl;
  const derivedDomain = domain || (canDeriveFromUrl ? popupState.helpers.getDomainFromUrl(popupState.tabUrl) : null);
  const overrideEntry = derivedDomain ? manualOverrides?.[derivedDomain] : null;
  const overrideDisabled = overrideEntry?.enabled === false;
  const canOfferManualEnable =
    Boolean(derivedDomain) && (!popupState.tabUrl || popupState.tabUrl.startsWith('http'));

  if (!siteEligible) {
    if (overrideDisabled || autoDetected) {
      statusText.textContent = 'DocsFocus is disabled for this domain.';
    } else {
      statusText.textContent = 'DocsFocus is idle: page not detected as documentation.';
      if (popupState.idleEnableButton && canOfferManualEnable) {
        popupState.idleEnableButton.hidden = false;
      }
    }
    return;
  }

  if (!adhdMode) {
    statusText.textContent = 'ADHD Mode is OFF. Enable to apply focus helpers.';
    return;
  }

  statusText.textContent = featuresActive
    ? 'DocsFocus is active on this page.'
    : 'DocsFocus is preparing enhancements…';
}

function updateSiteControls() {
  if (!popupState.siteSection || !popupState.siteStatusText || !popupState.siteButton) {
    return;
  }
  const state = popupState.contentState;
  if (!state?.domain) {
    popupState.siteSection.hidden = true;
    return;
  }

  popupState.siteSection.hidden = false;

  const overrideEntry = state.manualOverrides?.[state.domain];
  const overrideEnabled = overrideEntry?.enabled === true;
  const overrideDisabled = overrideEntry?.enabled === false;
  const autoDetected = Boolean(state.autoDetected);

  let hint = '';
  let action = 'enable';
  let label = 'Enable on this domain';

  if (autoDetected) {
    if (overrideDisabled) {
      hint = 'DocsFocus is disabled for this domain. Re-enable to restore automatic enhancements.';
      action = 'clear';
      label = 'Re-enable on this domain';
    } else {
      hint = 'DocsFocus recognizes this documentation site automatically.';
      action = 'disable';
      label = 'Disable on this domain';
    }
  } else {
    if (overrideEnabled) {
      hint = 'DocsFocus is manually enabled for this domain.';
      action = 'clear';
      label = 'Disable manual enable';
    } else {
      hint = 'Enable DocsFocus manually if you want focus helpers on this site.';
      action = 'enable';
      label = 'Enable on this domain';
    }
  }

  popupState.siteStatusText.textContent = hint;
  popupState.siteButton.textContent = label;
  popupState.siteButton.dataset.action = action;
  popupState.siteButton.disabled = false;
}

async function resolveActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      const tab = tabs[0];
      return {
        id: tab.id ?? null,
        url: tab.url ?? null
      };
    }
  } catch (error) {
    console.warn('[DocsFocus] Unable to resolve active tab:', error);
  }
  return { id: null, url: null };
}

async function requestContentState(tabId) {
  if (tabId == null) {
    return null;
  }
  try {
    const response = await sendMessageToTab(tabId, {
      type: popupState.helpers.MESSAGE_TYPES.GET_STATE
    });
    if (response?.state?.url && !popupState.tabUrl) {
      popupState.tabUrl = response.state.url;
    }
    return response?.state ?? null;
  } catch (error) {
    console.warn('[DocsFocus] Content script unreachable for state request:', error);
    return null;
  }
}

async function buildFallbackState(providedOverrides) {
  const overridesSource =
    providedOverrides && typeof providedOverrides === 'object'
      ? Promise.resolve(providedOverrides)
      : popupState.helpers.getManualOverrides();
  const [fallbackAdhd, overrides] = await Promise.all([
    popupState.helpers.getAdhdMode(),
    overridesSource
  ]);

  const manualOverrides = overrides && typeof overrides === 'object' ? overrides : {};
  const canDeriveFromUrl =
    popupState.tabUrl &&
    popupState.tabUrl.startsWith('http') &&
    popupState.helpers.getDomainFromUrl;
  const domainFromUrl = canDeriveFromUrl ? popupState.helpers.getDomainFromUrl(popupState.tabUrl) : null;
  const autoDetected =
    popupState.tabUrl && popupState.tabUrl.startsWith('http') && popupState.helpers.matchesDocsPattern
      ? popupState.helpers.matchesDocsPattern(popupState.tabUrl)
      : false;
  const overrideEntry = domainFromUrl ? manualOverrides[domainFromUrl] : null;
  const siteEligible = autoDetected || overrideEntry?.enabled === true;

  return {
    adhdMode: fallbackAdhd,
    settings: popupState.helpers.DEFAULT_SETTINGS,
    siteEligible,
    featuresActive: false,
    domain: domainFromUrl ?? null,
    url: popupState.tabUrl ?? null,
    manualOverrides,
    autoDetected
  };
}

function handleStorageChanges(changes, areaName) {
  if (areaName !== 'sync' && areaName !== 'local') {
    return;
  }
  if (!changes || !popupState.contentState) {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(changes, popupState.helpers.STORAGE_KEYS.ADHD_MODE)) {
    const nextValue = changes[popupState.helpers.STORAGE_KEYS.ADHD_MODE]?.newValue;
    popupState.contentState.adhdMode = Boolean(nextValue);
    const toggle = document.getElementById('adhd-toggle');
    if (toggle && toggle.checked !== popupState.contentState.adhdMode) {
      toggle.checked = popupState.contentState.adhdMode;
    }
    renderStatus();
  }

  if (Object.prototype.hasOwnProperty.call(changes, popupState.helpers.STORAGE_KEYS.MANUAL_OVERRIDES)) {
    const nextOverrides = changes[popupState.helpers.STORAGE_KEYS.MANUAL_OVERRIDES]?.newValue;
    const manualOverrides = nextOverrides && typeof nextOverrides === 'object' ? nextOverrides : {};
    popupState.contentState.manualOverrides = manualOverrides;
    if (popupState.contentState.domain) {
      const entry = manualOverrides[popupState.contentState.domain];
      const enabled = entry?.enabled === true;
      popupState.contentState.siteEligible = popupState.contentState.autoDetected || enabled;
    }
    updateSiteControls();
    renderStatus();
  }
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    if (tabId == null) {
      resolve(null);
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });
}

async function handleSiteButtonClick() {
  const action = popupState.siteButton?.dataset.action;
  const domain = popupState.contentState?.domain;
  if (!action || !domain) {
    return;
  }

  popupState.siteButton.disabled = true;

  let desired;
  if (action === 'enable') {
    desired = true;
  } else if (action === 'disable') {
    desired = false;
  } else {
    desired = null;
  }

  try {
    await applyManualOverride(domain, desired);
  } catch (error) {
    console.error('[DocsFocus] Failed to update manual override:', error);
  } finally {
    popupState.siteButton.disabled = false;
    renderStatus();
    updateSiteControls();
  }
}

async function handleIdleEnableClick() {
  if (!popupState.helpers) {
    return;
  }
  const primaryDomain = popupState.contentState?.domain;
  const canUseTabUrl = popupState.tabUrl && popupState.tabUrl.startsWith('http') && popupState.helpers.getDomainFromUrl;
  const fallbackDomain = canUseTabUrl ? popupState.helpers.getDomainFromUrl(popupState.tabUrl) : null;
  const domain = primaryDomain || fallbackDomain;
  if (!domain || !popupState.idleEnableButton) {
    return;
  }

  popupState.idleEnableButton.disabled = true;

  try {
    await applyManualOverride(domain, true);
  } catch (error) {
    console.error('[DocsFocus] Failed to manually enable DocsFocus:', error);
  } finally {
    popupState.idleEnableButton.disabled = false;
    renderStatus();
    updateSiteControls();
  }
}

async function applyManualOverride(domain, desired) {
  const payload = {
    type: popupState.helpers.MESSAGE_TYPES.MANUAL_OVERRIDE,
    payload: {
      domain,
      enabled: desired,
      tabId: popupState.tabId
    }
  };

  const response = await chrome.runtime.sendMessage(payload);
  if (response?.ok) {
    if (response.state) {
      popupState.contentState = response.state;
      popupState.tabUrl = response.state.url ?? popupState.tabUrl;
    } else {
      popupState.contentState = await buildFallbackState(response.overrides);
    }
  } else {
    // On failure attempt to refresh from content script/fallback to keep UI in sync.
    popupState.contentState = (await requestContentState(popupState.tabId)) ?? (await buildFallbackState());
  }
}
