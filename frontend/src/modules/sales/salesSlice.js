import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks
export const fetchSales = createAsyncThunk('sales/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/sales');
    const raw = response.data.sales || response.data.data || [];
    return normalizeResponse(raw, 'sale');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addSale = createAsyncThunk('sales/add', async (saleData, { rejectWithValue }) => {
  try {
    const response = await api.post('/sales', saleData);
    const raw = response.data.sale || response.data.data;
    return normalizeResponse(raw, 'sale');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSalesReturns = createAsyncThunk('sales/fetchReturns', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/returns?type=CUSTOMER_RETURN');
    return response.data.returns || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addSalesReturn = createAsyncThunk('sales/addReturn', async (returnData, { rejectWithValue }) => {
  try {
    const response = await api.post('/returns', { ...returnData, type: 'CUSTOMER_RETURN' });
    const raw = response.data.returnEntry || response.data.data;
    return normalizeResponse(raw, 'return');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  records: [],
  returns: [],
  loading: false,
  error: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearSalesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Sales
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload || [];
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Sale
      .addCase(addSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSale.fulfilled, (state, action) => {
        state.loading = false;
        state.records.unshift(action.payload);
      })
      .addCase(addSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Returns
      .addCase(fetchSalesReturns.fulfilled, (state, action) => {
        state.returns = action.payload || [];
      })
      // Add Return
      .addCase(addSalesReturn.fulfilled, (state, action) => {
        state.returns.unshift(action.payload);
      });
  },
});

export const { clearSalesError } = salesSlice.actions;
export default salesSlice.reducer;
