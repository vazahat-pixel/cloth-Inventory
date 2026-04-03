import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
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
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import purchaseOrdersExportColumns from '../../config/exportColumns/purchaseOrders';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchPurchaseOrders } from './purchaseSlice';
import { loadModuleRecords, upsertModuleRecord } from '../erp/erpLocalStore';
import {
  formatCurrency,
  mergePurchaseOrders,
  normalizePurchaseOrderRecord,
  purchaseOrderStorageKey,
} from './purchaseOrderUi';

const toExportRows = (rows = []) =>
  rows.flatMap((row) =>
    (row.items || []).map((line) => ({
      po_number: row.poNumber,
      po_date: row.poDate,
      supplier_name: row.supplierName,
      expected_delivery_date: row.expectedDeliveryDate,
      item_code: line.itemCode,
      item_name: line.itemName,
      size: line.size,
      color: line.color,
      qty: line.qty,
      rate: line.rate,
      discount_percent: line.discountPercent,
      tax_percent: line.taxPercent,
      line_amount: line.amount,
      subtotal: row.totals?.subtotal,
      discount_total: row.totals?.discountTotal,
      tax_total: row.totals?.taxTotal,
      grand_total: row.totals?.grandTotal,
      notes: row.notes,
      status: row.status,
      created_by: row.createdBy,
      created_at: row.createdAt,
    })),
  );

function PurchaseOrderListPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const location = useLocation();
  const basePath = useRoleBasePath();
  const backendOrders = useSelector((state) => state.purchase.orders || []);
  const masterSuppliers = useSelector((state) => state.masters.suppliers || []);

  const [searchText, setSearchText] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchMasters('suppliers'));
  }, [dispatch]);

  const localPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || '/'
    : location.pathname;
  const listPath = localPath.startsWith('/orders/purchase-order')
    ? '/orders/purchase-order'
    : '/purchase/orders';

  const suppliers = useMemo(() => {
    return (masterSuppliers || []).map((supplier) => ({
      id: supplier.id || supplier._id,
      supplierName: supplier.supplierName || supplier.name || '',
      city: supplier.city || '',
      state: supplier.state || '',
      creditDays: supplier.creditDays || 0,
      status: supplier.status || 'Active',
      addressLine1: supplier.addressLine1 || supplier.address || '',
      addressLine2: supplier.addressLine2 || '',
    }));
  }, [masterSuppliers]);

  const orders = backendOrders;

  const supplierMap = useMemo(
    () =>
      suppliers.reduce((accumulator, supplier) => {
        accumulator[supplier.id] = supplier;
        return accumulator;
      }, {}),
    [suppliers],
  );

  const rows = useMemo(() => {
    return orders.map((order) => {
      const normalized = normalizePurchaseOrderRecord(order);
      const supplierIdVal = normalized.supplierId?._id || normalized.supplierId;
      const supplier = supplierMap[supplierIdVal] || {};
      
      return {
        ...normalized,
        supplierName: normalized.supplierName || supplier.supplierName || 'Unassigned Supplier',
      };
    });
  }, [orders, supplierMap]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = query
        ? [row.poNumber, row.supplierName, row.notes]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesSupplier = supplierFilter === 'all' ? true : (row.supplierId?._id || row.supplierId) === supplierFilter;
      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      const matchesDateFrom = dateFrom ? row.poDate >= dateFrom : true;
      const matchesDateTo = dateTo ? row.poDate <= dateTo : true;
      return matchesSearch && matchesSupplier && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [dateFrom, dateTo, rows, searchText, statusFilter, supplierFilter]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(
    () => ({
      totalOrders: filteredRows.length,
      draftOrders: filteredRows.filter((row) => (row.status || '').toUpperCase() === 'DRAFT').length,
      pendingOrders: filteredRows.filter((row) => (row.status || '').toUpperCase() === 'PENDING').length,
      approvedOrders: filteredRows.filter((row) => (row.status || '').toUpperCase() === 'APPROVED').length,
      partialOrders: filteredRows.filter((row) => (row.status || '').toUpperCase() === 'PARTIALLY_RECEIVED').length,
      orderValue: filteredRows.reduce((sum, row) => sum + Number(row.totals?.grandTotal || 0), 0),
    }),
    [filteredRows],
  );

  const duplicateOrder = (row) => {
    const now = new Date();
    const duplicated = {
      ...row,
      id: `po-${now.getTime()}`,
      poNumber: `PO-${String(now.getTime()).slice(-6)}`,
      status: 'DRAFT',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      items: (row.items || []).map((line, index) => ({
        ...line,
        id: `po-line-${now.getTime()}-${index + 1}`,
      })),
    };
    upsertModuleRecord(purchaseOrderStorageKey, duplicated);
    navigate(`${listPath}/${duplicated.id}/edit`);
  };

  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);

  return (
    <Box>
      <PageHeader
        title="Purchase Orders"
        subtitle="Create garment purchase orders with supplier, delivery, item-line, and approval status tracking without disturbing the current purchase workflow."
        breadcrumbs={[
          { label: 'Purchase' },
          { label: 'Purchase Orders', active: true },
        ]}
        actions={[
          <ExportButton
            key="export"
            rows={exportRows}
            columns={purchaseOrdersExportColumns}
            filename="purchase-orders.xlsx"
            sheetName="Purchase Orders"
          />,
          <Button key="new" variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate(`${listPath}/new`)}>
            New PO
          </Button>,
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Purchase Orders" value={summary.totalOrders} helper="Filtered records in the current PO register." />
        <SummaryCard label="Draft / Pending" value={`${summary.draftOrders} / ${summary.pendingOrders}`} helper="Drafts can be edited before approval." tone="warning" />
        <SummaryCard label="Approved / Partial" value={`${summary.approvedOrders} / ${summary.partialOrders}`} helper="Partially received orders remain open." tone="success" />
        <SummaryCard label="Total Order Value" value={formatCurrency(summary.orderValue)} helper="Grand total across visible purchase orders." tone="info" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          value={searchText}
          onChange={(event) => {
            setPage(0);
            setSearchText(event.target.value);
          }}
          placeholder="Search PO number, supplier, or notes"
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
          label="Supplier"
          value={supplierFilter}
          onChange={(event) => {
            setPage(0);
            setSupplierFilter(event.target.value);
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="all">All Suppliers</MenuItem>
          {suppliers.map((supplier) => (
            <MenuItem key={supplier.id} value={supplier.id}>
              {supplier.supplierName}
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
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="PARTIALLY_RECEIVED">Partial</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="Cancelled">Cancelled</MenuItem>
        </TextField>
        <TextField
          size="small"
          type="date"
          label="From"
          value={dateFrom}
          onChange={(event) => {
            setPage(0);
            setDateFrom(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          type="date"
          label="To"
          value={dateTo}
          onChange={(event) => {
            setPage(0);
            setDateTo(event.target.value);
          }}
          InputLabelProps={{ shrink: true }}
        />
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>PO Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PO Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expected Delivery</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Rec / Total Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Total Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{row.poNumber}</TableCell>
                  <TableCell>{row.poDate}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {row.supplierName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {supplierMap[row.supplierId]?.city || '--'}{supplierMap[row.supplierId]?.state ? `, ${supplierMap[row.supplierId]?.state}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.expectedDeliveryDate || '--'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ minWidth: 100 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Rec: {row.totals?.totalReceivedQty || 0} / {row.totals?.totalQty || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>
                        Bill: {row.totals?.totalBilledQty || 0} / {row.totals?.totalQty || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(row.totals?.grandTotal || 0)}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} />
                  </TableCell>
                  <TableCell>{(typeof row.createdBy === 'object' ? row.createdBy?.name : row.createdBy) || 'HO Admin'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton size="small" color="info" onClick={() => navigate(`${listPath}/${row.id}/view`)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="primary" onClick={() => navigate(`${listPath}/${row.id}/edit`)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="secondary" onClick={() => duplicateOrder(row)}>
                        <ContentCopyOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => navigate(`/grn/new?poId=${row.id}`)}
                        title="Create GRN"
                      >
                        <ReceiptLongOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!paginatedRows.length ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                      No purchase orders found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Adjust filters or create a fresh purchase order to continue the garment inward flow.
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

export default PurchaseOrderListPage;
