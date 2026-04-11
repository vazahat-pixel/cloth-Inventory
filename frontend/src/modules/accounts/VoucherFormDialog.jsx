import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
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
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { addVoucher } from './accountsSlice';
import { fetchMasters } from '../masters/mastersSlice';

const VOUCHER_TYPES = [
  { value: 'BANK_PAYMENT', label: 'Bank Payment' },
  { value: 'CASH_PAYMENT', label: 'Cash Payment' },
  { value: 'BANK_RECEIPT', label: 'Bank Receipt' },
  { value: 'CASH_RECEIPT', label: 'Cash Receipt' },
  { value: 'JOURNAL', label: 'Journal Entry' },
];

function VoucherFormDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const accounts = useSelector((state) => state.masters.accounts || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const customers = useSelector((state) => state.masters.customers || []);

  const [formData, setFormData] = useState({
    type: 'BANK_PAYMENT',
    date: new Date().toISOString().split('T')[0],
    entityId: '',
    entityModel: null,
    referenceId: '',
    narration: '',
    entries: [{ accountId: '', debit: 0, credit: 0, narration: '' }],
  });

  useEffect(() => {
    if (open) {
      dispatch(fetchMasters('accounts'));
      dispatch(fetchMasters('suppliers'));
      dispatch(fetchMasters('customers'));
    }
  }, [open, dispatch]);

  const handleAddEntry = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, { accountId: '', debit: 0, credit: 0, narration: '' }],
    });
  };

  const handleRemoveEntry = (index) => {
    const newEntries = formData.entries.filter((_, i) => i !== index);
    setFormData({ ...formData, entries: newEntries });
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...formData.entries];
    newEntries[index][field] = value;
    setFormData({ ...formData, entries: newEntries });
  };

  const totalDebit = useMemo(() => formData.entries.reduce((sum, e) => sum + Number(e.debit || 0), 0), [formData.entries]);
  const totalCredit = useMemo(() => formData.entries.reduce((sum, e) => sum + Number(e.credit || 0), 0), [formData.entries]);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async () => {
    if (!isBalanced) return;
    
    const result = await dispatch(addVoucher({
        ...formData,
        totalAmount: totalDebit
    }));
    
    if (result.meta.requestStatus === 'fulfilled') {
      onClose();
      // Reset form
      setFormData({
        type: 'BANK_PAYMENT',
        date: new Date().toISOString().split('T')[0],
        entityId: '',
        entityModel: null,
        referenceId: '',
        narration: '',
        entries: [{ accountId: '', debit: 0, credit: 0, narration: '' }],
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>New Accounting Voucher</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Voucher Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {VOUCHER_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Reference / Cheque No"
              value={formData.referenceId}
              onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
                options={[...suppliers.map(s => ({ ...s, model: 'Supplier', label: `(S) ${s.name || s.supplierName}` })), ...customers.map(c => ({ ...c, model: 'Customer', label: `(C) ${c.name || c.customerName}` }))]}
                getOptionLabel={(option) => option.label || ""}
                onChange={(_, newValue) => {
                    setFormData({...formData, entityId: newValue?._id || '', entityModel: newValue?.model || null});
                }}
                renderInput={(params) => <TextField {...params} label="Party (Supplier/Customer) - Optional" />}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Narration"
              value={formData.narration}
              onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>Entries</Typography>
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 700 }} width={150} align="right">Debit</TableCell>
                <TableCell sx={{ fontWeight: 700 }} width={150} align="right">Credit</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Narration</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      value={entry.accountId}
                      onChange={(e) => handleEntryChange(index, 'accountId', e.target.value)}
                    >
                      {accounts.map((acc) => (
                        <MenuItem key={acc._id} value={acc._id}>
                          {acc.name} ({acc.code})
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={entry.debit}
                      onChange={(e) => handleEntryChange(index, 'debit', e.target.value)}
                      inputProps={{ style: { textAlign: 'right' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={entry.credit}
                      onChange={(e) => handleEntryChange(index, 'credit', e.target.value)}
                      inputProps={{ style: { textAlign: 'right' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={entry.narration}
                      onChange={(e) => handleEntryChange(index, 'narration', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => handleRemoveEntry(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5}>
                  <Button startIcon={<AddIcon />} onClick={handleAddEntry} size="small">
                    Add Row
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalDebit.toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>₹{totalCredit.toFixed(2)}</TableCell>
                <TableCell colSpan={2}>
                    {!isBalanced && totalDebit > 0 && <Typography color="error" variant="caption">Entries not balanced</Typography>}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: '#f8fafc' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isBalanced}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Post Voucher
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default VoucherFormDialog;
