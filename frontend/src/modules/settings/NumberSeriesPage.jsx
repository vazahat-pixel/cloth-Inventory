import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { addNumberSeries, updateNumberSeries } from './settingsSlice';

function NumberSeriesPage() {
  const dispatch = useDispatch();
  const numberSeries = useSelector((state) => state.settings.numberSeries);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const paginatedRows = useMemo(
    () => numberSeries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [numberSeries, page, rowsPerPage],
  );

  const handleOpenNew = () => { setEditing(null); setDialogOpen(true); };
  const handleOpenEdit = (r) => { setEditing(r); setDialogOpen(true); };

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Number Series</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Configure document numbering for invoices, bills, etc.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenNew}>Add Series</Button>
          </Stack>
        </Stack>
        {numberSeries.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Document Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Prefix</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Next Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reset Period</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.documentType}</TableCell>
                      <TableCell>{row.prefix}</TableCell>
                      <TableCell align="right">{row.nextNumber}</TableCell>
                      <TableCell>{row.resetPeriod || '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" color={row.status === 'Active' ? 'success' : 'default'} variant="outlined" label={row.status} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={numberSeries.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        ) : (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>No number series found.</Typography>
            <Button variant="contained" onClick={handleOpenNew}>Add Series</Button>
          </Box>
        )}
      </Paper>

      <NumberSeriesDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        ns={editing}
        onSave={(payload) => {
          if (editing) dispatch(updateNumberSeries({ id: editing.id, numberSeries: payload }));
          else dispatch(addNumberSeries(payload));
          setDialogOpen(false);
          setEditing(null);
        }}
      />
    </>
  );
}

function NumberSeriesDialog({ open, onClose, ns, onSave }) {
  const isEdit = Boolean(ns);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { documentType: '', prefix: '', nextNumber: 1, padding: 6, resetPeriod: 'Yearly', status: 'Active' },
  });

  useEffect(() => {
    if (!open) return;
    if (ns) reset({ documentType: ns.documentType, prefix: ns.prefix, nextNumber: ns.nextNumber, padding: ns.padding || 6, resetPeriod: ns.resetPeriod || 'Yearly', status: ns.status || 'Active' });
    else reset({ documentType: '', prefix: '', nextNumber: 1, padding: 6, resetPeriod: 'Yearly', status: 'Active' });
  }, [open, ns, reset]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Number Series' : 'Add Number Series'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField fullWidth size="small" label="Document Type" {...register('documentType', { required: true })} required />
            <TextField fullWidth size="small" label="Prefix" {...register('prefix')} placeholder="e.g., INV-" />
            <TextField fullWidth size="small" type="number" label="Next Number" {...register('nextNumber', { valueAsNumber: true })} />
            <TextField fullWidth size="small" type="number" label="Padding" {...register('padding', { valueAsNumber: true })} />
            <TextField fullWidth size="small" select label="Reset Period" {...register('resetPeriod')}>
              <MenuItem value="Never">Never</MenuItem>
              <MenuItem value="Yearly">Yearly</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
            </TextField>
            <TextField fullWidth size="small" select label="Status" {...register('status')}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>Save</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default NumberSeriesPage;
