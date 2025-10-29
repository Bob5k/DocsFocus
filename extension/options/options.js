const ui = {
  form: null,
  threshold: null,
  keywords: null,
  highlightInCode: null,
  previewTlDr: null,
  saveButton: null,
  resetButton: null,
  status: null
};

let helpersModule = null;
let statusTimer = null;

document.addEventListener('DOMContentLoaded', initializeOptionsPage);

async function initializeOptionsPage() {
  try {
    helpersModule = await import(chrome.runtime.getURL('utils/helpers.js'));
  } catch (error) {
    console.error('[DocsFocus] Failed to load helpers in options page:', error);
    return;
  }

  cacheDom();
  if (!ui.form) {
    console.warn('[DocsFocus] Options page missing form element.');
    return;
  }

  const settings = await helpersModule.getSettings();
  populateForm(settings);

  ui.form.addEventListener('submit', handleSubmit);
  ui.resetButton?.addEventListener('click', handleReset);
}

function cacheDom() {
  ui.form = document.getElementById('settings-form');
  ui.threshold = document.getElementById('collapse-threshold');
  ui.keywords = document.getElementById('keywords');
  ui.highlightInCode = document.getElementById('highlight-in-code');
  ui.previewTlDr = document.getElementById('preview-tldr');
  ui.saveButton = document.getElementById('save-button');
  ui.resetButton = document.getElementById('reset-button');
  ui.status = document.getElementById('save-status');
}

function populateForm(settings) {
  const normalized = helpersModule.normalizeSettings(settings);
  if (ui.threshold) {
    ui.threshold.value = normalized.collapseThreshold;
  }
  if (ui.keywords) {
    ui.keywords.value = normalized.keywords.join('\n');
  }
  if (ui.highlightInCode) {
    ui.highlightInCode.checked = Boolean(normalized.highlightInCode);
  }
  if (ui.previewTlDr) {
    ui.previewTlDr.checked = Boolean(normalized.previewTlDr);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!helpersModule) {
    return;
  }

  setButtonsDisabled(true);
  const pendingSettings = collectFormValues();

  try {
    const normalized = await helpersModule.setSettings(pendingSettings);
    populateForm(normalized);
    await broadcastSettingsUpdate(normalized);
    showStatus('Settings saved successfully.');
  } catch (error) {
    console.error('[DocsFocus] Failed to save settings:', error);
    showStatus('Could not save settings. Try again.', true);
  } finally {
    setButtonsDisabled(false);
  }
}

async function handleReset() {
  if (!helpersModule) {
    return;
  }
  setButtonsDisabled(true);
  try {
    const defaults = await helpersModule.resetSettings();
    populateForm(defaults);
    await broadcastSettingsUpdate(defaults);
    showStatus('Defaults restored.');
  } catch (error) {
    console.error('[DocsFocus] Failed to reset settings:', error);
    showStatus('Could not reset settings.', true);
  } finally {
    setButtonsDisabled(false);
  }
}

function collectFormValues() {
  const thresholdValue = Number(ui.threshold?.value ?? helpersModule.DEFAULT_SETTINGS.collapseThreshold);
  const keywordsValue = parseKeywords(ui.keywords?.value ?? '');
  const highlightInCode = Boolean(ui.highlightInCode?.checked);
  const previewTlDr = Boolean(ui.previewTlDr?.checked);

  return {
    collapseThreshold: thresholdValue,
    keywords: keywordsValue,
    highlightInCode,
    previewTlDr
  };
}

function parseKeywords(rawValue) {
  if (!rawValue) {
    return [...helpersModule.DEFAULT_SETTINGS.keywords];
  }
  return rawValue
    .split(/[\n,]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function setButtonsDisabled(disabled) {
  if (ui.saveButton) {
    ui.saveButton.disabled = disabled;
  }
  if (ui.resetButton) {
    ui.resetButton.disabled = disabled;
  }
}

function showStatus(message, isError = false) {
  if (!ui.status) {
    return;
  }
  ui.status.textContent = message;
  ui.status.dataset.state = isError ? 'error' : 'success';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    ui.status.textContent = '';
    delete ui.status.dataset.state;
  }, isError ? 6000 : 3600);
}

async function broadcastSettingsUpdate(settings) {
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs
        .filter((tab) => tab.id != null)
        .map((tab) =>
          sendMessageToTab(tab.id, {
            type: helpersModule.MESSAGE_TYPES.SETTINGS_UPDATED,
            payload: settings
          })
        )
    );
  } catch (error) {
    console.warn('[DocsFocus] Unable to broadcast settings update to tabs:', error);
  }
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        resolve({ ok: false, error });
      } else {
        resolve({ ok: true });
      }
    });
  });
}
