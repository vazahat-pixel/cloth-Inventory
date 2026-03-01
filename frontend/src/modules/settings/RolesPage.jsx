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
import { addRole, updateRole } from './settingsSlice';

function RolesPage() {
  const dispatch = useDispatch();
  const roles = useSelector((state) => state.settings.roles);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const paginatedRows = useMemo(
    () => roles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [roles, page, rowsPerPage],
  );

  const handleOpenNew = () => { setEditingRole(null); setDialogOpen(true); };
  const handleOpenEdit = (r) => { setEditingRole(r); setDialogOpen(true); };

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Roles</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Define roles and permissions.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenNew}>Add Role</Button>
          </Stack>
        </Stack>
        {roles.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Role Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.roleName}</TableCell>
                      <TableCell>{row.description || '-'}</TableCell>
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
              count={roles.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        ) : (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>No roles found.</Typography>
            <Button variant="contained" onClick={handleOpenNew}>Add Role</Button>
          </Box>
        )}
      </Paper>

      <RoleDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingRole(null); }}
        role={editingRole}
        onSave={(payload) => {
          if (editingRole) dispatch(updateRole({ id: editingRole.id, role: payload }));
          else dispatch(addRole(payload));
          setDialogOpen(false);
          setEditingRole(null);
        }}
      />
    </>
  );
}

function RoleDialog({ open, onClose, role, onSave }) {
  const isEdit = Boolean(role);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { roleName: '', description: '', status: 'Active' } });

  useEffect(() => {
    if (!open) return;
    if (role) reset({ roleName: role.roleName, description: role.description || '', status: role.status || 'Active' });
    else reset({ roleName: '', description: '', status: 'Active' });
  }, [open, role, reset]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Role' : 'Add Role'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField fullWidth size="small" label="Role Name" {...register('roleName', { required: true })} required />
            <TextField fullWidth size="small" multiline rows={2} label="Description" {...register('description')} />
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

export default RolesPage;
