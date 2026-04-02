import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  IconButton,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  VisibilityOutlined as VisibilityOutlinedIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  ReceiptOutlined as ReceiptOutlinedIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDispatches } from './inventorySlice';
import PageHeader from '../../components/erp/PageHeader';
import SummaryCard from '../../components/erp/SummaryCard';
import FilterBar from '../../components/erp/FilterBar';
import StatusBadge from '../../components/erp/StatusBadge';
import ExportButton from '../../components/erp/ExportButton';
import useAppNavigate from '../../hooks/useAppNavigate';

function StockTransferPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { dispatches, loading } = useSelector((state) => state.inventory);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchDispatches());
  }, [dispatch]);

  const rows = useMemo(() => {
    return dispatches.map(d => ({
      id: d._id,
      transferNumber: d.dispatchNumber,
      transferDate: new Date(d.createdAt).toLocaleDateString(),
      fromLocation: d.sourceWarehouseId?.name || 'Warehouse',
      toLocation: d.destinationStoreId?.name || 'Store',
      totalQty: d.items.reduce((sum, i) => sum + (i.qty || 0), 0),
      status: d.status,
      createdBy: d.createdBy?.name || 'System',
      referenceId: d.referenceId,
      referenceType: d.referenceType
    }));
  }, [dispatches]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = query
        ? [row.transferNumber, row.fromLocation, row.toLocation]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesStatus = statusFilter === 'all' ? true : row.status.toUpperCase() === statusFilter.toUpperCase();
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
      inTransit: filteredRows.filter((row) => row.status === 'DISPATCHED').length,
      completed: filteredRows.filter((row) => row.status === 'RECEIVED').length,
      totalQty: filteredRows.reduce((sum, row) => sum + Number(row.totalQty || 0), 0),
    }),
    [filteredRows],
  );

  return (
    <Box>
      <PageHeader
        title="Stock Transfer Register"
        subtitle="Manage and track all stock movements between Head Office and retail branches."
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Transfer', active: true },
        ]}
        actions={[
          <Button key="new" variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate('/inventory/transfer/new')}>
            New Transfer
          </Button>,
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Total Shipments" value={summary.totalTransfers} helper="Total recorded transfers." />
        <SummaryCard label="In Transit" value={summary.inTransit} helper="Dispatched but not yet received." tone="info" />
        <SummaryCard label="Completed" value={summary.completed} helper="Successfully received at stores." tone="success" />
        <SummaryCard label="Total Units" value={summary.totalQty} helper="Total quantity across all shipments." tone="warning" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search by DSP number or location..."
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
          <MenuItem value="DISPATCHED">In Transit</MenuItem>
          <MenuItem value="RECEIVED">Completed</MenuItem>
        </TextField>
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>DSP Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Destination</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Doc Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#6366f1' }}>{row.transferNumber}</TableCell>
                  <TableCell>{row.transferDate}</TableCell>
                  <TableCell>{row.toLocation}</TableCell>
                  <TableCell align="right">{row.totalQty}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} />
                  </TableCell>
                  <TableCell>
                    {row.referenceType === 'Sale' ? (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: '#0f172a' }}>
                            <ReceiptOutlinedIcon fontSize="small" color="primary" />
                            <span>Tax Invoice</span>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: '#0f172a' }}>
                            <DescriptionOutlinedIcon fontSize="small" color="secondary" />
                            <span>Challan</span>
                        </Stack>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Tooltip title="View Transfer Details">
                        <IconButton size="small" onClick={() => navigate(`/inventory/transfer/${row.id}/view`)}>
                            <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {row.referenceId && row.referenceType === 'Sale' && (
                        <Tooltip title="View Tax Invoice">
                            <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => navigate(`/sales/sale-bill/${row.referenceId}`)}
                            >
                                <DescriptionOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedRows.length === 0 && (
                <TableRow>
                   <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No transfers found.
                   </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
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
