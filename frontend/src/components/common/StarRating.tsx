import { Star } from 'lucide-react';

interface StarRatingProps {
  /** Current rating value (1-5 or null) */
  value: number | null;
  /** Callback when a star is clicked. Omit to make read-only. */
  onChange?: (rating: number | null) => void;
  /** Size variant */
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
};

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const isInteractive = !!onChange;

  const handleClick = (starIndex: number) => {
    if (!onChange) return;
    // Clicking the same star clears the rating
    onChange(value === starIndex ? null : starIndex);
  };

  return (
    <div className="inline-flex items-center gap-0.5" role={isInteractive ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = value !== null && star <= value;

        return isInteractive ? (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            className={`
              ${sizeClasses[size]} transition-colors
              ${isFilled ? 'text-yellow-400' : 'text-text-placeholder'}
              hover:text-yellow-300 cursor-pointer
            `}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className="w-full h-full"
              fill={isFilled ? 'currentColor' : 'none'}
            />
          </button>
        ) : (
          <span
            key={star}
            className={`
              ${sizeClasses[size]}
              ${isFilled ? 'text-yellow-400' : 'text-text-placeholder'}
            `}
          >
            <Star
              className="w-full h-full"
              fill={isFilled ? 'currentColor' : 'none'}
            />
          </span>
        );
      })}
    </div>
  );
}
