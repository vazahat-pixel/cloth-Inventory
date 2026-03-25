import { useEffect, useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSaleOrders } from './ordersSlice';
import { fetchMasters } from '../masters/mastersSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

function SaleOrderListPage() {
  const navigate = useAppNavigate();
  const basePath = useRoleBasePath();
  const saleOrders = useSelector((state) => state.orders.saleOrders || []);
  const customers = useSelector((state) => state.masters.customers || []);
  const dispatch = useDispatch();
  const saleOrderNewPath = basePath === '/ho' ? '/orders/sale-order/new' : '/orders/new';
  const getSaleOrderEditPath = (orderId) => (
    basePath === '/ho' ? `/orders/sale-order/${orderId}/edit` : `/orders/${orderId}/edit`
  );
  const pageTitle = basePath === '/ho' ? 'Sale Order' : 'Sale Orders';

  useEffect(() => {
    dispatch(fetchSaleOrders());
    dispatch(fetchMasters('customers'));
  }, [dispatch]);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const customerMap = useMemo(
    () =>
      (customers || []).reduce((acc, c) => {
        acc[c.id] = c.customerName || c.name;
        return acc;
      }, {}),
    [customers],
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return saleOrders.filter((row) => {
      const customerName = (row.customerName || customerMap[row.customerId] || '').toLowerCase();
      const matchesSearch =
        query === '' ||
        (row.orderNumber || '').toLowerCase().includes(query) ||
        customerName.includes(query);
      const matchesStatus =
        statusFilter === 'all' ? true : String(row.status || '').toLowerCase() === statusFilter;
      const matchesDateFrom = dateFrom ? (row.date || '') >= dateFrom : true;
      const matchesDateTo = dateTo ? (row.date || '') <= dateTo : true;
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [saleOrders, searchText, customerMap, statusFilter, dateFrom, dateTo]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
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
              Manage wholesale sale orders from confirmation to delivery.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate(saleOrderNewPath)}
          >
            New Sale Order
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search by order no or customer"
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
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setPage(0);
              setStatusFilter(e.target.value);
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="packed">Packed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFrom}
            onChange={(e) => {
              setPage(0);
              setDateFrom(e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateTo}
            onChange={(e) => {
              setPage(0);
              setDateTo(e.target.value);
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
                  <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Net Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.orderNumber}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.customerName || customerMap[row.customerId] || '-'}</TableCell>
                    <TableCell align="right">{row.totals?.totalQuantity ?? 0}</TableCell>
                    <TableCell align="right">{Number(row.totals?.netAmount ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <OrderStatusChip status={row.status} />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(getSaleOrderEditPath(row.id))}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
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
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </>
      ) : (
        <Box sx={{ py: 7, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            No sale orders found.
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Create your first sale order to begin the wholesale order flow.
          </Typography>
          <Button variant="contained" onClick={() => navigate(saleOrderNewPath)}>
            New Sale Order
          </Button>
        </Box>
      )}
    </Paper>
  );
}

function OrderStatusChip({ status }) {
  const n = String(status || '').toLowerCase();
  const color =
    n === 'packed'
      ? 'success'
      : n === 'confirmed'
        ? 'info'
        : n === 'cancelled'
          ? 'error'
          : 'default';
  return <Chip size="small" color={color} variant="outlined" label={status || 'Pending'} />;
}

export default SaleOrderListPage;
