import type { Company } from '@/types/company';
import { Skeleton } from '@/components/common';

interface CompanyListProps {
  companies: Company[];
  selectedId: number | null;
  onSelect: (company: Company) => void;
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
          <div key={i} className="p-3 bg-white rounded-lg">
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
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No companies found</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1 px-2">
      {companies.map((company) => (
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
            p-3 rounded-lg cursor-pointer transition-all
            ${
              selectedId === company.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-gray-900'
            }
          `}
        >
          <p className="font-medium truncate">{company.name}</p>
          {company.location && (
            <p
              className={`text-sm truncate mt-0.5 ${
                selectedId === company.id ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {company.location}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
