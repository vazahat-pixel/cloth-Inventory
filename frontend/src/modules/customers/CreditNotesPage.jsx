import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
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
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { addCreditNote } from './customersSlice';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function CreditNotesPage() {
  const dispatch = useDispatch();
  const creditNotes = useSelector((state) => state.customerRewards.creditNotes);
  const customers = useSelector((state) => state.masters.customers);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState(null);

  const customerMap = useMemo(
    () => customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}),
    [customers],
  );

  const creditSummary = useMemo(() => {
    const summary = {};
    creditNotes.forEach((note) => {
      const cusId = note.customerId;
      if (!summary[cusId]) {
        const cus = customerMap[cusId];
        summary[cusId] = {
          customerId: cusId,
          customerName: cus?.customerName || 'Unknown',
          mobileNumber: cus?.mobileNumber || '',
          creditBalance: 0,
          totalAvailable: 0,
          totalUsed: 0,
          lastActivity: null,
          notes: [],
        };
      }
      if (note.status === 'Available') {
        summary[cusId].creditBalance += toNum(note.amount);
        summary[cusId].totalAvailable += toNum(note.amount);
      } else {
        summary[cusId].totalUsed += toNum(note.amount);
      }
      summary[cusId].notes.push(note);
      const noteDate = note.usedDate || note.issueDate;
      if (
        !summary[cusId].lastActivity ||
        (noteDate && noteDate > summary[cusId].lastActivity)
      ) {
        summary[cusId].lastActivity = noteDate;
      }
    });
    return Object.values(summary);
  }, [creditNotes, customerMap]);

  const filteredSummary = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return creditSummary.filter((row) => {
      const matchesSearch =
        !query ||
        row.customerName.toLowerCase().includes(query) ||
        (row.mobileNumber || '').includes(searchText.trim());
      return matchesSearch;
    });
  }, [creditSummary, searchText]);

  const paginatedSummary = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSummary.slice(start, start + rowsPerPage);
  }, [filteredSummary, page, rowsPerPage]);

  const filteredNotes = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return creditNotes.filter((row) => {
      const cus = customerMap[row.customerId];
      const matchesSearch =
        !query ||
        row.reason?.toLowerCase().includes(query) ||
        (cus?.customerName || '').toLowerCase().includes(query) ||
        (cus?.mobileNumber || '').includes(searchText.trim());
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [creditNotes, searchText, statusFilter, customerMap]);

  const paginatedNotes = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredNotes.slice(start, start + rowsPerPage);
  }, [filteredNotes, page, rowsPerPage]);

  const [activeTab, setActiveTab] = useState('notes');

  const displayNotes = activeTab === 'notes';
  const displayRows = displayNotes ? paginatedNotes : paginatedSummary;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerId: '',
      amount: '',
      issueDate: new Date().toISOString().slice(0, 10),
      reason: '',
    },
  });

  const onSubmit = (values) => {
    const amountVal = toNum(values.amount);
    if (!values.customerId) return;
    if (amountVal <= 0) return;
    dispatch(
      addCreditNote({
        customerId: values.customerId,
        amount: amountVal,
        issueDate: values.issueDate,
        reason: values.reason?.trim() || 'Credit note',
        status: 'Available',
      }),
    );
    setDialogOpen(false);
    reset();
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
                Credit Notes
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Manage customer credit balances and credit notes.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add Credit Note
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button
              variant={activeTab === 'notes' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setActiveTab('notes')}
            >
              Credit Notes
            </Button>
            <Button
              variant={activeTab === 'summary' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setActiveTab('summary')}
            >
              Customer Summary
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              value={searchText}
              onChange={(e) => {
                setPage(0);
                setSearchText(e.target.value);
              }}
              placeholder={
                activeTab === 'notes'
                  ? 'Search by customer or reason'
                  : 'Search by name or mobile'
              }
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {activeTab === 'notes' && (
              <TextField
                size="small"
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setPage(0);
                  setStatusFilter(e.target.value);
                }}
                sx={{ minWidth: 140 }}
                SelectProps={{ native: true }}
              >
                <option value="all">All</option>
                <option value="Available">Available</option>
                <option value="Used">Used</option>
              </TextField>
            )}
          </Stack>
        </Stack>

        {displayNotes ? (
          filteredNotes.length ? (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Issue Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedNotes.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {customerMap[row.customerId]?.customerName || row.customerId}
                        </TableCell>
                        <TableCell align="right">₹{toNum(row.amount).toFixed(2)}</TableCell>
                        <TableCell>{row.issueDate || '-'}</TableCell>
                        <TableCell>{row.reason || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={row.status === 'Available' ? 'success' : 'default'}
                            variant="outlined"
                            label={row.status}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() =>
                              setDetailCustomer(
                                creditSummary.find((s) => s.customerId === row.customerId) || {
                                  customerId: row.customerId,
                                  customerName: customerMap[row.customerId]?.customerName,
                                  mobileNumber: customerMap[row.customerId]?.mobileNumber,
                                  creditBalance: 0,
                                  notes: creditNotes.filter((n) => n.customerId === row.customerId),
                                },
                              )
                            }
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredNotes.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </>
          ) : (
            <Box sx={{ py: 7, textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                No credit notes found.
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                Add credit notes to grant store credit to customers.
              </Typography>
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                Add Credit Note
              </Button>
            </Box>
          )
        ) : filteredSummary.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Credit Balance
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Activity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSummary.map((row) => (
                    <TableRow key={row.customerId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.customerName}</TableCell>
                      <TableCell>{row.mobileNumber}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        ₹{toNum(row.creditBalance).toFixed(2)}
                      </TableCell>
                      <TableCell>{row.lastActivity || '-'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => setDetailCustomer(row)}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredSummary.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </>
        ) : (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              No customer credit summary.
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Credit Note</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                select
                label="Customer"
                {...register('customerId', { required: 'Customer is required.' })}
                error={Boolean(errors.customerId)}
                helperText={errors.customerId?.message || ' '}
                SelectProps={{ native: true }}
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Credit Amount (₹)"
                {...register('amount', { required: 'Amount is required.', min: 0.01 })}
                error={Boolean(errors.amount)}
                helperText={errors.amount?.message || ' '}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Issue Date"
                InputLabelProps={{ shrink: true }}
                {...register('issueDate', { required: true })}
              />
              <TextField
                fullWidth
                size="small"
                label="Reason"
                {...register('reason')}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
              Add
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {detailCustomer && (
        <CreditDetailDialog
          open={Boolean(detailCustomer)}
          onClose={() => setDetailCustomer(null)}
          customer={detailCustomer}
          customerMap={customerMap}
        />
      )}
    </>
  );
}

function CreditDetailDialog({ open, onClose, customer, customerMap }) {
  if (!customer) return null;
  const notes = customer.notes || [];

  return (
    <Box
      component="div"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0,0,0,0.5)',
        zIndex: 1300,
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
      onClick={onClose}
    >
      <Paper
        elevation={4}
        sx={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto', p: 3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          Credit Details — {customer.customerName}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Mobile: {customer.mobileNumber || '-'} | Balance: ₹
          {Number(customer.creditBalance || 0).toFixed(2)}
        </Typography>
        {notes.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Issue Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Used</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notes.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>₹{toNum(n.amount).toFixed(2)}</TableCell>
                    <TableCell>{n.issueDate || '-'}</TableCell>
                    <TableCell>{n.reason || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={n.status === 'Available' ? 'success' : 'default'}
                        variant="outlined"
                        label={n.status}
                      />
                    </TableCell>
                    <TableCell>
                      {n.status === 'Used' && n.usedInvoice
                        ? `${n.usedDate || '-'} (${n.usedInvoice})`
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" sx={{ color: '#64748b', py: 2 }}>
            No credit notes.
          </Typography>
        )}
        <Button variant="outlined" onClick={onClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Paper>
    </Box>
  );
}

export default CreditNotesPage;
