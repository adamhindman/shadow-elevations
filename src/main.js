import {
  sliderToScale, scaleToSlider,
  blurPxToScale, blurScaleToPx,
  generateElevations, toCSSBlock,
} from './elevations.js';

const slider              = document.getElementById('slider');
const sliderVal           = document.getElementById('slider-value');
const blurSlider          = document.getElementById('blur-slider');
const blurVal             = document.getElementById('blur-value');
const intensitySlider     = document.getElementById('intensity-slider');
const intensityVal        = document.getElementById('intensity-value');
const layersInput         = document.getElementById('layers-input');
const progressionSelect   = document.getElementById('progression-select');
const innerShadowEnabled  = document.getElementById('inner-shadow-enabled');
const innerShadowPicker   = document.getElementById('inner-shadow-picker');
const innerShadowColor    = document.getElementById('inner-shadow-color');
const styleTag            = document.getElementById('shadow-vars');

// ── Apply elevations via CSS custom properties ───────────────────────────────

function applyElevations(elevs) {
  const vars = Object.entries(elevs)
    .map(([n, v]) => `--shadow-${n}: ${v};`)
    .join('\n  ');
  styleTag.textContent = `:root {\n  ${vars}\n}`;
}

// ── Read current control values ──────────────────────────────────────────────

function currentScale()       { return sliderToScale(Number(slider.value)); }
function currentBlurScale()   { return blurPxToScale(Number(blurSlider.value)); }
function currentLayers()      { return Math.max(1, parseInt(layersInput.value, 10) || 4); }
function currentIntensity()   { return Number(intensitySlider.value) / 100; }
function currentInnerColor()  { return innerShadowEnabled.checked ? innerShadowColor.value.trim() : null; }
function currentProgression() { return progressionSelect.value; }

function setFill(el, ratio) {
  el.style.setProperty('--fill', Math.min(1, Math.max(0, ratio)));
}

// ── Full regeneration ────────────────────────────────────────────────────────

function regenerate({ skipSliders = false } = {}) {
  const elevs = generateElevations(
    currentScale(), currentLayers(), currentIntensity(), currentBlurScale(), currentInnerColor(), currentProgression()
  );

  if (!skipSliders) {
    const sv = scaleToSlider(currentScale());
    slider.value = sv;
    sliderVal.textContent = `${sv}px`;
    setFill(slider, sv / 20);

    const bv = blurScaleToPx(currentBlurScale());
    blurSlider.value = bv;
    blurVal.textContent = `${bv}px`;
    setFill(blurSlider, bv / 40);
  }

  applyElevations(elevs);
}

// ── Control listeners ────────────────────────────────────────────────────────

slider.addEventListener('input', () => {
  const v = Number(slider.value);
  sliderVal.textContent = `${v}px`;
  setFill(slider, v / 20);
  regenerate({ skipSliders: true });
});

slider.addEventListener('keydown', e => {
  if (!e.shiftKey) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    slider.value = Math.max(0, Number(slider.value) - 1);
    slider.dispatchEvent(new Event('input'));
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    slider.value = Math.min(20, Number(slider.value) + 1);
    slider.dispatchEvent(new Event('input'));
  }
});

blurSlider.addEventListener('input', () => {
  const v = Number(blurSlider.value);
  blurVal.textContent = `${v}px`;
  setFill(blurSlider, v / 40);
  regenerate({ skipSliders: true });
});

blurSlider.addEventListener('keydown', e => {
  if (!e.shiftKey) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    blurSlider.value = Math.max(0, Number(blurSlider.value) - 1);
    blurSlider.dispatchEvent(new Event('input'));
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    blurSlider.value = Math.min(40, Number(blurSlider.value) + 1);
    blurSlider.dispatchEvent(new Event('input'));
  }
});

intensitySlider.addEventListener('input', () => {
  const v = Number(intensitySlider.value);
  intensityVal.textContent = `${v}%`;
  setFill(intensitySlider, v / 200);
  regenerate({ skipSliders: true });
});

intensitySlider.addEventListener('keydown', e => {
  if (!e.shiftKey) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    intensitySlider.value = Math.max(0, Number(intensitySlider.value) - 5);
    intensitySlider.dispatchEvent(new Event('input'));
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    intensitySlider.value = Math.min(200, Number(intensitySlider.value) + 5);
    intensitySlider.dispatchEvent(new Event('input'));
  }
});

layersInput.addEventListener('input', () => {
  regenerate({ skipSliders: true });
});

progressionSelect.addEventListener('change', () => {
  regenerate({ skipSliders: true });
});

innerShadowEnabled.addEventListener('change', () => {
  const on = innerShadowEnabled.checked;
  innerShadowPicker.disabled = !on;
  innerShadowColor.disabled  = !on;
  regenerate({ skipSliders: true });
});

innerShadowPicker.addEventListener('input', () => {
  innerShadowColor.value = innerShadowPicker.value;
  regenerate({ skipSliders: true });
});

innerShadowColor.addEventListener('input', () => {
  // Sync picker only when text is a valid 6-digit hex
  const hex = innerShadowColor.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) innerShadowPicker.value = hex;
  regenerate({ skipSliders: true });
});


// ── Presets (localStorage) ───────────────────────────────────────────────────

const STORAGE_KEY = 'shadow-elevations-presets';

function loadPresets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function savePresets(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderPresets() {
  const presets = loadPresets();
  const section = document.getElementById('presets-section');
  const list    = document.getElementById('presets-list');
  section.style.display = presets.length ? '' : 'none';

  list.innerHTML = presets.map(p => `
    <div class="preset-item" data-id="${p.id}">
      <span class="preset-label">${p.label}</span>
      <button class="preset-edit" data-id="${p.id}" tabindex="-1" title="Rename preset">✎</button>
      <button class="preset-delete" data-id="${p.id}" tabindex="-1" title="Delete preset">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('.preset-item').forEach(el => {
    let clickTimeout = null;
    el.addEventListener('click', e => {
      if (e.target.closest('.preset-edit') || e.target.closest('.preset-delete')) return;
      if (el.querySelector('.preset-label').contentEditable === 'true') return;
      clickTimeout = setTimeout(() => {
        const p = loadPresets().find(x => x.id === Number(el.dataset.id));
        if (p) restorePreset(p);
      }, 250);
    });
    el.addEventListener('dblclick', e => {
      clearTimeout(clickTimeout);
      if (e.target.closest('.preset-edit') || e.target.closest('.preset-delete')) return;
      const label = el.querySelector('.preset-label');
      label.contentEditable = 'true';
      label.spellcheck = false;
      label.focus();
      const range = document.createRange();
      range.selectNodeContents(label);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    });
  });

  list.querySelectorAll('.preset-edit').forEach(btn => {
    const label = btn.closest('.preset-item').querySelector('.preset-label');
    const id    = Number(btn.dataset.id);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      label.contentEditable = 'true';
      label.spellcheck = false;
      label.focus();
      const range = document.createRange();
      range.selectNodeContents(label);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    });
    label.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); label.blur(); }
    });
    label.addEventListener('blur', () => {
      if (label.contentEditable !== 'true') return;
      label.contentEditable = 'false';
      const all = loadPresets();
      const p   = all.find(x => x.id === id);
      if (p) { p.label = label.textContent.trim() || p.label; savePresets(all); }
    });
  });

  list.querySelectorAll('.preset-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      savePresets(loadPresets().filter(p => p.id !== Number(btn.dataset.id)));
      renderPresets();
    });
  });
}

function restorePreset(p) {
  const { sv, bv, iv, lv, progression } = p.params;
  slider.value = sv;         sliderVal.textContent = `${sv}px`;   setFill(slider, sv / 20);
  blurSlider.value = bv;     blurVal.textContent = `${bv}px`;     setFill(blurSlider, bv / 40);
  intensitySlider.value = iv; intensityVal.textContent = `${iv}%`; setFill(intensitySlider, iv / 200);
  layersInput.value = lv;
  if (progression) progressionSelect.value = progression;
  regenerate({ skipSliders: true });

  if (p.bg) {
    bgPicker.value = p.bg;
    bgText.value   = p.bg;
    applyBg(p.bg);
  }

  if (p.borderRadius != null) {
    radiusSlider.value = p.borderRadius;
    applyRadius(p.borderRadius);
  }

  if (p.innerShadow) {
    innerShadowEnabled.checked  = p.innerShadow.enabled;
    innerShadowPicker.disabled  = !p.innerShadow.enabled;
    innerShadowColor.disabled   = !p.innerShadow.enabled;
    innerShadowColor.value      = p.innerShadow.color;
    if (/^#[0-9a-fA-F]{6}$/.test(p.innerShadow.color)) innerShadowPicker.value = p.innerShadow.color;
  }

  if (p.boxes) {
    p.boxes.forEach(saved => {
      const b = boxState.find(x => x.id === saved.id);
      if (b) { b.locked = saved.locked; b.params = saved.params ? { ...saved.params } : null; }
    });
    renderBoxes(); // calls syncInspector internally
  }
}

document.getElementById('save-preset-btn').addEventListener('click', () => {
  const sv = Number(slider.value);
  const bv = Number(blurSlider.value);
  const iv = Number(intensitySlider.value);
  const lv = currentLayers();
  const progression = progressionSelect.value;
  const presets = loadPresets();
  presets.unshift({
    id: Date.now(),
    label: `Y:${sv}px  blur:${bv}px  ${iv}%  ${lv}L  ${progression}`,
    css: toCSSBlock(getEffectiveElevs()),
    params: { sv, bv, iv, lv, progression },
    bg: bgPicker.value,
    borderRadius: Number(radiusSlider.value),
    innerShadow: {
      enabled: innerShadowEnabled.checked,
      color: innerShadowColor.value,
    },
    boxes: boxState.map(b => ({ id: b.id, locked: b.locked || false, params: b.params ? { ...b.params } : null })),
  });
  savePresets(presets);
  renderPresets();
});

// ── SVG export ───────────────────────────────────────────────────────────────

const LEVEL_LABELS = {
  1: 'Button / Input',
  2: 'Card / Panel',
  3: 'Dropdown / Popover',
  4: 'Drawer / Sidebar',
  5: 'Modal Dialog',
};

function parseShadowLayers(shadowStr) {
  // Split on commas not inside parentheses (avoids breaking rgba(r, g, b, a))
  return shadowStr.split(/,(?![^(]*\))/).flatMap(part => {
    const m = part.trim().match(/^(inset\s+)?0px\s+([\d.]+)px\s+([\d.]+)px\s+rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)\s*\)/);
    if (!m) return [];
    return [{ inset: !!m[1], y: parseFloat(m[2]), blur: parseFloat(m[3]), alpha: parseFloat(m[4]) }];
  });
}

// ── Tokens export (Tokens Studio / Figma) ────────────────────────────────────

function buildTokens(elevs) {
  const tokens = {};
  Object.entries(elevs).forEach(([n, v]) => {
    const layers = parseShadowLayers(v).filter(l => !l.inset);
    tokens[`shadow-${n}`] = {
      type: 'boxShadow',
      value: layers.map(l => ({
        type: 'dropShadow',
        x: 0, y: l.y,
        blur: l.blur,
        spread: 0,
        color: `rgba(0,0,0,${l.alpha})`,
      })),
      description: LEVEL_LABELS[n],
    };
  });
  return JSON.stringify(tokens, null, 2);
}

const tokensBtn = document.getElementById('export-tokens-btn');

const tokensTooltip = document.createElement('div');
tokensTooltip.className = 'tokens-tooltip';
tokensTooltip.innerHTML = `Paste into <a href="https://www.figma.com/community/plugin/843461159747178978/tokens-studio-for-figma" target="_blank" rel="noopener">Tokens Studio for Figma ↗</a>`;
document.body.appendChild(tokensTooltip);

let tooltipTimer = null;

function showTokensTooltip() {
  const rect = tokensBtn.getBoundingClientRect();
  tokensTooltip.style.left = `${rect.left + rect.width / 2}px`;
  tokensTooltip.style.top  = `${rect.bottom + 8}px`;
  tokensTooltip.classList.add('visible');
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(() => tokensTooltip.classList.remove('visible'), 4000);
}

tokensBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(buildTokens(getEffectiveElevs()));
  const orig = tokensBtn.textContent;
  tokensBtn.textContent = 'Copied!';
  setTimeout(() => { tokensBtn.textContent = orig; }, 1500);
  showTokensTooltip();
});

document.addEventListener('click', e => {
  if (!tokensBtn.contains(e.target) && !tokensTooltip.contains(e.target)) {
    tokensTooltip.classList.remove('visible');
  }
});

const copyCssBtn = document.getElementById('copy-css-btn');
copyCssBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(toCSSBlock(getEffectiveElevs()));
  const orig = copyCssBtn.textContent;
  copyCssBtn.textContent = 'Copied!';
  setTimeout(() => { copyCssBtn.textContent = orig; }, 1500);
});

// ── Grid box state ───────────────────────────────────────────────────────────

const COLS = 12, ROWS = 12, GAP = 20;
const BOX_LAYOUT_KEY = 'shadow-elevations-layout';

const DEFAULT_LAYOUT = [
  { id: 1, col: 1,  row: 1,  colSpan: 3, rowSpan: 4, locked: false, params: null, z: 1 },
  { id: 2, col: 5,  row: 1,  colSpan: 4, rowSpan: 4, locked: false, params: null, z: 2 },
  { id: 3, col: 10, row: 1,  colSpan: 3, rowSpan: 4, locked: false, params: null, z: 3 },
  { id: 4, col: 1,  row: 6,  colSpan: 6, rowSpan: 7, locked: false, params: null, z: 4 },
  { id: 5, col: 7,  row: 6,  colSpan: 6, rowSpan: 7, locked: false, params: null, z: 5 },
];

function loadLayout() {
  try {
    const stored = JSON.parse(localStorage.getItem(BOX_LAYOUT_KEY));
    if (stored) {
      stored.forEach((b, i) => { if (b.z == null) b.z = i + 1; });
      return stored;
    }
  } catch {}
  return DEFAULT_LAYOUT;
}

function saveLayout() {
  localStorage.setItem(BOX_LAYOUT_KEY, JSON.stringify(boxState));
}

const boxState = loadLayout();

// ── Per-box lock helpers ─────────────────────────────────────────────────────

const ICON_LOCKED = `<svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="1" y="5" width="8" height="7" rx="1.5" fill="currentColor"/><path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="4.25" y="7.5" width="1.5" height="2" rx=".75" fill="white"/></svg>`;
const ICON_UNLOCKED = `<svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="1" y="5" width="8" height="7" rx="1.5" fill="currentColor"/><path d="M3 5V3.5a2 2 0 0 1 4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="4.25" y="7.5" width="1.5" height="2" rx=".75" fill="white"/></svg>`;

function applyBoxShadow(b) {
  const el = document.querySelector(`.elev-box[data-id="${b.id}"]`);
  if (!el) return;
  if (b.locked && b.params) {
    const { sv, bv, iv, lv, innerShadow, fgColor } = b.params;
    const innerColor = innerShadow?.enabled ? innerShadow.color : null;
    const progression = currentProgression();
    const elevs = generateElevations(sliderToScale(sv), lv, iv / 100, blurPxToScale(bv), innerColor, progression);
    el.style.boxShadow = elevs[b.id];
    el.style.backgroundColor = fgColor || '';
  } else {
    el.style.boxShadow = '';
    el.style.backgroundColor = '';
  }
}

function getEffectiveElevs() {
  const progression = currentProgression();
  const base = generateElevations(
    currentScale(), currentLayers(), currentIntensity(), currentBlurScale(), currentInnerColor(), progression
  );
  boxState.forEach(b => {
    if (b.locked && b.params) {
      const { sv, bv, iv, lv, innerShadow } = b.params;
      const innerColor = innerShadow?.enabled ? innerShadow.color : null;
      const locked = generateElevations(sliderToScale(sv), lv, iv / 100, blurPxToScale(bv), innerColor, progression);
      base[b.id] = locked[b.id];
    }
  });
  return base;
}

function applyZOrder() {
  boxState.forEach(b => {
    const el = document.querySelector(`.elev-box[data-id="${b.id}"]`);
    if (el) el.style.zIndex = b.z;
  });
}

function bringToFront(b) {
  const n = boxState.length;
  if (b.z === n) return;
  const oldZ = b.z;
  boxState.forEach(x => { if (x.z > oldZ) x.z--; });
  b.z = n;
  applyZOrder();
}

function renderBoxes() {
  const container = document.querySelector('.elev-boxes');
  container.innerHTML = '';
  boxState.forEach(b => {
    const locked = b.locked || false;
    const el = document.createElement('div');
    el.className = `elev-box elev-${b.id}${locked ? ' is-locked' : ''}`;
    el.dataset.id = String(b.id);
    el.style.gridColumn = `${b.col} / span ${b.colSpan}`;
    el.style.gridRow    = `${b.row} / span ${b.rowSpan}`;
    el.innerHTML = `
      <span class="elev-tag">${b.id}</span>
      <button class="box-lock" tabindex="-1" title="Edit shadow">
        ${locked ? ICON_LOCKED : ICON_UNLOCKED}
        <span class="box-lock-label">${locked ? 'Shadow overridden' : 'Override shadow'}</span>
      </button>
      <div class="elev-resize-handle"></div>`;
    container.appendChild(el);
    if (locked) applyBoxShadow(b);
  });
  applyZOrder();
  syncInspector();
}

// ── Box inspector (floating) ─────────────────────────────────────────────────

const inspector      = document.getElementById('box-inspector');
const inspectorTitle = document.getElementById('box-inspector-title');
const biSv           = document.getElementById('bi-sv');
const biSvVal        = document.getElementById('bi-sv-val');
const biBv           = document.getElementById('bi-bv');
const biBvVal        = document.getElementById('bi-bv-val');
const biIv           = document.getElementById('bi-iv');
const biIvVal        = document.getElementById('bi-iv-val');
const biLv           = document.getElementById('bi-lv');
const biInnerEnabled = document.getElementById('bi-inner-enabled');
const biInnerColor   = document.getElementById('bi-inner-color');
const biFgColor      = document.getElementById('bi-fg-color');

let activeBoxId = null;

function openInspector(b, anchorRect) {
  const wasHidden = inspector.style.display === 'none';
  activeBoxId = b.id;
  const p = b.params;
  inspectorTitle.textContent = `Override Shadow ${b.id}`;
  biSv.value = p.sv;  biSvVal.textContent = `${p.sv}px`;  setFill(biSv, p.sv / 20);
  biBv.value = p.bv;  biBvVal.textContent = `${p.bv}px`;  setFill(biBv, p.bv / 40);
  biIv.value = p.iv;  biIvVal.textContent = `${p.iv}%`;   setFill(biIv, p.iv / 200);
  biLv.value = p.lv;
  biInnerEnabled.checked = p.innerShadow?.enabled || false;
  biInnerColor.value     = p.innerShadow?.color || '#000000';
  biInnerColor.disabled  = !biInnerEnabled.checked;
  biFgColor.value        = p.fgColor || '#ffffff';
  inspector.style.display = '';
  if (anchorRect) {
    if (wasHidden) {
      const x = Math.min(anchorRect.right + 16, window.innerWidth - 256);
      const y = Math.max(Math.min(anchorRect.top, window.innerHeight - 320), 16);
      inspector.style.left = `${x}px`;
      inspector.style.top  = `${y}px`;
    }
    biSv.focus();
  }
}

function closeInspector() {
  activeBoxId = null;
  inspector.style.display = 'none';
}

function syncInspector() {
  if (activeBoxId == null) return;
  const b = boxState.find(x => x.id === activeBoxId);
  if (!b || !b.locked || !b.params) { closeInspector(); return; }
  openInspector(b);
}

function biUpdate() {
  if (activeBoxId == null) return;
  const b = boxState.find(x => x.id === activeBoxId);
  if (!b || !b.params) return;
  b.params.sv         = Number(biSv.value);
  b.params.bv         = Number(biBv.value);
  b.params.iv         = Number(biIv.value);
  b.params.lv         = Math.max(1, parseInt(biLv.value) || 1);
  b.params.innerShadow = { enabled: biInnerEnabled.checked, color: biInnerColor.value };
  b.params.fgColor    = biFgColor.value;
  applyBoxShadow(b);
  saveLayout();
}

biSv.addEventListener('input', () => { biSvVal.textContent = `${biSv.value}px`; setFill(biSv, biSv.value / 20);  biUpdate(); });
biBv.addEventListener('input', () => { biBvVal.textContent = `${biBv.value}px`; setFill(biBv, biBv.value / 40);  biUpdate(); });
biIv.addEventListener('input', () => { biIvVal.textContent = `${biIv.value}%`;  setFill(biIv, biIv.value / 200); biUpdate(); });
biLv.addEventListener('input', biUpdate);
biInnerEnabled.addEventListener('change', () => { biInnerColor.disabled = !biInnerEnabled.checked; biUpdate(); });
biInnerColor.addEventListener('input', biUpdate);
biFgColor.addEventListener('input', biUpdate);

document.getElementById('box-inspector-close').addEventListener('click', closeInspector);

document.getElementById('bi-clear-btn').addEventListener('click', () => {
  if (activeBoxId == null) return;
  const b = boxState.find(x => x.id === activeBoxId);
  if (!b) return;
  b.locked = false;
  b.params = null;
  const boxEl = document.querySelector(`.elev-box[data-id="${b.id}"]`);
  if (boxEl) {
    boxEl.classList.remove('is-locked');
    const lockBtn = boxEl.querySelector('.box-lock');
    if (lockBtn) lockBtn.innerHTML = ICON_UNLOCKED;
    boxEl.style.boxShadow = '';
    boxEl.style.backgroundColor = '';
  }
  saveLayout();
  closeInspector();
});

let iDrag = null;

document.getElementById('box-inspector-drag').addEventListener('mousedown', e => {
  if (e.target.closest('#box-inspector-close')) return;
  e.preventDefault();
  const rect = inspector.getBoundingClientRect();
  iDrag = { startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top };
});

// ── Drag & resize ────────────────────────────────────────────────────────────

let drag = null;

document.querySelector('.elev-boxes').addEventListener('mousedown', e => {
  const handle = e.target.closest('.elev-resize-handle');
  const box    = e.target.closest('.elev-box');
  if (!box) return;
  if (e.target.closest('.box-lock')) return;
  e.preventDefault();

  const id   = Number(box.dataset.id);
  const b    = boxState.find(x => x.id === id);
  const rect = document.querySelector('.elev-boxes').getBoundingClientRect();
  const cw   = (rect.width  + GAP) / COLS;
  const ch   = (rect.height + GAP) / ROWS;
  const relX = e.clientX - rect.left;
  const relY = e.clientY - rect.top;

  box.classList.add('is-dragging');
  bringToFront(b);
  saveLayout();

  if (handle) {
    drag = { type: 'resize', id, startX: e.clientX, startY: e.clientY,
             startColSpan: b.colSpan, startRowSpan: b.rowSpan, cw, ch };
  } else {
    drag = { type: 'move', id,
             offsetCol: relX / cw - (b.col - 1),
             offsetRow: relY / ch - (b.row - 1),
             rect, cw, ch };
  }
});

document.addEventListener('mousemove', e => {
  if (drag) {
    const b  = boxState.find(x => x.id === drag.id);
    const el = document.querySelector(`.elev-box[data-id="${drag.id}"]`);
    if (b && el) {
      if (drag.type === 'move') {
        const relX = e.clientX - drag.rect.left;
        const relY = e.clientY - drag.rect.top;
        b.col = Math.max(1, Math.min(COLS - b.colSpan + 1, Math.round(relX / drag.cw - drag.offsetCol) + 1));
        b.row = Math.max(1, Math.min(ROWS - b.rowSpan + 1, Math.round(relY / drag.ch - drag.offsetRow) + 1));
      } else {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        b.colSpan = Math.max(1, Math.min(COLS - b.col + 1, drag.startColSpan + Math.round(dx / drag.cw)));
        b.rowSpan = Math.max(1, Math.min(ROWS - b.row + 1, drag.startRowSpan + Math.round(dy / drag.ch)));
      }
      el.style.gridColumn = `${b.col} / span ${b.colSpan}`;
      el.style.gridRow    = `${b.row} / span ${b.rowSpan}`;
    }
  }
  if (iDrag) {
    inspector.style.left = `${iDrag.startLeft + e.clientX - iDrag.startX}px`;
    inspector.style.top  = `${iDrag.startTop  + e.clientY - iDrag.startY}px`;
  }
});

document.addEventListener('mouseup', () => {
  if (drag) {
    document.querySelector(`.elev-box[data-id="${drag.id}"]`)?.classList.remove('is-dragging');
    drag = null;
    saveLayout();
  }
  iDrag = null;
});

document.querySelector('.elev-boxes').addEventListener('click', e => {
  const lockBtn = e.target.closest('.box-lock');
  if (!lockBtn) return;
  const boxEl = lockBtn.closest('.elev-box');
  const id = Number(boxEl.dataset.id);
  const b  = boxState.find(x => x.id === id);

  if (activeBoxId === id && inspector.style.display !== 'none') {
    closeInspector();
    return;
  }

  if (!b.locked) {
    b.locked = true;
    b.params = {
      sv: Number(slider.value), bv: Number(blurSlider.value),
      iv: Number(intensitySlider.value), lv: currentLayers(),
      innerShadow: { enabled: innerShadowEnabled.checked, color: innerShadowColor.value.trim() || '#000000' },
      fgColor: '#ffffff',
    };
    boxEl.classList.add('is-locked');
    lockBtn.innerHTML = ICON_LOCKED;
    applyBoxShadow(b);
    saveLayout();
  }

  bringToFront(b);
  openInspector(b, boxEl.getBoundingClientRect());
});

// ── Border radius slider ──────────────────────────────────────────────────────

const radiusSlider = document.getElementById('radius-slider');
const radiusVal    = document.getElementById('radius-value');
const RADIUS_KEY   = 'shadow-elevations-radius';

function applyRadius(v, save = true) {
  document.documentElement.style.setProperty('--box-radius', `${v}px`);
  radiusVal.textContent = `${v}px`;
  setFill(radiusSlider, v / 32);
  if (save) localStorage.setItem(RADIUS_KEY, String(v));
}

radiusSlider.addEventListener('input', () => {
  applyRadius(Number(radiusSlider.value));
});

const savedRadius = localStorage.getItem(RADIUS_KEY);
if (savedRadius !== null) {
  radiusSlider.value = savedRadius;
  applyRadius(Number(savedRadius), false);
} else {
  setFill(radiusSlider, 10 / 32);
}

// ── Background color picker ───────────────────────────────────────────────────

const bgPicker = document.getElementById('bg-color-picker');
const bgText   = document.getElementById('bg-color-text');
const BG_KEY   = 'shadow-elevations-bg';

function applyBg(color, save = true) {
  document.documentElement.style.setProperty('--bg', color);
  if (save) localStorage.setItem(BG_KEY, color);
}

bgPicker.addEventListener('input', e => {
  bgText.value = e.target.value;
  applyBg(e.target.value);
});

bgText.addEventListener('input', e => {
  const val = e.target.value.trim();
  applyBg(val);
  if (/^#[0-9a-fA-F]{6}$/.test(val)) bgPicker.value = val;
});

const savedBg = localStorage.getItem(BG_KEY);
if (savedBg) {
  bgPicker.value = savedBg;
  bgText.value   = savedBg;
  applyBg(savedBg, false);
}

// ── Boot ─────────────────────────────────────────────────────────────────────

renderPresets();
renderBoxes();

const initialPresets = loadPresets();
if (initialPresets.length) {
  restorePreset(initialPresets[0]);
} else {
  slider.value = 2;        sliderVal.textContent = '2px';    setFill(slider, 2 / 20);
  blurSlider.value = 2;    blurVal.textContent = '2px';      setFill(blurSlider, 2 / 40);
  intensitySlider.value = 100; intensityVal.textContent = '100%'; setFill(intensitySlider, 0.5);
  regenerate({ skipSliders: true });
}
