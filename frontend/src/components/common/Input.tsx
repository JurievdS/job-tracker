import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Element rendered inside the input, left-aligned (e.g. search icon) */
  startElement?: ReactNode;
  /** Element rendered inside the input, right-aligned (e.g. password toggle, clear button) */
  endElement?: ReactNode;
}

const baseInputClasses = `
  block w-full px-[var(--padding-input-x)] py-[var(--padding-input-y)] rounded-[var(--radius-md)] border shadow-sm text-sm
  placeholder:text-text-placeholder
  focus:outline-none focus:ring-2 focus:ring-offset-0
  disabled:bg-surface-alt disabled:text-text-muted disabled:cursor-not-allowed
  bg-surface text-text transition-colors duration-150
`;

const normalBorder = 'border-border focus:border-border-focus focus:ring-border-focus';
const errorBorder = 'border-danger focus:border-danger focus:ring-danger';

/**
 * Input - A form input with label and error states
 *
 * Usage:
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={errors.email}
 * />
 *
 * // With react-hook-form
 * <Input
 *   label="Company Name"
 *   {...register('name')}
 *   error={errors.name?.message}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, startElement, endElement, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasAdornment = !!(startElement || endElement);

    const inputEl = (
      <input
        ref={ref}
        id={inputId}
        className={`
          ${baseInputClasses}
          ${error ? errorBorder : normalBorder}
          ${startElement ? 'pl-9' : ''}
          ${endElement ? 'pr-10' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />
    );

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        {/* Input with optional start/end elements */}
        {hasAdornment ? (
          <div className="relative">
            {startElement && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-placeholder">
                {startElement}
              </div>
            )}
            {inputEl}
            {endElement && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {endElement}
              </div>
            )}
          </div>
        ) : (
          inputEl
        )}

        {/* Error message */}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-danger-text">
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea - A multi-line text input
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={`
            ${baseInputClasses}
            ${error ? errorBorder : normalBorder}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />

        {error && (
          <p className="text-sm text-danger-text">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Select - A dropdown select input
 *
 * Usage:
 * ```tsx
 * // Single select
 * <Select
 *   label="Status"
 *   options={[{ value: 'active', label: 'Active' }]}
 *   value={status}
 *   onChange={(e) => setStatus(e.target.value)}
 * />
 *
 * // Multi-select (add multiple prop)
 * <Select
 *   multiple
 *   label="Technologies"
 *   options={[{ value: 'react', label: 'React' }, { value: 'node', label: 'Node.js' }]}
 *   value={selectedTechs}
 *   onChange={(e) => {
 *     const selected = Array.from(e.target.selectedOptions).map(o => o.value);
 *     setSelectedTechs(selected);
 *   }}
 * />
 * ```
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, multiple, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          multiple={multiple}
          className={`
            ${baseInputClasses}
            ${error ? errorBorder : normalBorder}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-sm text-danger-text">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
