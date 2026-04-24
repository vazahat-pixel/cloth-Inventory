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
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import * as XLSX from 'xlsx';
import api from '../../../../services/api';

const BulkSupplierUploadDialog = ({ open, onClose, onUploadSuccess }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws);
        
        if (json.length === 0) {
          setError('The Excel file is empty.');
          setLoading(false);
          return;
        }

        // Standardize keys (remove spaces, lowercase)
        const standardizedData = json.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
            newRow[cleanKey] = row[key];
          });
          return newRow;
        });

        setData(standardizedData);
      } catch (err) {
        setError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const parsedSuppliers = useMemo(() => {
    return data.map(row => ({
      name: row.supplier_name || row.name || row.firm_name,
      supplierCode: row.supplier_code || row.code,
      contactPerson: row.contact_person || row.person_name || row.owner,
      phone: String(row.phone || row.mobile || row.contact || ''),
      email: row.email || row.email_id,
      address: row.address || row.full_address,
      gstNumber: row.gst || row.gst_number || row.gstin,
      panNo: row.pan || row.pan_number,
      supplierType: row.type || row.supplier_type || 'General',
      isActive: true
    })).filter(s => s.name);
  }, [data]);

  const handleSave = async () => {
    if (parsedSuppliers.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/suppliers/bulk', parsedSuppliers);
      const { success: successSuppliers, errors: errorSuppliers } = response.data.data;

      if (errorSuppliers.length > 0) {
        const errorMsgs = errorSuppliers.map(e => `${e.name}: ${e.error}`).join(', ');
        setError(`Imported ${successSuppliers.length} suppliers. Errors in: ${errorMsgs}`);
      } else {
        setSuccess(`Successfully imported ${successSuppliers.length} suppliers!`);
        setTimeout(() => {
          onUploadSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save suppliers.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setData([]);
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Bulk Excel Upload - Suppliers</Typography>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Upload an Excel file with columns like: <b>Supplier Name, Contact Person, Phone, Email, GST Number, Address</b>.
          </Alert>

          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={loading || uploading}
            fullWidth
            sx={{ py: 2, borderStyle: 'dashed', borderWidth: 2 }}
          >
            {data.length > 0 ? 'Change File' : 'Select Excel File'}
            <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {data.length > 0 && !loading && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Preview ({parsedSuppliers.length} suppliers identified)</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Contact Person</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>GST</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedSuppliers.map((sup, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 700, color: '#6366f1' }}>{sup.name}</TableCell>
                      <TableCell>{sup.contactPerson || '--'}</TableCell>
                      <TableCell>{sup.phone || '--'}</TableCell>
                      <TableCell>{sup.gstNumber || '--'}</TableCell>
                      <TableCell>{sup.supplierType}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={parsedSuppliers.length === 0 || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : null}
          sx={{ fontWeight: 700, px: 4 }}
        >
          {uploading ? 'Uploading...' : 'Save All Suppliers'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkSupplierUploadDialog;
