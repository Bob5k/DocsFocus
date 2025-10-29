export async function createFeatureManager(context) {
  const [textCollapseModule, codePreviewModule, keywordHighlightModule] = await Promise.all([
    import(chrome.runtime.getURL('content/features/text-collapse.js')),
    import(chrome.runtime.getURL('content/features/code-preview.js')),
    import(chrome.runtime.getURL('content/features/keyword-highlighting.js'))
  ]);

  const textCollapse = textCollapseModule.createTextCollapseFeature(context);
  const codePreview = codePreviewModule.createCodePreviewFeature(context);
  const keywordHighlight = keywordHighlightModule.createKeywordHighlightFeature(context);

  return {
    activate(settings) {
      textCollapse.activate(settings);
      codePreview.activate(settings);
      keywordHighlight.activate(settings);
    },
    update(settings) {
      textCollapse.update(settings);
      codePreview.update(settings);
      keywordHighlight.update(settings);
    },
    deactivate() {
      keywordHighlight.deactivate();
      codePreview.deactivate();
      textCollapse.deactivate();
    }
  };
}
