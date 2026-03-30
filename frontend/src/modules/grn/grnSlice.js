import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchGrns = createAsyncThunk('grn/fetchGrns', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/grn');
    return response.data.grns || response.data.data || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch GRNs');
  }
});

export const addGrn = createAsyncThunk('grn/addGrn', async (grnData, { rejectWithValue }) => {
  try {
    const response = await api.post('/grn', grnData);
    return response.data.grn || response.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create GRN');
  }
});

const grnSlice = createSlice({
  name: 'grn',
  initialState: {
    records: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGrns.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGrns.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchGrns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addGrn.pending, (state) => {
        state.loading = true;
      })
      .addCase(addGrn.fulfilled, (state, action) => {
        state.loading = false;
        state.records = [action.payload, ...state.records];
      })
      .addCase(addGrn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default grnSlice.reducer;
