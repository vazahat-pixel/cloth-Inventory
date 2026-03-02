import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchLoyaltyConfig = createAsyncThunk('customerRewards/fetchConfig', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/customers/loyalty');
    return response.data.config || response.data.data || {};
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateLoyaltyConfig = createAsyncThunk('customerRewards/updateConfig', async (config, { rejectWithValue }) => {
  try {
    const response = await api.patch('/customers/loyalty', config);
    return response.data.config || response.data.data || config;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchLoyaltyTransactions = createAsyncThunk('customerRewards/fetchLoyaltyHistory', async (customerId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/customers/loyalty/history/${customerId}`);
    return response.data.transactions || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchCreditNotes = createAsyncThunk('customerRewards/fetchCreditNotes', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/credit-notes');
    return response.data.creditNotes || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addCreditNote = createAsyncThunk('customerRewards/addCreditNote', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/credit-notes', data);
    return response.data.creditNote || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const redeemVoucher = createAsyncThunk('customerRewards/redeemVoucher', async ({ id, redeemedDate, redeemedInvoice, customerId }, { rejectWithValue }) => {
  try {
    const payload = { redeemedDate, redeemedInvoice, customerId };
    const response = await api.patch(`/customers/vouchers/${id}/redeem`, payload);
    return response.data.voucher || response.data.data || { id, ...payload, status: 'Redeemed' };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addVoucher = createAsyncThunk('customerRewards/addVoucher', async (voucher, { rejectWithValue }) => {
  try {
    const response = await api.post('/customers/vouchers', voucher);
    return response.data.voucher || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addVouchersBulk = createAsyncThunk('customerRewards/addVouchersBulk', async (vouchers, { dispatch, rejectWithValue }) => {
  try {
    const created = [];
    for (const voucher of vouchers) {
      const result = await dispatch(addVoucher(voucher)).unwrap();
      created.push(result);
    }
    return created;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to create vouchers in bulk');
  }
});

const initialState = {
  loyaltyConfig: {},
  loyaltyTransactions: [],
  vouchers: [],
  creditNotes: [],
  loading: false,
  error: null,
};

const customerRewardsSlice = createSlice({
  name: 'customerRewards',
  initialState,
  reducers: {
    clearRewardsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoyaltyConfig.fulfilled, (state, action) => {
        state.loyaltyConfig = action.payload;
      })
      .addCase(updateLoyaltyConfig.fulfilled, (state, action) => {
        state.loyaltyConfig = action.payload;
      })
      .addCase(fetchLoyaltyTransactions.fulfilled, (state, action) => {
        state.loyaltyTransactions = action.payload;
      })
      .addCase(fetchCreditNotes.fulfilled, (state, action) => {
        state.creditNotes = action.payload;
      })
      .addCase(addCreditNote.fulfilled, (state, action) => {
        state.creditNotes.unshift(action.payload);
      })
      .addCase(redeemVoucher.fulfilled, (state, action) => {
        const index = state.vouchers.findIndex((v) => v.id === action.payload.id || v._id === action.payload._id);
        if (index !== -1) {
          state.vouchers[index] = {
            ...state.vouchers[index],
            ...action.payload,
            status: action.payload.status || 'Redeemed',
          };
        }
      })
      .addCase(addVoucher.fulfilled, (state, action) => {
        state.vouchers.unshift(action.payload);
      })
      .addCase(addVouchersBulk.fulfilled, (state, action) => {
        state.vouchers = [...action.payload, ...state.vouchers];
      });
  },
});

export const { clearRewardsError } = customerRewardsSlice.actions;
export default customerRewardsSlice.reducer;
