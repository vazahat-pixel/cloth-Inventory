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
import { addPrintTemplate, updatePrintTemplate, fetchPrintTemplates } from './settingsSlice';

function PrintTemplatesPage() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchPrintTemplates());
  }, [dispatch]);
  const templates = useSelector((state) => state.settings.printTemplates);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const paginatedRows = useMemo(
    () => templates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [templates, page, rowsPerPage],
  );

  const handleOpenNew = () => { setEditing(null); setDialogOpen(true); };
  const handleOpenEdit = (r) => { setEditing(r); setDialogOpen(true); };

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Print Templates</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Configure invoice and document print layouts.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenNew}>Add Template</Button>
          </Stack>
        </Stack>
        {templates.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Document Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Layout</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell>{row.documentType}</TableCell>
                      <TableCell>{row.layout}</TableCell>
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
              count={templates.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        ) : (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>No print templates found.</Typography>
            <Button variant="contained" onClick={handleOpenNew}>Add Template</Button>
          </Box>
        )}
      </Paper>

      <PrintTemplateDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        template={editing}
        onSave={(payload) => {
          if (editing) dispatch(updatePrintTemplate({ id: editing.id, printTemplate: payload }));
          else dispatch(addPrintTemplate(payload));
          setDialogOpen(false);
          setEditing(null);
        }}
      />
    </>
  );
}

function PrintTemplateDialog({ open, onClose, template, onSave }) {
  const isEdit = Boolean(template);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', documentType: 'Invoice', layout: 'Detailed', headerText: '', footerText: '', status: 'Active' },
  });

  useEffect(() => {
    if (!open) return;
    if (template) reset({ name: template.name, documentType: template.documentType, layout: template.layout, headerText: template.headerText || '', footerText: template.footerText || '', status: template.status || 'Active' });
    else reset({ name: '', documentType: 'Invoice', layout: 'Detailed', headerText: '', footerText: '', status: 'Active' });
  }, [open, template, reset]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Print Template' : 'Add Print Template'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField fullWidth size="small" label="Template Name" {...register('name', { required: true })} required />
            <TextField fullWidth size="small" select label="Document Type" {...register('documentType')}>
              <MenuItem value="Invoice">Invoice</MenuItem>
              <MenuItem value="Delivery Note">Delivery Note</MenuItem>
              <MenuItem value="Quotation">Quotation</MenuItem>
            </TextField>
            <TextField fullWidth size="small" select label="Layout" {...register('layout')}>
              <MenuItem value="Detailed">Detailed</MenuItem>
              <MenuItem value="Compact">Compact</MenuItem>
              <MenuItem value="Standard">Standard</MenuItem>
            </TextField>
            <TextField fullWidth size="small" multiline rows={2} label="Header Text" {...register('headerText')} />
            <TextField fullWidth size="small" multiline rows={2} label="Footer Text" {...register('footerText')} />
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

export default PrintTemplatesPage;
