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
import { addUser, updateUser } from './settingsSlice';

function UsersPage() {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.settings.users);
  const roles = useSelector((state) => state.settings.roles);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const paginatedRows = useMemo(
    () => users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [users, page, rowsPerPage],
  );

  const getRoleName = (roleId) => roles.find((r) => r.id === roleId)?.roleName || roleId;

  const handleOpenNew = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setDialogOpen(true);
  };

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Users</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Manage system users and their roles.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenNew}>Add User</Button>
          </Stack>
        </Stack>
        {users.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.userName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.mobile || '-'}</TableCell>
                      <TableCell>{getRoleName(row.roleId)}</TableCell>
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
              count={users.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        ) : (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>No users found.</Typography>
            <Button variant="contained" onClick={handleOpenNew}>Add User</Button>
          </Box>
        )}
      </Paper>

      <UserDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingUser(null); }}
        user={editingUser}
        roles={roles}
        onSave={(payload) => {
          if (editingUser) {
            dispatch(updateUser({ id: editingUser.id, user: payload }));
          } else {
            dispatch(addUser(payload));
          }
          setDialogOpen(false);
          setEditingUser(null);
        }}
      />
    </>
  );
}

function UserDialog({ open, onClose, user, roles, onSave }) {
  const isEdit = Boolean(user);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { userName: '', email: '', mobile: '', roleId: '', status: 'Active' } });

  useEffect(() => {
    if (!open) return;
    if (user) {
      reset({ userName: user.userName, email: user.email, mobile: user.mobile || '', roleId: user.roleId || '', status: user.status || 'Active' });
    } else {
      reset({ userName: '', email: '', mobile: '', roleId: roles[0]?.id || '', status: 'Active' });
    }
  }, [open, user, roles, reset]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Stack spacing={2}>
            <TextField fullWidth size="small" label="Full Name" {...register('userName', { required: true })} required />
            <TextField fullWidth size="small" type="email" label="Email" {...register('email', { required: true })} required />
            <TextField fullWidth size="small" label="Mobile" {...register('mobile')} />
            <TextField fullWidth size="small" select label="Role" {...register('roleId', { required: true })}>
              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.roleName}</MenuItem>)}
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

export default UsersPage;
