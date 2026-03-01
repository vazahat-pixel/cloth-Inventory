import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Gift Voucher', 'Split'];

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

function PaymentDialog({ open, onClose, netAmount, onConfirm, vouchers = [] }) {
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [splitValues, setSplitValues] = useState({
    cash: '',
    card: '',
    upi: '',
  });
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setPaymentMode('Cash');
    setAmountPaid(String(netAmount || ''));
    setSplitValues({ cash: '', card: '', upi: '' });
    setVoucherCode('');
    setAppliedVoucher(null);
    setVoucherError('');
  }, [netAmount, open]);

  const voucherAmount = toNumber(appliedVoucher?.amount);
  const netAfterVoucher = Math.max(Number(netAmount) - voucherAmount, 0);

  const computedAmountPaid = useMemo(() => {
    if (paymentMode === 'Split') {
      return (
        toNumber(splitValues.cash) + toNumber(splitValues.card) + toNumber(splitValues.upi)
      );
    }

    return toNumber(amountPaid);
  }, [amountPaid, paymentMode, splitValues.card, splitValues.cash, splitValues.upi]);

  const amountToPay = paymentMode === 'Gift Voucher' ? netAfterVoucher : Number(netAmount);
  const dueAmount = Math.max(amountToPay - computedAmountPaid, 0);
  const changeReturned = Math.max(computedAmountPaid - amountToPay, 0);
  const paymentStatus = dueAmount > 0 ? 'Partial' : 'Paid';

  const handleApplyVoucher = () => {
    setVoucherError('');
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError('Enter voucher code.');
      return;
    }
    const voucher = vouchers.find((v) => v.code?.toUpperCase() === code);
    if (!voucher) {
      setVoucherError('Invalid voucher code.');
      return;
    }
    if (String(voucher.status).toLowerCase() !== 'active') {
      setVoucherError('Voucher is already used or expired.');
      return;
    }
    if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
      setVoucherError('Voucher has expired.');
      return;
    }
    setAppliedVoucher(voucher);
    setVoucherError('');
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  const handleConfirm = () => {
    if (paymentMode === 'Gift Voucher' && !appliedVoucher) {
      setVoucherError('Apply a gift voucher first.');
      return;
    }
    onConfirm({
      mode: paymentMode,
      split:
        paymentMode === 'Split'
          ? {
              cash: toNumber(splitValues.cash),
              card: toNumber(splitValues.card),
              upi: toNumber(splitValues.upi),
            }
          : null,
      amountPaid: computedAmountPaid,
      changeReturned,
      dueAmount,
      status: paymentStatus,
      voucherUsed: paymentMode === 'Gift Voucher' ? appliedVoucher : null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Process Payment</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                Net Payable
              </Typography>
              <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800 }}>
                ₹{Number(netAmount || 0).toFixed(2)}
              </Typography>
              {appliedVoucher && (
                <Typography variant="caption" sx={{ color: '#059669', display: 'block', mt: 0.5 }}>
                  - ₹{voucherAmount.toFixed(2)} Gift Voucher ({appliedVoucher.code})
                </Typography>
              )}
              {appliedVoucher && (
                <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700, mt: 0.5 }}>
                  Amount to pay: ₹{netAfterVoucher.toFixed(2)}
                </Typography>
              )}
            </Box>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="payment-mode-label">Payment Mode</InputLabel>
              <Select
                labelId="payment-mode-label"
                value={paymentMode}
                label="Payment Mode"
                onChange={(event) => {
                  setPaymentMode(event.target.value);
                  if (event.target.value !== 'Gift Voucher') {
                    setAppliedVoucher(null);
                    setVoucherCode('');
                    setVoucherError('');
                  }
                }}
              >
                {PAYMENT_MODES.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {mode}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {paymentMode === 'Gift Voucher' && (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                fullWidth
                size="small"
                label="Gift Voucher Code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                error={Boolean(voucherError)}
                helperText={voucherError}
              />
              {appliedVoucher ? (
                <Button color="error" onClick={handleRemoveVoucher} sx={{ mt: 0.5 }}>
                  Remove
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<CardGiftcardIcon />}
                  onClick={handleApplyVoucher}
                  sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
                >
                  Apply
                </Button>
              )}
            </Stack>
          )}

          {paymentMode === 'Split' ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Cash"
                type="number"
                value={splitValues.cash}
                onChange={(event) =>
                  setSplitValues((previous) => ({ ...previous, cash: event.target.value }))
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Card"
                type="number"
                value={splitValues.card}
                onChange={(event) =>
                  setSplitValues((previous) => ({ ...previous, card: event.target.value }))
                }
              />
              <TextField
                fullWidth
                size="small"
                label="UPI"
                type="number"
                value={splitValues.upi}
                onChange={(event) =>
                  setSplitValues((previous) => ({ ...previous, upi: event.target.value }))
                }
              />
            </Stack>
          ) : (
            <TextField
              fullWidth
              size="small"
              label="Amount Paid"
              type="number"
              value={amountPaid}
              onChange={(event) => setAmountPaid(event.target.value)}
            />
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <InfoCard label="Paid" value={computedAmountPaid.toFixed(2)} />
            <InfoCard label="Due" value={dueAmount.toFixed(2)} />
            <InfoCard label="Change" value={changeReturned.toFixed(2)} />
            <InfoCard label="Status" value={paymentStatus} />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Confirm Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InfoCard({ label, value }) {
  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        px: 1.5,
        py: 1,
        minWidth: 100,
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default PaymentDialog;
