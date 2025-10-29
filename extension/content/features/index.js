export async function createFeatureManager(context) {
	const [
		textCollapseModule,
		codePreviewModule,
		keywordHighlightModule,
		readingMaskModule,
		collapsibleSectionsModule,
		layoutTrimModule,
		navigationAidsModule,
		dyslexiaModeModule,
	] = await Promise.all([
		import(chrome.runtime.getURL("content/features/text-collapse.js")),
		import(chrome.runtime.getURL("content/features/code-preview.js")),
		import(chrome.runtime.getURL("content/features/keyword-highlighting.js")),
		import(chrome.runtime.getURL("content/features/reading-mask.js")),
		import(chrome.runtime.getURL("content/features/collapsible-sections.js")),
		import(chrome.runtime.getURL("content/features/layout-trim.js")),
		import(chrome.runtime.getURL("content/features/navigation-aids.js")),
		import(chrome.runtime.getURL("content/features/dyslexia-mode.js")),
	]);

	const textCollapse = textCollapseModule.createTextCollapseFeature(context);
	const codePreview = codePreviewModule.createCodePreviewFeature(context);
	const keywordHighlight =
		keywordHighlightModule.createKeywordHighlightFeature(context);
	const readingMask = readingMaskModule.createReadingMaskFeature(context);
	const collapsibleSections =
		collapsibleSectionsModule.createCollapsibleSectionsFeature(context);
	const layoutTrim = layoutTrimModule.createLayoutTrimFeature(context);
	const navigationAids =
		navigationAidsModule.createNavigationAidsFeature(context);
	const dyslexiaMode = dyslexiaModeModule.createDyslexiaModeFeature(context);

	return {
		activate(settings) {
			textCollapse.activate(settings);
			codePreview.activate(settings);
			keywordHighlight.activate(settings);
			readingMask.activate(settings);
			collapsibleSections.activate(settings);
			layoutTrim.activate(settings);
			navigationAids.activate(settings);
			dyslexiaMode.activate(settings);
		},
		update(settings) {
			textCollapse.update(settings);
			codePreview.update(settings);
			keywordHighlight.update(settings);
			readingMask.update(settings);
			collapsibleSections.update(settings);
			layoutTrim.update(settings);
			navigationAids.update(settings);
			dyslexiaMode.update(settings);
		},
		deactivate() {
			navigationAids.deactivate();
			layoutTrim.deactivate();
			dyslexiaMode.deactivate();
			collapsibleSections.deactivate();
			readingMask.deactivate();
			keywordHighlight.deactivate();
			codePreview.deactivate();
			textCollapse.deactivate();
		},
	};
}
