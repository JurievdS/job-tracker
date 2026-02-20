import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Button content */
  children: ReactNode;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon to display before text */
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary',
  secondary: 'bg-surface-alt text-text hover:bg-border focus:ring-border',
  danger: 'bg-danger text-white hover:brightness-110 focus:ring-danger',
  ghost: 'bg-transparent text-text hover:bg-surface-alt focus:ring-border',
  outline: 'border border-border bg-transparent text-text hover:bg-surface-alt focus:ring-border',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-[var(--padding-button-sm-x)] py-[var(--padding-button-sm-y)] text-sm',
  md: 'px-[var(--padding-button-md-x)] py-[var(--padding-button-md-y)] text-sm',
  lg: 'px-[var(--padding-button-lg-x)] py-[var(--padding-button-lg-y)] text-base',
};

/**
 * Button - A consistent button component
 *
 * Usage:
 * ```tsx
 * <Button onClick={handleSave}>Save</Button>
 * <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
 * <Button variant="danger" onClick={handleDelete}>Delete</Button>
 * <Button loading={isSubmitting}>Submit</Button>
 * <Button icon={<PlusIcon />}>Add New</Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)]
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-[var(--color-ring-offset)]
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
