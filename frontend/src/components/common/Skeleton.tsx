interface SkeletonProps {
    /** Number of skeleton lines to display */
    lines?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Skeleton - A simple loading skeleton component
 */
export function Skeleton({ lines = 3, className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse space-y-2 ${className}`} aria-hidden="true">
            {Array.from({ length: lines }).map((_, index) => (
                <div
                    key={index}
                    className="h-4 bg-border rounded w-full"
                ></div>
            ))}
        </div>
    );
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse space-y-2 ${className}`} aria-hidden="true">
            {Array.from({ length: lines }).map((_, index) => (
                <div
                    key={index}
                    className="h-4 bg-border rounded w-full"
                ></div>
            ))}
        </div>
    );
}
