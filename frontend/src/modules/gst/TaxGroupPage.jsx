import { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { addTaxGroup, updateTaxGroup, setTaxGroupStatus } from './gstSlice';

function TaxGroupPage() {
  const dispatch = useDispatch();
  const taxGroups = useSelector((state) => state.gst.taxGroups);
  const taxRates = useSelector((state) => state.gst.taxRates);
  const itemGroups = useSelector((state) => state.masters?.itemGroups || []);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const rateMap = useMemo(
    () => taxRates.reduce((acc, r) => ({ ...acc, [r.id]: r.name }), {}),
    [taxRates],
  );

  const filteredRows = useMemo(() => [...taxGroups], [taxGroups]);
  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const handleOpenNew = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleToggleStatus = (group) => {
    dispatch(setTaxGroupStatus({ id: group.id, status: group.status === 'Active' ? 'Inactive' : 'Active' }));
  };

  const handleSave = (payload) => {
    if (editingGroup) {
      dispatch(updateTaxGroup({ id: editingGroup.id, taxGroup: payload }));
    } else {
      dispatch(addTaxGroup(payload));
    }
    setDialogOpen(false);
    setEditingGroup(null);
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              Tax Groups
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Assign GST rates to item categories.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenNew}>
            Add Tax Group
          </Button>
        </Stack>
      </Stack>

      {filteredRows.length ? (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tax Group Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Applicable Rate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>{rateMap[row.rateId] || row.rateId}</TableCell>
                    <TableCell>{row.category || '-'}</TableCell>
                    <TableCell>{row.description || '-'}</TableCell>
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
            No tax groups found.
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Add tax groups to assign rates to item categories.
          </Typography>
          <Button variant="contained" onClick={handleOpenNew}>
            Add Tax Group
          </Button>
        </Box>
      )}

      <TaxGroupDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingGroup(null);
        }}
        group={editingGroup}
        taxRates={taxRates}
        itemGroups={itemGroups}
        onSave={handleSave}
      />
    </Paper>
  );
}

function TaxGroupDialog({ open, onClose, group, taxRates, itemGroups, onSave }) {
  const isEdit = Boolean(group);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      rateId: '',
      category: '',
      description: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (group) {
      reset({
        name: group.name,
        rateId: group.rateId || '',
        category: group.category || '',
        description: group.description || '',
        status: group.status || 'Active',
      });
    } else {
      reset({
        name: '',
        rateId: '',
        category: '',
        description: '',
        status: 'Active',
      });
    }
  }, [open, group, reset]);

  const onSubmit = (values) => {
    if (!values.name?.trim()) return;
    onSave({
      name: values.name.trim(),
      rateId: values.rateId || null,
      category: values.category?.trim() || '',
      description: values.description?.trim() || '',
      status: values.status,
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Tax Group' : 'Add Tax Group'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Tax Group Name"
              {...register('name', { required: 'Required' })}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <TextField
              fullWidth
              size="small"
              select
              label="Applicable Rate"
              {...register('rateId')}
            >
              <MenuItem value="">None</MenuItem>
              {taxRates.filter((r) => r.status === 'Active').map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name} (CGST {r.cgst}% + SGST {r.sgst}%)
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="small"
              select
              label="Item Category (optional)"
              {...register('category')}
            >
              <MenuItem value="">None</MenuItem>
              {itemGroups.map((g) => (
                <MenuItem key={g.id} value={g.groupName}>
                  {g.groupName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="small"
              label="Description"
              multiline
              rows={2}
              {...register('description')}
            />
            <TextField fullWidth size="small" select label="Status" {...register('status')}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default TaxGroupPage;
