import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { updateLoyaltyConfig } from './customersSlice';
import { useEffect, useState } from 'react';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function LoyaltyConfigPage() {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.customerRewards.loyaltyConfig);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      earnRate: 1,
      earnPerAmount: 100,
      minRedeemPoints: 100,
      pointValue: 1,
      expiryPeriodDays: 365,
      status: 'Active',
    },
  });

  useEffect(() => {
    reset({
      earnRate: config?.earnRate ?? 1,
      earnPerAmount: config?.earnPerAmount ?? 100,
      minRedeemPoints: config?.minRedeemPoints ?? 100,
      pointValue: config?.pointValue ?? 1,
      expiryPeriodDays: config?.expiryPeriodDays ?? 365,
      status: config?.status ?? 'Active',
    });
  }, [config, reset]);

  const onSubmit = (values) => {
    setFormError('');
    setSuccess(false);
    const earnRate = toNum(values.earnRate);
    const earnPerAmount = toNum(values.earnPerAmount);
    const minRedeem = toNum(values.minRedeemPoints);
    const pointVal = toNum(values.pointValue);
    const expiryDays = toNum(values.expiryPeriodDays);

    if (earnRate < 0 || earnPerAmount <= 0) {
      setFormError('Earn rate and earn per amount must be positive.');
      return;
    }
    if (minRedeem < 0) {
      setFormError('Minimum redeem points cannot be negative.');
      return;
    }
    if (pointVal < 0) {
      setFormError('Point value cannot be negative.');
      return;
    }
    if (expiryDays < 0) {
      setFormError('Expiry period cannot be negative.');
      return;
    }

    dispatch(
      updateLoyaltyConfig({
        earnRate,
        earnPerAmount,
        minRedeemPoints: minRedeem,
        pointValue: pointVal,
        expiryPeriodDays: expiryDays,
        status: values.status,
      }),
    );
    setSuccess(true);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          Loyalty Configuration
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Define how customers earn and redeem loyalty points.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Points Earn Rate"
              helperText="Points earned per unit amount spent"
              {...register('earnRate', { required: 'Required', min: 0 })}
              error={Boolean(errors.earnRate)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Per Amount (₹)"
              helperText="e.g., 1 point per ₹100 spent"
              {...register('earnPerAmount', { required: 'Required', min: 1 })}
              error={Boolean(errors.earnPerAmount)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Minimum Points for Redemption"
              helperText="Points required before customer can redeem"
              {...register('minRedeemPoints', { required: 'Required', min: 0 })}
              error={Boolean(errors.minRedeemPoints)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Point Value (₹)"
              helperText="e.g., 1 point = ₹1"
              {...register('pointValue', { required: 'Required', min: 0 })}
              error={Boolean(errors.pointValue)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Expiry Period (days)"
              helperText="Optional: 0 = no expiry"
              {...register('expiryPeriodDays', { min: 0 })}
              error={Boolean(errors.expiryPeriodDays)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              select
              label="Status"
              {...register('status')}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {formError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Loyalty configuration saved successfully.
          </Alert>
        )}

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
            Save Configuration
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default LoyaltyConfigPage;
