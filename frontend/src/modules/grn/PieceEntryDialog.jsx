import { useState } from 'react';
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
  IconButton,
  Typography,
  Box,
  Stack,
  Alert
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StraightenIcon from '@mui/icons-material/Straighten';

const PieceEntryDialog = ({ open, onClose, onAdd, item }) => {
  const [pieces, setPieces] = useState([{ length: '', barcode: '' }]);
  const [prefix, setPrefix] = useState(item?.itemCode || 'ROLL');

  const handleAddRow = () => {
    setPieces([...pieces, { length: '', barcode: '' }]);
  };

  const handleRemoveRow = (index) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const next = [...pieces];
    next[index][field] = value;
    setPieces(next);
  };

  const handleGenerateBarcodes = () => {
    const next = pieces.map((p, i) => ({
      ...p,
      barcode: p.barcode || `${prefix}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    }));
    setPieces(next);
  };

  const handleSubmit = () => {
    const validPieces = pieces.filter(p => p.length > 0);
    if (validPieces.length === 0) return;
    
    onAdd(validPieces.map(p => ({
      ...item,
      itemId: item._id || item.id,
      variantId: item._id || item.id, // For fabrics, itemId acts as variantId
      receivedQty: Number(p.length),
      sku: p.barcode || `${prefix}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      batchNumber: p.barcode, 
      itemName: `${item.itemName} (Roll)`
    })));
    
    setPieces([{ length: '', barcode: '' }]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <StraightenIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Piece/Roll Entry: {item?.itemName}</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Enter the length for each individual "Than" (Roll). You can also provide custom barcodes or let the system generate them.
        </Alert>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField 
            label="Barcode Prefix" 
            size="small" 
            value={prefix} 
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
          />
          <Button variant="outlined" onClick={handleGenerateBarcodes}>Auto-Fill Barcodes</Button>
        </Stack>

        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Length (Meters/Qty)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unique Barcode / Piece ID</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pieces.map((piece, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={piece.length}
                      onChange={(e) => handleChange(index, 'length', e.target.value)}
                      placeholder="e.g. 100"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={piece.barcode}
                      onChange={(e) => handleChange(index, 'barcode', e.target.value)}
                      placeholder="Custom ID (Optional)"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleRemoveRow(index)} disabled={pieces.length === 1}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Button 
          startIcon={<AddCircleOutlineIcon />} 
          onClick={handleAddRow} 
          sx={{ mt: 2, fontWeight: 700 }}
        >
          Add Another Roll
        </Button>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} color="primary" sx={{ px: 4 }}>
          Add {pieces.filter(p => p.length > 0).length} Rolls to GRN
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PieceEntryDialog;
