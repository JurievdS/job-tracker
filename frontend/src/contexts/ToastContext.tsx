import { createContext, useState, useCallback, useContext, useRef, useEffect, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  dismissing: boolean;
}

interface ToastContextType {
  addToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4000;
const EXIT_ANIMATION_MS = 200;

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-l-success',
  error: 'border-l-danger',
  info: 'border-l-info',
};

const variantIcons: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    // Clear any existing timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    // Start exit animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t)));

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 5);

      setToasts((prev) => {
        const next = [...prev, { id, message, variant, dismissing: false }];

        // Auto-dismiss oldest if exceeding max
        if (next.filter((t) => !t.dismissing).length > MAX_VISIBLE) {
          const oldest = next.find((t) => !t.dismissing);
          if (oldest) {
            // Schedule dismiss of oldest
            setTimeout(() => removeToast(oldest.id), 0);
          }
        }

        return next;
      });

      // Auto-dismiss after timeout
      const timer = setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 sm:max-w-sm">
          {toasts.map((toast) => {
            const Icon = variantIcons[toast.variant];
            return (
              <div
                key={toast.id}
                className={`
                  border-l-4 rounded-[var(--radius-md)] shadow-lg px-4 py-3 flex items-center gap-3
                  bg-surface-elevated text-text
                  transition-all duration-200
                  ${toast.dismissing ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
                  ${variantStyles[toast.variant]}
                `}
                style={!toast.dismissing ? { animation: 'toast-in 200ms ease-out' } : undefined}
                role="alert"
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${variantIconColors[toast.variant]}`} />
                <p className="text-sm flex-1">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-text-placeholder hover:text-text-secondary flex-shrink-0 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
