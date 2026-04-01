import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
} from '@mui/material';
import {
  LocalShippingOutlined as ShippingIcon,
  CheckCircleOutline as CheckIcon,
  VisibilityOutlined as ViewIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { useSelector } from 'react-redux';

function StoreReceiptPage() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [receiving, setReceiving] = useState(false);
  const [scannedItems, setScannedItems] = useState({});
  const [scannerInput, setScannerInput] = useState('');
  
  // Assuming user shopId is available in state. If not, we'll fetch all and filter or the API will handle it.
  const user = useSelector((state) => state.auth?.user);
  const shopId = user?.shopId || user?.storeId;

  const handleScan = (barcode) => {
    if (!selectedDispatch) return;

    const matchedItem = selectedDispatch.items.find(
      (item) => item.variantId?.barcode === barcode || item.variantId?.sku === barcode
    );

    if (matchedItem) {
      setScannedItems((prev) => ({
        ...prev,
        [matchedItem.variantId?._id || matchedItem.variantId]: true,
      }));
      setScannerInput('');
      // Optional: Play a success sound here
    } else {
      alert('Barcode not found in this shipment!');
      setScannerInput('');
    }
  };

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      // Fetch only DISPATCHED dispatches for this store
      // Note: Backend stores locationId, so we pass destinationId
      const res = await api.get('/dispatch', { 
        params: { 
          destinationId: shopId,
          status: 'DISPATCHED' 
        } 
      });
      setDispatches(res.data?.data?.dispatches || res.data?.dispatches || []);
    } catch (err) {
      console.error('Failed to fetch dispatches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) fetchDispatches();
  }, [shopId]);

  const handleReceive = async (dispatchId) => {
    if (!window.confirm('Are you sure you want to confirm receipt of these items? This will update your store inventory.')) return;
    
    setReceiving(true);
    try {
      await api.post(`/dispatch/${dispatchId}/receive`);
      alert('Stock received successfully!');
      setSelectedDispatch(null);
      fetchDispatches();
    } catch (err) {
      alert('Failed to receive stock: ' + (err.response?.data?.message || err.message));
    } finally {
      setReceiving(false);
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Inbound Shipments
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Receive and verify stock transfers from Head Office
          </Typography>
        </Box>
        <Button variant="outlined" onClick={fetchDispatches} disabled={loading}>
          Refresh List
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : dispatches.length === 0 ? (
        <Paper elevation={0} sx={{ p: 10, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #cbd5e1', borderRadius: 4 }}>
          <ShippingIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700 }}>No Pending Shipments</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            When Head Office dispatches stock to your store, it will appear here.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Dispatch #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dispatches.map((d) => (
                <TableRow key={d._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{d.dispatchNumber}</TableCell>
                  <TableCell>{d.sourceWarehouseId?.name || 'Warehouse'}</TableCell>
                  <TableCell>{new Date(d.dispatchedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{d.items?.length || 0} Products</TableCell>
                  <TableCell>
                    <Chip 
                      icon={<PendingIcon fontSize="small" />} 
                      label="IN TRANSIT" 
                      color="info" 
                      variant="outlined" 
                      size="small" 
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton color="primary" onClick={() => setSelectedDispatch(d)} size="small">
                        <ViewIcon />
                      </IconButton>
                      <Button 
                        variant="contained" 
                        color="success" 
                        size="small" 
                        disableElevation
                        startIcon={<CheckIcon />}
                        onClick={() => handleReceive(d._id)}
                        sx={{ borderRadius: 2 }}
                      >
                        Receive
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dispatch Details Dialog */}
      <Dialog 
        open={Boolean(selectedDispatch)} 
        onClose={() => {
          setSelectedDispatch(null);
          setScannedItems({});
          setScannerInput('');
        }} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Shipment Inward: {selectedDispatch?.dispatchNumber}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Source: {selectedDispatch?.sourceWarehouseId?.name || 'Warehouse'}
                </Typography>
            </Box>
            <Chip 
              label={`${Object.keys(scannedItems).length} / ${selectedDispatch?.items?.length} Items Verified`}
              color={Object.keys(scannedItems).length === selectedDispatch?.items?.length ? "success" : "warning"}
              sx={{ fontWeight: 700, px: 1 }}
            />
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#fff' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShippingIcon sx={{ fontSize: 18 }} /> STEP 1: SCAN OR VERIFY ITEMS
                </Typography>
                <Button 
                    size="small" 
                    variant="outlined" 
                    color="primary" 
                    sx={{ borderRadius: 1.5, textTransform: 'none' }}
                    onClick={() => {
                        const allVerified = {};
                        selectedDispatch?.items?.forEach(item => {
                            allVerified[item.variantId?._id || item.variantId] = true;
                        });
                        setScannedItems(allVerified);
                    }}
                >
                    Verify All Items
                </Button>
            </Stack>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Scan Barcode or Type SKU to verify..."
              value={scannerInput}
              onChange={(e) => setScannerInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleScan(scannerInput);
                }
              }}
              autoFocus
              InputProps={{
                sx: { borderRadius: 3, bgcolor: '#f8fafc' }
              }}
              helperText="Tip: You can skip scanning by clicking 'Verify All Items'"
            />
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Product Details</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Qty Sent</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedDispatch?.items?.map((item, idx) => {
                  const isVerified = scannedItems[item.variantId?._id || item.variantId];
                  return (
                    <TableRow key={idx} sx={{ bgcolor: isVerified ? '#f0fdf4' : 'inherit' }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>
                          {item.variantId?.name || 'Product'} 
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {item.variantId?.sku} | Barcode: {item.variantId?.barcode}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 800 }}>{item.qty}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        {isVerified ? (
                          <Chip icon={<CheckIcon />} label="VERIFIED" color="success" size="small" />
                        ) : (
                          <Chip label="PENDING" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {selectedDispatch?.notes && (
            <Box sx={{ m: 2, p: 2, bgcolor: '#fff9c4', borderRadius: 2, border: '1px solid #fff176' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>NOTES FROM HO:</Typography>
              <Typography variant="body2">{selectedDispatch.notes}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => {
            setSelectedDispatch(null);
            setScannedItems({});
            setScannerInput('');
          }} color="inherit">Cancel</Button>
          <Button 
            variant="contained" 
            color="success" 
            disableElevation
            onClick={() => handleReceive(selectedDispatch._id)}
            disabled={receiving || Object.keys(scannedItems).length !== selectedDispatch?.items?.length}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {receiving ? <CircularProgress size={24} /> : 'Confirm & Inward Stock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StoreReceiptPage;
