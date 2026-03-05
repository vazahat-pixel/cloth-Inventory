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

function PaymentDialog({ open, onClose, netAmount, onConfirm }) {
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    if (!open) return;
    setPaymentMode('Cash');
    setAmountPaid(String(netAmount || ''));
  }, [netAmount, open]);

  const computedAmountPaid = toNumber(amountPaid);
  const dueAmount = Math.max(Number(netAmount) - computedAmountPaid, 0);
  const changeReturned = Math.max(computedAmountPaid - Number(netAmount), 0);
  const paymentStatus = dueAmount > 0 ? 'Partial' : 'Paid';

  const handleConfirm = () => {
    onConfirm({
      method: paymentMode.toUpperCase(), // Map to Backend Enum
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
            </Box>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="payment-mode-label">Payment Mode</InputLabel>
              <Select
                labelId="payment-mode-label"
                value={paymentMode}
                label="Payment Mode"
                onChange={(event) => setPaymentMode(event.target.value)}
              >
                {PAYMENT_MODES.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {mode}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <TextField
            fullWidth
            size="small"
            label="Amount Paid"
            type="number"
            value={amountPaid}
            onChange={(event) => setAmountPaid(event.target.value)}
          />

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
