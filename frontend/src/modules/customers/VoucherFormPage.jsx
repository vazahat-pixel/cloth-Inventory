import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CasinoIcon from '@mui/icons-material/Casino';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { addVoucher, addVouchersBulk } from './customersSlice';

const generateId = () => 'vch-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const generateVoucherCode = (len = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GV-';
  for (let i = 0; i < len; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function VoucherFormPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const vouchers = useSelector((state) => state.customerRewards.vouchers);
  const customers = useSelector((state) => state.masters.customers || []);

  const [formError, setFormError] = useState('');
  const [bulkMode, setBulkMode] = useState('count'); // 'count' | 'range'
  const [bulkCount, setBulkCount] = useState(1);
  const [bulkPrefix, setBulkPrefix] = useState('GV');
  const [bulkRangeFrom, setBulkRangeFrom] = useState(1);
  const [bulkRangeTo, setBulkRangeTo] = useState(50);
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkIssueDate, setBulkIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [bulkExpiryDate, setBulkExpiryDate] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: '',
      amount: '',
      issueDate: new Date().toISOString().slice(0, 10),
      expiryDate: '',
      status: 'Active',
      customerId: '',
    },
  });

  const handleGenerateCode = () => {
    const existingCodes = new Set(vouchers.map((v) => v.code));
    let newCode = generateVoucherCode();
    let attempts = 0;
    while (existingCodes.has(newCode) && attempts < 20) {
      newCode = generateVoucherCode();
      attempts++;
    }
    setValue('code', newCode);
  };

  const validateDates = (from, to) => {
    if (!from || !to) return true;
    return new Date(from) <= new Date(to);
  };

  const onSubmit = (values) => {
    setFormError('');
    const amountVal = toNum(values.amount);
    if (!values.code?.trim()) {
      setFormError('Voucher code is required.');
      return;
    }
    if (amountVal <= 0) {
      setFormError('Amount must be greater than 0.');
      return;
    }
    const existing = vouchers.find((v) => v.code.toLowerCase() === values.code.trim().toLowerCase());
    if (existing) {
      setFormError('A voucher with this code already exists.');
      return;
    }
    if (!validateDates(values.issueDate, values.expiryDate)) {
      setFormError('Expiry date must be on or after issue date.');
      return;
    }

    const voucher = {
      id: generateId(),
      code: values.code.trim().toUpperCase(),
      amount: amountVal,
      issueDate: values.issueDate || null,
      expiryDate: values.expiryDate || null,
      status: values.status,
      customerId: values.customerId || null,
    };
    dispatch(addVoucher(voucher));
    navigate('/customers/vouchers');
  };

  const handleBulkCreate = () => {
    setFormError('');
    const amount = toNum(bulkAmount);
    if (amount <= 0) {
      setFormError('Bulk amount must be greater than 0.');
      return;
    }
    if (!validateDates(bulkIssueDate, bulkExpiryDate)) {
      setFormError('Bulk: Expiry date must be on or after issue date.');
      return;
    }

    const existingCodes = new Set(vouchers.map((v) => v.code));
    const newVouchers = [];
    const prefix = (bulkPrefix || 'GV').trim().toUpperCase();

    if (bulkMode === 'range') {
      const from = Math.max(0, toNum(bulkRangeFrom));
      const to = Math.max(from, Math.min(9999, toNum(bulkRangeTo)));
      if (to - from + 1 > 500) {
        setFormError('Range too large (max 500 vouchers).');
        return;
      }
      for (let n = from; n <= to; n++) {
        const padded = String(n).padStart(3, '0');
        const code = `${prefix}-${padded}`;
        if (existingCodes.has(code) || newVouchers.some((v) => v.code === code)) {
          setFormError(`Code ${code} already exists.`);
          return;
        }
        newVouchers.push({
          id: generateId(),
          code,
          amount,
          issueDate: bulkIssueDate || null,
          expiryDate: bulkExpiryDate || null,
          status: 'Active',
          customerId: null,
        });
      }
    } else {
      const count = Math.min(Math.max(1, toNum(bulkCount)), 200);
      for (let i = 0; i < count; i++) {
        let newCode = generateVoucherCode();
        let attempts = 0;
        while (existingCodes.has(newCode) || newVouchers.some((v) => v.code === newCode)) {
          newCode = generateVoucherCode();
          attempts++;
          if (attempts > 50) break;
        }
        newVouchers.push({
          id: generateId(),
          code: newCode,
          amount,
          issueDate: bulkIssueDate || null,
          expiryDate: bulkExpiryDate || null,
          status: 'Active',
          customerId: null,
        });
      }
    }

    dispatch(addVouchersBulk(newVouchers));
    navigate('/customers/vouchers');
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              Issue Gift Voucher
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Create single or bulk vouchers.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers/vouchers')}>
            Back
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Single Voucher
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                label="Voucher Code"
                {...register('code', { required: 'Code is required.' })}
                error={Boolean(errors.code)}
                helperText={errors.code?.message || ' '}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
              <Button
                variant="outlined"
                startIcon={<CasinoIcon />}
                onClick={handleGenerateCode}
                sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
              >
                Generate
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Amount (₹)"
              {...register('amount', { required: 'Amount is required.', min: 1 })}
              error={Boolean(errors.amount)}
              helperText={errors.amount?.message || ' '}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Issue Date"
              InputLabelProps={{ shrink: true }}
              {...register('issueDate')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Expiry Date"
              InputLabelProps={{ shrink: true }}
              {...register('expiryDate')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Customer (optional)"
              {...register('customerId')}
            >
              <MenuItem value="">None</MenuItem>
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.customerName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
              Create Voucher
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Bulk Create
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant={bulkMode === 'count' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setBulkMode('count')}
          >
            By Count
          </Button>
          <Button
            variant={bulkMode === 'range' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setBulkMode('range')}
          >
            Prefix + Range
          </Button>
        </Stack>
        <Grid container spacing={2}>
          {bulkMode === 'count' ? (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Number of Vouchers"
                value={bulkCount}
                onChange={(e) => setBulkCount(Math.max(1, Math.min(200, toNum(e.target.value, 1))))}
                inputProps={{ min: 1, max: 200 }}
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Prefix"
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix((e.target.value || 'GV').toUpperCase().slice(0, 8))}
                  placeholder="GV"
                  inputProps={{ maxLength: 8 }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="From"
                  value={bulkRangeFrom}
                  onChange={(e) => setBulkRangeFrom(Math.max(0, toNum(e.target.value, 0)))}
                  inputProps={{ min: 0, max: 9999 }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="To"
                  value={bulkRangeTo}
                  onChange={(e) => setBulkRangeTo(Math.max(0, toNum(e.target.value, 0)))}
                  inputProps={{ min: 0, max: 9999 }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Amount per Voucher (₹)"
              value={bulkAmount}
              onChange={(e) => setBulkAmount(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Issue Date"
              value={bulkIssueDate}
              onChange={(e) => setBulkIssueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Expiry Date"
              value={bulkExpiryDate}
              onChange={(e) => setBulkExpiryDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button variant="contained" color="secondary" onClick={handleBulkCreate}>
              {bulkMode === 'range'
                ? `Create ${bulkPrefix || 'GV'}-${String(bulkRangeFrom).padStart(3, '0')} to ${bulkPrefix || 'GV'}-${String(bulkRangeTo).padStart(3, '0')}`
                : `Create ${bulkCount} Voucher${bulkCount > 1 ? 's' : ''}`}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}
    </Box>
  );
}

export default VoucherFormPage;
