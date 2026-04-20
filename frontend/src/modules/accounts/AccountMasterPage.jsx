import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { fetchMasters, addMasterRecord } from '../masters/mastersSlice';
import MasterFormDialog from '../masters/components/MasterFormDialog';

const accountFields = [
  { name: 'name', label: 'Account Name', required: true },
  { name: 'code', label: 'Account Code', required: true },
  {
    name: 'type',
    label: 'Account Type',
    type: 'select',
    required: true,
    options: [
      { value: 'ASSET', label: 'Asset (e.g. Bank, Cash, Debtors)' },
      { value: 'LIABILITY', label: 'Liability (e.g. Credits, Loans)' },
      { value: 'INCOME', label: 'Income (e.g. Sales)' },
      { value: 'EXPENSE', label: 'Expense (e.g. Rent, Salaries)' },
      { value: 'EQUITY', label: 'Equity (e.g. Capital)' },
    ],
  },
  { name: 'openingBalance', label: 'Opening Balance', type: 'number', defaultValue: 0 },
  { name: 'description', label: 'Description', multiline: true },
];

function AccountMasterPage() {
  const dispatch = useDispatch();
  const accounts = useSelector((state) => state.masters.accounts || []);
  const loading = useSelector((state) => state.masters.loading);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchMasters('accounts'));
  }, [dispatch]);

  const handleSubmit = (data) => {
    dispatch(addMasterRecord({ entityKey: 'accounts', record: data }));
    setOpenDialog(false);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Chart of Accounts
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Manage your ledger accounts (Banks, Cash, Expenses, etc.)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Add New Account
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Account Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Opening Balance</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No accounts found. Add your bank accounts here.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((acc) => (
                  <TableRow key={acc._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{acc.name}</TableCell>
                    <TableCell>{acc.code}</TableCell>
                    <TableCell>
                      <Chip label={acc.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">₹{acc.openingBalance?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={acc.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={acc.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <MasterFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        fields={accountFields}
        title="Add Ledger Account"
        submitLabel="Create Account"
      />
    </Box>
  );
}

export default AccountMasterPage;
