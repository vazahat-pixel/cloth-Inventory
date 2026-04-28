import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  Chip,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import * as XLSX from 'xlsx';
import api from '../../../services/api';

const FIELD_MAPS = {
  branch: ['branch', 'branch name', 'location', 'store'],
  itemName: ['item name', 'name', 'product', 'product name', 'style'],
  itemCode: ['item code', 'code', 'style code', 'article', 'article no'],
  shade: ['shade', 'shade name', 'color', 'shade no'],
  description: ['description', 'item description', 'remarks'],
  size: ['size', 'pack', 'pack / size', 'size name'],
  qty: ['closing stock', 'quantity', 'qty', 'stock', 'balance'],
  design: ['design', 'pattern'],
  type: ['type', 'category']
};

const BulkInventoryUploadDialog = ({ open, onClose, onUploadSuccess, warehouseId }) => {
  const [rawData, setRawData] = useState([]);
  const [resolvedData, setResolvedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const findMappedField = (headers, targets) => {
    return headers.find(h => targets.includes(h.toLowerCase().trim())) || null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setResolvedData([]);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target.result;
        // Optimized reading options
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, cellNF: false, cellText: false });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        
        console.log(`📊 EXCEL_UPLOAD: Read ${json.length} rows from file`);

        if (json.length === 0) {
          setError('The Excel file is empty.');
          setLoading(false);
          return;
        }

        const headers = Object.keys(json[0]);
        const mapping = {};
        Object.keys(FIELD_MAPS).forEach(key => {
          mapping[key] = findMappedField(headers, FIELD_MAPS[key]);
        });

        const standardizedRows = json.map(row => {
          const newRow = {};
          Object.keys(mapping).forEach(key => {
            if (mapping[key]) newRow[key] = row[mapping[key]];
          });
          return newRow;
        });

        setRawData(standardizedRows);
        await resolveItems(standardizedRows);
      } catch (err) {
        setError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const resolveItems = async (rows) => {
    setResolving(true);
    try {
      const response = await api.post('/items/resolve-opening-balance', { rows });
      setResolvedData(response.data.data);
    } catch (err) {
      setError('Failed to resolve items with database.');
    } finally {
      setResolving(false);
    }
  };

  const handleSave = async () => {
    const validItems = resolvedData.filter(d => d.matched && d.qty > 0);
    if (validItems.length === 0) {
      setError('No valid items with quantities found to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const payload = {
        grnType: 'OPENING_BALANCE',
        warehouseId,
        remarks: `Bulk Excel Import - ${new Date().toLocaleString()}`,
        items: validItems.map(item => ({
          itemId: item.itemId,
          variantId: item.variantId,
          sku: item.sku,
          receivedQty: Number(item.qty),
          costPrice: Number(item.costPrice || 0),
          itemName: item.itemName,
          size: item.size,
          color: item.color
        }))
      };

      const response = await api.post('/grn', payload);
      setSuccess(`Successfully posted Opening Balance GRN with ${validItems.length} items!`);
      
      setTimeout(() => {
        onUploadSuccess(response.data.data);
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process bulk upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setRawData([]);
    setResolvedData([]);
    setError('');
    setSuccess('');
    onClose();
  };

  const stats = useMemo(() => {
    const data = Array.isArray(resolvedData) ? resolvedData : [];
    const total = data.length;
    const matched = data.filter(d => d.matched).length;
    const unmatched = total - matched;
    const totalQty = data.reduce((sum, d) => sum + Number(d.qty || 0), 0);
    return { total, matched, unmatched, totalQty };
  }, [resolvedData]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Bulk Inventory Upload (Opening Stock)</Typography>
            <Typography variant="caption" color="textSecondary">Upload Excel to initialize warehouse inventory</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!resolvedData.length ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CloudUploadIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
            <Typography variant="h6" gutterBottom>Upload your Inventory Excel</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
              System will automatically map columns like Branch, Item Name, Code, Shade, Size, and Closing Stock.
            </Typography>
            <Button
              variant="contained"
              component="label"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              sx={{ px: 6, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              {loading ? 'Reading File...' : 'Select Excel File'}
              <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
            </Button>
          </Box>
        ) : (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>MATCHED ITEMS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#15803d' }}>{stats.matched}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#fef2f2', borderColor: '#fecaca' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#991b1b' }}>UNMATCHED ITEMS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#dc2626' }}>{stats.unmatched}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#eff6ff', borderColor: '#bfdbfe' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e40af' }}>TOTAL QUANTITY</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#2563eb' }}>{stats.totalQty}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Button variant="outlined" component="label" size="small" startIcon={<CloudUploadIcon />}>
                      Change File
                      <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
                   </Button>
                </Box>
              </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, borderRadius: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>ITEM NAME / CODE</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>SHADE / COLOR</TableCell>
                    <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>SIZE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>UPLOADED QTY</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resolvedData.map((row, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: !row.matched ? '#fff5f5' : 'inherit' }}>
                      <TableCell>
                        {row.matched ? (
                          <Chip icon={<CheckCircleIcon />} label="Matched" color="success" size="small" variant="outlined" />
                        ) : (
                          <Chip icon={<ErrorIcon />} label="Not Found" color="error" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.itemName || row.itemCode}</Typography>
                        <Typography variant="caption" color="textSecondary">{row.itemCode}</Typography>
                      </TableCell>
                      <TableCell>{row.color || row.shade || '--'}</TableCell>
                      <TableCell><Chip label={row.size || '--'} size="small" /></TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#2563eb' }}>{row.qty}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!resolvedData.length || uploading || resolving || stats.matched === 0}
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ px: 4, fontWeight: 700, borderRadius: 2 }}
        >
          {uploading ? 'Processing 9000+ Items...' : 'Confirm & Post Opening Stock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkInventoryUploadDialog;
