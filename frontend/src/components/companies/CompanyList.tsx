import { Building2 } from 'lucide-react';
import type { CompanyWithNotes } from '@/types/company';
import { Skeleton, StarRating } from '@/components/common';

interface CompanyListProps {
  companies: CompanyWithNotes[];
  selectedId: number | null;
  onSelect: (company: CompanyWithNotes) => void;
  loading?: boolean;
}

export function CompanyList({
  companies,
  selectedId,
  onSelect,
  loading,
}: CompanyListProps) {
  if (loading) {
    return (
      <div className="space-y-2 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-3 bg-surface rounded-[var(--radius-lg)]">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6 text-text-placeholder" />
        </div>
        <p className="text-text-muted text-sm">No companies found</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1 px-2">
      {companies.map((company) => {
        const isSelected = selectedId === company.id;

        return (
          <li
            key={company.id}
            onClick={() => onSelect(company)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(company);
              }
            }}
            tabIndex={0}
            role="button"
            className={`
              p-3 rounded-[var(--radius-lg)] cursor-pointer transition-all
              ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-surface hover:bg-surface-alt text-text'
              }
            `}
          >
            <p className="font-medium truncate">{company.name}</p>
            {company.location && (
              <p
                className={`text-sm truncate mt-0.5 ${
                  isSelected ? 'text-primary-foreground opacity-80' : 'text-text-muted'
                }`}
              >
                {company.location}
              </p>
            )}
            {company.industry && (
              <p
                className={`text-xs truncate mt-0.5 ${
                  isSelected ? 'text-primary-foreground opacity-60' : 'text-text-placeholder'
                }`}
              >
                {company.industry}
              </p>
            )}
            {company.user_rating && (
              <div className="mt-1">
                <StarRating value={company.user_rating} size="sm" />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
