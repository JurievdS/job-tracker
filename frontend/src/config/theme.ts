// ─── Theme Types ────────────────────────────────────────────────────────────

export type ColorMode = 'light' | 'dark' | 'system';
export type ThemePalette = 'default' | 'cyberpunk';
export type Density = 'compact' | 'comfortable' | 'spacious';
export type FontSize = 'small' | 'medium' | 'large';
export type SidebarPosition = 'left' | 'right';

export interface ThemeSettings {
  colorMode: ColorMode;
  palette: ThemePalette;
  accentColor: string | null; // null = use palette default
  density: Density;
  fontSize: FontSize;
  sidebarPosition: SidebarPosition;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  colorMode: 'system',
  palette: 'default',
  accentColor: null,
  density: 'comfortable',
  fontSize: 'medium',
  sidebarPosition: 'left',
};

export const STORAGE_KEY = 'theme-settings';

// ─── Palette Definitions ────────────────────────────────────────────────────

export interface PaletteInfo {
  id: ThemePalette;
  label: string;
  description: string;
  /** Preview swatch colors (for Settings UI) */
  swatches: { primary: string; surface: string; text: string };
}

export const PALETTES: PaletteInfo[] = [
  {
    id: 'default',
    label: 'Modern Indigo',
    description: 'Clean and professional',
    swatches: { primary: '#6366f1', surface: '#ffffff', text: '#111827' },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Neon cyan on dark',
    swatches: { primary: '#22d3ee', surface: '#1a1a2e', text: '#e0f2fe' },
  },
];

// ─── Preset Accent Colors ───────────────────────────────────────────────────

export interface AccentPreset {
  label: string;
  /** OKLCH value for --color-primary in light mode */
  value: string;
  /** Hex for preview swatch */
  hex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { label: 'Indigo',  value: 'oklch(0.55 0.18 275)',  hex: '#6366f1' },
  { label: 'Blue',    value: 'oklch(0.55 0.18 250)',  hex: '#3b82f6' },
  { label: 'Teal',    value: 'oklch(0.60 0.14 195)',  hex: '#14b8a6' },
  { label: 'Green',   value: 'oklch(0.55 0.16 155)',  hex: '#22c55e' },
  { label: 'Amber',   value: 'oklch(0.75 0.16 80)',   hex: '#f59e0b' },
  { label: 'Orange',  value: 'oklch(0.68 0.18 50)',   hex: '#f97316' },
  { label: 'Rose',    value: 'oklch(0.60 0.20 10)',   hex: '#f43f5e' },
  { label: 'Violet',  value: 'oklch(0.55 0.20 300)',  hex: '#8b5cf6' },
  { label: 'Pink',    value: 'oklch(0.65 0.20 340)',  hex: '#ec4899' },
];

// ─── Color Mode Options ─────────────────────────────────────────────────────

export const COLOR_MODE_OPTIONS: { value: ColorMode; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Always use light mode' },
  { value: 'dark', label: 'Dark', description: 'Always use dark mode' },
  { value: 'system', label: 'System', description: 'Match your OS preference' },
];

// ─── Density Options ────────────────────────────────────────────────────────

export const DENSITY_OPTIONS: { value: Density; label: string; description: string }[] = [
  { value: 'compact', label: 'Compact', description: 'Tighter spacing, more content visible' },
  { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
  { value: 'spacious', label: 'Spacious', description: 'More breathing room' },
];

// ─── Font Size Options ──────────────────────────────────────────────────────

export const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];
