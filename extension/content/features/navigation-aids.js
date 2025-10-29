const TRACKER_CLASS = 'docsfocus-tracker';
const TRACKER_RESTORE_CLASS = 'docsfocus-tracker__restore';
const TRACKER_FLASH_CLASS = 'docsfocus-flash';
const FOCUSABLE_SELECTOR = 'input, textarea, select, button, [contenteditable="true"], [role="textbox"]';

export function createNavigationAidsFeature({ document }) {
  let settings = {
    sectionTracker: true,
    keyboardShortcuts: true
  };

  let headings = [];
  let observer = null;
  let mutationObserver = null;
  let refreshScheduled = false;
  let currentIndex = 0;
  let overlay = null;
  let labelEl = null;
  let infoEl = null;
  let restoreButton = null;
  let minimized = false;
  let keydownAttached = false;

  function activate(nextSettings) {
    settings = {
      ...settings,
      ...(nextSettings || {})
    };

    if (!settings.sectionTracker && !settings.keyboardShortcuts) {
      deactivate();
      return;
    }

    collectHeadings();
    ensureObserver();
    ensureMutationObserver();
    updateOverlayState();
    updateKeyboardState();
    updateTrackerLabel();
  }

  function update(nextSettings) {
    activate(nextSettings);
  }

  function deactivate() {
    detachKeydown();
    headings = [];
    currentIndex = 0;
    minimized = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    removeOverlay();
    removeRestoreButton();
  }

  function ensureObserver() {
    if (observer) {
      observer.disconnect();
    }
    if (!headings.length) {
      observer = null;
      return;
    }
    observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '-55% 0px -35% 0px',
      threshold: [0, 0.1, 1]
    });
    headings.forEach((item) => observer.observe(item.element));
  }

  function ensureMutationObserver() {
    if (mutationObserver) {
      return;
    }
    mutationObserver = new MutationObserver(() => scheduleRefresh());
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function scheduleRefresh() {
    if (refreshScheduled) {
      return;
    }
    refreshScheduled = true;
    requestAnimationFrame(() => {
      refreshScheduled = false;
      const previousId = headings[currentIndex]?.id;
      collectHeadings();
      ensureObserver();
      if (previousId) {
        const nextIndex = headings.findIndex((item) => item.id === previousId);
        currentIndex = nextIndex >= 0 ? nextIndex : Math.min(currentIndex, headings.length - 1);
      } else {
        currentIndex = Math.min(currentIndex, Math.max(headings.length - 1, 0));
      }
      updateTrackerLabel();
    });
  }

  function collectHeadings() {
    const scope = document.querySelector('main') || document.body;
    const nodes = scope.querySelectorAll('h1, h2, h3, h4');
    const list = [];
    const usedIds = new Set();

    nodes.forEach((heading) => {
      if (!(heading instanceof HTMLElement)) {
        return;
      }
      if (!heading.textContent || !heading.textContent.trim()) {
        return;
      }
      if (heading.closest('[data-docsfocus-ignore]')) {
        return;
      }
      const computed = window.getComputedStyle(heading);
      if (computed.display === 'none' || computed.visibility === 'hidden') {
        return;
      }
      const level = parseInt(heading.tagName.slice(1), 10);
      if (!Number.isFinite(level) || level > 4) {
        return;
      }
      const id = ensureHeadingId(heading, usedIds);
      usedIds.add(id);
      const text = extractHeadingText(heading);
      list.push({ element: heading, id, level, text });
    });

    headings = list;
  }

  function ensureHeadingId(heading, usedIds) {
    if (heading.id && !usedIds.has(heading.id)) {
      return heading.id;
    }
    const base = slugify(heading.textContent || 'section');
    let candidate = base || 'section';
    let i = 1;
    while (document.getElementById(candidate) || usedIds.has(candidate)) {
      candidate = `${base || 'section'}-${i++}`;
    }
    heading.id = candidate;
    return candidate;
  }

  function extractHeadingText(heading) {
    const pieces = [];
    heading.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        pieces.push(node.textContent || '');
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (element.classList.contains('docsfocus-section__toggle')) {
          return;
        }
        if (element.matches('a[href^="#"]')) {
          return;
        }
        pieces.push(element.textContent || '');
      }
    });
    const text = pieces.join(' ').replace(/\s+/g, ' ').trim();
    return text || heading.textContent.trim().replace(/\s+/g, ' ');
  }

  function slugify(value) {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function handleIntersect(entries) {
    const indices = entries
      .filter((entry) => entry.isIntersecting)
      .map((entry) => headings.findIndex((item) => item.element === entry.target))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);

    if (indices.length) {
      setCurrentIndex(indices[0]);
    } else {
      updateIndexByScrollPosition();
    }
  }

  function updateIndexByScrollPosition() {
    const viewportTop = window.scrollY;
    let bestIndex = 0;
    let bestOffset = Number.NEGATIVE_INFINITY;
    headings.forEach((item, index) => {
      const rect = item.element.getBoundingClientRect();
      const absoluteTop = viewportTop + rect.top;
      if (absoluteTop <= viewportTop + 80 && absoluteTop > bestOffset) {
        bestOffset = absoluteTop;
        bestIndex = index;
      }
    });
    setCurrentIndex(bestIndex);
  }

  function setCurrentIndex(index) {
    const nextIndex = Math.min(Math.max(index, 0), Math.max(headings.length - 1, 0));
    if (nextIndex === currentIndex) {
      return;
    }
    currentIndex = nextIndex;
    updateTrackerLabel();
  }

  function updateOverlayState() {
    if (!settings.sectionTracker || !headings.length) {
      removeOverlay();
      removeRestoreButton();
      return;
    }
    ensureOverlay();
    updateTrackerLabel();
  }

  function ensureOverlay() {
    if (overlay) {
      overlay.hidden = minimized;
      return;
    }
    overlay = document.createElement('aside');
    overlay.className = TRACKER_CLASS;
    overlay.setAttribute('role', 'complementary');
    overlay.setAttribute('aria-label', 'DocsFocus navigation helper');

    const prevButton = createNavButton('prev', 'Previous section');
    const nextButton = createNavButton('next', 'Next section');
    const collapseButton = createNavButton('collapse', 'Hide tracker');

    labelEl = document.createElement('div');
    labelEl.className = `${TRACKER_CLASS}__label`;
    labelEl.setAttribute('role', 'status');
    labelEl.setAttribute('aria-live', 'polite');

    infoEl = document.createElement('div');
    infoEl.className = `${TRACKER_CLASS}__hint`;
    infoEl.textContent = 'Shift+J / Shift+K';

    const content = document.createElement('div');
    content.className = `${TRACKER_CLASS}__content`;
    content.appendChild(labelEl);
    content.appendChild(infoEl);

    overlay.append(prevButton, content, nextButton, collapseButton);
    overlay.addEventListener('click', handleOverlayClick);
    document.body.appendChild(overlay);
    if (minimized) {
      overlay.hidden = true;
      ensureRestoreButton();
    }
  }

  function removeOverlay() {
    if (!overlay) {
      return;
    }
    overlay.removeEventListener('click', handleOverlayClick);
    overlay.remove();
    overlay = null;
    labelEl = null;
    infoEl = null;
  }

  function ensureRestoreButton() {
    if (restoreButton) {
      restoreButton.hidden = !minimized;
      return;
    }
    restoreButton = document.createElement('button');
    restoreButton.type = 'button';
    restoreButton.className = TRACKER_RESTORE_CLASS;
    restoreButton.textContent = 'DocsFocus tracker';
    restoreButton.hidden = !minimized;
    restoreButton.addEventListener('click', () => {
      minimized = false;
      if (overlay) {
        overlay.hidden = false;
      }
      if (restoreButton) {
        restoreButton.hidden = true;
      }
    });
    document.body.appendChild(restoreButton);
  }

  function removeRestoreButton() {
    if (!restoreButton) {
      return;
    }
    restoreButton.remove();
    restoreButton = null;
  }

  function createNavButton(action, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `${TRACKER_CLASS}__nav`;
    button.dataset.action = action;
    button.setAttribute('aria-label', label);
    button.textContent = action === 'prev' ? '↑' : action === 'next' ? '↓' : '×';
    if (action === 'collapse') {
      button.classList.add(`${TRACKER_CLASS}__nav--collapse`);
      button.textContent = '⌄';
    }
    return button;
  }

  function handleOverlayClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const action = target.dataset.action;
    if (!action) {
      return;
    }
    event.preventDefault();
    switch (action) {
      case 'prev':
        goToOffset(-1);
        break;
      case 'next':
        goToOffset(1);
        break;
      case 'collapse':
        minimized = true;
        if (overlay) {
          overlay.hidden = true;
        }
        ensureRestoreButton();
        if (restoreButton) {
          restoreButton.hidden = false;
        }
        break;
      default:
        break;
    }
  }

  function goToOffset(delta) {
    if (!headings.length) {
      return;
    }
    const nextIndex = Math.min(Math.max(currentIndex + delta, 0), headings.length - 1);
    scrollToHeading(nextIndex);
  }

  function scrollToHeading(index) {
    const target = headings[index];
    if (!target) {
      return;
    }
    const sectionWrapper = target.element.closest('.docsfocus-section');
    if (sectionWrapper?.classList.contains('docsfocus-section--collapsed')) {
      const toggle = sectionWrapper.querySelector('.docsfocus-section__toggle');
      toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    target.element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    currentIndex = index;
    requestAnimationFrame(() => {
      updateTrackerLabel();
    });
  }

  function updateTrackerLabel() {
    if (!labelEl) {
      return;
    }
    if (!headings.length) {
      labelEl.textContent = 'No headings detected';
      if (infoEl) {
        infoEl.textContent = settings.keyboardShortcuts ? 'Shift+J / Shift+K' : '';
      }
      return;
    }
    const item = headings[currentIndex];
    labelEl.textContent = item?.text || '—';
    if (infoEl) {
      const base = `Section ${currentIndex + 1} of ${headings.length}`;
      infoEl.textContent = settings.keyboardShortcuts ? `${base} • Shift+J / Shift+K` : base;
    }
  }

  function updateKeyboardState() {
    if (settings.keyboardShortcuts) {
      attachKeydown();
    } else {
      detachKeydown();
    }
  }

  function attachKeydown() {
    if (keydownAttached) {
      return;
    }
    keydownAttached = true;
    window.addEventListener('keydown', handleKeydown, true);
  }

  function detachKeydown() {
    if (!keydownAttached) {
      return;
    }
    keydownAttached = false;
    window.removeEventListener('keydown', handleKeydown, true);
  }

  function handleKeydown(event) {
    if (!settings.keyboardShortcuts) {
      return;
    }
    if (!event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const target = event.target;
    if (target instanceof HTMLElement && (target.matches(FOCUSABLE_SELECTOR) || target.isContentEditable)) {
      return;
    }

    const key = event.key.toLowerCase();
    switch (key) {
      case 'j':
        event.preventDefault();
        goToOffset(1);
        break;
      case 'k':
        event.preventDefault();
        goToOffset(-1);
        break;
      case 'c':
        event.preventDefault();
        jumpToFirstCode();
        break;
      case 't':
        event.preventDefault();
        toggleTrackerVisibility();
        break;
      default:
        break;
    }
  }

  function jumpToFirstCode() {
    const code = document.querySelector('.docsfocus-code-preview__code, main pre, pre, code');
    if (!code || !(code instanceof HTMLElement)) {
      return;
    }
    code.scrollIntoView({ behavior: 'smooth', block: 'center' });
    code.classList.add(TRACKER_FLASH_CLASS);
    setTimeout(() => code.classList.remove(TRACKER_FLASH_CLASS), 1600);
  }

  function toggleTrackerVisibility() {
    if (!overlay && !settings.sectionTracker) {
      return;
    }
    minimized = !minimized;
    if (overlay) {
      overlay.hidden = minimized;
    }
    ensureRestoreButton();
    if (restoreButton) {
      restoreButton.hidden = !minimized;
    }
  }

  return {
    activate,
    update,
    deactivate
  };
}
