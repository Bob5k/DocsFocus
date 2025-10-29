const MASK_CLASS = 'docsfocus-reading-mask';
const MASK_SEGMENT_CLASS = 'docsfocus-reading-mask__segment';
const MASK_FOCUS_CLASS = 'docsfocus-reading-mask__focus';

// Default fallback values
const DEFAULT_CONFIG = {
  focusHeightRatio: 0.32,
  minFocusHeight: 160,
  maxFocusHeight: 360,
  defaultPositionRatio: 0.33
};

export function createReadingMaskFeature({ document }) {
  let enabled = true;
  let overlay = null;
  let topSegment = null;
  let focusSegment = null;
  let bottomSegment = null;
  let rafId = null;
  let pointerY = null;
  let active = false;
  let currentConfig = DEFAULT_CONFIG;

  const handleScroll = () => scheduleUpdate();
  const handleResize = () => scheduleUpdate(true);
  const handlePointerMove = (event) => {
    pointerY = event.clientY;
    scheduleUpdate();
  };
  const handlePointerLeave = (event) => {
    if (!event.relatedTarget || event.relatedTarget === document.documentElement) {
      pointerY = null;
      scheduleUpdate(true);
    }
  };

  function activate(settings) {
    // Check if reading mask is enabled for the current preset
    const presetEnabled = settings.readingMaskConfig?.enabled !== false && Boolean(settings.readingMask);

    if (!presetEnabled) {
      deactivate();
      return;
    }

    // Update configuration based on preset
    currentConfig = {
      ...DEFAULT_CONFIG,
      ...(settings.readingMaskConfig || {})
    };

    enabled = true;
    if (!overlay) {
      buildOverlay();
    }
    if (!active) {
      attachListeners();
      active = true;
      scheduleUpdate(true);
    } else {
      scheduleUpdate(true);
    }
  }

  function update(settings) {
    activate(settings);
  }

  function deactivate() {
    active = false;
    pointerY = null;
    cancelAnimationFrame(rafId);
    rafId = null;
    detachListeners();
    if (overlay) {
      overlay.remove();
      overlay = null;
      topSegment = null;
      focusSegment = null;
      bottomSegment = null;
    }
  }

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = MASK_CLASS;
    overlay.setAttribute('aria-hidden', 'true');

    topSegment = document.createElement('div');
    topSegment.className = `${MASK_SEGMENT_CLASS} ${MASK_SEGMENT_CLASS}--top`;

    focusSegment = document.createElement('div');
    focusSegment.className = MASK_FOCUS_CLASS;

    bottomSegment = document.createElement('div');
    bottomSegment.className = `${MASK_SEGMENT_CLASS} ${MASK_SEGMENT_CLASS}--bottom`;

    overlay.append(topSegment, focusSegment, bottomSegment);
    document.body.appendChild(overlay);
  }

  function attachListeners() {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseout', handlePointerLeave, { passive: true });
  }

  function detachListeners() {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('mouseout', handlePointerLeave);
  }

  function scheduleUpdate(forceCenter = false) {
    if (!active || !overlay) {
      return;
    }
    if (forceCenter) {
      pointerY = null;
    }
    if (rafId != null) {
      return;
    }
    rafId = requestAnimationFrame(() => {
      rafId = null;
      updateOverlay();
    });
  }

  function updateOverlay() {
    if (!overlay || !topSegment || !bottomSegment || !focusSegment) {
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportHeight) {
      return;
    }

    // Use preset-specific configuration
    const focusHeight = clamp(
      Math.round(viewportHeight * currentConfig.focusHeightRatio),
      currentConfig.minFocusHeight,
      currentConfig.maxFocusHeight
    );
    const defaultCenter = viewportHeight * currentConfig.defaultPositionRatio;
    const centerY = pointerY == null ? defaultCenter : pointerY;
    const focusTop = clamp(centerY - focusHeight / 2, 0, Math.max(viewportHeight - focusHeight, 0));
    const focusBottom = Math.max(viewportHeight - (focusTop + focusHeight), 0);

    topSegment.style.height = `${focusTop}px`;
    bottomSegment.style.height = `${focusBottom}px`;
    focusSegment.style.height = `${focusHeight}px`;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  return {
    activate,
    update,
    deactivate
  };
}
