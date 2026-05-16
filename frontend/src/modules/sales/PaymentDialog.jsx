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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { IconButton } from '@mui/material';

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Gift Voucher'];

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

function PaymentDialog({ open, onClose, totals, onComplete, store, customer, isEditMode = false }) {
  const netAmount = totals?.netPayable || 0;
  const onConfirm = onComplete; // Alias for internal use
  const [payments, setPayments] = useState([{ mode: 'Cash', amount: '' }]);

  useEffect(() => {
    if (!open) return;
    setPayments([{ mode: 'Cash', amount: String(Number(netAmount || 0).toFixed(2)) }]);
  }, [netAmount, open]);

  const computedAmountPaid = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const dueAmount = Math.max(Number(netAmount) - computedAmountPaid, 0);
  const changeReturned = Math.max(computedAmountPaid - Number(netAmount), 0);
  const paymentStatus = dueAmount > 0 ? 'Partial' : 'Paid';

  const handleConfirm = () => {
    onConfirm({
      method: payments[0]?.mode === 'Gift Voucher' ? 'GIFT_VOUCHER' : payments[0]?.mode?.toUpperCase() || 'CASH',
      payments: payments.map(p => ({
        mode: p.mode === 'Gift Voucher' ? 'GIFT_VOUCHER' : p.mode.toUpperCase(),
        amount: toNumber(p.amount)
      })),
      amountPaid: computedAmountPaid,
      changeReturned,
      dueAmount,
      status: paymentStatus,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Process Payment</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                Net Payable
              </Typography>
              <Typography variant="h6" sx={{ color: "#0f172a", fontWeight: 800 }}>
                ₹{Number(netAmount || 0).toFixed(2)}
              </Typography>
              {customer && (
                <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600 }}>
                  Customer: {customer.name} ({customer.mobile})
                </Typography>
              )}
              {store && (
                <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600 }}>
                  Store: {store.name}
                </Typography>
              )}
            </Box>

            {/* Multi-payment list below */}
          </Stack>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
            Payments
          </Typography>
          {payments.map((p, index) => (
            <Stack direction="row" spacing={1} key={index} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={p.mode}
                  onChange={(e) => {
                    const next = [...payments];
                    next[index].mode = e.target.value;
                    setPayments(next);
                  }}
                >
                  {PAYMENT_MODES.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Amount"
                type="number"
                value={p.amount}
                onChange={(e) => {
                  const next = [...payments];
                  next[index].amount = e.target.value;
                  setPayments(next);
                }}
                sx={{ flexGrow: 1 }}
              />
              {payments.length > 1 && (
                <IconButton color="error" onClick={() => setPayments(payments.filter((_, i) => i !== index))}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          ))}
          <Button
            variant="outlined"
            size="small"
            onClick={() => setPayments([...payments, { mode: 'Cash', amount: '' }])}
            sx={{ alignSelf: 'flex-start' }}
          >
            Add Payment Mode
          </Button>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
          {isEditMode ? 'Save & Update Bill' : 'Confirm Payment'}
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
