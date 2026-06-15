import { useEffect, useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useDispatch, useSelector } from 'react-redux';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useServerPagination from '../../hooks/useServerPagination';
import ServerTablePagination from '../../components/erp/ServerTablePagination';
import { fetchSales, deleteSale } from './salesSlice';
import { fetchMasters } from '../masters/mastersSlice';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import SalesDetailDialog from './SalesDetailDialog';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import BillPrintDialog from '../../components/BillPrintDialog';
import StandardInvoicePrint from './StandardInvoicePrint';
import ExchangeInvoicePrint from './ExchangeInvoicePrint';

const PAYMENT_STATUS_OPTIONS = ['Paid', 'Partial'];

function SalesListPage({
  pageTitle = 'Sales Invoices',
  pageDescription = 'Review retail invoices, payment status, and returns.',
  showPrimaryAction = true,
  primaryActionLabel = 'New Sale',
  primaryActionPath = '/sales/sale-bill/new',
  returnPathBuilder = (saleId) => `/sales/${saleId}/return`,
  emptyStateTitle = 'No sales invoices found.',
  emptyStateDescription = 'Start billing to create your first POS invoice.',
  emptyStateActionLabel = 'New Sale',
  emptyStateActionPath = '/sales/sale-bill/new',
}) {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const sales = useSelector((state) => state.sales.records || []);
  const salesTotal = useSelector((state) => state.sales.total || 0);
  const salesLoading = useSelector((state) => state.sales.loading);
  const customers = useSelector((state) => state.masters.customers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const user = useSelector((state) => state.auth.user);
  const canManageSales = user?.role === 'Admin' || user?.role === 'admin';
  const canCancelOrDelete = user?.role && user.role !== 'store_staff';

  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 350);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const {
    page,
    rowsPerPage,
    resetPage,
    handlePageChange,
    handleRowsPerPageChange,
    buildParams,
    pageSizeOptions,
  } = useServerPagination({ defaultPageSize: 10 });
  const [selectedSale, setSelectedSale] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);

  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [reasonActionType, setReasonActionType] = useState(''); // 'cancel' or 'delete'
  const [actionTargetId, setActionTargetId] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [reasonError, setReasonError] = useState('');

  const handleOpenReasonDialog = (actionType, id) => {
    setActionTargetId(id);
    setReasonActionType(actionType);
    setReasonText('');
    setReasonError('');
    setReasonDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!reasonText.trim()) {
      setReasonError('Reason is required.');
      return;
    }

    if (reasonActionType === 'cancel') {
      dispatch(cancelSale({ id: actionTargetId, reason: reasonText.trim() })).unwrap()
        .then(() => {
          setReasonDialogOpen(false);
          dispatch(refreshSales());
        })
        .catch((err) => {
          alert(err || 'Failed to cancel sale');
        });
    } else if (reasonActionType === 'delete') {
      dispatch(deleteSale({ id: actionTargetId, reason: reasonText.trim() })).unwrap()
        .then(() => {
          setReasonDialogOpen(false);
          dispatch(refreshSales());
        })
        .catch((err) => {
          alert(err || 'Failed to delete sale');
        });
    }
  };

  useEffect(() => {
    const params = buildParams({
      search: debouncedSearch,
      ...(paymentStatusFilter !== 'all' ? { paymentStatus: paymentStatusFilter } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    });
    dispatch(fetchSales(params));
    dispatch(fetchMasters('customers'));
    dispatch(fetchMasters('warehouses'));
  }, [dispatch, debouncedSearch, paymentStatusFilter, dateFilter, page, rowsPerPage, buildParams]);

  const refreshSales = () => {
    const params = buildParams({
      search: debouncedSearch,
      ...(paymentStatusFilter !== 'all' ? { paymentStatus: paymentStatusFilter } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    });
    dispatch(fetchSales(params));
  };

  const customerMap = useMemo(
    () =>
      customers.reduce((accumulator, customer) => {
        accumulator[customer.id] = customer;
        return accumulator;
      }, {}),
    [customers],
  );

  const warehouseMap = useMemo(
    () =>
      warehouses.reduce((accumulator, warehouse) => {
        accumulator[warehouse.id] = warehouse.name;
        return accumulator;
      }, {}),
    [warehouses],
  );

  const displayRows = useMemo(() => sales.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))), [sales]);

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                {pageTitle}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {pageDescription}
              </Typography>
            </Box>

            {showPrimaryAction ? (
              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => navigate(primaryActionPath)}
              >
                {primaryActionLabel}
              </Button>
            ) : null}
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              value={searchText}
              onChange={(event) => {
                resetPage();
                setSearchText(event.target.value);
              }}
              placeholder="Search by invoice, customer, or mobile"
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
              label="Payment Status"
              value={paymentStatusFilter}
              onChange={(event) => {
                resetPage();
                setPaymentStatusFilter(event.target.value);
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              type="date"
              label="Date"
              value={dateFilter}
              onChange={(event) => {
                resetPage();
                setDateFilter(event.target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Stack>

        {displayRows.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer / Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Total Items
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Net Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Store</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayRows.map((row) => {
                    const customer = customerMap[row.customerId];
                    const customerName =
                      row.customerName || customer?.customerName || 'Walk-in Customer';
                    const customerMobile = row.customerMobile || customer?.mobileNumber || '-';
                    const storeName = warehouseMap[row.storeId || row.warehouseId] || '...';

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{row.invoiceNumber}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {customerName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {customerMobile}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={String(row.saleType || 'retail').toUpperCase()}
                            color={row.saleType === 'exchange' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{row.totals?.totalQuantity ?? '-'}</TableCell>
                        <TableCell align="right">{row.totals?.netPayable != null ? Number(row.totals.netPayable).toFixed(2) : '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {storeName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.status === 'CANCELLED' ? (
                            <Chip size="small" color="error" variant="filled" label="Cancelled" sx={{ fontWeight: 600 }} />
                          ) : (
                            <PaymentStatusChip status={row.payment?.status || 'Pending'} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" color="info" onClick={() => setSelectedSale(row)}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="primary" onClick={() => setPrintTarget(row)}>
                              <PrintOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="warning"
                              disabled={row.status === 'CANCELLED'}
                              onClick={() => navigate(returnPathBuilder(row.id))}
                            >
                              <KeyboardReturnOutlinedIcon fontSize="small" />
                            </IconButton>
                            {canManageSales && (
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={row.status === 'CANCELLED'}
                                onClick={() => navigate(`/sales/sale-bill/${row.id}/edit`)}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            )}
                            {canCancelOrDelete && row.status !== 'CANCELLED' && (
                              <IconButton
                                size="small"
                                color="error"
                                title="Cancel Sale"
                                onClick={() => handleOpenReasonDialog('cancel', row.id)}
                              >
                                <BlockOutlinedIcon fontSize="small" />
                              </IconButton>
                            )}
                            {canCancelOrDelete && (
                              <IconButton
                                size="small"
                                color="error"
                                title="Delete Sale"
                                onClick={() => handleOpenReasonDialog('delete', row.id)}
                              >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <ServerTablePagination
              count={salesTotal}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={pageSizeOptions}
              disabled={salesLoading}
            />
          </>
        ) : (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              {emptyStateTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              {emptyStateDescription}
            </Typography>
            {emptyStateActionLabel && emptyStateActionPath ? (
              <Button variant="contained" onClick={() => navigate(emptyStateActionPath)}>
                {emptyStateActionLabel}
              </Button>
            ) : null}
          </Box>
        )}
      </Paper>

      <SalesDetailDialog
        open={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        customerName={
          selectedSale
            ? selectedSale.customerName || customerMap[selectedSale.customerId]?.customerName
            : ''
        }
        customerMobile={
          selectedSale
            ? selectedSale.customerMobile || customerMap[selectedSale.customerId]?.mobileNumber
            : ''
        }
        warehouseName={selectedSale ? warehouseMap[selectedSale.warehouseId] : ''}
      />

      <BillPrintDialog open={Boolean(printTarget)} onClose={() => setPrintTarget(null)}>
        {(() => {
          if (!printTarget) return null;
          const customer = customerMap[printTarget.customerId];
          const enrichedTarget = {
            ...printTarget,
            customerName: printTarget.customerName || customer?.customerName || 'Walk-in Customer',
            customerMobile: printTarget.customerMobile || customer?.mobileNumber || '',
            customerAddress: (printTarget.customerAddress && printTarget.customerAddress !== 'N/A')
              ? printTarget.customerAddress
              : (customer?.address || ''),
          };
          return enrichedTarget.saleType === 'exchange' ? (
            <ExchangeInvoicePrint sale={enrichedTarget} />
          ) : (
            <StandardInvoicePrint sale={enrichedTarget} />
          );
        })()}
      </BillPrintDialog>

      <Dialog open={reasonDialogOpen} onClose={() => setReasonDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {reasonActionType === 'cancel' ? 'Cancel Invoice' : 'Delete Invoice'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Are you sure you want to {reasonActionType === 'cancel' ? 'cancel' : 'delete'} this sale invoice? Please provide a reason below. This action will restore stock.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Reason"
            placeholder={`Enter reason for ${reasonActionType}...`}
            value={reasonText}
            onChange={(e) => {
              setReasonText(e.target.value);
              if (e.target.value.trim()) setReasonError('');
            }}
            error={Boolean(reasonError)}
            helperText={reasonError}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setReasonDialogOpen(false)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function PaymentStatusChip({ status }) {
  const normalized = String(status || '').toLowerCase();
  const color = normalized === 'paid' ? 'success' : normalized === 'partial' ? 'warning' : 'default';
  return <Chip size="small" color={color} variant="outlined" label={status || 'Pending'} />;
}

export default SalesListPage;
