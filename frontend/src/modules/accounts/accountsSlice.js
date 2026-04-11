import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchVouchers = createAsyncThunk('accounts/fetchVouchers', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/accounts/vouchers', { params });
    return response.data; // { success, vouchers, total, page, limit }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch vouchers');
  }
});

export const addVoucher = createAsyncThunk('accounts/addVoucher', async (voucherData, { rejectWithValue }) => {
  try {
    const response = await api.post('/accounts/vouchers', voucherData);
    return response.data.voucher;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create voucher');
  }
});

export const fetchBankReceipts = createAsyncThunk('accounts/fetchBankReceipts', async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts/vouchers', { params: { type: 'BANK_RECEIPT' } });
      return response.data.vouchers || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bank receipts');
    }
});

export const fetchBankPayments = createAsyncThunk('accounts/fetchBankPayments', async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/accounts/vouchers', { params: { type: 'BANK_PAYMENT' } });
      return response.data.vouchers || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bank payments');
    }
});

const initialState = {
  vouchers: [],
  bankReceipts: [],
  bankPayments: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
};

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    clearAccountsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Vouchers
      .addCase(fetchVouchers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVouchers.fulfilled, (state, action) => {
        state.loading = false;
        state.vouchers = action.payload.vouchers;
        state.total = action.payload.total;
      })
      .addCase(fetchVouchers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Voucher
      .addCase(addVoucher.fulfilled, (state, action) => {
        state.vouchers.unshift(action.payload);
      })
      // Receipts Case
      .addCase(fetchBankReceipts.fulfilled, (state, action) => {
        state.bankReceipts = action.payload;
      })
      // Payments Case
      .addCase(fetchBankPayments.fulfilled, (state, action) => {
        state.bankPayments = action.payload;
      });
  },
});

export const { clearAccountsError } = accountsSlice.actions;
export default accountsSlice.reducer;
