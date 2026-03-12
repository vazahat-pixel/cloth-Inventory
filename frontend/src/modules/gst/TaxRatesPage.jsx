import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { addTaxRate, updateTaxRate, setTaxRateStatus, fetchGstSlabs } from './gstSlice';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function TaxRatesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const taxRates = useSelector((state) => state.gst.taxRates);

  useEffect(() => {
    dispatch(fetchGstSlabs());
  }, [dispatch]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);

  const filteredRows = useMemo(() => [...taxRates], [taxRates]);
  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const handleOpenNew = () => {
    setEditingRate(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (rate) => {
    setEditingRate(rate);
    setDialogOpen(true);
  };

  const handleToggleStatus = (rate) => {
    dispatch(setTaxRateStatus({ id: rate.id, status: rate.status === 'Active' ? 'Inactive' : 'Active' }));
  };

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                Tax Rates
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Manage GST rates. CGST + SGST = IGST for interstate consistency.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenNew}>
              Add Tax Rate
            </Button>
          </Stack>
        </Stack>

        {filteredRows.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Tax Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      CGST %
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      SGST %
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      IGST %
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Effective From</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell align="right">{row.cgst}%</TableCell>
                      <TableCell align="right">{row.sgst}%</TableCell>
                      <TableCell align="right">{row.igst}%</TableCell>
                      <TableCell>{row.effectiveFrom || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={row.status === 'Active' ? 'success' : 'default'}
                          variant="outlined"
                          label={row.status}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={row.status === 'Active' ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(row)}
                          >
                            {row.status === 'Active' ? (
                              <ToggleOffIcon fontSize="small" />
                            ) : (
                              <ToggleOnIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        ) : (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              No tax rates found.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Add GST rates for tax configuration.
            </Typography>
            <Button variant="contained" onClick={handleOpenNew}>
              Add Tax Rate
            </Button>
          </Box>
        )}
      </Paper>

      <TaxRateDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingRate(null);
        }}
        rate={editingRate}
        taxRates={taxRates}
        onSave={(payload) => {
          if (editingRate) {
            dispatch(updateTaxRate({ id: editingRate.id, taxRate: payload }));
          } else {
            dispatch(addTaxRate(payload));
          }
          setDialogOpen(false);
          setEditingRate(null);
        }}
      />
    </>
  );
}

function TaxRateDialog({ open, onClose, rate, taxRates, onSave }) {
  const isEdit = Boolean(rate);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      cgst: '',
      sgst: '',
      igst: '',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      status: 'Active',
    },
  });

  const handleClose = () => {
    reset();
    setFormError('');
    onClose();
  };

  const onSubmit = (values) => {
    setFormError('');
    const cgstVal = toNum(values.cgst);
    const sgstVal = toNum(values.sgst);
    const igstVal = toNum(values.igst);

    if (!values.name?.trim()) {
      setFormError('Tax name is required.');
      return;
    }
    if (cgstVal < 0 || sgstVal < 0 || igstVal < 0) {
      setFormError('Rates cannot be negative.');
      return;
    }
    if (Math.abs(cgstVal + sgstVal - igstVal) > 0.01) {
      setFormError('CGST + SGST must equal IGST for interstate consistency.');
      return;
    }

    onSave({
      name: values.name.trim(),
      cgst: cgstVal,
      sgst: sgstVal,
      igst: igstVal,
      effectiveFrom: values.effectiveFrom || null,
      status: values.status,
    });
  };

  useEffect(() => {
    if (!open) return;
    if (rate) {
      reset({
        name: rate.name || '',
        cgst: rate.cgst ?? '',
        sgst: rate.sgst ?? '',
        igst: rate.igst ?? '',
        effectiveFrom: rate.effectiveFrom || '',
        status: rate.status || 'Active',
      });
    } else {
      reset({
        name: '',
        cgst: '',
        sgst: '',
        igst: '',
        effectiveFrom: new Date().toISOString().slice(0, 10),
        status: 'Active',
      });
    }
  }, [open, rate, reset]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Tax Name"
              {...register('name', { required: 'Required' })}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              placeholder="e.g., GST 5%"
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="CGST %"
                  {...register('cgst', { min: 0, max: 100 })}
                  error={Boolean(errors.cgst)}
                  helperText={errors.cgst?.message}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="SGST %"
                  {...register('sgst', { min: 0, max: 100 })}
                  error={Boolean(errors.sgst)}
                  helperText={errors.sgst?.message}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="IGST %"
                  {...register('igst', { min: 0, max: 100 })}
                  error={Boolean(errors.igst)}
                  helperText={errors.igst?.message}
                  placeholder="CGST+SGST"
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Effective From"
              InputLabelProps={{ shrink: true }}
              {...register('effectiveFrom')}
            />
            <TextField
              fullWidth
              size="small"
              select
              label="Status"
              {...register('status')}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
            {formError && (
              <Typography variant="body2" color="error">
                {formError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default TaxRatesPage;
