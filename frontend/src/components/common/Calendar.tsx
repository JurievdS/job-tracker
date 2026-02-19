import { useState, useMemo } from 'react';

interface CalendarProps {
  /** Currently selected date */
  selectedDate?: Date;
  /** Callback when a date is selected */
  onDateSelect: (date: Date) => void;
  /** Dates to mark with a dot (e.g., reminders, interviews) */
  markedDates?: Date[];
}

/**
 * Calendar - A mini calendar for date selection
 *
 * Usage:
 * ```tsx
 * const [date, setDate] = useState<Date>();
 * const reminders = [new Date('2024-01-15'), new Date('2024-01-20')];
 *
 * <Calendar
 *   selectedDate={date}
 *   onDateSelect={setDate}
 *   markedDates={reminders}
 * />
 * ```
 */
export function Calendar({
  selectedDate,
  onDateSelect,
  markedDates = [],
}: CalendarProps) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const { year, month, days, firstDayOfWeek } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();

    return {
      year: y,
      month: m,
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      firstDayOfWeek: firstDay,
    };
  }, [viewDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isMarked = (day: number) => {
    return markedDates.some(
      (d) =>
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const goToPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    onDateSelect(new Date(year, month, day));
  };

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] border border-border p-4 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-1 hover:bg-surface-alt rounded-[var(--radius-md)] transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-medium text-text">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-surface-alt rounded-[var(--radius-md)] transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name) => (
          <div
            key={name}
            className="text-center text-xs font-medium text-text-muted py-1"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first of the month */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => (
          <button
            key={day}
            onClick={() => handleDateClick(day)}
            className={`
              relative w-8 h-8 flex items-center justify-center rounded-full text-sm
              transition-colors
              ${isSelected(day)
                ? 'bg-primary text-primary-foreground'
                : isToday(day)
                ? 'bg-primary-light text-primary'
                : 'hover:bg-surface-alt text-text'
              }
            `}
          >
            {day}
            {/* Marker dot */}
            {isMarked(day) && !isSelected(day) && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
