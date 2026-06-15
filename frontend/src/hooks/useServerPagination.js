import { useCallback, useState } from 'react';
import { PAGE_SIZE_OPTIONS } from '../utils/paginationMeta';

export default function useServerPagination({
  defaultPageSize = 20,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
} = {}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const resetPage = useCallback(() => setPage(0), []);

  const handlePageChange = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const toggleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('asc');
      return field;
    });
    setPage(0);
  }, []);

  const buildParams = useCallback((extra = {}) => ({
    page: page + 1,
    limit: rowsPerPage,
    ...(sortBy ? { sortBy, sortOrder } : {}),
    ...extra,
  }), [page, rowsPerPage, sortBy, sortOrder]);

  return {
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    setPage,
    resetPage,
    handlePageChange,
    handleRowsPerPageChange,
    toggleSort,
    buildParams,
    pageSizeOptions,
  };
}
