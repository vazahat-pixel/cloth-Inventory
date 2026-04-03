import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Autocomplete,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import { useNavigate } from 'react-router-dom';

function AccessoryDirectEntryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [masters, setMasters] = useState({ brands: [], categories: [], warehouses: [] });
  const [form, setForm] = useState({
    itemCode: '',
    itemName: '',
    brandId: null,
    categoryId: null,
    warehouseId: null,
    variants: [{ size: 'NA', color: '', costPrice: 0, salePrice: 0, mrp: 0, initialQty: 1 }],
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [b, c, w] = await Promise.all([
          api.get('/brands'),
          api.get('/groups?type=Category'),
          api.get('/warehouses'),
        ]);
        setMasters({
          brands: b.data.data || [],
          categories: c.data.data || [],
          warehouses: w.data.warehouses || w.data.data || [],
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchMasters();
  }, []);

  const addVariant = () => {
    setForm({
      ...form,
      variants: [...form.variants, { size: '', color: '', costPrice: 0, salePrice: 0, mrp: 0, initialQty: 0 }],
    });
  };

  const removeVariant = (index) => {
    const v = [...form.variants];
    v.splice(index, 1);
    setForm({ ...form, variants: v });
  };

  const updateVariant = (index, field, value) => {
    const v = [...form.variants];
    v[index][field] = value;
    setForm({ ...form, variants: v });
  };

  const handleSubmit = async () => {
    if (!form.itemCode || !form.itemName || !form.warehouseId) {
        setError('Please fill Item Code, Name and Warehouse');
        return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/items/accessory/direct-entry', form);
      setSuccess('Accessory stock added and item created successfully!');
      setTimeout(() => navigate('/inventory'), 2000);
    } catch (e) {
      setError(e.response?.data?.message || 'Accessory entry failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Direct Accessory Inward"
        subtitle="Manual entry for non-production items (Ties, Belts, etc.)"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Accessory Inward', active: true }]}
      />

      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>ITEM BASIC DETAILS</Typography>
              <TextField
                fullWidth
                label="Accessory Code (Primary SKU)"
                value={form.itemCode}
                onChange={(e) => setForm({ ...form, itemCode: e.target.value.toUpperCase() })}
                placeholder="e.g. TIE-MAROON-01"
              />
              <TextField
                fullWidth
                label="Accessory Name"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                placeholder="e.g. Silk Maroon Tie"
              />
              <Stack direction="row" spacing={2}>
                <Autocomplete
                  fullWidth
                  options={masters.brands}
                  getOptionLabel={(o) => o.name || o.brandName || ''}
                  onChange={(_, v) => setForm({ ...form, brandId: v?._id })}
                  renderInput={(p) => <TextField {...p} label="Brand" />}
                />
                <Autocomplete
                  fullWidth
                  options={masters.categories}
                  getOptionLabel={(o) => o.name || ''}
                  onChange={(_, v) => setForm({ ...form, categoryId: v?._id })}
                  renderInput={(p) => <TextField {...p} label="Category" />}
                />
              </Stack>
               <Autocomplete
                  fullWidth
                  options={masters.warehouses}
                  getOptionLabel={(o) => o.name || ''}
                  onChange={(_, v) => setForm({ ...form, warehouseId: v?._id })}
                  renderInput={(p) => <TextField {...p} label="Target Warehouse / Room" />}
                />
            </Stack>
          </Grid>

          <Grid item xs={12} md={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>STOCK & PRICING MATRIX</Typography>
              <Button startIcon={<AddIcon />} onClick={addVariant} variant="outlined" size="small">Add Variant</Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cost</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Sale Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>MRP</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Inward Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.variants.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <TextField size="small" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} sx={{ width: 80 }} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" type="number" value={v.costPrice} onChange={(e) => updateVariant(i, 'costPrice', e.target.value)} sx={{ width: 100 }} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" type="number" value={v.salePrice} onChange={(e) => updateVariant(i, 'salePrice', e.target.value)} sx={{ width: 100 }} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" type="number" value={v.mrp} onChange={(e) => updateVariant(i, 'mrp', e.target.value)} sx={{ width: 100 }} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" type="number" value={v.initialQty} onChange={(e) => updateVariant(i, 'initialQty', e.target.value)} sx={{ width: 80 }} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => removeVariant(i)} disabled={form.variants.length === 1}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={loading}
              sx={{ py: 1.5, borderRadius: 2, bgcolor: '#0f172a' }}
            >
              FINALIZE & ADD STOCK
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default AccessoryDirectEntryPage;
