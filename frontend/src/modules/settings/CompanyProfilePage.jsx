import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

function CompanyProfilePage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      // Identity
      legalName: '',
      gstin: '',
      pan: '',
      phone: '',
      email: '',
      logo: '',
      address: { address: '', city: '', state: '', pincode: '' },
      
      // Invoicing
      invoicePrefix: '',
      dcPrefix: '',
      purchasePrefix: '',
      termsAndConditions: '',
      declaration: '',
      
      // Bank
      bankDetails: {
        bankName: '',
        accountNo: '',
        ifsc: '',
        branch: ''
      }
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [compRes, invRes] = await Promise.all([
          api.get('/settings/company'),
          api.get('/settings/invoicing')
        ]);

        const comp = compRes.data?.company || {};
        const inv = invRes.data?.config || {};

        reset({
          legalName: comp.legalName || '',
          gstin: comp.gstin || '',
          pan: comp.pan || '',
          phone: comp.phone || '',
          email: comp.email || '',
          logo: comp.logo || '',
          address: comp.address || { address: '', city: '', state: '', pincode: '' },
          
          invoicePrefix: inv.invoicePrefix || '',
          dcPrefix: inv.dcPrefix || '',
          purchasePrefix: inv.purchasePrefix || '',
          termsAndConditions: inv.termsAndConditions || '',
          declaration: inv.declaration || '',
          bankDetails: inv.bankDetails || { bankName: '', accountNo: '', ifsc: '', branch: '' }
        });
      } catch (err) {
        setErrorMsg('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Split values back into relevant keys
      const companyPayload = {
        legalName: values.legalName,
        gstin: values.gstin,
        pan: values.pan,
        phone: values.phone,
        email: values.email,
        logo: values.logo,
        address: values.address
      };

      const invoicingPayload = {
        invoicePrefix: values.invoicePrefix,
        dcPrefix: values.dcPrefix,
        purchasePrefix: values.purchasePrefix,
        termsAndConditions: values.termsAndConditions,
        declaration: values.declaration,
        bankDetails: values.bankDetails
      };

      await Promise.all([
        api.patch('/settings/company', companyPayload),
        api.patch('/settings/invoicing', invoicingPayload)
      ]);

      // Sync with Primary Warehouse for document system consistency
      try {
        const whRes = await api.get('/warehouses/primary');
        const primaryWh = whRes.data?.warehouse || whRes.data?.data?.warehouse;
        if (primaryWh) {
          await api.patch(`/warehouses/${primaryWh._id}`, {
            name: values.legalName,
            gstNumber: values.gstin,
            contactPhone: values.phone,
            email: values.email,
            location: values.address
          });
        }
      } catch (whErr) {
        console.warn('Sync with warehouse failed, but settings saved.');
      }

      setSuccessMsg('All HO Settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            Head Office Configuration
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>
            Manage your global company profile, document prefixes, and legal terms.
          </Typography>
        </Box>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained" 
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
          disabled={saving}
          sx={{ 
            px: 4, py: 1.2, fontWeight: 800, borderRadius: 2.5,
            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
            textTransform: 'none'
          }}
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>{errorMsg}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={tab} 
          onChange={(e, v) => setTab(v)}
          sx={{ 
            bgcolor: '#f8fafc', 
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
          }}
        >
          <Tab icon={<BusinessOutlinedIcon fontSize="small" />} iconPosition="start" label="Company Identity" sx={{ fontWeight: 700, py: 2 }} />
          <Tab icon={<ReceiptLongOutlinedIcon fontSize="small" />} iconPosition="start" label="Invoicing & Docs" sx={{ fontWeight: 700, py: 2 }} />
          <Tab icon={<AccountBalanceOutlinedIcon fontSize="small" />} iconPosition="start" label="Bank Details" sx={{ fontWeight: 700, py: 2 }} />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* TAB 0: IDENTITY */}
            {tab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>Basic Information</Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Legal Entity Name *" {...register('legalName', { required: true })} placeholder="REBEL MASS EXPORT PVT LTD" />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label="GSTIN Number" {...register('gstin')} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label="PAN Number" {...register('pan')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Contact Phone" {...register('phone')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Contact Email" {...register('email')} />
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>Registered Address</Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Street Address" {...register('address.address')} multiline rows={2} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="City" {...register('address.city')} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="State" {...register('address.state')} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Pincode" {...register('address.pincode')} />
                </Grid>
              </Grid>
            )}

            {/* TAB 1: INVOICING */}
            {tab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>Document Prefixes</Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Sales Invoice Prefix" {...register('invoicePrefix')} helperText="e.g. REB/ " />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Delivery Challan Prefix" {...register('dcPrefix')} helperText="e.g. DC/ " />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Purchase Prefix" {...register('purchasePrefix')} />
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>Invoicing Statutory Terms</Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Default Declaration" {...register('declaration')} multiline rows={2} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Terms & Conditions" {...register('termsAndConditions')} multiline rows={5} helperText="Enter one term per line" />
                </Grid>
              </Grid>
            )}

            {/* TAB 2: BANK */}
            {tab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>Bank Details (For Invoices)</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>These details will be printed on your tax invoices for client payments.</Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Bank Name" {...register('bankDetails.bankName')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Account Number" {...register('bankDetails.accountNo')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="IFSC Code" {...register('bankDetails.ifsc')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Branch Name" {...register('bankDetails.branch')} />
                </Grid>
              </Grid>
            )}
          </form>
        </Box>
      </Paper>
    </Box>
  );
}

export default CompanyProfilePage;
