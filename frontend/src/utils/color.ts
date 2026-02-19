/**
 * Color utilities for accent color derivation.
 *
 * Given a base OKLCH color string (e.g., "oklch(0.55 0.18 275)"),
 * derives hover, light, and foreground variants for use as CSS custom properties.
 */

interface ParsedOKLCH {
  l: number; // Lightness 0-1
  c: number; // Chroma 0-0.4
  h: number; // Hue 0-360
}

/** Parse an OKLCH string like "oklch(0.55 0.18 275)" */
function parseOKLCH(value: string): ParsedOKLCH | null {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return null;
  return { l: parseFloat(match[1]), c: parseFloat(match[2]), h: parseFloat(match[3]) };
}

/** Format back to OKLCH string */
function formatOKLCH(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(0)})`;
}

/** Clamp a number between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Determine if a color is "light" (i.e. needs dark foreground text).
 * Uses OKLCH lightness — above 0.7 is considered light.
 */
function isLightColor(l: number): boolean {
  return l > 0.7;
}

export interface AccentTokens {
  '--color-primary': string;
  '--color-primary-hover': string;
  '--color-primary-light': string;
  '--color-primary-foreground': string;
}

/**
 * Generate a full set of accent tokens from a single OKLCH base color.
 *
 * - **hover**: slightly darker (lower lightness)
 * - **light**: very light tint for backgrounds
 * - **foreground**: white or dark text depending on base lightness
 */
export function generateAccentTokens(baseColor: string): AccentTokens | null {
  const parsed = parseOKLCH(baseColor);
  if (!parsed) return null;

  const { l, c, h } = parsed;

  // Hover: darken by 0.07
  const hoverL = clamp(l - 0.07, 0.1, 0.95);

  // Light background: very desaturated, high lightness
  const lightL = clamp(0.95, 0.85, 0.98);
  const lightC = clamp(c * 0.2, 0, 0.06);

  // Foreground: white for dark primaries, dark for light primaries
  const fgColor = isLightColor(l) ? 'oklch(0.15 0.01 265)' : 'oklch(1 0 0)';

  return {
    '--color-primary': formatOKLCH(l, c, h),
    '--color-primary-hover': formatOKLCH(hoverL, c, h),
    '--color-primary-light': formatOKLCH(lightL, lightC, h),
    '--color-primary-foreground': fgColor,
  };
}

/**
 * Generate dark-mode accent tokens from a base OKLCH color.
 * In dark mode, primary colors are typically lighter.
 */
export function generateDarkAccentTokens(baseColor: string): AccentTokens | null {
  const parsed = parseOKLCH(baseColor);
  if (!parsed) return null;

  const { l, c, h } = parsed;

  // In dark mode, bump lightness up for visibility
  const darkL = clamp(l + 0.10, 0.5, 0.85);
  const darkC = clamp(c * 0.9, 0, 0.3);

  // Hover: slightly less light
  const hoverL = clamp(darkL - 0.05, 0.4, 0.85);

  // Light background: very dark, slight tint
  const lightL = 0.25;
  const lightC = clamp(c * 0.35, 0, 0.08);

  // Foreground: always white in dark mode for contrast
  const fgColor = 'oklch(1 0 0)';

  return {
    '--color-primary': formatOKLCH(darkL, darkC, h),
    '--color-primary-hover': formatOKLCH(hoverL, darkC, h),
    '--color-primary-light': formatOKLCH(lightL, lightC, h),
    '--color-primary-foreground': fgColor,
  };
}

/**
 * Convert a hex color to an OKLCH string.
 * Uses sRGB → linear RGB → OKLab → OKLCH conversion.
 */
export function hexToOKLCH(hex: string): string | null {
  // Remove # and handle shorthand
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return null;

  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  // sRGB → linear RGB
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  // Linear RGB → LMS (using OKLab matrix)
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // Cube root
  const l_c = Math.cbrt(l_);
  const m_c = Math.cbrt(m_);
  const s_c = Math.cbrt(s_);

  // LMS → OKLab
  const L = 0.2104542553 * l_c + 0.7936177850 * m_c - 0.0040720468 * s_c;
  const A = 1.9779984951 * l_c - 2.4285922050 * m_c + 0.4505937099 * s_c;
  const B = 0.0259040371 * l_c + 0.7827717662 * m_c - 0.8086757660 * s_c;

  // OKLab → OKLCH
  const C = Math.sqrt(A * A + B * B);
  let H = Math.atan2(B, A) * (180 / Math.PI);
  if (H < 0) H += 360;

  return formatOKLCH(clamp(L, 0, 1), clamp(C, 0, 0.4), H);
}
