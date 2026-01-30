import type { ReactNode } from 'react';

interface Column<T> {
  /** Key from the data object */
  key: keyof T;
  /** Column header text */
  header: string;
  /** Custom render function for cell content */
  render?: (value: T[keyof T], row: T) => ReactNode;
  /** Column width class (e.g., 'w-1/4') */
  width?: string;
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
 * Table - A generic data table component
 *
 * Usage:
 * ```tsx
 * const columns = [
 *   { key: 'name', header: 'Name' },
 *   { key: 'email', header: 'Email' },
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
  const getKey = (row: T, index: number): string | number => {
    if (keyExtractor) return keyExtractor(row);
    if ('id' in row) return row.id as string | number;
    return index;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`
                    px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.width || ''}
                  `}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    transition-colors
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-3 text-sm text-gray-900"
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
