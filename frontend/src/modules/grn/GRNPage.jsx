import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import grnExportColumns from '../../config/exportColumns/grn';
import { fetchGrns } from './grnSlice';
import { fetchPurchaseOrders } from '../purchase/purchaseSlice';
import { loadModuleRecords, upsertModuleRecord } from '../erp/erpLocalStore';
import { fallbackGrns, formatCurrency, grnStorageKey, mergeGrns } from './grnUi';

const toExportRows = (rows = []) =>
  rows.flatMap((row) =>
    (row.lineItems || []).map((line) => ({
      grn_number: row.grnNumber,
      grn_date: row.grnDate,
      po_number: row.poNumber,
      supplier_name: row.supplierName,
      warehouse: row.warehouse,
      invoice_number: row.invoiceNumber,
      invoice_date: row.invoiceDate,
      item_code: line.itemCode,
      item_name: line.itemName,
      size: line.size,
      ordered_qty: line.orderedQty,
      previously_received_qty: line.previouslyReceivedQty,
      received_qty: line.receivedQty,
      rejected_qty: line.rejectedQty,
      accepted_qty: line.acceptedQty,
      rate: line.rate,
      batch_no: line.batchNo,
      remarks: line.remarks,
      status: row.status,
      posted_by: row.postedBy,
      created_at: row.createdAt,
    })),
  );

function GRNPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const backendRecords = useSelector((state) => state.grn.records || []);

  const [searchText, setSearchText] = useState('');
  const [poFilter, setPoFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchGrns());
    dispatch(fetchPurchaseOrders());
  }, [dispatch]);

  const records = useMemo(
    () => mergeGrns(loadModuleRecords(grnStorageKey, fallbackGrns), backendRecords),
    [backendRecords],
  );

  useEffect(() => {
    if (backendRecords.length) {
      records.forEach((record) => upsertModuleRecord(grnStorageKey, record));
    }
  }, [backendRecords.length, records]);

  const poOptions = useMemo(() => Array.from(new Set(records.map((row) => row.poNumber).filter(Boolean))), [records]);
  const supplierOptions = useMemo(() => Array.from(new Set(records.map((row) => row.supplierName).filter(Boolean))), [records]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return records.filter((row) => {
      const matchesSearch = query
        ? [row.grnNumber, row.poNumber, row.supplierName, row.invoiceNumber]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesPo = poFilter === 'all' ? true : row.poNumber === poFilter;
      const matchesSupplier = supplierFilter === 'all' ? true : row.supplierName === supplierFilter;
      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      const matchesDateFrom = dateFrom ? row.grnDate >= dateFrom : true;
      const matchesDateTo = dateTo ? row.grnDate <= dateTo : true;
      return matchesSearch && matchesPo && matchesSupplier && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [dateFrom, dateTo, poFilter, records, searchText, statusFilter, supplierFilter]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(
    () => ({
      totalRecords: filteredRows.length,
      approved: filteredRows.filter((row) => row.status === 'Approved').length,
      draft: filteredRows.filter((row) => row.status === 'Draft').length,
      receivedQty: filteredRows.reduce((sum, row) => sum + Number(row.totals?.receivedTotal || 0), 0),
    }),
    [filteredRows],
  );

  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);

  return (
    <Box>
      <PageHeader
        title="Goods Receipt Note (GRN)"
        subtitle="Track draft, partial, and posted inward receipts against purchase orders with supplier, warehouse, invoice, and batch visibility."
        breadcrumbs={[
          { label: 'Purchase' },
          { label: 'GRN', active: true },
        ]}
        actions={[
          <ExportButton key="export" rows={exportRows} columns={grnExportColumns} filename="grn-register.xlsx" sheetName="GRN" />,
          <Button key="new" variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate('/grn/new')}>
            New GRN
          </Button>,
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="GRN Records" value={summary.totalRecords} helper="Visible GRN entries in the inward register." />
        <SummaryCard label="Draft GRNs" value={summary.draft} helper="Stock is not posted yet for draft receipts." tone="warning" />
        <SummaryCard label="Approved / Posted" value={summary.approved} helper="Approved GRNs have inventory posted to warehouse." tone="success" />
        <SummaryCard label="Received Qty" value={summary.receivedQty} helper="Total received quantity across filtered inward records." tone="info" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search GRN number, PO, supplier, or invoice"
          value={searchText}
          onChange={(event) => {
            setPage(0);
            setSearchText(event.target.value);
          }}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          size="small"
          select
          label="PO"
          value={poFilter}
          onChange={(event) => {
            setPage(0);
            setPoFilter(event.target.value);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All POs</MenuItem>
          {poOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="Supplier"
          value={supplierFilter}
          onChange={(event) => {
            setPage(0);
            setSupplierFilter(event.target.value);
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="all">All Suppliers</MenuItem>
          {supplierOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={(event) => {
            setPage(0);
            setStatusFilter(event.target.value);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="Draft">Draft</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Partial">Partial</MenuItem>
          <MenuItem value="Cancelled">Cancelled</MenuItem>
        </TextField>
        <TextField size="small" type="date" label="From" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="To" value={dateTo} onChange={(event) => setDateTo(event.target.value)} InputLabelProps={{ shrink: true }} />
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>GRN Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>GRN Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PO Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Received Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Posted By</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{row.grnNumber}</TableCell>
                  <TableCell>{row.grnDate}</TableCell>
                  <TableCell>{row.poNumber || '--'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.supplierName || '--'}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {row.invoiceNumber ? `Invoice: ${row.invoiceNumber}` : 'Awaiting invoice reference'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{row.totals?.receivedTotal || 0}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} />
                  </TableCell>
                  <TableCell>{row.postedBy || '--'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton size="small" color="info" onClick={() => navigate(`/grn/${row.id}/view`)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="primary" onClick={() => navigate(`/grn/${row.id}/edit`)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!paginatedRows.length ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                      No GRNs found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Create a draft GRN from an approved purchase order or adjust your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
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

export default GRNPage;
