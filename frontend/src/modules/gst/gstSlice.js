import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchGstSlabs = createAsyncThunk('gst/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/gst');
    return response.data.gstSlabs || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addGstSlab = createAsyncThunk('gst/add', async (gstData, { rejectWithValue }) => {
  try {
    const response = await api.post('/gst', gstData);
    return response.data.gstSlab || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateTaxRate = createAsyncThunk('gst/update', async ({ id, taxRate }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/gst/${id}`, taxRate);
    return response.data.gstSlab || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const setTaxRateStatus = createAsyncThunk('gst/setStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/gst/${id}`, { status });
    return response.data.gstSlab || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Backwards-compatible alias for components expecting addTaxRate
export const addTaxRate = addGstSlab;

// Tax group management
export const addTaxGroup = createAsyncThunk('gst/addGroup', async (group, { rejectWithValue }) => {
  try {
    const response = await api.post('/gst/groups', group);
    return response.data.group || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateTaxGroup = createAsyncThunk('gst/updateGroup', async ({ id, taxGroup }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/gst/groups/${id}`, taxGroup);
    return response.data.group || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const setTaxGroupStatus = createAsyncThunk('gst/setGroupStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/gst/groups/${id}`, { status });
    return response.data.group || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchGstSummary = createAsyncThunk('gst/fetchSummary', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/reports/gst-summary', { params });
    return response.data.report || response.data.data || {};
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  taxRates: [],
  taxGroups: [],
  summary: { sales: {}, purchases: {} },
  loading: false,
  error: null,
};

const gstSlice = createSlice({
  name: 'gst',
  initialState,
  reducers: {
    clearGstError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGstSlabs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGstSlabs.fulfilled, (state, action) => {
        state.loading = false;
        state.taxRates = action.payload; // Mapping slabs to taxRates for compatibility
      })
      .addCase(fetchGstSlabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addGstSlab.fulfilled, (state, action) => {
        state.taxRates.unshift(action.payload);
      })
      .addCase(updateTaxRate.fulfilled, (state, action) => {
        const index = state.taxRates.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.taxRates[index] = action.payload;
        }
      })
      .addCase(setTaxRateStatus.fulfilled, (state, action) => {
        const index = state.taxRates.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.taxRates[index] = action.payload;
        }
      })
      .addCase(addTaxGroup.fulfilled, (state, action) => {
        state.taxGroups.unshift(action.payload);
      })
      .addCase(updateTaxGroup.fulfilled, (state, action) => {
        const index = state.taxGroups.findIndex((g) => g.id === action.payload.id || g._id === action.payload._id);
        if (index !== -1) {
          state.taxGroups[index] = action.payload;
        }
      })
      .addCase(setTaxGroupStatus.fulfilled, (state, action) => {
        const index = state.taxGroups.findIndex((g) => g.id === action.payload.id || g._id === action.payload._id);
        if (index !== -1) {
          state.taxGroups[index] = action.payload;
        }
      })
      .addCase(fetchGstSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const { clearGstError } = gstSlice.actions;
export default gstSlice.reducer;
