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

export const fetchGrnById = createAsyncThunk('grn/fetchGrnById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/grn/${id}`);
    return response.data.grn || response.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch GRN');
  }
});

export const fetchNextGrnNumber = createAsyncThunk('grn/fetchNextNumber', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/grn/suggested-number');
    return response.data.nextNumber || response.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch next GRN number');
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

export const approveGrn = createAsyncThunk('grn/approveGrn', async (id, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/grn/${id}/approve`);
    return response.data.grn || response.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to approve GRN');
  }
});

export const updateGrn = createAsyncThunk('grn/updateGrn', async ({ id, updateData }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/grn/${id}`, updateData);
    return response.data.grn || response.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update GRN');
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
      })
      .addCase(fetchGrnById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGrnById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.records.findIndex(r => (r._id || r.id) === (action.payload._id || action.payload.id));
        if (index !== -1) state.records[index] = action.payload;
        else state.records.push(action.payload);
      })
      .addCase(approveGrn.fulfilled, (state, action) => {
        const index = state.records.findIndex(r => (r._id || r.id) === (action.payload._id || action.payload.id));
        if (index !== -1) state.records[index] = action.payload;
      })
      .addCase(updateGrn.fulfilled, (state, action) => {
        const index = state.records.findIndex(r => (r._id || r.id) === (action.payload._id || action.payload.id));
        if (index !== -1) state.records[index] = action.payload;
      });
  },
});

export default grnSlice.reducer;
