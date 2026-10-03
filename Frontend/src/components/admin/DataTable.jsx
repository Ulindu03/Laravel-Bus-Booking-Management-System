'use client';

import React, { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InboxIcon from '@mui/icons-material/Inbox';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = 'Search...',
  onRowClick,
  pageSize = 10,
  emptyMessage = 'No data found',
  emptySubMessage = 'Try adjusting your search or filters',
  actions,
  headerActions,
  filters,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Sort
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Search across all searchable columns
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          if (col.searchable === false) return false;
          const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : '';
          return String(val || '').toLowerCase().includes(searchLower);
        })
      );
    }

    // Sort
    if (sortConfig.key) {
      const col = columns.find((c) => c.key === sortConfig.key);
      filtered.sort((a, b) => {
        const aVal = col?.accessor
          ? typeof col.accessor === 'function'
            ? col.accessor(a)
            : a[col.accessor]
          : a[sortConfig.key];
        const bVal = col?.accessor
          ? typeof col.accessor === 'function'
            ? col.accessor(b)
            : b[col.accessor]
          : b[sortConfig.key];

        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const comp = String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? comp : -comp;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, columns]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={styles.tableWrap}>
        <div className={styles.toolbar}>
          <div className={`${styles.skeleton} ${styles.skeletonSearch}`} />
        </div>
        <div className={styles.skeletonTable}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              {columns.map((_, j) => (
                <div key={j} className={`${styles.skeleton} ${styles.skeletonCell}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.toolbarRight}>
          {filters && <div className={styles.filters}>{filters}</div>}
          {headerActions && <div className={styles.headerActions}>{headerActions}</div>}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${styles.th} ${col.sortable !== false ? styles.sortable : ''} ${col.align === 'center' ? styles.center : ''} ${col.align === 'right' ? styles.right : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={col.width ? { width: col.width } : {}}
                >
                  <div className={styles.thContent}>
                    <span>{col.label}</span>
                    {col.sortable !== false && sortConfig.key === col.key && (
                      <span className={styles.sortIndicator}>
                        {sortConfig.direction === 'asc' ? (
                          <ArrowUpwardIcon />
                        ) : (
                          <ArrowDownwardIcon />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className={`${styles.th} ${styles.center}`}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <InboxIcon />
                    </div>
                    <p className={styles.emptyTitle}>{emptyMessage}</p>
                    <p className={styles.emptySub}>{emptySubMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${styles.td} ${col.align === 'center' ? styles.center : ''} ${col.align === 'right' ? styles.right : ''}`}
                    >
                      {col.render
                        ? col.render(row)
                        : typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor]}
                    </td>
                  ))}
                  {actions && (
                    <td className={`${styles.td} ${styles.center}`}>
                      <div className={styles.actionBtns}>{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {processedData.length > pageSize && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, processedData.length)} of{' '}
            {processedData.length}
          </span>
          <div className={styles.pageControls}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`${styles.pageNum} ${currentPage === i + 1 ? styles.activePageNum : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
