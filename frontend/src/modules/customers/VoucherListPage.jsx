import { useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
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
import RedeemIcon from '@mui/icons-material/Redeem';
import { redeemVoucher } from './customersSlice';

const STATUS_COLORS = {
  Active: 'success',
  Redeemed: 'info',
  Expired: 'default',
};

function VoucherListPage() {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const vouchers = useSelector((state) => state.customerRewards.vouchers);
  const customers = useSelector((state) => state.masters.customers);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [redeemDialog, setRedeemDialog] = useState(null);

  const customerMap = useMemo(
    () => customers.reduce((acc, c) => ({ ...acc, [c.id]: c.customerName }), [customers]),
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return vouchers.filter((row) => {
      const matchesSearch =
        !query ||
        row.code.toLowerCase().includes(query) ||
        (customerMap[row.customerId] || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vouchers, searchText, statusFilter, customerMap]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleRedeemClick = (voucher) => {
    if (voucher.status !== 'Active') return;
    setRedeemDialog(voucher);
  };

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
                Gift Vouchers
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Issue and manage gift vouchers, track redemption status.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/customers/vouchers/new')}
            >
              Issue Voucher
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
              placeholder="Search by code or customer"
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
              SelectProps={{ native: true }}
            >
              <option value="all">All</option>
              <option value="Active">Active</option>
              <option value="Redeemed">Redeemed</option>
              <option value="Expired">Expired</option>
            </TextField>
          </Stack>
        </Stack>

        {filteredRows.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Voucher Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Issue Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Redeemed</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        {row.code}
                      </TableCell>
                      <TableCell align="right">₹{Number(row.amount || 0).toFixed(2)}</TableCell>
                      <TableCell>{row.issueDate || '-'}</TableCell>
                      <TableCell>{row.expiryDate || '-'}</TableCell>
                      <TableCell>{customerMap[row.customerId] || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={STATUS_COLORS[row.status] || 'default'}
                          variant="outlined"
                          label={row.status}
                        />
                      </TableCell>
                      <TableCell>
                        {row.status === 'Redeemed' ? (
                          <Typography variant="caption">
                            {row.redeemedDate || '-'}
                            {row.redeemedInvoice ? ` (${row.redeemedInvoice})` : ''}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {row.status === 'Active' && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleRedeemClick(row)}
                            title="Mark as redeemed"
                          >
                            <RedeemIcon fontSize="small" />
                          </IconButton>
                        )}
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
              No vouchers found.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Issue gift vouchers to offer store credit to customers.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/customers/vouchers/new')}>
              Issue Voucher
            </Button>
          </Box>
        )}
      </Paper>

      {redeemDialog && (
        <RedeemVoucherDialog
          open={Boolean(redeemDialog)}
          onClose={() => setRedeemDialog(null)}
          voucher={redeemDialog}
          onRedeem={(payload) => {
            dispatch(redeemVoucher(payload));
            setRedeemDialog(null);
          }}
          customers={customers}
        />
      )}
    </>
  );
}

function RedeemVoucherDialog({ open, onClose, voucher, onRedeem, customers }) {
  const [redeemedDate, setRedeemedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [redeemedInvoice, setRedeemedInvoice] = useState('INV-MOCK-' + Date.now().toString().slice(-6));
  const [customerId, setCustomerId] = useState(voucher?.customerId || '');

  const handleSubmit = () => {
    onRedeem({
      id: voucher.id,
      redeemedDate,
      redeemedInvoice,
      customerId: customerId || undefined,
    });
  };

  if (!open) return null;

  return (
    <Box
      component="div"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0,0,0,0.5)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
      onClick={onClose}
    >
      <Paper
        elevation={4}
        sx={{ maxWidth: 420, width: '100%', p: 3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Redeem Voucher — {voucher?.code}
        </Typography>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="Redeemed Date"
            value={redeemedDate}
            onChange={(e) => setRedeemedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            size="small"
            label="Reference Invoice"
            value={redeemedInvoice}
            onChange={(e) => setRedeemedInvoice(e.target.value)}
          />
          <TextField
            fullWidth
            size="small"
            select
            label="Customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">None</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerName}
              </option>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Mark Redeemed
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default VoucherListPage;
