import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const initiateStockReturn = createAsyncThunk(
  'stockReturn/initiate',
  async (returnData, { rejectWithValue }) => {
    try {
      const response = await api.post('/stock-returns', returnData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initiate return');
    }
  }
);

export const fetchStockReturns = createAsyncThunk(
  'stockReturn/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/stock-returns', { params });
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch returns');
    }
  }
);

export const receiveStockReturn = createAsyncThunk(
  'stockReturn/receive',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post(`/stock-returns/${id}/receive`);
      dispatch(fetchStockReturns());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to receive return');
    }
  }
);

const stockReturnSlice = createSlice({
  name: 'stockReturn',
  initialState: {
    returns: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearReturnError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockReturns.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStockReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.returns = action.payload;
      })
      .addCase(fetchStockReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(initiateStockReturn.pending, (state) => {
        state.loading = true;
      })
      .addCase(initiateStockReturn.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(initiateStockReturn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReturnError } = stockReturnSlice.actions;
export default stockReturnSlice.reducer;
