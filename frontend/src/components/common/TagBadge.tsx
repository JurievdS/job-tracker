import { X } from 'lucide-react';

interface TagBadgeProps {
  /** Tag display name */
  name: string;
  /** Hex color (e.g. "#3b82f6"). Falls back to neutral styling if null */
  color?: string | null;
  /** Show remove button */
  onRemove?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * TagBadge - A colored pill for displaying a tag
 *
 * Uses inline styles for custom hex colors with low-opacity backgrounds.
 */
export function TagBadge({
  name,
  color,
  onRemove,
  size = 'md',
}: TagBadgeProps) {
  const sizeStyles = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5'
    : 'text-xs px-2 py-0.5 gap-1';

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium whitespace-nowrap
        ${sizeStyles}
        ${!color ? 'bg-surface-alt text-text-secondary' : ''}
      `}
      style={color ? { backgroundColor: `${color}1A`, color } : undefined}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove tag ${name}`}
        >
          <X className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </button>
      )}
    </span>
  );
}
