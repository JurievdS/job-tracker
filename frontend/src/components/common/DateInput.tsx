import { forwardRef, type InputHTMLAttributes } from 'react';
import { today, formatRelative, isPast } from '@/utils/date';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Default to today's date if no value provided */
  defaultToToday?: boolean;
  /** Show relative date hint (e.g., "2 days ago") */
  showRelative?: boolean;
  /** Highlight if date is in the past */
  warnPast?: boolean;
}

/**
 * DateInput - A date input with sensible defaults and formatting
 *
 * Features:
 * - Properly handles local timezone (not UTC)
 * - Optional default to today's date
 * - Shows relative date hints ("Tomorrow", "2 days ago")
 * - Can warn when date is in the past
 *
 * Usage:
 * ```tsx
 * // Basic usage
 * <DateInput
 *   label="Date Applied"
 *   value={dateApplied}
 *   onChange={(e) => setDateApplied(e.target.value)}
 * />
 *
 * // With today as default
 * <DateInput
 *   label="Start Date"
 *   value={startDate}
 *   onChange={(e) => setStartDate(e.target.value)}
 *   defaultToToday
 * />
 *
 * // For reminders (show relative, warn if past)
 * <DateInput
 *   label="Reminder Date"
 *   value={reminderDate}
 *   onChange={(e) => setReminderDate(e.target.value)}
 *   showRelative
 *   warnPast
 * />
 * ```
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      error,
      helperText,
      defaultToToday = false,
      showRelative = false,
      warnPast = false,
      className = '',
      id,
      value,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    // Use today's date as default if enabled and no value
    const effectiveValue = value || (defaultToToday ? today() : '');

    // Calculate relative text and past warning
    const relativeText = showRelative && effectiveValue ? formatRelative(effectiveValue as string) : null;
    const isPastDate = warnPast && effectiveValue && isPast(effectiveValue as string);

    // Combine helper text with relative date
    const displayHelperText = relativeText
      ? (helperText ? `${helperText} • ${relativeText}` : relativeText)
      : helperText;

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          type="date"
          value={effectiveValue}
          className={`
            block w-full px-3 py-2 rounded-md border shadow-sm text-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : isPastDate
                ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : displayHelperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />

        {/* Error message */}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Helper text / Relative date */}
        {displayHelperText && !error && (
          <p
            id={`${inputId}-helper`}
            className={`text-sm ${isPastDate ? 'text-amber-600' : 'text-gray-500'}`}
          >
            {isPastDate && '⚠ '}
            {displayHelperText}
          </p>
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
