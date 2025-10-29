const TRIM_DATA_ATTR = "data-docsfocus-trimmed";
const PREVIEW_DATA_ATTR = "data-docsfocus-trim-preview";
const TOGGLE_BUTTON_CLASS = "docsfocus-trim-toggle";

const CANDIDATE_SELECTORS = [
	"header",
	'[role="banner"]',
	".site-header",
	".global-nav",
	".docs-nav",
	".docs-subheader",
	".docs-sidebar",
	".sidebar",
	".side-nav",
	".sidenav",
	".secondary-nav",
	".table-of-contents",
	".toc",
	"#TableOfContents",
	".breadcrumbs",
	".breadcrumb",
	".announcement",
	".announcement-bar",
	".promo",
	".notification",
	".feedback",
	".newsletter",
	".subscribe",
	".ad",
	".ads",
	".cookie-banner",
	"aside",
	"nav",
];

const KEYWORD_HINTS = [
	"announcement",
	"promo",
	"newsletter",
	"subscribe",
	"cookie",
	"feedback",
	"survey",
	"alert",
	"banner",
	"sidebar",
	"table-of-contents",
	"toc",
	"breadcrumbs",
	"sidenav",
	"pagenav",
];

export function createLayoutTrimFeature({ document }) {
	const trimmedEntries = new Map();
	let observer = null;
	let resizeListenerAttached = false;
	let active = false;
	let previewVisible = false;
	let toggleButton = null;
	let rafId = null;

	const handleToggleClick = () => {
		setPreview(!previewVisible);
	};

	function activate(settings) {
		if (!settings.trimChrome) {
			deactivate();
			return;
		}
		active = true;
		applyTrim();
		ensureToggleButton();
		ensureObserver();
		ensureResizeListener();
	}

	function update(settings) {
		if (!settings.trimChrome) {
			deactivate();
			return;
		}
		active = true;
		applyTrim();
		ensureToggleButton();
	}

	function deactivate() {
		active = false;
		previewVisible = false;
		cancelAnimationFrame(rafId);
		rafId = null;
		if (observer) {
			observer.disconnect();
			observer = null;
		}
		if (resizeListenerAttached) {
			window.removeEventListener("resize", scheduleTrimPass);
			resizeListenerAttached = false;
		}
		restoreAll();
		removeToggleButton();
	}

	function ensureObserver() {
		if (observer) {
			return;
		}
		observer = new MutationObserver((mutations) => {
			if (!active) {
				return;
			}
			let added = false;
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						added = true;
					}
				});
			});
			if (added) {
				scheduleTrimPass();
			}
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	function ensureResizeListener() {
		if (resizeListenerAttached) {
			return;
		}
		window.addEventListener("resize", scheduleTrimPass, { passive: true });
		resizeListenerAttached = true;
	}

	function scheduleTrimPass() {
		if (!active) {
			return;
		}
		if (rafId != null) {
			return;
		}
		rafId = requestAnimationFrame(() => {
			rafId = null;
			applyTrim();
		});
	}

	function applyTrim() {
		cleanupEntries();
		if (!active) {
			return;
		}
		const candidates = collectCandidates();
		const viewportWidth =
			window.innerWidth || document.documentElement.clientWidth || 0;
		const viewportHeight =
			window.innerHeight || document.documentElement.clientHeight || 0;

		candidates.forEach((element) => {
			if (trimmedEntries.has(element)) {
				return;
			}
			if (shouldTrimElement(element, viewportWidth, viewportHeight)) {
				hideElement(element, classifyElement(element));
			}
		});
		updateToggleButtonState();
	}

	function collectCandidates() {
		const nodes = new Set();
		for (const selector of CANDIDATE_SELECTORS) {
			for (const element of document.querySelectorAll(selector)) {
				nodes.add(element);
			}
		}
		return Array.from(nodes).filter((element) => isCandidate(element));
	}

	function isCandidate(element) {
		if (!(element instanceof HTMLElement)) {
			return false;
		}
		if (!document.body.contains(element)) {
			return false;
		}
		if (element.closest('[class*="docsfocus-"]') || element.dataset.docsfocus) {
			return false;
		}
		if (element.getAttribute(TRIM_DATA_ATTR)) {
			return true;
		}
		const computed = window.getComputedStyle(element);
		if (
			computed.display === "none" ||
			computed.visibility === "hidden" ||
			Number(computed.opacity) === 0
		) {
			return false;
		}
		return true;
	}

	function shouldTrimElement(element, viewportWidth, viewportHeight) {
		if (viewportWidth < 960) {
			return false;
		}

		const rect = element.getBoundingClientRect();
		if (!rect || rect.width === 0 || rect.height === 0) {
			return false;
		}

		const computed = window.getComputedStyle(element);
		const descriptor =
			`${element.id} ${element.className} ${element.getAttribute("data-testid") || ""}`.toLowerCase();

		if (shouldTrimBanner(rect, computed, descriptor, viewportHeight)) {
			return true;
		}
		if (
			shouldTrimSidebar(
				rect,
				computed,
				descriptor,
				viewportWidth,
				viewportHeight,
			)
		) {
			return true;
		}
		if (shouldTrimFloatingPanel(rect, computed, descriptor)) {
			return true;
		}
		return false;
	}

	function shouldTrimBanner(rect, computed, descriptor, viewportHeight) {
		if (rect.top > viewportHeight * 0.4) {
			return false;
		}
		const isTopFixed =
			computed.position === "fixed" || computed.position === "sticky";
		const smallHeight = rect.height <= 180;
		const keywordMatch = KEYWORD_HINTS.some((keyword) =>
			descriptor.includes(keyword),
		);
		return isTopFixed && smallHeight && keywordMatch;
	}

	function shouldTrimSidebar(
		rect,
		computed,
		descriptor,
		viewportWidth,
		viewportHeight,
	) {
		const horizontalMargin = Math.min(rect.left, viewportWidth - rect.right);
		if (horizontalMargin > viewportWidth * 0.35) {
			return false;
		}
		const narrow = rect.width <= viewportWidth * 0.32;
		const tallEnough = rect.height >= viewportHeight * 0.3;
		const sticky =
			computed.position === "sticky" || computed.position === "fixed";
		const keywordMatch = KEYWORD_HINTS.some((keyword) =>
			descriptor.includes(keyword),
		);
		return (narrow && (tallEnough || sticky)) || keywordMatch;
	}

	function shouldTrimFloatingPanel(rect, computed, descriptor) {
		if (computed.position !== "fixed") {
			return false;
		}
		if (rect.width > 360 || rect.height > 360) {
			return false;
		}
		const nearEdge =
			rect.right >= (window.innerWidth || 0) - 60 ||
			rect.left <= 60 ||
			rect.bottom >= (window.innerHeight || 0) - 60;
		const keywordMatch = KEYWORD_HINTS.some((keyword) =>
			descriptor.includes(keyword),
		);
		return nearEdge && keywordMatch;
	}

	function classifyElement(element) {
		const descriptor = `${element.id} ${element.className}`.toLowerCase();
		if (
			descriptor.includes("banner") ||
			descriptor.includes("announcement") ||
			descriptor.includes("promo")
		) {
			return "banner";
		}
		if (descriptor.includes("breadcrumb")) {
			return "breadcrumbs";
		}
		if (
			descriptor.includes("toc") ||
			descriptor.includes("table-of-contents")
		) {
			return "toc";
		}
		if (descriptor.includes("feedback") || descriptor.includes("newsletter")) {
			return "feedback";
		}
		return "sidebar";
	}

	function hideElement(element, reason) {
		if (trimmedEntries.has(element)) {
			return;
		}
		const entry = {
			element,
			reason,
			inlineStyle: element.getAttribute("style"),
			ariaHidden: element.getAttribute("aria-hidden"),
		};
		trimmedEntries.set(element, entry);
		element.setAttribute(TRIM_DATA_ATTR, reason);
		if (previewVisible) {
			if (entry.inlineStyle != null) {
				element.setAttribute("style", entry.inlineStyle);
			} else {
				element.removeAttribute("style");
			}
			if (entry.ariaHidden != null) {
				element.setAttribute("aria-hidden", entry.ariaHidden);
			} else {
				element.removeAttribute("aria-hidden");
			}
			element.setAttribute(PREVIEW_DATA_ATTR, "true");
		} else {
			element.setAttribute("aria-hidden", "true");
			element.style.setProperty("display", "none", "important");
		}
	}

	function restoreAll() {
		trimmedEntries.forEach((entry, element) => {
			restoreElement(entry);
			trimmedEntries.delete(element);
		});
		updateToggleButtonState();
	}

	function restoreElement(entry) {
		const { element, inlineStyle, ariaHidden } = entry;
		if (inlineStyle != null) {
			element.setAttribute("style", inlineStyle);
		} else {
			element.removeAttribute("style");
		}
		if (ariaHidden != null) {
			element.setAttribute("aria-hidden", ariaHidden);
		} else {
			element.removeAttribute("aria-hidden");
		}
		element.removeAttribute(TRIM_DATA_ATTR);
		element.removeAttribute(PREVIEW_DATA_ATTR);
	}

	function setPreview(visible) {
		previewVisible = visible;
		trimmedEntries.forEach((entry, element) => {
			if (visible) {
				if (entry.inlineStyle != null) {
					element.setAttribute("style", entry.inlineStyle);
				} else {
					element.removeAttribute("style");
				}
				if (entry.ariaHidden != null) {
					element.setAttribute("aria-hidden", entry.ariaHidden);
				} else {
					element.removeAttribute("aria-hidden");
				}
				element.setAttribute(PREVIEW_DATA_ATTR, "true");
			} else {
				element.style.setProperty("display", "none", "important");
				element.setAttribute("aria-hidden", "true");
				element.removeAttribute(PREVIEW_DATA_ATTR);
			}
		});
		updateToggleButtonState();
	}

	function cleanupEntries() {
		Array.from(trimmedEntries.entries()).forEach(([element, _entry]) => {
			if (!document.body.contains(element)) {
				trimmedEntries.delete(element);
				return;
			}
			if (previewVisible) {
				// Ensure previewed elements still show the preview marker.
				element.setAttribute(PREVIEW_DATA_ATTR, "true");
			}
		});
	}

	function ensureToggleButton() {
		if (!toggleButton) {
			toggleButton = document.createElement("button");
			toggleButton.type = "button";
			toggleButton.className = TOGGLE_BUTTON_CLASS;
			toggleButton.addEventListener("click", handleToggleClick);
			toggleButton.setAttribute("aria-pressed", "false");
			toggleButton.hidden = true;
			document.body.appendChild(toggleButton);
		}
		updateToggleButtonState();
	}

	function removeToggleButton() {
		if (!toggleButton) {
			return;
		}
		toggleButton.removeEventListener("click", handleToggleClick);
		toggleButton.remove();
		toggleButton = null;
	}

	function updateToggleButtonState() {
		if (!toggleButton) {
			return;
		}
		const hasTrim = trimmedEntries.size > 0;
		toggleButton.hidden = !hasTrim;
		toggleButton.setAttribute("aria-pressed", String(previewVisible));
		if (!hasTrim) {
			toggleButton.textContent = "";
			return;
		}
		toggleButton.textContent = previewVisible
			? "Hide trimmed UI"
			: "Show trimmed UI";
	}

	return {
		activate,
		update,
		deactivate,
	};
}
