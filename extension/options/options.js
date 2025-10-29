const ui = {
  form: null,
  threshold: null,
  keywords: null,
  highlightInCode: null,
  collapseCodeParagraphs: null,
  previewTlDr: null,
  readingMask: null,
  collapsibleSections: null,
  trimChrome: null,
  sectionTracker: null,
  keyboardShortcuts: null,
  dyslexiaMode: null,
  presetSelect: null,
  presetApply: null,
  saveButton: null,
  resetButton: null,
  status: null,
  presetName: null,
  savePresetButton: null,
  customPresetsList: null,
  customPresetsItems: null,
  visibilityDeepfocus: null,
  visibilitySkim: null
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

  attachPresetListeners();

  const settings = await helpersModule.getSettings();
  await populateForm(settings);
  await loadCustomPresets();
  await loadPresetVisibility();
  await updatePresetDropdown();

  ui.form.addEventListener('submit', handleSubmit);
  ui.resetButton?.addEventListener('click', handleReset);
  ui.presetApply?.addEventListener('click', handlePresetApply);
  ui.savePresetButton?.addEventListener('click', handleSavePreset);
  ui.visibilityDeepfocus?.addEventListener('change', handleVisibilityChange);
  ui.visibilitySkim?.addEventListener('change', handleVisibilityChange);
}

function cacheDom() {
  ui.form = document.getElementById('settings-form');
  ui.threshold = document.getElementById('collapse-threshold');
  ui.keywords = document.getElementById('keywords');
  ui.highlightInCode = document.getElementById('highlight-in-code');
  ui.collapseCodeParagraphs = document.getElementById('collapse-code-paragraphs');
  ui.previewTlDr = document.getElementById('preview-tldr');
  ui.readingMask = document.getElementById('reading-mask');
  ui.collapsibleSections = document.getElementById('collapsible-sections');
  ui.trimChrome = document.getElementById('trim-chrome');
  ui.sectionTracker = document.getElementById('section-tracker');
  ui.keyboardShortcuts = document.getElementById('keyboard-shortcuts');
  ui.dyslexiaMode = document.getElementById('dyslexia-mode');
  ui.presetSelect = document.getElementById('preset-select');
  ui.presetApply = document.getElementById('preset-apply');
  ui.saveButton = document.getElementById('save-button');
  ui.resetButton = document.getElementById('reset-button');
  ui.status = document.getElementById('save-status');
  ui.presetName = document.getElementById('preset-name');
  ui.savePresetButton = document.getElementById('save-preset-button');
  ui.customPresetsList = document.getElementById('custom-presets-list');
  ui.customPresetsItems = document.getElementById('custom-presets-items');
  ui.visibilityDeepfocus = document.getElementById('visibility-deepfocus');
  ui.visibilitySkim = document.getElementById('visibility-skim');
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
  if (ui.collapseCodeParagraphs) {
    ui.collapseCodeParagraphs.checked = Boolean(normalized.collapseCodeParagraphs);
  }
  if (ui.previewTlDr) {
    ui.previewTlDr.checked = Boolean(normalized.previewTlDr);
  }
  if (ui.readingMask) {
    ui.readingMask.checked = Boolean(normalized.readingMask);
  }
  if (ui.collapsibleSections) {
    ui.collapsibleSections.checked = Boolean(normalized.collapsibleSections);
  }
  if (ui.trimChrome) {
    ui.trimChrome.checked = Boolean(normalized.trimChrome);
  }
  if (ui.sectionTracker) {
    ui.sectionTracker.checked = Boolean(normalized.sectionTracker);
  }
  if (ui.keyboardShortcuts) {
    ui.keyboardShortcuts.checked = Boolean(normalized.keyboardShortcuts);
  }
  if (ui.dyslexiaMode) {
    ui.dyslexiaMode.checked = Boolean(normalized.dyslexiaMode);
  }
  if (ui.presetSelect) {
    const presets = ['deepfocus', 'skim'];
    ui.presetSelect.value = presets.includes(normalized.preset) ? normalized.preset : 'custom';
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
  const collapseCodeParagraphs = Boolean(ui.collapseCodeParagraphs?.checked);
  const previewTlDr = Boolean(ui.previewTlDr?.checked);
  const readingMask = Boolean(ui.readingMask?.checked);
  const collapsibleSections = Boolean(ui.collapsibleSections?.checked);
  const trimChrome = Boolean(ui.trimChrome?.checked);
  const sectionTracker = Boolean(ui.sectionTracker?.checked);
  const keyboardShortcuts = Boolean(ui.keyboardShortcuts?.checked);
  const dyslexiaMode = Boolean(ui.dyslexiaMode?.checked);
  const presetSelection = ui.presetSelect?.value ?? 'custom';
  const preset = ['deepfocus', 'skim'].includes(presetSelection) ? presetSelection : 'custom';

  return {
    collapseThreshold: thresholdValue,
    keywords: keywordsValue,
    highlightInCode,
    collapseCodeParagraphs,
    previewTlDr,
    readingMask,
    collapsibleSections,
    trimChrome,
    sectionTracker,
    keyboardShortcuts,
    dyslexiaMode,
    preset
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

function attachPresetListeners() {
  const markCustom = () => {
    if (ui.presetSelect && ui.presetSelect.value !== 'custom') {
      ui.presetSelect.value = 'custom';
    }
  };

  ui.threshold?.addEventListener('input', markCustom);
  ui.keywords?.addEventListener('input', markCustom);

  [
    ui.highlightInCode,
    ui.collapseCodeParagraphs,
    ui.previewTlDr,
    ui.readingMask,
    ui.collapsibleSections,
    ui.trimChrome,
    ui.sectionTracker,
    ui.keyboardShortcuts,
    ui.dyslexiaMode
  ].forEach((control) => control?.addEventListener('change', markCustom));
}

async function handlePresetApply() {
  if (!helpersModule || !ui.presetSelect) {
    return;
  }
  const preset = ui.presetSelect.value;
  if (!preset || preset === 'custom') {
    return;
  }

  const applied = await helpersModule.applyPresetSettings(preset, helpersModule.DEFAULT_SETTINGS);
  await populateForm(applied);
  if (ui.presetSelect) {
    const available = ['deepfocus', 'skim'];
    const customPresets = await helpersModule.getCustomPresets();
    const allAvailable = [...available, ...Object.keys(customPresets)];
    ui.presetSelect.value = allAvailable.includes(applied.preset) ? applied.preset : preset;
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

async function loadCustomPresets() {
  if (!helpersModule || !ui.customPresetsItems) {
    return;
  }
  
  const customPresets = await helpersModule.getCustomPresets();
  const presetNames = Object.keys(customPresets);
  
  if (presetNames.length === 0) {
    if (ui.customPresetsList) {
      ui.customPresetsList.hidden = true;
    }
    return;
  }
  
  if (ui.customPresetsList) {
    ui.customPresetsList.hidden = false;
  }
  
  ui.customPresetsItems.innerHTML = '';
  
  presetNames.forEach((name) => {
    const li = document.createElement('li');
    li.className = 'options__preset-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'options__preset-name';
    nameSpan.textContent = name;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'options__button options__button--small options__button--danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => handleDeletePreset(name));
    
    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    ui.customPresetsItems.appendChild(li);
  });
}

async function loadPresetVisibility() {
  if (!helpersModule) {
    return;
  }
  
  const visibility = await helpersModule.getPresetVisibility();
  
  if (ui.visibilityDeepfocus) {
    ui.visibilityDeepfocus.checked = visibility.deepfocus !== false;
  }
  if (ui.visibilitySkim) {
    ui.visibilitySkim.checked = visibility.skim !== false;
  }
}

async function updatePresetDropdown() {
  if (!helpersModule || !ui.presetSelect) {
    return;
  }
  
  const [customPresets, visibility] = await Promise.all([
    helpersModule.getCustomPresets(),
    helpersModule.getPresetVisibility()
  ]);
  
  const currentValue = ui.presetSelect.value;
  
  // Clear existing options except custom
  ui.presetSelect.innerHTML = '';
  
  // Add visible built-in presets
  if (visibility.deepfocus !== false) {
    const option = document.createElement('option');
    option.value = 'deepfocus';
    option.textContent = 'Deep Focus (default)';
    ui.presetSelect.appendChild(option);
  }
  
  if (visibility.skim !== false) {
    const option = document.createElement('option');
    option.value = 'skim';
    option.textContent = 'Skim (fast scan)';
    ui.presetSelect.appendChild(option);
  }
  
  // Add custom presets
  Object.keys(customPresets).forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    ui.presetSelect.appendChild(option);
  });
  
  // Always add "Custom" option
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = 'Custom';
  ui.presetSelect.appendChild(customOption);
  
  // Restore selection if still valid
  const allValues = Array.from(ui.presetSelect.options).map(opt => opt.value);
  if (allValues.includes(currentValue)) {
    ui.presetSelect.value = currentValue;
  } else {
    ui.presetSelect.value = 'custom';
  }
}

async function handleSavePreset() {
  if (!helpersModule || !ui.presetName) {
    return;
  }
  
  const name = ui.presetName.value.trim();
  if (!name) {
    showStatus('Please enter a preset name.', true);
    return;
  }
  
  const currentSettings = collectFormValues();
  
  try {
    await helpersModule.saveCustomPreset(name, currentSettings);
    ui.presetName.value = '';
    await loadCustomPresets();
    await updatePresetDropdown();
    showStatus(`Preset "${name}" saved successfully.`);
  } catch (error) {
    console.error('[DocsFocus] Failed to save preset:', error);
    showStatus(error.message || 'Failed to save preset.', true);
  }
}

async function handleDeletePreset(name) {
  if (!helpersModule) {
    return;
  }
  
  if (!confirm(`Delete preset "${name}"?`)) {
    return;
  }
  
  try {
    await helpersModule.deleteCustomPreset(name);
    await loadCustomPresets();
    await updatePresetDropdown();
    
    // If deleted preset was active, revert to deepfocus
    const currentSettings = await helpersModule.getSettings();
    if (currentSettings.preset === name) {
      const defaults = await helpersModule.applyPresetSettings('deepfocus', helpersModule.DEFAULT_SETTINGS);
      await helpersModule.setSettings(defaults);
      await populateForm(defaults);
    }
    
    showStatus(`Preset "${name}" deleted.`);
  } catch (error) {
    console.error('[DocsFocus] Failed to delete preset:', error);
    showStatus('Failed to delete preset.', true);
  }
}

async function handleVisibilityChange() {
  if (!helpersModule || !ui.visibilityDeepfocus || !ui.visibilitySkim) {
    return;
  }
  
  try {
    await helpersModule.setPresetVisibility('deepfocus', ui.visibilityDeepfocus.checked);
    await helpersModule.setPresetVisibility('skim', ui.visibilitySkim.checked);
    await updatePresetDropdown();
    showStatus('Preset visibility updated.');
  } catch (error) {
    console.error('[DocsFocus] Failed to update visibility:', error);
    showStatus('Failed to update visibility.', true);
  }
}
