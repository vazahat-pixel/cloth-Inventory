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
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warehouseId, setWarehouseId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      code: '',
      contactPerson: '',
      contactPhone: '',
      email: '',
      gstNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  useEffect(() => {
    const fetchPrimaryWarehouse = async () => {
      try {
        // Use dedicated primary warehouse endpoint
        const res = await api.get('/warehouses/primary');
        const primary = res.data?.warehouse || res.data?.data?.warehouse;
        
        if (primary) {
          setWarehouseId(primary._id);
          reset({
            name: primary.name || '',
            code: primary.code || '',
            contactPerson: primary.contactPerson || '',
            contactPhone: primary.contactPhone || '',
            email: primary.email || '',
            gstNumber: primary.gstNumber || '',
            address: primary.location?.address || '',
            city: primary.location?.city || '',
            state: primary.location?.state || '',
            pincode: primary.location?.pincode || '',
          });
        }
      } catch (err) {
        setErrorMsg('Failed to load warehouse details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPrimaryWarehouse();
  }, [reset]);

  const onSubmit = async (values) => {
    if (!warehouseId) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.patch(`/warehouses/${warehouseId}`, {
        name: values.name,
        code: values.code,
        contactPerson: values.contactPerson,
        contactPhone: values.contactPhone,
        email: values.email,
        gstNumber: values.gstNumber || null,
        location: {
          address: values.address,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
        },
      });
      setSuccessMsg('Warehouse details updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarehouseOutlinedIcon sx={{ color: '#6366f1', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Warehouse Settings
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>
              Update the details of your primary warehouse. These reflect in dispatches, GRNs, and invoice shipping addresses.
            </Typography>
          </Box>
        </Box>

        {successMsg && <Alert severity="success" sx={{ borderRadius: 2 }}>{successMsg}</Alert>}
        {errorMsg && <Alert severity="error" sx={{ borderRadius: 2 }}>{errorMsg}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Identity */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
                  Warehouse Identity
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth size="small" label="Warehouse Name *"
                {...register('name', { required: true })}
                helperText='e.g. "Main Warehouse (HO)"'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth size="small" label="Warehouse Code"
                {...register('code')}
                helperText='e.g. "WH-001"'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth size="small" label="GST Number"
                {...register('gstNumber')}
                placeholder="29AAAAP0267H1ZK"
              />
            </Grid>

            {/* Contact */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1, mb: 1, mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
                  Contact Details
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth size="small" label="Contact Person *"
                {...register('contactPerson', { required: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth size="small" label="Contact Phone *"
                {...register('contactPhone', { required: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth size="small" type="email" label="Email Address"
                {...register('email')}
              />
            </Grid>

            {/* Address */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1, mb: 1, mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
                  Physical Address
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth size="small" label="Street Address *"
                {...register('address', { required: true })}
                placeholder="123 Business Hub, MG Road"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="City *" {...register('city', { required: true })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="State *" {...register('state', { required: true })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Pincode" {...register('pincode')} />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Button
                type="submit" variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                disabled={saving}
                sx={{ 
                  px: 5, 
                  py: 1.2,
                  fontWeight: 800, 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Paper>
  );
}

export default CompanyProfilePage;
