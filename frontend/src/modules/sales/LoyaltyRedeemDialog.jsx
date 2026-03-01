import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function LoyaltyRedeemDialog({ open, onClose, customer, loyaltyConfig, onRedeem }) {
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [error, setError] = useState('');

  const availablePoints = toNum(customer?.loyaltyPoints);
  const pointValue = toNum(loyaltyConfig?.pointValue, 1);
  const minRedeem = toNum(loyaltyConfig?.minRedeemPoints, 1);
  const redeemValue = toNum(pointsToRedeem) * pointValue;

  useEffect(() => {
    if (!open) {
      setPointsToRedeem('');
      setError('');
    }
  }, [open]);

  const handleRedeem = () => {
    setError('');
    const pts = toNum(pointsToRedeem);
    if (pts <= 0) {
      setError('Enter points to redeem.');
      return;
    }
    if (pts > availablePoints) {
      setError(`Cannot redeem more than ${availablePoints} available points.`);
      return;
    }
    if (pts < minRedeem) {
      setError(`Minimum ${minRedeem} points required for redemption.`);
      return;
    }
    onRedeem(pts);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>
        Redeem Loyalty Points
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              Customer
            </Typography>
            <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700 }}>
              {customer?.customerName || 'Walk-in'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              Available Points
            </Typography>
            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800 }}>
              {availablePoints}
            </Typography>
          </Box>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Points to Redeem"
            value={pointsToRedeem}
            onChange={(e) => setPointsToRedeem(e.target.value)}
            helperText={`1 point = ₹${pointValue} | Redeem value: ₹${redeemValue.toFixed(2)}`}
            inputProps={{ min: 0, max: availablePoints }}
          />
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<ConfirmationNumberIcon />}
          onClick={handleRedeem}
          disabled={!pointsToRedeem || toNum(pointsToRedeem) <= 0}
        >
          Redeem {pointsToRedeem ? `${pointsToRedeem} pts` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LoyaltyRedeemDialog;
