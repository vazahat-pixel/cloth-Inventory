import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Stack,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';

function ExchangeDialog({ open, onClose, onAddItems, storeId }) {
  const [saleNumber, setSaleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [saleData, setSaleData] = useState(null);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const handleSearch = async () => {
    if (!saleNumber.trim()) return;
    setLoading(true);
    setError('');
    setSaleData(null);
    setSelectedItems([]);
    try {
      // Find sale by sale number
      const response = await api.get(`/sales?saleNumber=${saleNumber.trim()}`);
      const sale = response.data.sales?.[0] || response.data.data?.[0];
      
      if (!sale) {
        setError('Invoice not found.');
      } else {
        setSaleData(sale);
      }
    } catch (err) {
      setError('Error searching for invoice.');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.barcode === item.barcode);
      if (exists) {
        return prev.filter((i) => i.barcode !== item.barcode);
      }
      return [...prev, { ...item, returnQty: 1 }];
    });
  };

  const handleQtyChange = (barcode, qty) => {
    setSelectedItems((prev) =>
      prev.map((i) => {
        if (i.barcode === barcode) {
          const original = saleData.items.find((si) => si.barcode === barcode);
          return { ...i, returnQty: Math.min(Number(qty), original.quantity) };
        }
        return i;
      }),
    );
  };

  const handleConfirm = () => {
    if (selectedItems.length === 0) return;
    onAddItems({
      originalSaleId: saleData._id || saleData.id,
      originalSaleNumber: saleData.saleNumber,
      items: selectedItems.map(i => ({
        ...i,
        quantity: i.returnQty,
        // We use the original rate for credit calculation
        rate: i.rate,
        tax: i.taxPercentage || 0,
        isReturn: true
      }))
    });
    onClose();
    // Reset
    setSaleNumber('');
    setSaleData(null);
    setSelectedItems([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Exchange / Return Items</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Original Invoice Number"
              placeholder="e.g. INV-2024-00001"
              value={saleNumber}
              onChange={(e) => setSaleNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              onClick={handleSearch}
              disabled={loading || !saleNumber.trim()}
            >
              Search
            </Button>
          </Stack>

          {error && <Typography color="error">{error}</Typography>}

          {saleData && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                Items in Invoice: {saleData.saleNumber} ({new Date(saleData.saleDate).toLocaleDateString()})
              </Typography>
              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Bought Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Rate</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Return Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {saleData.items.map((item) => {
                      const isSelected = selectedItems.find((i) => i.barcode === item.barcode);
                      return (
                        <TableRow key={item.barcode} selected={!!isSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={!!isSelected}
                              onChange={() => toggleItem(item)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.itemId?.itemName || item.name || 'Unknown Item'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {item.barcode}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.rate}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              sx={{ width: 80 }}
                              disabled={!isSelected}
                              value={isSelected?.returnQty || ''}
                              onChange={(e) => handleQtyChange(item.barcode, e.target.value)}
                              InputProps={{ inputProps: { min: 1, max: item.quantity } }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          disabled={selectedItems.length === 0}
          onClick={handleConfirm}
        >
          Add to Exchange List ({selectedItems.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExchangeDialog;
