import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { updatePurchaseVoucherConfig, fetchPurchaseVoucherConfig } from './settingsSlice';

function PurchaseVoucherConfigPage() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchPurchaseVoucherConfig());
  }, [dispatch]);
  const config = useSelector((state) => state.settings.purchaseVoucherConfig);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      carryForwardPackSize: true,
      defaultTaxPercent: 12,
      gstSlabEnabled: true,
      gstSlabThreshold: 1000,
      belowThresholdTax: 5,
      aboveThresholdTax: 12,
    },
  });

  const carryForwardPackSize = watch('carryForwardPackSize');
  const gstSlabEnabled = watch('gstSlabEnabled');

  useEffect(() => {
    if (config) {
      reset({
        carryForwardPackSize: config.carryForwardPackSize ?? true,
        defaultTaxPercent: config.defaultTaxPercent ?? 12,
        gstSlabEnabled: config.gstSlabEnabled ?? true,
        gstSlabThreshold: config.gstSlabThreshold ?? 1000,
        belowThresholdTax: config.belowThresholdTax ?? 5,
        aboveThresholdTax: config.aboveThresholdTax ?? 12,
      });
    }
  }, [config, reset]);

  const onSubmit = (values) => {
    dispatch(updatePurchaseVoucherConfig({
      carryForwardPackSize: values.carryForwardPackSize,
      defaultTaxPercent: Number(values.defaultTaxPercent) || 12,
      gstSlabEnabled: values.gstSlabEnabled,
      gstSlabThreshold: Number(values.gstSlabThreshold) || 1000,
      belowThresholdTax: Number(values.belowThresholdTax) || 5,
      aboveThresholdTax: Number(values.aboveThresholdTax) || 12,
    }));
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Purchase Voucher Config
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Configure purchase entry behavior: carry forward pack size, default tax, and GST slab by value.
          </Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={carryForwardPackSize}
                    onChange={(e) => setValue('carryForwardPackSize', e.target.checked)}
                  />
                }
                label="Carry Forward Pack Size (Enter to auto-add next size of same item)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Default Tax %"
                {...register('defaultTaxPercent', { valueAsNumber: true })}
                helperText="Used when GST slab is disabled"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={gstSlabEnabled}
                    onChange={(e) => setValue('gstSlabEnabled', e.target.checked)}
                  />
                }
                label="GST Slab by Value (e.g. 5% below ₹1000, 12% above)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="GST Slab Threshold (₹)"
                {...register('gstSlabThreshold', { valueAsNumber: true })}
                helperText="Rate below this uses lower tax %"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Tax % (Below Threshold)"
                {...register('belowThresholdTax', { valueAsNumber: true })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Tax % (Above Threshold)"
                {...register('aboveThresholdTax', { valueAsNumber: true })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
                Save
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Paper>
  );
}

export default PurchaseVoucherConfigPage;
