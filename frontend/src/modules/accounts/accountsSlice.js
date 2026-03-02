import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchBankPayments = createAsyncThunk('accounts/fetchPayments', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/accounts/bank-payment');
    return response.data.payments || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchBankReceipts = createAsyncThunk('accounts/fetchReceipts', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/accounts/bank-receipt');
    return response.data.receipts || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addBankPayment = createAsyncThunk('accounts/addPayment', async (paymentData, { rejectWithValue }) => {
  try {
    const response = await api.post('/accounts/bank-payment', paymentData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addBankReceipt = createAsyncThunk('accounts/addReceipt', async (receiptData, { rejectWithValue }) => {
  try {
    const response = await api.post('/accounts/bank-receipt', receiptData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  bankPayments: [],
  bankReceipts: [],
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
      .addCase(fetchBankPayments.fulfilled, (state, action) => {
        state.bankPayments = action.payload;
      })
      .addCase(fetchBankReceipts.fulfilled, (state, action) => {
        state.bankReceipts = action.payload;
      })
      .addCase(addBankPayment.fulfilled, (state, action) => {
        state.bankPayments.unshift(action.payload);
      })
      .addCase(addBankReceipt.fulfilled, (state, action) => {
        state.bankReceipts.unshift(action.payload);
      });
  },
});

export const { clearAccountsError } = accountsSlice.actions;
export default accountsSlice.reducer;
