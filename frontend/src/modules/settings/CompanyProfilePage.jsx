import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { updateCompanyProfile, fetchCompanyProfile } from './settingsSlice';

function CompanyProfilePage() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchCompanyProfile());
  }, [dispatch]);
  const company = useSelector((state) => state.settings.companyProfile);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      businessName: '',
      legalName: '',
      gstin: '',
      pan: '',
      line1: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      financialYearStart: '',
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        businessName: company.businessName || '',
        legalName: company.legalName || '',
        gstin: company.gstin || '',
        pan: company.pan || '',
        line1: company.address?.line1 || '',
        city: company.address?.city || '',
        state: company.address?.state || '',
        pincode: company.address?.pincode || '',
        phone: company.phone || '',
        email: company.email || '',
        financialYearStart: company.financialYearStart || '',
      });
    }
  }, [company, reset]);

  const onSubmit = (values) => {
    dispatch(updateCompanyProfile({
      businessName: values.businessName,
      legalName: values.legalName,
      gstin: values.gstin,
      pan: values.pan,
      address: {
        line1: values.line1,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      },
      phone: values.phone,
      email: values.email,
      financialYearStart: values.financialYearStart,
    }));
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Warehouse Settings
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mt: 1, fontWeight: 500 }}>
            Configure your warehouse identity, address, and GST registration for invoices.
          </Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Business Name" {...register('businessName')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Legal Name" {...register('legalName')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="GSTIN" {...register('gstin')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="PAN" {...register('pan')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Address" {...register('line1')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="City" {...register('city')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="State" {...register('state')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Pincode" {...register('pincode')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Phone" {...register('phone')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="email" label="Email" {...register('email')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Financial Year Start (MM-DD)" {...register('financialYearStart')} placeholder="04-01" />
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

export default CompanyProfilePage;
