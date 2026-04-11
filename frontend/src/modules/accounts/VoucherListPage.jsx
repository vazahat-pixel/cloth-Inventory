import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { fetchVouchers, clearAccountsError } from './accountsSlice';
import VoucherFormDialog from './VoucherFormDialog';

const getVoucherTypeColor = (type) => {
  switch (type) {
    case 'BANK_PAYMENT':
    case 'CASH_PAYMENT':
      return 'error';
    case 'BANK_RECEIPT':
    case 'CASH_RECEIPT':
      return 'success';
    default:
      return 'primary';
  }
};

function VoucherListPage() {
  const dispatch = useDispatch();
  const { vouchers, loading, error } = useSelector((state) => state.accounts);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchVouchers());
  }, [dispatch]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Accounting Vouchers
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Manage payments, receipts, and journal entries.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          New Voucher
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Voucher No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Party / Account</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vouchers.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                      No vouchers found. Create your first voucher to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vouchers.map((v) => (
                  <TableRow key={v._id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{v.voucherNumber}</TableCell>
                    <TableCell>{new Date(v.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={v.type.replace('_', ' ')}
                        size="small"
                        color={getVoucherTypeColor(v.type)}
                        variant="soft"
                        sx={{ fontWeight: 600, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      {v.entityId?.name || v.entityId?.supplierName || v.entityId?.customerName || 'N/A'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{v.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={v.status}
                        size="small"
                        sx={{
                          backgroundColor: v.status === 'POSTED' ? '#f0fdf4' : '#f8fafc',
                          color: v.status === 'POSTED' ? '#166534' : '#64748b',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <VoucherFormDialog open={openDialog} onClose={() => setOpenDialog(false)} />
    </Box>
  );
}

export default VoucherListPage;
