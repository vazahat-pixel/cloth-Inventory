import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchBankReceipts = createAsyncThunk('accounts/fetchBankReceipts', async (_, { rejectWithValue }) => {
  try {
    // Placeholder: Backend doesn't have bank-receipts endpoint yet
    // const response = await api.get('/accounts/bank-receipts');
    // return response.data.data || [];
    return [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch bank receipts');
  }
});

export const fetchBankPayments = createAsyncThunk('accounts/fetchBankPayments', async (_, { rejectWithValue }) => {
  try {
    // Placeholder: Backend doesn't have bank-payments endpoint yet
    return [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch bank payments');
  }
});

const initialState = {
  bankReceipts: [],
  bankPayments: [],
  loading: false,
  error: null,
};

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBankReceipts.fulfilled, (state, action) => {
        state.bankReceipts = action.payload;
      })
      .addCase(fetchBankPayments.fulfilled, (state, action) => {
        state.bankPayments = action.payload;
      });
  },
});

export default accountsSlice.reducer;
