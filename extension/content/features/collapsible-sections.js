const SECTION_CLASS = 'docsfocus-section';
const HEADING_CLASS = 'docsfocus-section__heading';
const HEADING_COLLAPSED_CLASS = 'docsfocus-section__heading--collapsed';
const TOGGLE_CLASS = 'docsfocus-section__toggle';
const CONTENT_CLASS = 'docsfocus-section__content';
const COLLAPSED_CLASS = 'docsfocus-section--collapsed';
const IGNORED_PARENTS = 'nav, header, footer, aside, [role="navigation"], [data-docsfocus-ignore]';

export function createCollapsibleSectionsFeature({ document }) {
  const sections = new Map();
  let observer = null;
  let active = false;

  function activate(settings) {
    if (!settings.collapsibleSections) {
      deactivate();
      return;
    }
    active = true;
    scanDocument(document.body);
    ensureObserver();
  }

  function update(settings) {
    if (!settings.collapsibleSections) {
      deactivate();
      return;
    }
    active = true;
    scanDocument(document.body);
  }

  function deactivate() {
    active = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    sections.forEach((entry) => restoreSection(entry));
    sections.clear();
  }

  function ensureObserver() {
    if (observer) {
      return;
    }
    observer = new MutationObserver((mutations) => {
      if (!active) {
        return;
      }
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (isEligibleHeading(node)) {
              processHeading(node);
            }
            node.querySelectorAll?.('h2, h3, h4, h5, h6').forEach((heading) => {
              if (isEligibleHeading(heading)) {
                processHeading(heading);
              }
            });
          }
        });
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function scanDocument(root) {
    const headings = root.querySelectorAll?.('h2, h3, h4, h5, h6');
    if (!headings) {
      return;
    }
    headings.forEach((heading) => {
      if (isEligibleHeading(heading)) {
        processHeading(heading);
      }
    });
  }

  function isEligibleHeading(heading) {
    if (!(heading instanceof HTMLElement)) {
      return false;
    }
    if (heading.dataset.docsfocusSection === 'processed') {
      return false;
    }
    if (heading.closest(`.${SECTION_CLASS}`) && !sections.has(heading)) {
      return false;
    }
    if (heading.closest(IGNORED_PARENTS)) {
      return false;
    }
    if (heading.querySelector(`.${TOGGLE_CLASS}`)) {
      return false;
    }
    const level = getHeadingLevel(heading);
    if (level <= 1 || level > 4) {
      return false;
    }
    const nodes = collectSectionNodes(heading);
    return nodes.length > 0;
  }

  function processHeading(heading) {
    const nodes = collectSectionNodes(heading);
    if (!nodes.length) {
      heading.dataset.docsfocusSection = 'processed';
      return;
    }
    const parent = heading.parentElement;
    if (!parent) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = SECTION_CLASS;
    const content = document.createElement('div');
    content.className = CONTENT_CLASS;

    const sectionId = `docsfocus-section-${sections.size + 1}`;
    content.id = `${sectionId}-content`;

    parent.insertBefore(wrapper, heading);
    wrapper.appendChild(heading);
    enhanceHeading(heading, content, sectionId);
    wrapper.appendChild(content);

    nodes.forEach((node) => {
      content.appendChild(node);
    });

    const entry = {
      id: sectionId,
      heading,
      content,
      wrapper,
      collapsed: false,
      onToggleClick: null,
      onHeadingKeyDown: null
    };

    const onToggleClick = () => toggleSection(entry, !entry.collapsed);
    const onHeadingKeyDown = (event) => {
      if (event.defaultPrevented) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleSection(entry, !entry.collapsed);
      }
    };

    entry.onToggleClick = onToggleClick;
    entry.onHeadingKeyDown = onHeadingKeyDown;
    heading.querySelector(`.${TOGGLE_CLASS}`)?.addEventListener('click', onToggleClick);
    heading.addEventListener('keydown', onHeadingKeyDown);

    sections.set(heading, entry);
  }

  function enhanceHeading(heading, content, sectionId) {
    heading.classList.add(HEADING_CLASS);
    heading.dataset.docsfocusSection = 'processed';
    heading.setAttribute('tabindex', '0');
    heading.setAttribute('aria-expanded', 'true');
    heading.setAttribute('aria-controls', content.id);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = TOGGLE_CLASS;
    toggle.setAttribute('aria-label', 'Collapse section');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-controls', content.id);
    toggle.innerHTML = '<span aria-hidden="true">−</span>';

    const existingAnchor = Array.from(heading.children).find(
      (child) =>
        child instanceof HTMLAnchorElement &&
        child.getAttribute('href') &&
        child.getAttribute('href').startsWith('#')
    );
    if (existingAnchor) {
      heading.insertBefore(toggle, existingAnchor);
    } else {
      heading.appendChild(toggle);
    }
  }

  function collectSectionNodes(heading) {
    const nodes = [];
    let node = heading.nextSibling;
    while (node) {
      if (isHeadingSameOrHigher(node, heading)) {
        break;
      }
      const next = node.nextSibling;
      nodes.push(node);
      node = next;
    }
    return nodes;
  }

  function toggleSection(entry, collapsed) {
    if (!entry || entry.collapsed === collapsed) {
      return;
    }
    entry.collapsed = collapsed;
    entry.content.hidden = collapsed;
    entry.wrapper.classList.toggle(COLLAPSED_CLASS, collapsed);
    entry.heading.classList.toggle(HEADING_COLLAPSED_CLASS, collapsed);

    const toggle = entry.heading.querySelector(`.${TOGGLE_CLASS}`);
    const label = collapsed ? 'Expand section' : 'Collapse section';
    const symbol = collapsed ? '+' : '−';

    entry.heading.setAttribute('aria-expanded', String(!collapsed));
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', label);
      toggle.innerHTML = `<span aria-hidden="true">${symbol}</span>`;
    }
  }

  function restoreSection(entry) {
    const { heading, content, wrapper, onToggleClick, onHeadingKeyDown } = entry;
    const parent = wrapper.parentElement || heading.parentElement;
    if (!parent) {
      return;
    }

    const toggle = heading.querySelector(`.${TOGGLE_CLASS}`);
    if (toggle && onToggleClick) {
      toggle.removeEventListener('click', onToggleClick);
      toggle.remove();
    }
    if (onHeadingKeyDown) {
      heading.removeEventListener('keydown', onHeadingKeyDown);
    }

    heading.classList.remove(HEADING_CLASS, HEADING_COLLAPSED_CLASS);
    heading.removeAttribute('tabindex');
    heading.removeAttribute('aria-expanded');
    heading.removeAttribute('aria-controls');
    delete heading.dataset.docsfocusSection;

    parent.insertBefore(heading, wrapper);
    while (content.firstChild) {
      parent.insertBefore(content.firstChild, wrapper);
    }
    wrapper.remove();
  }

  function getHeadingLevel(node) {
    if (!(node instanceof HTMLElement)) {
      return 7;
    }
    const match = node.tagName.match(/H([1-6])/);
    return match ? Number(match[1]) : 7;
  }

  function isHeadingSameOrHigher(node, referenceHeading) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    if (!/^H[1-6]$/.test(node.tagName)) {
      return false;
    }
    const nodeLevel = getHeadingLevel(node);
    const referenceLevel = getHeadingLevel(referenceHeading);
    return nodeLevel <= referenceLevel;
  }

  return {
    activate,
    update,
    deactivate
  };
}
