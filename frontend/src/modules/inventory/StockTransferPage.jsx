import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import stockTransferExportColumns from '../../config/exportColumns/stockTransfer';
import { loadModuleRecords } from '../erp/erpLocalStore';
import { fallbackStockTransfers, mergeStockTransfers, stockTransferStorageKey } from './stockTransferUi';

const toExportRows = (rows = []) =>
  rows.flatMap((row) =>
    (row.items || []).map((item) => ({
      transfer_number: row.transferNumber,
      transfer_date: row.transferDate,
      from_location: row.fromLocation,
      to_location: row.toLocation,
      item_code: item.itemCode,
      item_name: item.itemName,
      size: item.size,
      available_qty: item.availableQty,
      transfer_qty: item.transferQty,
      uom: item.uom,
      remarks: item.remarks,
      status: row.status,
      created_by: row.createdBy,
      created_at: row.createdAt,
    })),
  );

function StockTransferPage() {
  const navigate = useAppNavigate();
  const rows = useMemo(
    () => mergeStockTransfers(loadModuleRecords(stockTransferStorageKey, fallbackStockTransfers)),
    [],
  );

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = query
        ? [row.transferNumber, row.fromLocation, row.toLocation]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchText, statusFilter]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(
    () => ({
      totalTransfers: filteredRows.length,
      inTransit: filteredRows.filter((row) => row.status === 'In Transit').length,
      completed: filteredRows.filter((row) => row.status === 'Completed').length,
      totalQty: filteredRows.reduce((sum, row) => sum + Number(row.totalQty || 0), 0),
    }),
    [filteredRows],
  );

  return (
    <Box>
      <PageHeader
        title="Stock Transfer"
        subtitle="Track HO to store transfer drafts, in-transit dispatches, and completed stock movement with register and form routes."
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Transfer', active: true },
        ]}
        actions={[
          <ExportButton key="export" rows={toExportRows(filteredRows)} columns={stockTransferExportColumns} filename="stock-transfer.xlsx" sheetName="Stock Transfer" />,
          <Button key="new" variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate('/inventory/transfer/new')}>
            New Transfer
          </Button>,
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Transfers" value={summary.totalTransfers} helper="Visible transfer register rows." />
        <SummaryCard label="In Transit" value={summary.inTransit} helper="Dispatches moving to store locations." tone="info" />
        <SummaryCard label="Completed" value={summary.completed} helper="Transfers marked as completed." tone="success" />
        <SummaryCard label="Total Qty" value={summary.totalQty} helper="Total transfer quantity across filtered records." tone="warning" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search transfer number or location"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField size="small" select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="Draft">Draft</MenuItem>
          <MenuItem value="In Transit">In Transit</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="Cancelled">Cancelled</MenuItem>
        </TextField>
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Transfer No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>From Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>To Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Total Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{row.transferNumber}</TableCell>
                  <TableCell>{row.transferDate}</TableCell>
                  <TableCell>{row.fromLocation}</TableCell>
                  <TableCell>{row.toLocation}</TableCell>
                  <TableCell align="right">{row.totalQty}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} />
                  </TableCell>
                  <TableCell>{row.createdBy}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton size="small" color="info" onClick={() => navigate(`/inventory/transfer/${row.id}/view`)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="primary" onClick={() => navigate(`/inventory/transfer/${row.id}/edit`)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
}

export default StockTransferPage;
