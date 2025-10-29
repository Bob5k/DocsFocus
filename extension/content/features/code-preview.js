const PREVIEW_CLASS = "docsfocus-code-preview";
const PREVIEW_LABEL_CLASS = "docsfocus-code-preview__label";
const PREVIEW_BODY_CLASS = "docsfocus-code-preview__body";
const PREVIEW_LINK_CLASS = "docsfocus-code-preview__link";
const PREVIEW_CONTAINER_ATTR = "data-docsfocus-preview";

export function createCodePreviewFeature({ document }) {
	const previewMap = new Map();
	let active = false;
	let observer = null;
	let idCounter = 0;
	let shouldShowPreview = true;

	function activate(settings) {
		shouldShowPreview = Boolean(settings.previewTlDr);
		active = shouldShowPreview;
		if (!shouldShowPreview) {
			deactivate();
			return;
		}
		generatePreviews();
		ensureObserver();
	}

	function update(settings) {
		const nextShouldShow = Boolean(settings.previewTlDr);
		if (!nextShouldShow) {
			deactivate();
			return;
		}
		shouldShowPreview = true;
		active = true;
		refreshPreviews();
	}

	function deactivate() {
		active = false;
		shouldShowPreview = false;
		if (observer) {
			observer.disconnect();
			observer = null;
		}
		previewMap.forEach(({ preview, heading }) => {
			if (preview?.parentElement) {
				preview.parentElement.removeChild(preview);
			}
			if (heading) {
				delete heading.dataset.docsfocusPreview;
			}
		});
		previewMap.clear();
	}

	function ensureObserver() {
		if (observer) {
			return;
		}
		observer = new MutationObserver((mutations) => {
			if (!active) {
				return;
			}
			let shouldRefresh = false;
			for (const mutation of mutations) {
				if (
					mutation.type === "childList" ||
					mutation.type === "characterData"
				) {
					shouldRefresh = true;
					break;
				}
			}
			if (shouldRefresh) {
				refreshPreviews();
			}
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			characterData: true,
		});
	}

	function refreshPreviews() {
		const seenHeadings = new Set();
		const headings = getHeadings();
		headings.forEach((heading) => {
			seenHeadings.add(heading);
			createOrUpdatePreview(heading);
		});

		previewMap.forEach((entry, heading) => {
			if (!seenHeadings.has(heading)) {
				if (entry.preview?.parentElement) {
					entry.preview.parentElement.removeChild(entry.preview);
				}
				previewMap.delete(heading);
			}
		});
	}

	function generatePreviews() {
		const headings = getHeadings();
		for (const heading of headings) {
			createOrUpdatePreview(heading);
		}
	}

	function createOrUpdatePreview(heading) {
		if (
			!shouldShowPreview ||
			!heading ||
			heading.dataset.docsfocusPreview === "true"
		) {
			return;
		}
		const firstCodeBlock = findFirstCodeBlockAfterHeading(heading);
		if (!firstCodeBlock) {
			return;
		}
		const anchorId = ensureCodeBlockAnchor(firstCodeBlock);
		const existing = previewMap.get(heading);
		if (existing) {
			updatePreviewContent(existing.preview, firstCodeBlock, anchorId);
			return;
		}
		const preview = buildPreviewElement(heading, firstCodeBlock, anchorId);
		heading.insertAdjacentElement("afterend", preview);
		heading.dataset.docsfocusPreview = "true";
		previewMap.set(heading, { preview, heading, anchorId });
	}

	function buildPreviewElement(heading, codeBlock, anchorId) {
		const preview = document.createElement("div");
		preview.className = PREVIEW_CLASS;
		preview.setAttribute(PREVIEW_CONTAINER_ATTR, anchorId);

		const label = document.createElement("div");
		label.className = PREVIEW_LABEL_CLASS;
		label.textContent = "TL;DR code";

		const body = document.createElement("div");
		body.className = PREVIEW_BODY_CLASS;

		const clone = cloneCodeBlock(codeBlock);
		body.appendChild(clone);

		const link = document.createElement("a");
		link.className = PREVIEW_LINK_CLASS;
		link.href = `#${anchorId}`;
		link.textContent = "Jump to full example";
		link.setAttribute(
			"aria-label",
			`Jump to full example in section ${heading.textContent?.trim() || ""}`,
		);

		preview.append(label, body, link);

		return preview;
	}

	function updatePreviewContent(preview, codeBlock, anchorId) {
		const body = preview.querySelector(`.${PREVIEW_BODY_CLASS}`);
		const link = preview.querySelector(`.${PREVIEW_LINK_CLASS}`);
		if (body) {
			body.innerHTML = "";
			body.appendChild(cloneCodeBlock(codeBlock));
		}
		if (link) {
			link.href = `#${anchorId}`;
		}
	}

	function cloneCodeBlock(element) {
		const target =
			element.classList?.contains("highlight") && element.querySelector("pre")
				? element
				: element.closest(".highlight") || element;
		const clone = target.cloneNode(true);
		for (const node of clone.querySelectorAll("[id]")) {
			node.removeAttribute("id");
		}
		enhanceClone(clone);
		return clone;
	}

	function enhanceClone(clone) {
		if (!(clone instanceof HTMLElement)) {
			return;
		}
		clone.classList.add("docsfocus-code-preview__code");
		clone.setAttribute("tabindex", "0");
		clone.setAttribute("role", "region");
		clone.setAttribute("aria-label", "Code preview");
	}

	function ensureCodeBlockAnchor(codeBlock) {
		const container = codeBlock.closest("[id]") || codeBlock;
		if (container.id) {
			return container.id;
		}
		const generatedId = `docsfocus-code-${++idCounter}`;
		container.id = generatedId;
		return generatedId;
	}

	function getHeadings() {
		return Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
	}

	function findFirstCodeBlockAfterHeading(heading) {
		const level = getHeadingLevel(heading);
		let node = heading.nextElementSibling;
		while (node) {
			if (isHeading(node)) {
				const nextLevel = getHeadingLevel(node);
				if (nextLevel <= level) {
					break;
				}
			}
			const code = findCodeWithin(node);
			if (code) {
				if (isNonExampleCode(code)) {
					node = node.nextElementSibling;
					continue;
				}
				return code;
			}
			node = node.nextElementSibling;
		}
		return null;
	}

	function findCodeWithin(node) {
		if (!node || !(node instanceof HTMLElement)) {
			return null;
		}
		if (node.matches("pre, code, div.highlight")) {
			return resolveCodeNode(node);
		}
		const found = node.querySelector("pre, code, div.highlight");
		return found ? resolveCodeNode(found) : null;
	}

	function resolveCodeNode(node) {
		if (!node) {
			return null;
		}
		if (node.matches("div.highlight")) {
			const pre = node.querySelector("pre");
			return pre || node;
		}
		if (node.matches("code")) {
			const preParent = node.closest("pre");
			return preParent || node;
		}
		return node;
	}

	function isNonExampleCode(node) {
		if (!node) {
			return true;
		}
		const text = node.textContent?.trim() ?? "";
		if (!text) {
			return true;
		}
		if (text.length < 40) {
			return true;
		}
		const lines = text.split("\n");
		const meaningfulLines = lines.filter((line) => line.trim().length > 2);
		return meaningfulLines.length < 2;
	}

	function isHeading(node) {
		return node instanceof HTMLElement && /^H[1-6]$/.test(node.tagName);
	}

	function getHeadingLevel(node) {
		if (!node || !(node instanceof HTMLElement)) {
			return 7;
		}
		const match = node.tagName.match(/H([1-6])/);
		return match ? Number(match[1]) : 7;
	}

	return {
		activate,
		update,
		deactivate,
	};
}
