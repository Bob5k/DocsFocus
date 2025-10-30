const popupState = {
	tabId: null,
	tabUrl: null,
	contentState: null,
	helpers: null,
	siteSection: null,
	siteStatusText: null,
	siteButton: null,
	diagnosticText: null,
	sitePresetSelect: null,
	sitePresetApply: null,
	sitePresetClear: null,
	keywordHighlightToggle: null,
};

let statusResetTimer = null;

document.addEventListener("DOMContentLoaded", initializePopup);

async function initializePopup() {
	try {
		popupState.helpers = await import(
			chrome.runtime.getURL("utils/helpers.js")
		);
		console.log("[DocsFocus] Helpers module loaded successfully");
	} catch (error) {
		console.error("[DocsFocus] Failed to load helpers in popup:", error);
		// Show error message to user in status text
		const statusText = document.getElementById("status-text");
		if (statusText) {
			statusText.textContent = "Error: Extension failed to load properly.";
			statusText.style.color = "#d73a49";
		}
		return;
	}

	const toggle = document.getElementById("focus-toggle");
	const statusText = document.getElementById("status-text");
	popupState.siteSection = document.getElementById("site-section");
	popupState.siteStatusText = document.getElementById("site-status-text");
	popupState.siteButton = document.getElementById("site-toggle");
	popupState.diagnosticText = document.getElementById("diagnostic-text");
	popupState.sitePresetSelect = document.getElementById("site-preset");
	popupState.sitePresetApply = document.getElementById("site-preset-apply");
	popupState.sitePresetClear = document.getElementById("site-preset-clear");
	popupState.keywordHighlightToggle = document.getElementById("keyword-highlight-toggle");

	if (!toggle || !statusText) {
		console.warn("[DocsFocus] Popup markup missing expected elements.");
		return;
	}

	if (popupState.siteButton) {
		popupState.siteButton.addEventListener("click", handleSiteButtonClick);
	}

	popupState.sitePresetApply?.addEventListener("click", handleSitePresetApply);
	popupState.sitePresetClear?.addEventListener("click", handleSitePresetClear);
	popupState.keywordHighlightToggle?.addEventListener("change", handleKeywordHighlightToggle);

	const activeTab = await resolveActiveTab();
	popupState.tabId = activeTab.id;
	popupState.tabUrl = activeTab.url;
	console.log(
		`[DocsFocus] Active tab resolved: ${popupState.tabId}, URL: ${popupState.tabUrl}`,
	);

	try {
		popupState.contentState = await requestContentState(popupState.tabId);
		console.log("[DocsFocus] Content state retrieved from tab");
	} catch (error) {
		console.warn(
			"[DocsFocus] Failed to get content state from tab:",
			formatError(error),
			error,
		);
	}

	if (!popupState.contentState) {
		console.log("[DocsFocus] Building fallback state");
		popupState.contentState = await buildFallbackState();
	}

	toggle.checked = Boolean(popupState.contentState.focusMode);
	renderStatus();
	updateSiteControls();

	toggle.addEventListener("change", async (event) => {
		const enabled = Boolean(event.target.checked);
		console.log(`[DocsFocus] Focus Mode toggle changed to: ${enabled}`);
		toggle.disabled = true;
		try {
			await popupState.helpers.setFocusMode(enabled);
			console.log("[DocsFocus] Focus Mode setting saved");

			if (popupState.tabId != null) {
				try {
					await sendMessageToTab(popupState.tabId, {
						type: popupState.helpers.MESSAGE_TYPES.TOGGLE_FOCUS,
						payload: { enabled },
					});
					console.log("[DocsFocus] Toggle message sent to content script");
					popupState.contentState = await requestContentState(popupState.tabId);
				} catch (error) {
					console.warn(
						"[DocsFocus] Could not communicate with content script:",
						formatError(error),
						error,
					);
					// Still update local state even if content script communication fails
					popupState.contentState = {
						...popupState.contentState,
						focusMode: enabled,
						featuresActive: enabled && popupState.contentState.siteEligible,
					};
				}
			} else {
				popupState.contentState = {
					...popupState.contentState,
					focusMode: enabled,
					featuresActive: enabled && popupState.contentState.siteEligible,
				};
			}
		} catch (error) {
			console.error("[DocsFocus] Failed to toggle Focus Mode:", error);
			event.target.checked = !enabled; // revert on failure
			const statusText = document.getElementById("status-text");
			if (statusText) {
				statusText.textContent = `Error: Failed to ${enabled ? "enable" : "disable"} Focus Mode`;
				setTimeout(() => renderStatus(), 3000);
			}
		} finally {
			toggle.disabled = false;
			renderStatus();
			updateSiteControls();
		}
	});

	chrome.storage.onChanged.addListener(handleStorageChanges);
	window.addEventListener("unload", () => {
		chrome.storage.onChanged.removeListener(handleStorageChanges);
	});
}

async function updateSitePresetDropdown() {
	if (!popupState.helpers || !popupState.sitePresetSelect) {
		return;
	}

	const [customPresets, visibility] = await Promise.all([
		popupState.helpers.getCustomPresets(),
		popupState.helpers.getPresetVisibility(),
	]);

	const currentValue = popupState.sitePresetSelect.value;

	// Clear existing options
	popupState.sitePresetSelect.innerHTML = "";

	// Add visible built-in presets
	if (visibility.deepfocus !== false) {
		const option = document.createElement("option");
		option.value = "deepfocus";
		option.textContent = "Deep Focus";
		popupState.sitePresetSelect.appendChild(option);
	}

	if (visibility.skim !== false) {
		const option = document.createElement("option");
		option.value = "skim";
		option.textContent = "Skim (fast scan)";
		popupState.sitePresetSelect.appendChild(option);
	}

	// Add custom presets
	Object.keys(customPresets).forEach((name) => {
		const option = document.createElement("option");
		option.value = name;
		option.textContent = name;
		popupState.sitePresetSelect.appendChild(option);
	});

	// Always add "Custom" option
	const customOption = document.createElement("option");
	customOption.value = "custom";
	customOption.textContent = "Custom";
	popupState.sitePresetSelect.appendChild(customOption);

	// Restore selection if still valid
	const allValues = Array.from(popupState.sitePresetSelect.options).map(
		(opt) => opt.value,
	);
	if (allValues.includes(currentValue)) {
		popupState.sitePresetSelect.value = currentValue;
	}
}

function renderStatus() {
	const statusText = document.getElementById("status-text");
	if (!popupState.contentState || !statusText) {
		return;
	}

	const diagnostic = popupState.diagnosticText;
	if (diagnostic) {
		diagnostic.hidden = true;
		diagnostic.textContent = "";
	}

	const {
		focusMode,
		siteEligible,
		featuresActive,
		manualOverrides: storedOverrides,
		domain,
		autoDetected,
		eligibilityMessage,
		autoDetectedInfo,
		domainSettings,
		domainPreset,
	} = popupState.contentState;
	const manualOverrides =
		storedOverrides && typeof storedOverrides === "object"
			? storedOverrides
			: {};

	const canDeriveFromUrl =
		popupState.tabUrl?.startsWith("http") &&
		popupState.helpers?.getDomainFromUrl;
	const derivedDomain =
		domain ||
		(canDeriveFromUrl
			? popupState.helpers.getDomainFromUrl(popupState.tabUrl)
			: null);
	const overrideEntry = derivedDomain ? manualOverrides?.[derivedDomain] : null;
	const overrideDisabled = overrideEntry?.enabled === false;
	const _canOfferManualEnable =
		Boolean(derivedDomain) &&
		(!popupState.tabUrl || popupState.tabUrl.startsWith("http"));
	const domainHasOverride = Boolean(domainSettings);

	const diagnosticLines = [];
	const globalPresetName =
		popupState.contentState?.globalSettings?.preset ?? "deepfocus";
	const effectivePresetName =
		domainHasOverride && domainPreset ? domainPreset : globalPresetName;
	const presetLabel = formatPresetLabel(effectivePresetName);
	const presetDisplay = domainHasOverride
		? presetLabel === "Custom"
			? "Preset: Custom"
			: `Preset: ${presetLabel}`
		: presetLabel === "Custom"
			? "Preset: Custom (global)"
			: `Preset: ${presetLabel} (global)`;

	const addDiagnostic = (text) => {
		if (!text || diagnosticLines.includes(text)) {
			return;
		}
		diagnosticLines.push(text);
	};

	addDiagnostic(eligibilityMessage);

	if (!siteEligible) {
		if (overrideDisabled || autoDetected) {
			statusText.textContent = "DocsFocus is disabled for this domain.";
		} else {
			statusText.textContent =
				"DocsFocus is idle: page not detected as documentation.";
		}
		// Show preset info so users see whether custom or global settings apply
		addDiagnostic(presetDisplay);
		if (diagnostic && diagnosticLines.length) {
			diagnostic.hidden = false;
			diagnostic.textContent = diagnosticLines.join(" ");
		}
		return;
	}

	if (!focusMode) {
		statusText.textContent = "Focus Mode is OFF. Enable to apply focus helpers.";
		if (diagnosticLines.length === 0 && autoDetectedInfo?.label) {
			addDiagnostic(autoDetectedInfo.label);
		}
		if (diagnostic && diagnosticLines.length) {
			diagnostic.hidden = false;
			diagnostic.textContent = diagnosticLines.join(" ");
		}
		return;
	}

	statusText.textContent = featuresActive
		? "DocsFocus is active on this page."
		: "DocsFocus is preparing enhancements…";

	addDiagnostic(autoDetectedInfo?.label);
	addDiagnostic(presetDisplay);

	if (diagnostic && diagnosticLines.length) {
		diagnostic.hidden = false;
		diagnostic.textContent = diagnosticLines.join(" ");
	}
}

function formatPresetLabel(name) {
	if (!name || typeof name !== "string") {
		return "Custom";
	}
	const normalized = name.toLowerCase();
	const presetLabels = {
		deepfocus: "Deep Focus",
		skim: "Skim (fast scan)",
	};
	if (Object.hasOwn(presetLabels, normalized)) {
		return presetLabels[normalized];
	}
	if (normalized === "custom") {
		return "Custom";
	}
	return name;
}

function showTransientStatus(
	message,
	{ tone = "error", duration = 4000 } = {},
) {
	if (!message) {
		return;
	}
	const statusText = document.getElementById("status-text");
	if (!statusText) {
		return;
	}
	if (statusResetTimer) {
		clearTimeout(statusResetTimer);
		statusResetTimer = null;
	}

	const colorMap = {
		error: "#d73a49",
		success: "#2da44e",
		info: "",
	};
	const resolvedColor = colorMap[tone] ?? colorMap.info;

	statusText.textContent = message;
	statusText.style.color = resolvedColor;

	statusResetTimer = setTimeout(() => {
		statusText.style.color = "";
		renderStatus();
		statusResetTimer = null;
	}, duration);
}

function updateSiteControls() {
	if (
		!popupState.siteSection ||
		!popupState.siteStatusText ||
		!popupState.siteButton
	) {
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

	let hint = "";
	let action = "enable";
	let label = "Enable on this domain";

	if (autoDetected) {
		if (overrideDisabled) {
			hint =
				"Previously disabled. Re-enable to restore automatic enhancements.";
			action = "clear";
			label = "Re-enable on this domain";
		} else {
			hint = "This site is automatically recognized as documentation.";
			action = "disable";
			label = "Disable on this domain";
		}
	} else {
		if (overrideEnabled) {
			hint = "This site is manually enabled for DocsFocus.";
			action = "clear";
			label = "Disable manual enable";
		} else {
			hint = "Enable DocsFocus manually for this non-documentation site.";
			action = "enable";
			label = "Enable on this domain";
		}
	}

	popupState.siteStatusText.textContent = hint;
	popupState.siteButton.textContent = label;
	popupState.siteButton.dataset.action = action;
	popupState.siteButton.disabled = false;

	if (popupState.sitePresetSelect) {
		if (!state?.domain) {
			popupState.sitePresetSelect.disabled = true;
		} else {
			popupState.sitePresetSelect.disabled = false;

			// Populate with available presets
			updateSitePresetDropdown().then(() => {
				if (state.domainSettings) {
					const presetValue =
						state.domainSettings.preset &&
						state.domainSettings.preset !== "custom"
							? state.domainSettings.preset
							: "custom";
					popupState.sitePresetSelect.value = presetValue;
				} else {
					// No domain settings means using global
					const globalPreset = state.globalSettings?.preset ?? "deepfocus";
					popupState.sitePresetSelect.value = globalPreset;
				}
			});
		}
	}

	if (popupState.sitePresetApply) {
		popupState.sitePresetApply.disabled = !state?.domain;
	}
	if (popupState.sitePresetClear) {
		popupState.sitePresetClear.disabled =
			!state?.domain || !state.domainSettings;
	}

	if (popupState.keywordHighlightToggle) {
		const highlightEnabled = state?.settings?.highlightKeywords ?? true;
		popupState.keywordHighlightToggle.checked = highlightEnabled;
		popupState.keywordHighlightToggle.disabled = !state?.domain;
	}
}

async function resolveActiveTab() {
	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tabs && tabs.length > 0) {
			const tab = tabs[0];
			return {
				id: tab.id ?? null,
				url: tab.url ?? null,
			};
		}
	} catch (error) {
		console.warn(
			"[DocsFocus] Unable to resolve active tab:",
			formatError(error),
			error,
		);
	}
	return { id: null, url: null };
}

async function requestContentState(tabId) {
	if (tabId == null) {
		return null;
	}
	try {
		const response = await sendMessageToTab(tabId, {
			type: popupState.helpers.MESSAGE_TYPES.GET_STATE,
		});
		if (response?.state?.url && !popupState.tabUrl) {
			popupState.tabUrl = response.state.url;
		}
		return response?.state ?? null;
	} catch (error) {
		console.warn(
			"[DocsFocus] Content script unreachable for state request:",
			formatError(error),
			error,
		);
		return null;
	}
}

async function buildFallbackState(providedOverrides) {
	const overridesSource =
		providedOverrides && typeof providedOverrides === "object"
			? Promise.resolve(providedOverrides)
			: popupState.helpers.getManualOverrides();

	const [fallbackFocus, overrides, globalSettingsRaw, domainSettingsMap] =
		await Promise.all([
			popupState.helpers.getFocusMode(),
			overridesSource,
			popupState.helpers.getSettings(),
			popupState.helpers.getDomainSettings(),
		]);

	const manualOverrides =
		overrides && typeof overrides === "object" ? overrides : {};
	const canDeriveFromUrl =
		popupState.tabUrl?.startsWith("http") &&
		popupState.helpers.getDomainFromUrl;
	const domainFromUrl = canDeriveFromUrl
		? popupState.helpers.getDomainFromUrl(popupState.tabUrl)
		: null;
	const normalizedGlobal =
		popupState.helpers.normalizeSettings(globalSettingsRaw);
	const domainSettings = domainFromUrl
		? (domainSettingsMap?.[domainFromUrl] ?? null)
		: null;
	const effectiveSettings = domainSettings
		? popupState.helpers.mergeSettings(normalizedGlobal, domainSettings)
		: normalizedGlobal;
	const matchInfo =
		popupState.tabUrl?.startsWith("http") &&
		popupState.helpers.describeDocsMatch
			? popupState.helpers.describeDocsMatch(popupState.tabUrl)
			: null;
	const autoDetected =
		popupState.tabUrl?.startsWith("http") &&
		popupState.helpers.matchesDocsPattern
			? popupState.helpers.matchesDocsPattern(popupState.tabUrl)
			: Boolean(matchInfo?.matched);
	const overrideEntry = domainFromUrl ? manualOverrides[domainFromUrl] : null;
	let siteEligible = autoDetected || overrideEntry?.enabled === true;
	let eligibilitySource = "not-detected";
	let eligibilityMessage =
		matchInfo?.label ||
		(autoDetected ? "Recognized documentation patterns." : "");

	if (overrideEntry?.enabled === true) {
		siteEligible = true;
		eligibilitySource = "manual-allow";
		eligibilityMessage = "Manually enabled for this domain.";
	} else if (overrideEntry?.enabled === false) {
		siteEligible = false;
		eligibilitySource = "manual-block";
		eligibilityMessage = "Manually disabled for this domain.";
	} else if (autoDetected) {
		siteEligible = true;
		eligibilitySource = "auto";
	} else {
		siteEligible = false;
		eligibilitySource = "not-detected";
		eligibilityMessage =
			eligibilityMessage || "DocsFocus did not detect documentation signals.";
	}

	return {
		focusMode: fallbackFocus,
		settings: effectiveSettings,
		globalSettings: normalizedGlobal,
		siteEligible,
		featuresActive: false,
		domain: domainFromUrl ?? null,
		url: popupState.tabUrl ?? null,
		manualOverrides,
		autoDetected,
		autoDetectedInfo: matchInfo,
		domainSettings,
		domainPreset: domainSettings?.preset ?? normalizedGlobal.preset,
		eligibilitySource,
		eligibilityMessage,
	};
}

function handleStorageChanges(changes, areaName) {
	if (areaName !== "sync" && areaName !== "local") {
		return;
	}
	if (!changes || !popupState.contentState) {
		return;
	}

	let needsRender = false;
	let needsControls = false;

	if (Object.hasOwn(changes, popupState.helpers.STORAGE_KEYS.SETTINGS)) {
		const nextValue =
			changes[popupState.helpers.STORAGE_KEYS.SETTINGS]?.newValue;
		const normalized = popupState.helpers.normalizeSettings(nextValue);
		popupState.contentState.globalSettings = normalized;
		if (!popupState.contentState.domainSettings) {
			popupState.contentState.settings = normalized;
			popupState.contentState.domainPreset = normalized.preset;
		}
		needsRender = true;
		needsControls = true;
	}

	if (
		Object.hasOwn(changes, popupState.helpers.STORAGE_KEYS.FOCUS_MODE) ||
		Object.hasOwn(changes, "docsfocusAdhdMode")
	) {
		const focusKey = Object.hasOwn(
			changes,
			popupState.helpers.STORAGE_KEYS.FOCUS_MODE,
		)
			? popupState.helpers.STORAGE_KEYS.FOCUS_MODE
			: "docsfocusAdhdMode";
		const nextValue = changes[focusKey]?.newValue;
		popupState.contentState.focusMode = Boolean(nextValue);
		const toggle = document.getElementById("focus-toggle");
		if (toggle && toggle.checked !== popupState.contentState.focusMode) {
			toggle.checked = popupState.contentState.focusMode;
		}
		needsRender = true;
	}

	if (Object.hasOwn(changes, popupState.helpers.STORAGE_KEYS.DOMAIN_SETTINGS)) {
		const nextMap =
			changes[popupState.helpers.STORAGE_KEYS.DOMAIN_SETTINGS]?.newValue;
		const normalizedMap = nextMap && typeof nextMap === "object" ? nextMap : {};
		const domainKey = popupState.contentState.domain;
		const override =
			domainKey && normalizedMap[domainKey]
				? popupState.helpers.normalizeSettings(normalizedMap[domainKey])
				: null;
		popupState.contentState.domainSettings = override;
		if (override) {
			popupState.contentState.settings = popupState.helpers.mergeSettings(
				popupState.contentState.globalSettings ??
					popupState.helpers.DEFAULT_SETTINGS,
				override,
			);
			popupState.contentState.domainPreset = override.preset ?? "custom";
		} else {
			const fallbackGlobal =
				popupState.contentState.globalSettings ??
				popupState.helpers.DEFAULT_SETTINGS;
			popupState.contentState.settings = fallbackGlobal;
			popupState.contentState.domainPreset =
				fallbackGlobal.preset ?? "deepfocus";
		}
		needsRender = true;
		needsControls = true;
	}

	if (
		Object.hasOwn(changes, popupState.helpers.STORAGE_KEYS.MANUAL_OVERRIDES)
	) {
		const nextOverrides =
			changes[popupState.helpers.STORAGE_KEYS.MANUAL_OVERRIDES]?.newValue;
		const manualOverrides =
			nextOverrides && typeof nextOverrides === "object" ? nextOverrides : {};
		popupState.contentState.manualOverrides = manualOverrides;
		if (popupState.contentState.domain) {
			const entry = manualOverrides[popupState.contentState.domain];
			if (entry?.enabled === true) {
				popupState.contentState.siteEligible = true;
				popupState.contentState.eligibilitySource = "manual-allow";
				popupState.contentState.eligibilityMessage =
					"Manually enabled for this domain.";
			} else if (entry?.enabled === false) {
				popupState.contentState.siteEligible = false;
				popupState.contentState.eligibilitySource = "manual-block";
				popupState.contentState.eligibilityMessage =
					"Manually disabled for this domain.";
			} else if (popupState.contentState.autoDetected) {
				popupState.contentState.siteEligible = true;
				popupState.contentState.eligibilitySource = "auto";
				popupState.contentState.eligibilityMessage =
					popupState.contentState.autoDetectedInfo?.label ??
					"Recognized documentation patterns.";
			} else {
				popupState.contentState.siteEligible = false;
				popupState.contentState.eligibilitySource = "not-detected";
				popupState.contentState.eligibilityMessage =
					popupState.contentState.autoDetectedInfo?.label ??
					"DocsFocus did not detect documentation signals.";
			}
		}
		needsRender = true;
		needsControls = true;
	}

	if (needsControls) {
		updateSiteControls();
	}
	if (needsRender) {
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

	if (popupState.siteButton) {
		popupState.siteButton.disabled = true;
	}

	let desired;
	if (action === "enable") {
		desired = true;
	} else if (action === "disable") {
		desired = false;
	} else {
		desired = null;
	}

	let customStatusMessage = null;
	let skipPermissionCheck = false;

	try {
		if (desired === true) {
			const granted = await ensureDomainPermission(domain);
			if (!granted) {
				customStatusMessage =
					"DocsFocus needs permission for this site. Approve the browser prompt to enable it.";
				return;
			}
			skipPermissionCheck = true;
		}

		await applyManualOverride(domain, desired, {
			skipPermissionCheck,
		});

		if (desired === true && popupState.tabId != null) {
			await ensureContentScriptInjected(popupState.tabId);
			const refreshed = await requestContentState(popupState.tabId);
			if (refreshed) {
				popupState.contentState = refreshed;
			}
		}
	} catch (error) {
		console.error(
			"[DocsFocus] Failed to update manual override:",
			formatError(error),
			error,
		);
		customStatusMessage =
			typeof error?.message === "string"
				? `Error: ${error.message}`
				: "Error: Unable to update DocsFocus for this domain.";
	} finally {
		if (popupState.siteButton) {
			popupState.siteButton.disabled = false;
		}
		renderStatus();
		updateSiteControls();
		if (customStatusMessage) {
			showTransientStatus(customStatusMessage);
		}
	}
}

async function applyManualOverride(domain, desired, options = {}) {
	const payload = {
		type: popupState.helpers.MESSAGE_TYPES.MANUAL_OVERRIDE,
		payload: {
			domain,
			enabled: desired,
			tabId: popupState.tabId,
			skipPermissionCheck: Boolean(options.skipPermissionCheck),
		},
	};

	const response = await chrome.runtime.sendMessage(payload);
	if (response?.ok) {
		if (response.state) {
			popupState.contentState = response.state;
			popupState.tabUrl = response.state.url ?? popupState.tabUrl;
		} else {
			popupState.contentState = await buildFallbackState(response.overrides);
		}
		return response;
	}

	// On failure attempt to refresh from content script/fallback to keep UI in sync.
	popupState.contentState =
		(await requestContentState(popupState.tabId)) ??
		(await buildFallbackState());

	const errorMessage =
		typeof response?.error === "string" && response.error.trim()
			? response.error
			: "Manual override failed.";
	throw new Error(errorMessage);
}

async function ensureDomainPermission(domain) {
	if (!domain) {
		return false;
	}

	const origins = buildOriginPatterns(domain);

	try {
		const alreadyGranted = await chrome.permissions
			.contains({ origins })
			.catch(() => false);
		if (alreadyGranted) {
			return true;
		}
	} catch (error) {
		console.warn(
			"[DocsFocus] Permission check failed:",
			formatError(error),
			error,
		);
	}

	try {
		const granted = await chrome.permissions.request({ origins });
		return Boolean(granted);
	} catch (error) {
		console.warn(
			"[DocsFocus] Permission request failed:",
			formatError(error),
			error,
		);
		return false;
	}
}

function buildOriginPatterns(domain) {
	return [`https://${domain}/*`, `http://${domain}/*`];
}

async function ensureContentScriptInjected(tabId) {
	if (tabId == null || typeof tabId !== "number") {
		return;
	}

	try {
		await chrome.scripting.insertCSS({
			target: { tabId },
			files: ["content/styles.css"],
		});
	} catch (error) {
		if (
			!error?.message ||
			!error.message.toLowerCase().includes("css has already been injected")
		) {
			console.warn("[DocsFocus] CSS injection failed:", formatError(error));
		}
	}

	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			files: ["content/content.js"],
		});
	} catch (error) {
		console.warn(
			"[DocsFocus] Content script injection failed:",
			formatError(error),
		);
	}
}

function formatError(error) {
	if (!error) {
		return "Unknown error";
	}
	if (typeof error === "string") {
		return error;
	}
	if (error?.message) {
		return error.message;
	}
	return String(error);
}

async function handleSitePresetApply() {
	if (!popupState.helpers || !popupState.sitePresetSelect) {
		console.warn("[DocsFocus] Preset apply: helpers or select element missing");
		return;
	}
	const domain = popupState.contentState?.domain;
	if (!domain) {
		console.warn("[DocsFocus] Preset apply: no domain available");
		return;
	}
	const selected = popupState.sitePresetSelect.value;
	console.log(
		`[DocsFocus] Applying preset "${selected}" for domain "${domain}"`,
	);

	if (selected === "custom") {
		console.log("[DocsFocus] Opening options page for custom settings");
		if (chrome.runtime?.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		}
		return;
	}

	popupState.sitePresetApply.disabled = true;

	let statusMessage = null;
	let statusTone = "error";
	let presetSettings = null;

	try {
		presetSettings = popupState.helpers.applyPresetSettings
			? await popupState.helpers.applyPresetSettings(
					selected,
					popupState.helpers.DEFAULT_SETTINGS,
				)
			: popupState.helpers.normalizeSettings({
					...popupState.helpers.DEFAULT_SETTINGS,
					...(popupState.helpers.SETTINGS_PRESETS?.[selected] ?? {}),
				});

		console.log("[DocsFocus] Preset settings calculated:", presetSettings);
		await popupState.helpers.setDomainSettings(domain, presetSettings);
		console.log("[DocsFocus] Domain settings saved successfully");

		let manualEnableApplied = false;
		if (!popupState.contentState?.siteEligible) {
			console.log("[DocsFocus] Site not eligible, attempting manual enable");
			const granted = await ensureDomainPermission(domain);
			if (!granted) {
				statusMessage =
					"DocsFocus needs permission for this site. Approve the browser prompt to enable it.";
				return;
			}
			await applyManualOverride(domain, true, { skipPermissionCheck: true });
			manualEnableApplied = true;
		}

		if (popupState.tabId != null) {
			try {
				await sendMessageToTab(popupState.tabId, {
					type: popupState.helpers.MESSAGE_TYPES.DOMAIN_SETTINGS,
					payload: { domain, settings: presetSettings },
				});
				console.log("[DocsFocus] Settings sent to content script");
			} catch (error) {
				console.warn(
					"[DocsFocus] Unable to push domain settings message:",
					formatError(error),
					error,
				);
				statusMessage ??=
					"Preset saved, but DocsFocus couldn't reach this tab. Reload the page to apply it.";
			}
		}

		if (manualEnableApplied && popupState.tabId != null) {
			await ensureContentScriptInjected(popupState.tabId);
		}

		const refreshed = await requestContentState(popupState.tabId);
		if (refreshed) {
			popupState.contentState = refreshed;
			console.log("[DocsFocus] State refreshed from content script");
		} else {
			popupState.contentState = {
				...popupState.contentState,
				domainSettings: presetSettings,
				domainPreset: presetSettings.preset ?? selected,
			};
			console.log("[DocsFocus] State updated locally");
			statusMessage ??=
				"Preset saved. Reload this page if changes do not appear immediately.";
		}

		if (!statusMessage) {
			const prettyPreset = formatPresetLabel(
				presetSettings?.preset ?? selected,
			);
			statusTone = "success";
			statusMessage = `Preset ${prettyPreset} applied for this domain.`;
		}
	} catch (error) {
		console.error(
			"[DocsFocus] Failed to apply site preset:",
			formatError(error),
			error,
		);
		statusMessage =
			statusMessage ??
			`Error: Failed to apply preset. ${formatError(error)}`.trim();
	} finally {
		popupState.sitePresetApply.disabled = false;
		updateSiteControls();
		renderStatus();
		if (statusMessage) {
			showTransientStatus(statusMessage, {
				tone: statusTone,
				duration: statusTone === "success" ? 2500 : 4000,
			});
		}
	}
}

async function handleSitePresetClear() {
	if (!popupState.helpers) {
		console.warn("[DocsFocus] Preset clear: helpers missing");
		return;
	}
	const domain = popupState.contentState?.domain;
	if (!domain) {
		console.warn("[DocsFocus] Preset clear: no domain available");
		return;
	}

	console.log(`[DocsFocus] Clearing preset for domain "${domain}"`);

	if (popupState.sitePresetClear) {
		popupState.sitePresetClear.disabled = true;
	}
	if (popupState.sitePresetSelect) {
		await updateSitePresetDropdown();
		popupState.sitePresetSelect.value =
			popupState.contentState?.globalSettings?.preset ?? "deepfocus";
	}

	let statusMessage = null;
	let statusTone = "success";

	try {
		await popupState.helpers.clearDomainSettings(domain);
		console.log("[DocsFocus] Domain settings cleared successfully");

		if (popupState.tabId != null) {
			try {
				await sendMessageToTab(popupState.tabId, {
					type: popupState.helpers.MESSAGE_TYPES.DOMAIN_SETTINGS,
					payload: { domain, clear: true },
				});
				console.log("[DocsFocus] Clear notification sent to content script");
			} catch (error) {
				console.warn(
					"[DocsFocus] Unable to notify content script about domain clear:",
					formatError(error),
					error,
				);
				statusTone = "info";
				statusMessage ??=
					"Preset cleared, but this tab did not respond. Reload the page to ensure defaults apply.";
			}
		}

		const refreshed = await requestContentState(popupState.tabId);
		if (refreshed) {
			popupState.contentState = refreshed;
			console.log("[DocsFocus] State refreshed from content script");
		} else {
			popupState.contentState = {
				...popupState.contentState,
				domainSettings: null,
				domainPreset:
					popupState.contentState?.globalSettings?.preset ?? "deepfocus",
			};
			console.log("[DocsFocus] State updated locally");
			statusTone = statusTone === "success" ? "info" : statusTone;
			statusMessage ??=
				"Preset cleared. Reload this page if it still shows custom settings.";
		}

		if (!statusMessage) {
			const globalPreset =
				popupState.contentState?.globalSettings?.preset ?? "deepfocus";
			statusMessage = `Site overrides removed. Using global ${formatPresetLabel(globalPreset)} preset.`;
		}
	} catch (error) {
		console.error(
			"[DocsFocus] Failed to clear domain settings:",
			formatError(error),
			error,
		);
		statusTone = "error";
		statusMessage =
			statusMessage ??
			`Error: Failed to clear preset. ${formatError(error)}`.trim();
	} finally {
		if (popupState.sitePresetClear) {
			popupState.sitePresetClear.disabled = false;
		}
		updateSiteControls();
		renderStatus();
		if (statusMessage) {
			showTransientStatus(statusMessage, {
				tone: statusTone,
				duration: statusTone === "success" ? 2500 : 4000,
			});
		}
	}
}

async function handleKeywordHighlightToggle(event) {
	if (!popupState.helpers || !popupState.keywordHighlightToggle) {
		console.warn("[DocsFocus] Keyword highlight toggle: helpers or element missing");
		return;
	}

	const domain = popupState.contentState?.domain;
	if (!domain) {
		console.warn("[DocsFocus] Keyword highlight toggle: no domain available");
		return;
	}

	const enabled = Boolean(event.target.checked);
	console.log(`[DocsFocus] Keyword highlighting toggled to: ${enabled} for domain "${domain}"`);

	popupState.keywordHighlightToggle.disabled = true;

	let statusMessage = null;
	let statusTone = "success";

	try {
		const currentSettings = popupState.contentState?.domainSettings
			? { ...popupState.contentState.domainSettings }
			: popupState.contentState?.settings
				? { ...popupState.contentState.settings }
				: { ...popupState.helpers.DEFAULT_SETTINGS };

		const updatedSettings = {
			...currentSettings,
			highlightKeywords: enabled,
		};

		await popupState.helpers.setDomainSettings(domain, updatedSettings);
		console.log("[DocsFocus] Domain settings updated with keyword highlighting preference");

		if (popupState.tabId != null) {
			try {
				await sendMessageToTab(popupState.tabId, {
					type: popupState.helpers.MESSAGE_TYPES.DOMAIN_SETTINGS,
					payload: { domain, settings: updatedSettings },
				});
				console.log("[DocsFocus] Settings sent to content script");
			} catch (error) {
				console.warn(
					"[DocsFocus] Unable to push keyword highlight setting to tab:",
					formatError(error),
					error,
				);
				statusMessage ??= "Setting saved, but couldn't reach this tab. Reload to apply.";
			}
		}

		const refreshed = await requestContentState(popupState.tabId);
		if (refreshed) {
			popupState.contentState = refreshed;
			console.log("[DocsFocus] State refreshed from content script");
		} else {
			popupState.contentState = {
				...popupState.contentState,
				settings: updatedSettings,
				domainSettings: updatedSettings,
			};
			console.log("[DocsFocus] State updated locally");
		}

		if (!statusMessage) {
			statusMessage = enabled
				? "Keyword highlighting enabled."
				: "Keyword highlighting disabled.";
		}
	} catch (error) {
		console.error(
			"[DocsFocus] Failed to toggle keyword highlighting:",
			formatError(error),
			error,
		);
		statusTone = "error";
		statusMessage = `Error: Failed to toggle keyword highlighting. ${formatError(error)}`.trim();
		event.target.checked = !enabled;
	} finally {
		popupState.keywordHighlightToggle.disabled = false;
		updateSiteControls();
		if (statusMessage) {
			showTransientStatus(statusMessage, {
				tone: statusTone,
				duration: statusTone === "success" ? 1500 : 4000,
			});
		}
	}
}
