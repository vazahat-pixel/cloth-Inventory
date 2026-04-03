import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchRawMaterials = createAsyncThunk(
  'rawMaterial/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/raw-materials', { params: filters });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response.data.message || 'Failed to fetch raw materials');
    }
  }
);

export const addRawMaterial = createAsyncThunk(
  'rawMaterial/add',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/raw-materials', data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response.data.message || 'Failed to add raw material');
    }
  }
);

export const updateRawMaterial = createAsyncThunk(
  'rawMaterial/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/raw-materials/${id}`, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response.data.message || 'Failed to update raw material');
    }
  }
);

export const deleteRawMaterial = createAsyncThunk(
  'rawMaterial/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/raw-materials/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response.data.message || 'Failed to delete raw material');
    }
  }
);

const rawMaterialSlice = createSlice({
  name: 'rawMaterial',
  initialState: {
    records: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRawMaterials.pending, (state) => { state.loading = true; })
      .addCase(fetchRawMaterials.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchRawMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addRawMaterial.fulfilled, (state, action) => {
        state.records.unshift(action.payload);
      })
      .addCase(updateRawMaterial.fulfilled, (state, action) => {
        const index = state.records.findIndex(r => r._id === action.payload._id);
        if (index !== -1) state.records[index] = action.payload;
      })
      .addCase(deleteRawMaterial.fulfilled, (state, action) => {
        state.records = state.records.filter(r => r._id !== action.payload);
      });
  },
});

export default rawMaterialSlice.reducer;
