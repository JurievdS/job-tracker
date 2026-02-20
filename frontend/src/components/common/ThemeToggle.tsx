import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const themeOrder = ['light', 'dark', 'system'] as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor } as const;
const themeLabels = { light: 'Light mode', dark: 'Dark mode', system: 'System theme' } as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const nextIndex = (themeOrder.indexOf(theme) + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const Icon = themeIcons[theme];

  return (
    <button
      onClick={cycle}
      aria-label={themeLabels[theme]}
      className="p-2 rounded-[var(--radius-md)] text-text-secondary hover:bg-surface-alt transition-colors"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
