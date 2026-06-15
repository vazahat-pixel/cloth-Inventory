import { TablePagination } from '@mui/material';
import { PAGE_SIZE_OPTIONS } from '../../utils/paginationMeta';

function ServerTablePagination({
  count = 0,
  page = 0,
  rowsPerPage = 20,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = PAGE_SIZE_OPTIONS,
  disabled = false,
}) {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={onPageChange}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={rowsPerPageOptions}
      disabled={disabled}
    />
  );
}

export default ServerTablePagination;
