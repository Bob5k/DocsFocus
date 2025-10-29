const PROSE_MARK_CLASS = "docsfocus-highlight";
const CODE_CONTAINER_CLASS = "docsfocus-code-annotated";
const CODE_OVERLAY_CONTAINER_CLASS = "docsfocus-code-highlight-layer";
const CODE_OVERLAY_CLASS = "docsfocus-code-overlay";
const SKIP_PROSE_SELECTOR =
	".docsfocus-collapse, .docsfocus-code-preview, nav, header, footer, aside, code, pre, samp, kbd, script, style";

export function createKeywordHighlightFeature({ document, helpers }) {
	let keywords = normalizeKeywords(helpers.DEFAULT_SETTINGS.keywords);
	let regex = buildRegex(keywords);
	let highlightCode = true;
	let observer = null;
	let active = false;
	let refreshScheduled = false;
	let refreshFrameId = null;
	const codeOverlayMap = new Map();

	function activate(settings) {
		keywords = normalizeKeywords(
			settings.keywords ?? helpers.DEFAULT_SETTINGS.keywords,
		);
		regex = buildRegex(keywords);
		highlightCode = Boolean(settings.highlightInCode);

		if (!keywords.length || !regex) {
			deactivate();
			return;
		}

		active = true;
		applyHighlights();
		ensureObserver();
	}

	function update(settings) {
		const nextKeywords = normalizeKeywords(
			settings.keywords ?? helpers.DEFAULT_SETTINGS.keywords,
		);
		const nextRegex = buildRegex(nextKeywords);
		const nextHighlightCode = Boolean(settings.highlightInCode);

		const keywordsChanged = nextKeywords.join("|") !== keywords.join("|");
		const codeToggleChanged = nextHighlightCode !== highlightCode;

		keywords = nextKeywords;
		regex = nextRegex;
		highlightCode = nextHighlightCode;

		if (!keywords.length || !regex) {
			deactivate();
			return;
		}

		active = true;

		if (keywordsChanged || codeToggleChanged) {
			applyHighlights();
		}
	}

	function deactivate() {
		active = false;
		if (observer) {
			observer.disconnect();
			observer = null;
		}
		cancelScheduledRefresh();
		clearProseHighlights();
		clearCodeHighlights();
	}

	function ensureObserver() {
		if (observer) {
			return;
		}
		observer = new MutationObserver(() => scheduleRefresh());
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			characterData: true,
		});
	}

	function scheduleRefresh() {
		if (!active || refreshScheduled) {
			return;
		}
		refreshScheduled = true;
		refreshFrameId = requestAnimationFrame(() => {
			refreshFrameId = null;
			refreshScheduled = false;
			if (!active) {
				return;
			}
			applyHighlights();
		});
	}

	function cancelScheduledRefresh() {
		refreshScheduled = false;
		if (refreshFrameId !== null) {
			cancelAnimationFrame(refreshFrameId);
			refreshFrameId = null;
		}
	}

	function applyHighlights() {
		if (!active) {
			return;
		}
		if (!regex) {
			clearProseHighlights();
			clearCodeHighlights();
			return;
		}
		clearProseHighlights();
		highlightProse();
		clearCodeHighlights();
		if (highlightCode) {
			highlightCodeBlocks();
		}
	}

	function highlightProse() {
		const treeWalker = document.createTreeWalker(
			document.body,
			NodeFilter.SHOW_TEXT,
			{
				acceptNode(node) {
					if (!node?.parentElement) {
						return NodeFilter.FILTER_REJECT;
					}
					if (node.parentElement.closest(SKIP_PROSE_SELECTOR)) {
						return NodeFilter.FILTER_REJECT;
					}
					const text = node.textContent;
					if (!text) {
						return NodeFilter.FILTER_REJECT;
					}
					const localRegex = buildRegex(keywords);
					if (!localRegex || !localRegex.test(text)) {
						return NodeFilter.FILTER_REJECT;
					}
					return NodeFilter.FILTER_ACCEPT;
				},
			},
		);

		const targets = [];
		let current = treeWalker.nextNode();
		while (current) {
			targets.push(current);
			current = treeWalker.nextNode();
		}

		for (const node of targets) {
			wrapTextNode(node);
		}
	}

	function wrapTextNode(textNode) {
		const text = textNode.textContent;
		const localRegex = buildRegex(keywords);
		if (!text || !localRegex) {
			return;
		}
		localRegex.lastIndex = 0;
		if (!localRegex.test(text)) {
			return;
		}
		localRegex.lastIndex = 0;
		const fragment = document.createDocumentFragment();
		let lastIndex = 0;
		let match = localRegex.exec(text);
		while (match !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (start > lastIndex) {
				fragment.appendChild(
					document.createTextNode(text.slice(lastIndex, start)),
				);
			}
			const mark = document.createElement("mark");
			mark.className = PROSE_MARK_CLASS;
			mark.dataset.docsfocus = "highlight";
			mark.textContent = match[0];
			fragment.appendChild(mark);
			lastIndex = end;
			match = localRegex.exec(text);
		}
		if (lastIndex < text.length) {
			fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
		}
		textNode.parentNode.replaceChild(fragment, textNode);
	}

	function clearProseHighlights() {
		const highlights = Array.from(
			document.querySelectorAll(`mark.${PROSE_MARK_CLASS}`),
		);
		highlights.forEach((mark) => {
			const text = mark.textContent ?? "";
			const replacement = document.createTextNode(text);
			mark.replaceWith(replacement);
			const parent = replacement.parentElement;
			if (parent) {
				parent.normalize();
			}
		});
	}

	function highlightCodeBlocks() {
		const blocks = Array.from(document.querySelectorAll("pre"));
		for (const block of blocks) {
			applyCodeOverlay(block);
		}
	}

	function applyCodeOverlay(pre) {
		if (!(pre instanceof HTMLElement) || !pre.isConnected) {
			return;
		}

		const text = pre.textContent ?? "";
		if (!text.trim() || !regex) {
			removeOverlay(pre);
			return;
		}

		const lines = text.split("\n");
		const matchingLines = [];
		const keywordRegex = buildRegex(keywords);
		if (!keywordRegex) {
			removeOverlay(pre);
			return;
		}

		lines.forEach((line, index) => {
			keywordRegex.lastIndex = 0;
			if (keywordRegex.test(line)) {
				matchingLines.push(index);
			}
		});

		if (!matchingLines.length) {
			removeOverlay(pre);
			return;
		}

		const metrics = computeMetrics(pre);
		if (!metrics.lineHeight) {
			removeOverlay(pre);
			return;
		}

		let container = codeOverlayMap.get(pre)?.container;
		if (!container) {
			container = document.createElement("div");
			container.className = CODE_OVERLAY_CONTAINER_CLASS;
			container.setAttribute("aria-hidden", "true");
			pre.appendChild(container);
			codeOverlayMap.set(pre, { container });
		}

		container.innerHTML = "";
		pre.classList.add(CODE_CONTAINER_CLASS);

		matchingLines.forEach((lineNumber) => {
			const overlay = document.createElement("div");
			overlay.className = CODE_OVERLAY_CLASS;
			const top = metrics.paddingTop + lineNumber * metrics.lineHeight;
			overlay.style.top = `${top}px`;
			overlay.style.height = `${metrics.lineHeight}px`;
			overlay.style.left = `${metrics.paddingLeft}px`;
			overlay.style.right = `${metrics.paddingRight}px`;
			container.appendChild(overlay);
		});
	}

	function removeOverlay(pre) {
		const entry = codeOverlayMap.get(pre);
		if (entry?.container) {
			entry.container.remove();
		}
		codeOverlayMap.delete(pre);
		pre.classList.remove(CODE_CONTAINER_CLASS);
	}

	function computeMetrics(pre) {
		const style = window.getComputedStyle(pre);
		let lineHeight = parseFloat(style.lineHeight);
		if (!Number.isFinite(lineHeight)) {
			const measurement = document.createElement("span");
			measurement.textContent = "M";
			measurement.style.visibility = "hidden";
			pre.appendChild(measurement);
			lineHeight = measurement.getBoundingClientRect().height || 16;
			measurement.remove();
		}
		const paddingTop = parseFloat(style.paddingTop) || 0;
		const paddingLeft = parseFloat(style.paddingLeft) || 0;
		const paddingRight = parseFloat(style.paddingRight) || 0;
		return {
			lineHeight,
			paddingTop,
			paddingLeft,
			paddingRight,
		};
	}

	function clearCodeHighlights() {
		codeOverlayMap.forEach(({ container }, pre) => {
			if (container) {
				container.remove();
			}
			pre.classList.remove(CODE_CONTAINER_CLASS);
		});
		codeOverlayMap.clear();
	}

	function normalizeKeywords(list) {
		if (!Array.isArray(list)) {
			return [...helpers.DEFAULT_SETTINGS.keywords];
		}
		return Array.from(
			new Set(
				list
					.map((item) => (typeof item === "string" ? item.trim() : ""))
					.filter(Boolean),
			),
		);
	}

	function buildRegex(list) {
		if (!Array.isArray(list) || list.length === 0) {
			return null;
		}
		const escaped = list
			.map((item) => escapeRegex(item))
			.filter(Boolean)
			.join("|");
		if (!escaped) {
			return null;
		}
		return new RegExp(`\\b(?:${escaped})\\b`, "gi");
	}

	function escapeRegex(value) {
		return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
	}

	return {
		activate,
		update,
		deactivate,
	};
}
