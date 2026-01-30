import type { ReactNode } from "react";

interface FormProps {
  /** Form title */
  title?: string;
  /** Form content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Form submit handler */
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Form - A styled form container
 *
 * Usage:
 * ```tsx
 * <Form title="Login" onSubmit={handleLogin}>
 *   <input type="text" ... />
 *   <input type="password" ... />
 *   <button type="submit">Submit</button>
 * </Form>
 * ```
 */
export function Form({ title, children, className = '', onSubmit }: FormProps) {
  return (
    <form
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-6
        ${className}
      `}
      onSubmit={onSubmit}
    >
      {title && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      )}
      {children}
    </form>
  );
}