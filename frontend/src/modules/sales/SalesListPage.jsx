import { useEffect, useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSales } from './salesSlice';
import { fetchMasters } from '../masters/mastersSlice';
import {
  Box,
  Button,
  Chip,
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
import SalesDetailDialog from './SalesDetailDialog';

const PAYMENT_STATUS_OPTIONS = ['Paid', 'Partial'];

function SalesListPage({
  pageTitle = 'Sales Invoices',
  pageDescription = 'Review retail invoices, payment status, and returns.',
  showPrimaryAction = true,
  primaryActionLabel = 'New Sale',
  primaryActionPath = '/sales/new',
  returnPathBuilder = (saleId) => `/sales/${saleId}/return`,
  emptyStateTitle = 'No sales invoices found.',
  emptyStateDescription = 'Start billing to create your first POS invoice.',
  emptyStateActionLabel = 'New Sale',
  emptyStateActionPath = '/sales/new',
}) {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const sales = useSelector((state) => state.sales.records || []);
  const customers = useSelector((state) => state.masters.customers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const [searchText, setSearchText] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    dispatch(fetchSales());
    dispatch(fetchMasters('customers'));
    dispatch(fetchMasters('warehouses'));
  }, [dispatch]);

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

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return sales
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .filter((row) => {
        const customer = customerMap[row.customerId];
        const customerName = row.customerName || customer?.customerName || 'Walk-in Customer';
        const customerMobile = row.customerMobile || customer?.mobileNumber || '';

        const matchesSearch = query
          ? row.invoiceNumber.toLowerCase().includes(query) ||
          customerName.toLowerCase().includes(query) ||
          customerMobile.toLowerCase().includes(query)
          : true;

        const matchesStatus =
          paymentStatusFilter === 'all'
            ? true
            : (row.payment?.status || '').toLowerCase() === paymentStatusFilter.toLowerCase();

        const matchesDate = dateFilter ? row.date === dateFilter : true;

        return matchesSearch && matchesStatus && matchesDate;
      });
  }, [customerMap, dateFilter, paymentStatusFilter, sales, searchText]);

  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

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
                setPage(0);
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
                setPage(0);
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
                setPage(0);
                setDateFilter(event.target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Stack>

        {filteredRows.length ? (
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
                      Net Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Store</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => {
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
                          <PaymentStatusChip status={row.payment?.status || 'Pending'} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" color="info" onClick={() => setSelectedSale(row)}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => navigate(returnPathBuilder(row.id))}
                            >
                              <KeyboardReturnOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20]}
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
    </>
  );
}

function PaymentStatusChip({ status }) {
  const normalized = String(status || '').toLowerCase();
  const color = normalized === 'paid' ? 'success' : normalized === 'partial' ? 'warning' : 'default';
  return <Chip size="small" color={color} variant="outlined" label={status || 'Pending'} />;
}

export default SalesListPage;
