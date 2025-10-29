const popupState = {
  tabId: null,
  contentState: null,
  helpers: null,
  siteSection: null,
  siteStatusText: null,
  siteButton: null
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

  if (!toggle || !statusText) {
    console.warn('[DocsFocus] Popup markup missing expected elements.');
    return;
  }

  if (popupState.siteButton) {
    popupState.siteButton.addEventListener('click', handleSiteButtonClick);
  }

  popupState.tabId = await resolveActiveTabId();
  popupState.contentState = await requestContentState(popupState.tabId);

  if (!popupState.contentState) {
    // Fallback to stored ADHD mode state when content script not reachable.
    const fallbackAdhd = await popupState.helpers.getAdhdMode();
    popupState.contentState = {
      adhdMode: fallbackAdhd,
      settings: popupState.helpers.DEFAULT_SETTINGS,
      siteEligible: false,
      featuresActive: false,
      domain: null,
      url: null,
      manualOverrides: {},
      autoDetected: false
    };
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

  const { adhdMode, siteEligible, featuresActive, manualOverrides, domain, autoDetected } = popupState.contentState;
  const overrideEntry = domain ? manualOverrides?.[domain] : null;
  const overrideDisabled = overrideEntry?.enabled === false;

  if (!siteEligible) {
    if (overrideDisabled || autoDetected) {
      statusText.textContent = 'DocsFocus is disabled for this domain.';
    } else {
      statusText.textContent = 'DocsFocus is idle: page not detected as documentation.';
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

async function resolveActiveTabId() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      return tabs[0].id ?? null;
    }
  } catch (error) {
    console.warn('[DocsFocus] Unable to resolve active tab:', error);
  }
  return null;
}

async function requestContentState(tabId) {
  if (tabId == null) {
    return null;
  }
  try {
    const response = await sendMessageToTab(tabId, {
      type: popupState.helpers.MESSAGE_TYPES.GET_STATE
    });
    return response?.state ?? null;
  } catch (error) {
    console.warn('[DocsFocus] Content script unreachable for state request:', error);
    return null;
  }
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
    popupState.contentState.manualOverrides = nextOverrides && typeof nextOverrides === 'object' ? nextOverrides : {};
    updateSiteControls();
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
    const response = await chrome.runtime.sendMessage({
      type: popupState.helpers.MESSAGE_TYPES.MANUAL_OVERRIDE,
      payload: {
        domain,
        enabled: desired,
        tabId: popupState.tabId
      }
    });

    if (response?.ok && response.state) {
      popupState.contentState = response.state;
    } else {
      popupState.contentState = await requestContentState(popupState.tabId);
    }
  } catch (error) {
    console.error('[DocsFocus] Failed to update manual override:', error);
  } finally {
    popupState.siteButton.disabled = false;
    renderStatus();
    updateSiteControls();
  }
}
