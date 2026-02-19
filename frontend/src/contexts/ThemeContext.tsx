import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import {
  type ThemeSettings,
  type ColorMode,
  type ThemePalette,
  type Density,
  type FontSize,
  type SidebarPosition,
  DEFAULT_THEME_SETTINGS,
  STORAGE_KEY,
} from '@/config/theme';
import { generateAccentTokens, generateDarkAccentTokens } from '@/utils/color';

// ─── Context Type ───────────────────────────────────────────────────────────

interface ThemeContextType {
  settings: ThemeSettings;
  /** Update one or more settings. Changes apply instantly and persist. */
  updateSettings: (partial: Partial<ThemeSettings>) => void;
  /** Resolved color mode (never 'system' — always 'light' or 'dark') */
  resolvedColorMode: 'light' | 'dark';

  // Convenience shortcuts (avoids `settings.x` everywhere)
  colorMode: ColorMode;
  palette: ThemePalette;
  density: Density;
  fontSize: FontSize;
  sidebarPosition: SidebarPosition;

  // Legacy compatibility — existing code uses setTheme('light'|'dark'|'system')
  theme: ColorMode;
  setTheme: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadSettings(): ThemeSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_THEME_SETTINGS, ...parsed };
    }
  } catch {
    // Corrupted storage — fall through to defaults
  }

  // Migrate from old 'theme' key if it exists
  const legacyTheme = localStorage.getItem('theme');
  if (legacyTheme === 'light' || legacyTheme === 'dark' || legacyTheme === 'system') {
    const migrated = { ...DEFAULT_THEME_SETTINGS, colorMode: legacyTheme as ColorMode };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    localStorage.removeItem('theme');
    return migrated;
  }

  return DEFAULT_THEME_SETTINGS;
}

function saveSettings(settings: ThemeSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function resolveColorMode(mode: ColorMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applySettingsToDOM(settings: ThemeSettings, resolved: 'light' | 'dark'): void {
  const root = document.documentElement;

  // Palette — set before dark class so cyberpunk can force dark
  if (settings.palette && settings.palette !== 'default') {
    root.dataset.theme = settings.palette;
  } else {
    delete root.dataset.theme;
  }

  // Color mode — .dark class (cyberpunk always forces dark)
  const isDarkTheme = settings.palette === 'cyberpunk' || resolved === 'dark';
  root.classList.toggle('dark', isDarkTheme);

  // Density
  if (settings.density && settings.density !== 'comfortable') {
    root.dataset.density = settings.density;
  } else {
    delete root.dataset.density;
  }

  // Font size
  if (settings.fontSize && settings.fontSize !== 'medium') {
    root.dataset.fontSize = settings.fontSize;
  } else {
    delete root.dataset.fontSize;
  }

  // Accent color — derive full set of primary tokens
  const accentProps = ['--color-primary', '--color-primary-hover', '--color-primary-light', '--color-primary-foreground'];
  if (settings.accentColor) {
    const tokens = isDarkTheme
      ? generateDarkAccentTokens(settings.accentColor)
      : generateAccentTokens(settings.accentColor);
    if (tokens) {
      for (const [prop, value] of Object.entries(tokens)) {
        root.style.setProperty(prop, value);
      }
    }
  } else {
    // Remove all overrides — let CSS cascade handle it
    for (const prop of accentProps) {
      root.style.removeProperty(prop);
    }
  }
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(loadSettings);
  const [resolvedColorMode, setResolvedColorMode] = useState<'light' | 'dark'>(
    () => resolveColorMode(settings.colorMode)
  );

  const updateSettings = useCallback((partial: Partial<ThemeSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  // Apply settings to DOM whenever they change
  useEffect(() => {
    const resolved = resolveColorMode(settings.colorMode);
    setResolvedColorMode(resolved);
    applySettingsToDOM(settings, resolved);
  }, [settings]);

  // Listen for OS preference changes when in system mode
  useEffect(() => {
    if (settings.colorMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = resolveColorMode('system');
      setResolvedColorMode(resolved);
      applySettingsToDOM(settings, resolved);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings]);

  // Legacy compatibility
  const setTheme = useCallback((mode: ColorMode) => {
    updateSettings({ colorMode: mode });
  }, [updateSettings]);

  return (
    <ThemeContext.Provider
      value={{
        settings,
        updateSettings,
        resolvedColorMode,
        colorMode: settings.colorMode,
        palette: settings.palette,
        density: settings.density,
        fontSize: settings.fontSize,
        sidebarPosition: settings.sidebarPosition,
        theme: settings.colorMode,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
