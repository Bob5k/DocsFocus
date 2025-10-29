import {
	getDomainFromUrl,
	getManualOverrides,
	MESSAGE_TYPES,
	updateManualOverride,
} from "../utils/helpers.js";

const overridesState = {
	map: {},
};

initialize();

async function initialize() {
	overridesState.map = await getManualOverrides();
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (!message || typeof message.type !== "string") {
			return false;
		}
		if (message.type === MESSAGE_TYPES.MANUAL_OVERRIDE) {
			handleManualOverrideMessage(message, sender, sendResponse);
			return true;
		}
		return false;
	});

	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName !== "sync" && areaName !== "local") {
			return;
		}
		if (Object.hasOwn(changes, "docsfocusManualOverrides")) {
			const value = changes.docsfocusManualOverrides?.newValue;
			overridesState.map = value && typeof value === "object" ? value : {};
		}
	});

	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (changeInfo.status !== "complete" || !tab?.url) {
			return;
		}
		maybeInjectForTab(tabId, tab.url);
	});
}

async function handleManualOverrideMessage(message, sender, sendResponse) {
	const domain = message.payload?.domain;
	const enabled = message.payload?.enabled;
	const tabId = message.payload?.tabId ?? sender.tab?.id ?? null;
	const skipPermissionCheck = Boolean(message.payload?.skipPermissionCheck);

	if (!domain) {
		sendResponse({ ok: false, error: "Missing domain for manual override." });
		return;
	}

	try {
		if (enabled === true) {
			const hasPermission = await hasHostPermission(domain);
			if (!hasPermission) {
				if (skipPermissionCheck) {
					sendResponse({
						ok: false,
						error: "Permission denied for this domain.",
					});
					return;
				}
				const granted = await requestHostPermission(domain);
				if (!granted) {
					sendResponse({
						ok: false,
						error: "Permission denied for this domain.",
					});
					return;
				}
			}
		}

		const overrides = await updateManualOverride(domain, enabled);
		overridesState.map = overrides;

		if (enabled === true && tabId != null) {
			await injectIntoTab(tabId, domain);
		}

		if (tabId != null) {
			try {
				await sendMessageToTab(tabId, {
					type: MESSAGE_TYPES.MANUAL_OVERRIDE,
					payload: { domain, enabled },
				});
			} catch (_error) {
				// No active content script; ignore.
			}
		}

		const stateResponse =
			tabId != null ? await requestStateFromTab(tabId) : null;
		sendResponse({ ok: true, overrides, state: stateResponse?.state });
	} catch (error) {
		console.error("[DocsFocus] Failed to update manual override:", error);
		sendResponse({ ok: false, error: error.message });
	}
}

async function maybeInjectForTab(tabId, url) {
	if (!url || !url.startsWith("http")) {
		return;
	}
	const domain = getDomainFromUrl(url);
	if (!domain) {
		return;
	}
	const entry = overridesState.map?.[domain];
	if (entry?.enabled) {
		await injectIntoTab(tabId, domain);
	}
}

async function injectIntoTab(tabId, domain) {
	if (typeof tabId !== "number") {
		return;
	}
	try {
		await chrome.scripting.insertCSS({
			target: { tabId },
			files: ["content/styles.css"],
		});
	} catch (_error) {
		// Ignore if CSS already injected or tab no longer exists.
	}

	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			files: ["content/content.js"],
		});
	} catch (error) {
		console.warn(
			"[DocsFocus] Unable to inject content script for domain",
			domain,
			error,
		);
	}
}

function sendMessageToTab(tabId, message) {
	return new Promise((resolve, reject) => {
		chrome.tabs.sendMessage(tabId, message, (response) => {
			const lastError = chrome.runtime.lastError;
			if (lastError) {
				reject(lastError);
				return;
			}
			resolve(response);
		});
	});
}

async function requestStateFromTab(tabId) {
	try {
		return await sendMessageToTab(tabId, { type: MESSAGE_TYPES.GET_STATE });
	} catch (_error) {
		return null;
	}
}

async function hasHostPermission(domain) {
	const origins = buildOriginPatterns(domain);
	return await chrome.permissions
		.contains({ origins })
		.catch(() => false);
}

async function requestHostPermission(domain) {
	const origins = buildOriginPatterns(domain);
	try {
		return await chrome.permissions.request({ origins });
	} catch (error) {
		console.warn(
			"[DocsFocus] Permission request failed for domain",
			domain,
			error,
		);
		return false;
	}
}

function buildOriginPatterns(domain) {
	return [`https://${domain}/*`, `http://${domain}/*`];
}
