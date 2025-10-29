const DYSLEXIA_CLASS = "docsfocus-dyslexia";

export function createDyslexiaModeFeature({ document }) {
	let active = false;

	function activate(settings) {
		updateState(Boolean(settings.dyslexiaMode));
	}

	function update(settings) {
		updateState(Boolean(settings.dyslexiaMode));
	}

	function deactivate() {
		updateState(false);
	}

	function updateState(enabled) {
		if (enabled === active) {
			return;
		}
		active = enabled;
		document.documentElement.classList.toggle(DYSLEXIA_CLASS, enabled);
		if (enabled) {
			document.documentElement.dataset.docsfocusDyslexia = "true";
		} else {
			delete document.documentElement.dataset.docsfocusDyslexia;
		}
	}

	return {
		activate,
		update,
		deactivate,
	};
}
