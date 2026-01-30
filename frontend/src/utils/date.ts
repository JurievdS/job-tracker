/**
 * Date utility functions for consistent date handling across the app
 */

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * Use this for HTML date input default values
 */
export function getLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as a string in YYYY-MM-DD format
 * Alias for getLocalDate() with no arguments
 */
export function today(): string {
  return getLocalDate();
}

/**
 * Parse a date string (YYYY-MM-DD) into a Date object
 * Returns null if invalid
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  const date = new Date(dateString + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date for display (localized)
 * @param date - Date object, ISO string, or YYYY-MM-DD string
 * @param options - Intl.DateTimeFormat options
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toLocaleDateString(undefined, options);
}

/**
 * Format a date as relative time (e.g., "2 days ago", "in 3 days")
 * Useful for reminders and activity feeds
 */
export function formatRelative(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const todayDate = new Date();
  return (
    dateObj.getFullYear() === todayDate.getFullYear() &&
    dateObj.getMonth() === todayDate.getMonth() &&
    dateObj.getDate() === todayDate.getDate()
  );
}
