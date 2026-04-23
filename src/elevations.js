// Shadow generation following Tobias Ahlin's layered shadow technique:
// https://tobiasahlin.com/blog/layered-smooth-box-shadows/
//
// Each layer doubles y-offset and blur (2^i scaling).
// All layers share equal alpha so adding more layers keeps perceived
// darkness constant: alpha_per_layer = TOTAL_ALPHA / numLayers.
//
// Two independent bases control the shape:
//   y_base    — first-layer y-offset for each elevation level
//   blur_base — first-layer blur radius (can differ from y for "dreamy" shadows)

const LEVEL_BASES = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 12 };
const SLIDER_BASE = LEVEL_BASES[1]; // 1 — both sliders are expressed in level-1 units

// Total alpha summed across all layers at intensity=1.
// At the default of N=4 layers this yields 0.12/layer, matching the article.
const TOTAL_ALPHA = 0.48;

const LABELS = {
  1: 'Button / Input',
  2: 'Card / Panel',
  3: 'Dropdown / Popover',
  4: 'Drawer / Sidebar',
  5: 'Modal Dialog',
};

// ── Slider ↔ scale conversions ───────────────────────────────────────────────

// Both sliders are expressed as "level-5 first-layer value in px."
export function sliderToScale(px)     { return px / SLIDER_BASE; }
export function scaleToSlider(scale)  { return Math.min(20, Math.max(0, Math.round(scale * SLIDER_BASE))); }

export function blurPxToScale(px)     { return px / SLIDER_BASE; }
export function blurScaleToPx(scale)  { return Math.min(40, Math.max(0, Math.round(scale * SLIDER_BASE))); }

// ── Shadow generation ────────────────────────────────────────────────────────

function r2(v) { return Math.round(v * 2) / 2; }

// scale     — multiplier from the Y-offset slider
// numLayers — number of doublings per elevation (1–8)
// intensity — alpha multiplier (0–2)
// blurScale — multiplier from the baseline-blur slider
export function generateElevations(scale, numLayers, intensity, blurScale, innerColor = null) {
  const out = {};

  if (scale === 0) {
    const zero = Array(numLayers).fill('  0px 0px 0px rgba(0, 0, 0, 0)').join(',\n');
    for (let n = 1; n <= 5; n++) {
      out[n] = innerColor ? `${zero},\n  inset 0 0 0 1px ${innerColor}` : zero;
    }
    return out;
  }

  const alpha = +Math.min(1, (TOTAL_ALPHA * intensity) / numLayers).toFixed(4);

  for (let n = 1; n <= 5; n++) {
    const yBase    = LEVEL_BASES[n] * scale;
    const blurBase = LEVEL_BASES[n] * blurScale;
    const layers   = [];

    for (let i = 0; i < numLayers; i++) {
      const pow  = Math.pow(2, i);
      const y    = r2(yBase    * pow);
      const blur = r2(blurBase * pow);
      layers.push(`  0px ${y}px ${blur}px rgba(0, 0, 0, ${alpha})`);
    }

    if (innerColor) layers.push(`  inset 0 0 0 1px ${innerColor}`);
    out[n] = layers.join(',\n');
  }

  return out;
}

// ── CSS serialisation ────────────────────────────────────────────────────────

export function toCSSBlock(elevs) {
  const vars = Object.entries(elevs).map(([n, v]) =>
    `  /* Level ${n} — ${LABELS[n]} */\n  --shadow-${n}:\n${v};`
  );
  return `:root {\n${vars.join('\n\n')}\n}`;
}

export function parseCSSBlock(css) {
  const result = {};
  for (let n = 1; n <= 5; n++) {
    const m = css.match(new RegExp(`--shadow-${n}\\s*:\\s*([\\s\\S]*?);`));
    if (m) result[n] = m[1].trim();
  }
  return result;
}

// Infer scale and blurScale from the first layer of --shadow-1.
// Layer 0 for level 1: y = LEVEL_BASES[1] * scale = 1 * scale → scale = y
//                      blur = LEVEL_BASES[1] * blurScale = 1 * blurScale → blurScale = blur
export function inferParams(css) {
  const m = css.match(/--shadow-1[\s\S]*?0px\s+([\d.]+)px\s+([\d.]+)px/);
  if (!m) return { scale: sliderToScale(2), blurScale: blurPxToScale(2) };
  return {
    scale:     parseFloat(m[1]) / LEVEL_BASES[1],
    blurScale: parseFloat(m[2]) / LEVEL_BASES[1],
  };
}
