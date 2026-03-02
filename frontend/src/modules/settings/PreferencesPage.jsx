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
import { updatePreferences, fetchPreferences } from './settingsSlice';

function PreferencesPage() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchPreferences());
  }, [dispatch]);
  const prefs = useSelector((state) => state.settings.preferences);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      lowStockThreshold: 10,
      qtyDecimals: 2,
      amountDecimals: 2,
      showGstOnInvoice: true,
      autoApplyLoyalty: false,
    },
  });

  const showGstOnInvoice = watch('showGstOnInvoice');
  const autoApplyLoyalty = watch('autoApplyLoyalty');

  useEffect(() => {
    if (prefs) {
      reset({
        currency: prefs.currency || 'INR',
        dateFormat: prefs.dateFormat || 'DD/MM/YYYY',
        timeFormat: prefs.timeFormat || '12h',
        lowStockThreshold: prefs.lowStockThreshold ?? 10,
        qtyDecimals: prefs.qtyDecimals ?? 2,
        amountDecimals: prefs.amountDecimals ?? 2,
        showGstOnInvoice: prefs.showGstOnInvoice ?? true,
        autoApplyLoyalty: prefs.autoApplyLoyalty ?? false,
      });
    }
  }, [prefs, reset]);

  const onSubmit = (values) => {
    dispatch(updatePreferences({
      currency: values.currency,
      dateFormat: values.dateFormat,
      timeFormat: values.timeFormat,
      lowStockThreshold: Number(values.lowStockThreshold) || 10,
      qtyDecimals: Number(values.qtyDecimals) ?? 2,
      amountDecimals: Number(values.amountDecimals) ?? 2,
      showGstOnInvoice: values.showGstOnInvoice,
      autoApplyLoyalty: values.autoApplyLoyalty,
    }));
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Preferences</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            System defaults for currency, dates, decimals, and invoice options.
          </Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Currency" {...register('currency')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Date Format" {...register('dateFormat')} placeholder="DD/MM/YYYY" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" select label="Time Format" {...register('timeFormat')}>
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="number" label="Low Stock Threshold" {...register('lowStockThreshold', { valueAsNumber: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="number" label="Qty Decimals" {...register('qtyDecimals', { valueAsNumber: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="number" label="Amount Decimals" {...register('amountDecimals', { valueAsNumber: true })} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={showGstOnInvoice} onChange={(e) => setValue('showGstOnInvoice', e.target.checked)} />}
                label="Show GST on Invoice"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={autoApplyLoyalty} onChange={(e) => setValue('autoApplyLoyalty', e.target.checked)} />}
                label="Auto Apply Loyalty Points"
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>Save</Button>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Paper>
  );
}

export default PreferencesPage;
