import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { addBankPayment } from './accountsSlice';
import { getPendingPurchaseBills } from './pendingBillsService';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function BankPaymentPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const banks = useSelector((state) => state.masters.banks) || [];
  const suppliers = useSelector((state) => state.masters.suppliers) || [];
  const purchases = useSelector((state) => state.purchase.records) || [];
  const bankPayments = useSelector((state) => state.accounts.bankPayments) || [];

  const [bankId, setBankId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [chequeNo, setChequeNo] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [allocations, setAllocations] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const pendingBills = useMemo(
    () => getPendingPurchaseBills(purchases, bankPayments, supplierId),
    [purchases, bankPayments, supplierId],
  );

  const totalAllocated = useMemo(
    () => Object.values(allocations).reduce((sum, val) => sum + toNumber(val), 0),
    [allocations],
  );

  const handleBillAllocationChange = (purchaseId, checked, billAmount) => {
    setAllocations((prev) => {
      const next = { ...prev };
      if (checked) {
        next[purchaseId] = billAmount;
      } else {
        delete next[purchaseId];
      }
      return next;
    });
  };

  const handleAllocationAmountChange = (purchaseId, value) => {
    const num = toNumber(value, 0);
    setAllocations((prev) => ({ ...prev, [purchaseId]: num }));
  };

  const handleSave = () => {
    setErrorMessage('');
    if (!bankId) {
      setErrorMessage('Select bank account.');
      return;
    }
    if (!supplierId) {
      setErrorMessage('Select supplier.');
      return;
    }
    const amt = toNumber(amount);
    if (amt <= 0) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    if (totalAllocated > amt) {
      setErrorMessage('Allocated amount cannot exceed payment amount.');
      return;
    }

    const allocatedBills = Object.entries(allocations)
      .filter(([, v]) => toNumber(v) > 0)
      .map(([purchaseId, allocated]) => {
        const bill = pendingBills.find((b) => b.purchaseId === purchaseId);
        return {
          purchaseId,
          billNumber: bill?.billNumber || '',
          amount: bill?.netAmount || 0,
          allocated: toNumber(allocated),
        };
      });

    dispatch(
      addBankPayment({
        bankId,
        supplierId,
        date,
        chequeNo: chequeNo.trim(),
        amount: amt,
        narration: narration.trim(),
        allocatedBills,
      }),
    );
    navigate('/accounts');
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/accounts')}
          sx={{ color: '#64748b' }}
        >
          Back
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Bank Payment
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Record supplier cheque payment and allocate against pending purchase bills.
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={2} sx={{ maxWidth: 500, mb: 3 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Bank Account"
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            required
          >
            <MenuItem value="">Select bank</MenuItem>
            {banks.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.bankName} - {b.accountNumber}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            size="small"
            label="Supplier"
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              setAllocations({});
            }}
            required
          >
            <MenuItem value="">Select supplier</MenuItem>
            {suppliers.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.supplierName}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              size="small"
              label="Cheque No"
              value={chequeNo}
              onChange={(e) => setChequeNo(e.target.value)}
              fullWidth
            />
          </Stack>
          <TextField
            size="small"
            type="number"
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            required
          />
          <TextField
            size="small"
            label="Narration"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </Stack>

        {supplierId && pendingBills.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              Pending Purchase Bills – Allocate Payment
            </Typography>
            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Allocate</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bill No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Pending</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingBills.map((bill) => (
                    <TableRow key={bill.purchaseId}>
                      <TableCell>
                        <Checkbox
                          size="small"
                          checked={bill.purchaseId in allocations}
                          onChange={(e) =>
                            handleBillAllocationChange(bill.purchaseId, e.target.checked, bill.pendingAmount)
                          }
                        />
                      </TableCell>
                      <TableCell>{bill.billNumber}</TableCell>
                      <TableCell>{bill.billDate}</TableCell>
                      <TableCell align="right">{bill.pendingAmount.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {bill.purchaseId in allocations ? (
                          <TextField
                            size="small"
                            type="number"
                            value={allocations[bill.purchaseId]}
                            onChange={(e) =>
                              handleAllocationAmountChange(bill.purchaseId, e.target.value)
                            }
                            inputProps={{ min: 0, max: bill.pendingAmount, step: 0.01 }}
                            sx={{ width: 100 }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
              Total allocated: {totalAllocated.toFixed(2)} / {toNumber(amount).toFixed(2)}
            </Typography>
          </Box>
        )}

        {supplierId && pendingBills.length === 0 && (
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            No pending purchase bills for this supplier.
          </Typography>
        )}

        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          onClick={handleSave}
        >
          Save Payment
        </Button>
      </Paper>
    </Box>
  );
}

export default BankPaymentPage;
