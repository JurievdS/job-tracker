import type { ReactNode } from 'react';

interface Tab {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  /** Tab definitions */
  tabs: Tab[];
  /** Currently active tab key */
  activeTab: string;
  /** Called when a tab is selected */
  onChange: (key: string) => void;
}

/**
 * Tabs - Horizontal tab navigation
 *
 * Usage:
 * ```tsx
 * const [tab, setTab] = useState('appearance');
 *
 * <Tabs
 *   tabs={[
 *     { key: 'appearance', label: 'Appearance', icon: <PaletteIcon /> },
 *     { key: 'account', label: 'Account', icon: <UserIcon /> },
 *   ]}
 *   activeTab={tab}
 *   onChange={setTab}
 * />
 * ```
 */
export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-border" role="tablist">
      <nav className="-mb-px flex gap-4" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              role="tab"
              aria-selected={isActive}
              className={`
                inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2
                transition-colors duration-150 whitespace-nowrap
                ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text hover:border-border'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
