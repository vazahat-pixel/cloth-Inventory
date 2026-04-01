import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { fetchBankPayments, fetchBankReceipts } from './accountsSlice';
import { fetchMasters } from '../masters/mastersSlice';

function BankPaymentListPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const bankPayments = useSelector((state) => state.accounts.bankPayments) || [];
  const suppliers = useSelector((state) => state.masters.suppliers) || [];
  const banks = useSelector((state) => state.masters.banks) || [];

  useEffect(() => {
    dispatch(fetchBankPayments());
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchMasters('banks'));
  }, [dispatch]);

  const enrichedPayments = useMemo(() => {
    return bankPayments.map((pmt) => {
      // Backend returns populated objects or IDs. Handle both.
      const sObj = typeof pmt.supplierId === 'object' ? pmt.supplierId : {};
      const bObj = typeof pmt.bankId === 'object' ? pmt.bankId : {};

      // Local lookup as fallback if backend didn't populate
      const localSupplier = !sObj.name ? (suppliers.find(s => (s.id || s._id) === pmt.supplierId) || {}) : {};
      const localBank = !bObj.name ? (banks.find(b => (b.id || b._id) === pmt.bankId) || {}) : {};

      return {
        ...pmt,
        supplierName: sObj.name || localSupplier.supplierName || 'Unknown Supplier',
        bankName: bObj.name || localBank.bankName || 'Direct',
      };
    });
  }, [bankPayments, suppliers, banks]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Payment Register (Supplier)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            History of all bank and cash settlements made to suppliers.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/ho/accounts/bank-payment')}
          sx={{ borderRadius: 2 }}
        >
          Record New Payment
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reference No / Cheque</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bank / Cash</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Amount Paid</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrichedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                  No historical payments found. Start by recording a new payment.
                </TableCell>
              </TableRow>
            ) : (
              enrichedPayments.map((pmt) => (
                <TableRow key={pmt._id || pmt.id} hover>
                  <TableCell>{pmt.date ? new Date(pmt.date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{pmt.chequeNo || 'TRX-' + (pmt._id || pmt.id).slice(-6)}</Typography>
                  </TableCell>
                  <TableCell>{pmt.supplierName}</TableCell>
                  <TableCell>{pmt.bankName}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{pmt.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label="SUCCESS" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<DescriptionOutlinedIcon />} sx={{ color: '#6366f1' }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default BankPaymentListPage;
