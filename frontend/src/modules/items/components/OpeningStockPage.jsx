import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Autocomplete,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, IconButton, Alert, CircularProgress, LinearProgress,
  Stack, Divider, InputAdornment, Tooltip, Badge
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import api from '../../../services/api';

const OpeningStockPage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); // { item, variantId, size, color, sku, qty, rate }
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch warehouses on mount
  useEffect(() => {
    api.get('/warehouses').then(res => {
      const list = res.data?.data || res.data?.warehouses || [];
      setWarehouses(list);
      if (list.length === 1) setSelectedWarehouse(list[0]);
    }).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/items', { params: { search: searchQuery, limit: 20 } });
        const resData = res.data?.data || res.data || {};
        const paginationData = resData.items || {};
        setSearchResults(paginationData.items || []);
      } catch {
        setSearchResults([]);
      } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addItemVariant = useCallback((item, variant) => {
    const key = `${item._id}-${variant._id}`;
    const exists = selectedItems.find(s => s.key === key);
    if (exists) return; // already added
    setSelectedItems(prev => [...prev, {
      key,
      itemId: item._id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      brandName: item.brand?.brandName || item.brand?.name || item.brandName || '--',
      variantId: variant._id,
      size: variant.size,
      color: variant.color || item.color || '--',
      sku: variant.sku || variant.barcode || item.itemCode,
      qty: 1,
      rate: variant.mrp || 0,
      hsnCode: item.hsCodeId?.code || item.hsnCode || '--'
    }]);
    setSearchQuery('');
    setSearchResults([]);
  }, [selectedItems]);

  const addAllVariants = useCallback((item) => {
    const newEntries = (item.sizes || []).map(variant => ({
      key: `${item._id}-${variant._id}`,
      itemId: item._id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      brandName: item.brand?.brandName || item.brand?.name || item.brandName || '--',
      variantId: variant._id,
      size: variant.size,
      color: variant.color || item.color || '--',
      sku: variant.sku || variant.barcode || item.itemCode,
      qty: 1,
      rate: variant.mrp || 0,
      hsnCode: item.hsCodeId?.code || item.hsnCode || '--'
    })).filter(e => !selectedItems.find(s => s.key === e.key));
    setSelectedItems(prev => [...prev, ...newEntries]);
    setSearchQuery('');
    setSearchResults([]);
  }, [selectedItems]);

  const removeItem = (key) => setSelectedItems(prev => prev.filter(s => s.key !== key));
  const updateField = (key, field, value) => {
    setSelectedItems(prev => prev.map(s => s.key === key ? { ...s, [field]: value } : s));
  };

  const totalItems = selectedItems.length;
  const totalQty = selectedItems.reduce((s, i) => s + Number(i.qty || 0), 0);
  const totalValue = selectedItems.reduce((s, i) => s + (Number(i.qty || 0) * Number(i.rate || 0)), 0);

  const handlePost = async () => {
    if (!selectedWarehouse) { setError('Please select a warehouse first.'); return; }
    if (selectedItems.length === 0) { setError('Please add at least one item.'); return; }
    const invalidQty = selectedItems.find(s => Number(s.qty) <= 0);
    if (invalidQty) { setError(`Qty must be > 0 for: ${invalidQty.itemName} (${invalidQty.size})`); return; }

    setPosting(true);
    setError('');
    setSuccess('');
    setProgress(10);

    try {
      const payload = {
        grnType: 'OPENING_BALANCE',
        warehouseId: selectedWarehouse._id || selectedWarehouse.id,
        remarks: `Opening Balance — ${new Date().toLocaleDateString('en-IN')}`,
        items: selectedItems.map(s => ({
          itemId: s.itemId,
          variantId: s.variantId,
          sku: s.sku,
          itemName: `${s.itemName} (${s.size})`,
          size: s.size,
          color: s.color,
          uom: 'PCS',
          receivedQty: Number(s.qty),
          costPrice: Number(s.rate)
        }))
      };

      setProgress(40);
      await api.post('/grn', payload);
      setProgress(100);
      setSuccess(`✅ Opening stock posted successfully! ${totalItems} variants, ${totalQty} total units worth ₹${totalValue.toLocaleString('en-IN')} posted to ${selectedWarehouse.name || 'warehouse'}.`);
      setSelectedItems([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to post opening stock');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: 2,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <InventoryIcon sx={{ color: 'white', fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#1e293b">Opening Stock Entry</Typography>
          <Typography variant="body2" color="text.secondary">
            Post existing / old stock into inventory without a purchase order
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 3 }}>
        {/* Left: Item Selection */}
        <Stack spacing={2}>
          {/* Warehouse Select */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <WarehouseIcon sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle2" fontWeight={700}>Select Warehouse *</Typography>
            </Stack>
            <Autocomplete
              options={warehouses}
              getOptionLabel={opt => opt.name || opt.warehouseName || ''}
              value={selectedWarehouse}
              onChange={(_, v) => setSelectedWarehouse(v)}
              renderInput={params => (
                <TextField {...params} placeholder="Choose warehouse..." size="small" variant="outlined" />
              )}
            />
          </Paper>

          {/* Item Search */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Search & Add Items
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by item code, name, or brand..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {searching ? <CircularProgress size={16} /> : <SearchIcon sx={{ color: '#94a3b8' }} />}
                  </InputAdornment>
                )
              }}
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Paper variant="outlined" sx={{ mt: 1, maxHeight: 320, overflow: 'auto', borderRadius: 1.5 }}>
                {searchResults.map(item => (
                  <Box key={item._id} sx={{ p: 1.5, borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="#4f46e5">{item.itemCode}</Typography>
                        <Typography variant="body2">{item.itemName}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip label={item.brand?.brandName || item.brand?.name || item.brandName || '--'} size="small" sx={{ fontSize: '0.65rem' }} />
                          <Chip label={`${item.sizes?.length || 0} variants`} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        </Stack>
                      </Box>
                      <Tooltip title="Add all variants">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => addAllVariants(item)}
                          sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.7rem' }}
                        >
                          Add All
                        </Button>
                      </Tooltip>
                    </Stack>
                    {/* Individual variants */}
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                      {(item.sizes || []).map(v => (
                        <Chip
                          key={v._id}
                          label={`${v.size}${v.color && v.color !== item.color ? ` / ${v.color}` : ''}`}
                          size="small"
                          clickable
                          onClick={() => addItemVariant(item, v)}
                          icon={<AddCircleIcon />}
                          sx={{
                            fontSize: '0.68rem',
                            bgcolor: selectedItems.find(s => s.key === `${item._id}-${v._id}`) ? '#dcfce7' : undefined,
                            borderColor: selectedItems.find(s => s.key === `${item._id}-${v._id}`) ? '#16a34a' : undefined,
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Paper>
            )}
          </Paper>

          {/* Selected Items Table */}
          {selectedItems.length > 0 && (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={700}>
                    Selected Items
                    <Badge badgeContent={selectedItems.length} color="primary" sx={{ ml: 2 }} />
                  </Typography>
                  <Button size="small" color="error" onClick={() => setSelectedItems([])}>Clear All</Button>
                </Stack>
              </Box>
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#f8fafc', fontSize: '0.75rem' } }}>
                      <TableCell>Code</TableCell>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Color</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="center">Qty *</TableCell>
                      <TableCell align="center">Rate (₹)</TableCell>
                      <TableCell align="center">Value</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedItems.map(s => (
                      <TableRow key={s.key} hover>
                        <TableCell sx={{ color: '#6366f1', fontWeight: 700, fontSize: '0.75rem' }}>{s.itemCode}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', maxWidth: 180 }}>
                          <Typography variant="caption" display="block" noWrap>{s.itemName}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.brandName}</Typography>
                        </TableCell>
                        <TableCell><Chip label={s.size} size="small" sx={{ fontSize: '0.65rem' }} /></TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{s.color}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#64748b' }}>{s.sku}</TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={s.qty}
                            onChange={e => updateField(s.key, 'qty', e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'center', width: 60, padding: '4px 6px' } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={s.rate}
                            onChange={e => updateField(s.key, 'rate', e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'center', width: 80, padding: '4px 6px' } }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#059669', fontSize: '0.75rem' }}>
                          ₹{(Number(s.qty) * Number(s.rate)).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => removeItem(s.key)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Stack>

        {/* Right: Summary Panel */}
        <Stack spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              p: 3, borderRadius: 2, position: 'sticky', top: 16,
              background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)'
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Summary</Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Warehouse</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {selectedWarehouse?.name || <span style={{ color: '#ef4444' }}>Not selected</span>}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Total Variants</Typography>
                <Chip label={totalItems} color="primary" size="small" />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Total Qty</Typography>
                <Typography variant="body2" fontWeight={700}>{totalQty.toLocaleString('en-IN')} pcs</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Total Value</Typography>
                <Typography variant="h6" fontWeight={800} color="#4f46e5">
                  ₹{totalValue.toLocaleString('en-IN')}
                </Typography>
              </Stack>
            </Stack>

            <Box sx={{ mt: 3 }}>
              {posting && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                    Posting to inventory...
                  </Typography>
                </Box>
              )}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePost}
                disabled={posting || selectedItems.length === 0 || !selectedWarehouse}
                startIcon={posting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                sx={{
                  py: 1.5,
                  fontWeight: 800,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
                  '&.Mui-disabled': { opacity: 0.6 }
                }}
              >
                {posting ? 'Posting...' : 'Post to Inventory'}
              </Button>

              <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
                Stock will be <b>immediately available</b> in Inventory Overview after posting. No approval needed.
              </Alert>
            </Box>
          </Paper>

          {/* Instructions */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>📌 How to use</Typography>
            <Stack spacing={0.8}>
              {[
                '1. Select the warehouse where stock exists',
                '2. Search items by code or name',
                '3. Click size chips to add variants',
                '4. Enter quantity & rate for each variant',
                '5. Click "Post to Inventory"'
              ].map((step, i) => (
                <Typography key={i} variant="caption" color="text.secondary" display="block">
                  {step}
                </Typography>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
};

export default OpeningStockPage;
