import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  /** Section heading */
  title: string;
  /** Whether the section starts open */
  defaultOpen?: boolean;
  /** Section content */
  children: ReactNode;
}

/**
 * CollapsibleSection - A toggleable section with a clickable header
 *
 * Usage:
 * ```tsx
 * <CollapsibleSection title="Compensation" defaultOpen={false}>
 *   <Input label="Salary" ... />
 * </CollapsibleSection>
 * ```
 */
export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 w-full py-2 text-sm font-medium text-text-secondary hover:text-text transition-colors"
        aria-expanded={isOpen}
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
        {title}
      </button>
      {isOpen && <div className="pb-2">{children}</div>}
    </div>
  );
}
