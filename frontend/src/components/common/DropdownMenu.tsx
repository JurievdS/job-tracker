import { useState, useRef, useEffect, type ReactNode } from 'react';

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
}

interface DropdownMenuProps {
  /** Element that triggers the menu */
  trigger: ReactNode;
  /** Menu items */
  items: DropdownMenuItem[];
  /** Alignment of the dropdown */
  align?: 'left' | 'right';
}

/**
 * DropdownMenu - A button-triggered floating menu
 *
 * Usage:
 * ```tsx
 * <DropdownMenu
 *   trigger={<Button variant="ghost" icon={<MoreVertical />}>More</Button>}
 *   items={[
 *     { label: 'Edit', onClick: handleEdit, icon: <Pencil /> },
 *     { label: 'Delete', onClick: handleDelete, icon: <Trash />, danger: true },
 *   ]}
 * />
 * ```
 */
export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setIsOpen((prev) => !prev)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1 min-w-[160px] py-1
            bg-surface-elevated border border-border rounded-[var(--radius-md)] shadow-lg
            animate-in fade-in duration-150
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          role="menu"
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                ${item.danger
                  ? 'text-danger hover:bg-danger-light'
                  : 'text-text hover:bg-surface-alt'
                }
              `}
              role="menuitem"
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
