import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Map backend GstSlab document -> UI tax rate row
const mapSlabToTaxRate = (slab) => {
  if (!slab) return slab;
  const percentage = Number(slab.percentage ?? 0);
  const isSplit = slab.type === 'CGST_SGST';
  const half = Number((percentage / 2).toFixed(2));

  return {
    id: slab._id ?? slab.id,
    name: slab.name,
    cgst: isSplit ? half : 0,
    sgst: isSplit ? half : 0,
    igst: isSplit ? percentage : percentage,
    effectiveFrom: slab.effectiveFrom || null,
    status: slab.isActive === false ? 'Inactive' : 'Active',
    raw: slab,
  };
};

// Build backend payload from UI tax rate form data
const buildSlabPayloadFromTaxRate = (taxRate) => {
  const cgst = Number(taxRate.cgst ?? 0);
  const sgst = Number(taxRate.sgst ?? 0);
  const igst = Number(taxRate.igst ?? 0);

  let percentage = igst || cgst + sgst;
  if (!Number.isFinite(percentage)) percentage = 0;

  const usesSplit = cgst > 0 || sgst > 0;
  const type = usesSplit ? 'CGST_SGST' : 'IGST';

  return {
    name: taxRate.name,
    percentage,
    type,
    isActive: taxRate.status !== 'Inactive',
  };
};

// Async Thunks
export const fetchGstSlabs = createAsyncThunk('gst/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/gst');
    const data = response.data;
    const rawSlabs = data.gstSlabs || data.slabs || data.data || [];
    return Array.isArray(rawSlabs) ? rawSlabs : [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addGstSlab = createAsyncThunk('gst/add', async (gstData, { rejectWithValue }) => {
  try {
    const payload = buildSlabPayloadFromTaxRate(gstData);
    const response = await api.post('/gst', payload);
    const data = response.data;
    const slab = data.gstSlab || data.slab || data.data;
    return slab;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateTaxRate = createAsyncThunk('gst/update', async ({ id, taxRate }, { rejectWithValue }) => {
  try {
    const payload = buildSlabPayloadFromTaxRate(taxRate);
    const response = await api.patch(`/gst/${id}`, payload);
    const data = response.data;
    const slab = data.gstSlab || data.slab || data.data;
    return slab;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const setTaxRateStatus = createAsyncThunk('gst/setStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/gst/${id}`, { isActive: status !== 'Inactive' });
    const data = response.data;
    const slab = data.gstSlab || data.slab || data.data;
    return slab;
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
        state.taxRates = action.payload.map(mapSlabToTaxRate);
      })
      .addCase(fetchGstSlabs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addGstSlab.fulfilled, (state, action) => {
        state.taxRates.unshift(mapSlabToTaxRate(action.payload));
      })
      .addCase(updateTaxRate.fulfilled, (state, action) => {
        const updated = mapSlabToTaxRate(action.payload);
        const index = state.taxRates.findIndex((r) => r.id === updated.id);
        if (index !== -1) {
          state.taxRates[index] = updated;
        }
      })
      .addCase(setTaxRateStatus.fulfilled, (state, action) => {
        const updated = mapSlabToTaxRate(action.payload);
        const index = state.taxRates.findIndex((r) => r.id === updated.id);
        if (index !== -1) {
          state.taxRates[index] = updated;
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
