import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CasinoIcon from '@mui/icons-material/Casino';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { addCoupon, addCouponsBulk, updateCoupon } from './pricingSlice';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const generateRandomCode = (len = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

function CouponPage() {
  const dispatch = useDispatch();
  const coupons = useSelector((state) => state.pricing.coupons);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return coupons.filter((row) => {
      const matchesSearch = query ? row.code.toLowerCase().includes(query) : true;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchText, statusFilter]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleOpenNew = () => {
    setEditingCoupon(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCoupon(null);
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
                Coupons
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Manage coupon codes for percentage and flat discounts on billing.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleOpenNew}
              >
                Add Coupon
              </Button>
              <Button
                variant="outlined"
                onClick={() => setBulkOpen((o) => !o)}
                endIcon={<ExpandMoreIcon sx={{ transform: bulkOpen ? 'rotate(180deg)' : 'none' }} />}
              >
                Bulk (Prefix + Range)
              </Button>
            </Stack>
          </Stack>

          <Collapse in={bulkOpen}>
            <BulkCreateSection
              coupons={coupons}
              dispatch={dispatch}
              addCouponsBulk={addCouponsBulk}
              onSuccess={() => setBulkOpen(false)}
              onError={setBulkError}
            />
          </Collapse>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              value={searchText}
              onChange={(e) => {
                setPage(0);
                setSearchText(e.target.value);
              }}
              placeholder="Search by coupon code"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
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
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </TextField>
          </Stack>
        </Stack>

        {filteredRows.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Coupon Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Discount Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Discount Value
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Min Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Usage</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        {row.code}
                      </TableCell>
                      <TableCell>
                        {row.discountType === 'percentage' ? 'Percentage' : 'Amount'}
                      </TableCell>
                      <TableCell align="right">
                        {row.discountType === 'percentage'
                          ? `${row.value}%`
                          : `₹${toNum(row.value).toFixed(2)}`}
                      </TableCell>
                      <TableCell align="right">₹{toNum(row.minAmount).toFixed(2)}</TableCell>
                      <TableCell>
                        {row.usageCount ?? 0} / {row.usageLimit ?? '∞'}
                      </TableCell>
                      <TableCell>{row.expiry || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={row.status === 'Active' ? 'success' : 'default'}
                          variant="outlined"
                          label={row.status}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(row)}
                        >
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
              count={filteredRows.length}
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
              No coupons found.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Create coupon codes to offer discounts on sales.
            </Typography>
            <Button variant="contained" onClick={handleOpenNew}>
              Add Coupon
            </Button>
          </Box>
        )}
      </Paper>

      {bulkError && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setBulkError('')}>
          {bulkError}
        </Alert>
      )}

      <CouponDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        coupon={editingCoupon}
        onSave={() => {
          handleCloseDialog();
        }}
      />
    </>
  );
}

function BulkCreateSection({ coupons, dispatch, addCouponsBulk, onSuccess, onError }) {
  const [prefix, setPrefix] = useState('CPN');
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(50);
  const [discountType, setDiscountType] = useState('percentage');
  const [value, setValue] = useState('');
  const [minAmount, setMinAmount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(1000);
  const [expiry, setExpiry] = useState('');

  const handleBulkCreate = () => {
    onError('');
    const val = toNum(value);
    if (val <= 0) {
      onError('Discount value must be greater than 0.');
      return;
    }
    if (discountType === 'percentage' && val > 100) {
      onError('Percentage must be ≤ 100.');
      return;
    }
    const from = Math.max(0, toNum(rangeFrom));
    const to = Math.max(from, Math.min(9999, toNum(rangeTo)));
    if (to - from + 1 > 500) {
      onError('Range too large (max 500 coupons).');
      return;
    }
    const pfx = (prefix || 'CPN').trim().toUpperCase();
    const existingCodes = new Set(coupons.map((c) => c.code));
    const newCoupons = [];
    for (let n = from; n <= to; n++) {
      const padded = String(n).padStart(3, '0');
      const code = `${pfx}-${padded}`;
      if (existingCodes.has(code) || newCoupons.some((c) => c.code === code)) {
        onError(`Code ${code} already exists.`);
        return;
      }
      newCoupons.push({
        code,
        discountType,
        value: val,
        minAmount: toNum(minAmount),
        usageLimit: toNum(usageLimit, 1000),
        expiry: expiry || null,
        status: 'Active',
      });
    }
    dispatch(addCouponsBulk(newCoupons));
    onSuccess();
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f8fafc' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
        Bulk Create (Prefix + Range)
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          label="Prefix"
          value={prefix}
          onChange={(e) => setPrefix((e.target.value || 'CPN').toUpperCase().slice(0, 8))}
          sx={{ width: 90 }}
          inputProps={{ maxLength: 8 }}
        />
        <TextField
          size="small"
          type="number"
          label="From"
          value={rangeFrom}
          onChange={(e) => setRangeFrom(Math.max(0, toNum(e.target.value, 0)))}
          sx={{ width: 90 }}
          inputProps={{ min: 0, max: 9999 }}
        />
        <TextField
          size="small"
          type="number"
          label="To"
          value={rangeTo}
          onChange={(e) => setRangeTo(Math.max(0, toNum(e.target.value, 0)))}
          sx={{ width: 90 }}
          inputProps={{ min: 0, max: 9999 }}
        />
        <TextField
          size="small"
          select
          label="Discount Type"
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value)}
          sx={{ width: 140 }}
          SelectProps={{ native: true }}
        >
          <option value="percentage">Percentage</option>
          <option value="amount">Amount</option>
        </TextField>
        <TextField
          size="small"
          type="number"
          label={discountType === 'percentage' ? 'Discount %' : 'Discount (₹)'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          sx={{ width: 120 }}
          inputProps={{ min: 0, step: discountType === 'percentage' ? 0.1 : 1 }}
        />
        <TextField
          size="small"
          type="number"
          label="Min Amount (₹)"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          sx={{ width: 120 }}
          inputProps={{ min: 0 }}
        />
        <TextField
          size="small"
          type="date"
          label="Expiry"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" color="secondary" onClick={handleBulkCreate}>
          Create {prefix || 'CPN'}-{String(rangeFrom).padStart(3, '0')} to {prefix || 'CPN'}-{String(rangeTo).padStart(3, '0')}
        </Button>
      </Stack>
    </Paper>
  );
}

function CouponDialog({ open, onClose, coupon, onSave }) {
  const dispatch = useDispatch();
  const isEdit = Boolean(coupon);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: '',
      discountType: 'percentage',
      value: '',
      minAmount: 0,
      usageLimit: 1000,
      expiry: '',
      status: 'Active',
    },
  });

  const handleGenerateCode = () => {
    setValue('code', generateRandomCode(8));
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values) => {
    const payload = {
      code: values.code.trim().toUpperCase(),
      discountType: values.discountType,
      value: toNum(values.value),
      minAmount: toNum(values.minAmount),
      usageLimit: toNum(values.usageLimit, 1000),
      expiry: values.expiry || null,
      status: values.status,
    };

    if (isEdit && coupon) {
      dispatch(updateCoupon({ id: coupon.id, coupon: { ...payload, usageCount: coupon.usageCount } }));
    } else {
      dispatch(addCoupon(payload));
    }
    onSave();
    handleClose();
  };

  useEffect(() => {
    if (!open) return;
    if (isEdit && coupon) {
      reset({
        code: coupon.code,
        discountType: coupon.discountType || 'percentage',
        value: coupon.value ?? '',
        minAmount: coupon.minAmount ?? 0,
        usageLimit: coupon.usageLimit ?? 1000,
        expiry: coupon.expiry || '',
        status: coupon.status || 'Active',
      });
    } else {
      reset({
        code: '',
        discountType: 'percentage',
        value: '',
        minAmount: 0,
        usageLimit: 1000,
        expiry: '',
        status: 'Active',
      });
    }
  }, [open, isEdit, coupon, reset]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>
        {isEdit ? 'Edit Coupon' : 'New Coupon'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  fullWidth
                  size="small"
                  label="Coupon Code"
                  {...register('code', { required: 'Coupon code is required.' })}
                  error={Boolean(errors.code)}
                  helperText={errors.code?.message || ' '}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
                {!isEdit && (
                  <Button
                    variant="outlined"
                    startIcon={<CasinoIcon />}
                    onClick={handleGenerateCode}
                    sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
                  >
                    Generate
                  </Button>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Discount Type"
                {...register('discountType')}
                SelectProps={{ native: true }}
              >
                <option value="percentage">Percentage</option>
                <option value="amount">Amount</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={watch('discountType') === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}
                {...register('value', {
                  required: 'Value is required.',
                  min: { value: 0, message: 'Must be ≥ 0' },
                  max:
                    watch('discountType') === 'percentage'
                      ? { value: 100, message: 'Must be ≤ 100' }
                      : undefined,
                })}
                error={Boolean(errors.value)}
                helperText={errors.value?.message || ' '}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Minimum Bill Amount (₹)"
                {...register('minAmount', { min: 0 })}
                error={Boolean(errors.minAmount)}
                helperText={errors.minAmount?.message || ' '}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Usage Limit"
                {...register('usageLimit', { min: 1 })}
                error={Boolean(errors.usageLimit)}
                helperText={errors.usageLimit?.message || ' '}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Expiry Date"
                InputLabelProps={{ shrink: true }}
                {...register('expiry')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Status"
                {...register('status')}
                SelectProps={{ native: true }}
              >
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
              </TextField>
            </Grid>
          </Grid>
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

export default CouponPage;
