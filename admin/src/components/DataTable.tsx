import React, { useState, useMemo } from 'react';
import { tokens } from '../theme/tokens';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onAddFirst?: () => void;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchFilter,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records to display.',
  onAddFirst,
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchQuery.toLowerCase().trim()));
  }, [data, searchQuery, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = aVal > bVal ? 1 : -1;
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div
      style={{
        backgroundColor: tokens.colors.bg,
        borderRadius: `${tokens.radii.md}px`,
        border: `1px solid ${tokens.colors.border}`,
        boxShadow: tokens.shadows.card,
        overflow: 'hidden',
      }}
    >
      {/* Search Header */}
      {searchable && (
        <div
          style={{
            padding: '1rem',
            borderBottom: `1px solid ${tokens.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: tokens.colors.bgWarm,
          }}
        >
          <div style={{ position: 'relative', width: '320px' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.875rem',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                fontSize: '0.8125rem',
                borderRadius: `${tokens.radii.sm}px`,
                border: `1px solid ${tokens.colors.border}`,
                backgroundColor: tokens.colors.bg,
                color: tokens.colors.textPrimary,
                outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: '0.8125rem', color: tokens.colors.textMuted }}>
            Showing {sortedData.length} total records
          </span>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: tokens.colors.primary50, borderBottom: `1px solid ${tokens.colors.border}` }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: tokens.colors.primary700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {col.header}
                    {col.sortable && (
                      <span style={{ fontSize: '0.6875rem' }}>
                        {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ color: tokens.colors.primary700, fontWeight: '600', fontSize: '0.875rem' }}>
                    Loading data...
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '2rem' }}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={onAddFirst ? 'Add First Record' : undefined}
                    onAction={onAddFirst}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item)}
                  style={{
                    borderBottom: `1px solid ${tokens.colors.borderLight}`,
                    backgroundColor: rowIdx % 2 === 0 ? tokens.colors.bg : tokens.colors.bgWarm,
                    transition: 'background-color 0.1s',
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '0.875rem 1rem',
                        fontSize: '0.8125rem',
                        color: tokens.colors.textPrimary,
                        verticalAlign: 'middle',
                      }}
                    >
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: `1px solid ${tokens.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: tokens.colors.bgWarm,
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: tokens.colors.textMuted }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: `${tokens.radii.sm}px`,
                border: `1px solid ${tokens.colors.border}`,
                backgroundColor: tokens.colors.bg,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: `${tokens.radii.sm}px`,
                border: `1px solid ${tokens.colors.border}`,
                backgroundColor: tokens.colors.bg,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

