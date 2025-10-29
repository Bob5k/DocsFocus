const COLLAPSE_WRAPPER_CLASS = 'docsfocus-collapse';
const SUMMARY_CLASS = 'docsfocus-collapse__summary';
const TOGGLE_CLASS = 'docsfocus-collapse__toggle';
const CONTENT_CLASS = 'docsfocus-collapse__content';
const DATA_KEY = 'docsfocusCollapseWrapper';
const SKIP_PARENTS_SELECTOR = 'nav, header, footer, aside, code, pre, figure, table, blockquote, dl, ul, ol';

export function createTextCollapseFeature({ document, helpers }) {
  let threshold = helpers.DEFAULT_SETTINGS.collapseThreshold;
  const collapsedMap = new Map();
  let observer = null;
  let active = false;
  let idCounter = 0;

  function activate(settings) {
    threshold = settings.collapseThreshold ?? helpers.DEFAULT_SETTINGS.collapseThreshold;
    active = true;
    scanDocument();
    ensureObserver();
  }

  function update(settings) {
    const nextThreshold = settings.collapseThreshold ?? helpers.DEFAULT_SETTINGS.collapseThreshold;
    if (nextThreshold !== threshold) {
      threshold = nextThreshold;
      refreshAll();
    } else {
      scanDocument();
    }
  }

  function deactivate() {
    active = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    collapsedMap.forEach((entry) => restoreParagraph(entry));
    collapsedMap.clear();
  }

  function refreshAll() {
    collapsedMap.forEach((entry) => restoreParagraph(entry));
    collapsedMap.clear();
    scanDocument();
  }

  function ensureObserver() {
    if (observer) {
      return;
    }
    observer = new MutationObserver((mutations) => {
      if (!active) {
        return;
      }
      let shouldRescan = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches('p')) {
                processParagraph(node);
              }
              node.querySelectorAll?.('p').forEach((paragraph) => processParagraph(paragraph));
            }
          });
        }
        if (mutation.type === 'characterData') {
          const parent = mutation.target.parentElement;
          if (parent && parent.closest(`.${COLLAPSE_WRAPPER_CLASS}`)) {
            shouldRescan = true;
          }
        }
      }
      if (shouldRescan) {
        refreshAll();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function scanDocument() {
    if (!active) {
      return;
    }
    const paragraphs = Array.from(document.querySelectorAll('p'));
    paragraphs.forEach((paragraph) => processParagraph(paragraph));
  }

  function processParagraph(paragraph) {
    if (!active || paragraph.dataset.docsfocusCollapsed === 'true') {
      return;
    }
    if (!shouldCollapse(paragraph)) {
      return;
    }
    collapseParagraph(paragraph);
  }

  function shouldCollapse(paragraph) {
    if (!(paragraph instanceof HTMLElement)) {
      return false;
    }
    if (paragraph.closest(`.${COLLAPSE_WRAPPER_CLASS}`)) {
      return false;
    }
    if (paragraph.closest(SKIP_PARENTS_SELECTOR)) {
      return false;
    }
    if (paragraph.querySelector('code, pre')) {
      return false;
    }
    const text = paragraph.textContent?.trim().replace(/\s+/g, ' ') ?? '';
    if (text.length < threshold) {
      return false;
    }
    return true;
  }

  function collapseParagraph(paragraph) {
    const originalParent = paragraph.parentElement;
    if (!originalParent) {
      return;
    }
    const summaryText = buildSummary(paragraph.textContent ?? '');
    const wrapper = document.createElement('div');
    wrapper.className = COLLAPSE_WRAPPER_CLASS;
    wrapper.dataset.docsfocus = 'collapsed-paragraph';
    const summary = document.createElement('p');
    summary.className = SUMMARY_CLASS;
    summary.textContent = summaryText;

    const content = document.createElement('div');
    content.className = CONTENT_CLASS;
    content.hidden = true;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = TOGGLE_CLASS;
    toggle.textContent = 'Show more';
    const contentId = `docsfocus-collapse-${++idCounter}`;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', contentId);
    toggle.setAttribute('aria-label', 'Expand collapsed paragraph');
    content.id = contentId;

    const nextSibling = paragraph.nextSibling;
    content.appendChild(paragraph);
    wrapper.append(summary, toggle, content);
    originalParent.insertBefore(wrapper, nextSibling ?? null);

    const entry = {
      wrapper,
      summary,
      toggle,
      content,
      paragraph,
      parent: originalParent,
      nextSibling
    };

    paragraph[DATA_KEY] = wrapper;
    paragraph.dataset.docsfocusCollapsed = 'true';
    collapsedMap.set(wrapper, entry);

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      setExpanded(entry, !expanded);
    });
  }

  function setExpanded(entry, expanded) {
    entry.toggle.setAttribute('aria-expanded', String(expanded));
    entry.toggle.textContent = expanded ? 'Show less' : 'Show more';
    entry.toggle.setAttribute('aria-label', expanded ? 'Collapse paragraph' : 'Expand paragraph');
    entry.summary.hidden = expanded;
    entry.content.hidden = !expanded;
  }

  function restoreParagraph(entry) {
    const { wrapper, paragraph, parent, nextSibling } = entry;
    if (wrapper && wrapper.parentElement) {
      wrapper.parentElement.replaceChild(paragraph, wrapper);
    } else if (parent) {
      parent.insertBefore(paragraph, nextSibling ?? null);
    }
    if (paragraph) {
      delete paragraph[DATA_KEY];
      delete paragraph.dataset.docsfocusCollapsed;
    }
  }

  function buildSummary(text) {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      return '';
    }
    const sentenceMatch = trimmed.match(/^[^.!?]*[.!?]/);
    if (sentenceMatch) {
      return `${sentenceMatch[0].trim()} …`;
    }
    return `${trimmed.slice(0, 160).trim()} …`;
  }

  return {
    activate,
    update,
    deactivate
  };
}
