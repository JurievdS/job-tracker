import { useState, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  /** Key from the data object */
  key: keyof T;
  /** Column header text */
  header: string;
  /** Custom render function for cell content */
  render?: (value: T[keyof T], row: T) => ReactNode;
  /** Column width class (e.g., 'w-1/4') */
  width?: string;
  /** Allow sorting by this column */
  sortable?: boolean;
}

interface TableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Callback when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Key extractor for React keys (defaults to 'id') */
  keyExtractor?: (row: T) => string | number;
  /** Show loading state */
  loading?: boolean;
}

/**
 * Table - A generic data table component with optional column sorting
 *
 * Usage:
 * ```tsx
 * const columns = [
 *   { key: 'name', header: 'Name', sortable: true },
 *   { key: 'email', header: 'Email', sortable: true },
 *   { key: 'status', header: 'Status', render: (val) => <Badge>{val}</Badge> },
 * ];
 *
 * <Table
 *   data={users}
 *   columns={columns}
 *   onRowClick={(user) => navigate(`/users/${user.id}`)}
 * />
 * ```
 */
export function Table<T extends object>({
  data,
  columns,
  onRowClick,
  keyExtractor,
  loading = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const getKey = (row: T, index: number): string | number => {
    if (keyExtractor) return keyExtractor(row);
    if ('id' in row) return row.id as string | number;
    return index;
  };

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  const skeletonWidths = ['w-3/4', 'w-1/2', 'w-2/3'];

  if (loading) {
    return (
      <div className="bg-surface rounded-[var(--radius-lg)] border border-border overflow-hidden" aria-busy="true">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-alt">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider ${column.width || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={String(column.key)} className="px-4 py-3">
                      <div className={`animate-pulse h-4 bg-border rounded ${skeletonWidths[(rowIndex + colIndex) % 3]}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-alt">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  className={`
                    px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider
                    ${column.width || ''}
                    ${column.sortable ? 'cursor-pointer select-none hover:text-text transition-colors' : ''}
                  `}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortKey === column.key && (
                      sortDir === 'asc'
                        ? <ChevronUp className="w-3.5 h-3.5" />
                        : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-text-placeholder"
                >
                  No results to display
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={getKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-surface-alt' : ''}
                    transition-colors
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-3 text-sm text-text"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
