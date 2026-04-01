import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks
export const fetchItems = createAsyncThunk('items/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/items');
    // The items are likely inside response.data.items or response.data.data
    const raw = response.data.items || response.data.data || [];
    return normalizeResponse(raw, 'item');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addItem = createAsyncThunk('items/add', async (itemPayload, { rejectWithValue }) => {
  try {
    const response = await api.post('/items', itemPayload);
    return response.data.item || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || (error instanceof Error ? error.message : String(error)));
  }
});

export const updateItem = createAsyncThunk('items/update', async ({ id, item: itemPayload }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/items/${id}`, itemPayload);
    return response.data.item || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || (error instanceof Error ? error.message : String(error)));
  }
});

export const deleteItem = createAsyncThunk('items/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/items/${id}`);
    await api.delete(`/items/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  records: [],
  loading: false,
  error: null,
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    clearItemsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Items
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload || [];
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Item
      .addCase(addItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItem.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.records.unshift(action.payload);
        }
      })
      .addCase(addItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Item
      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.records.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Item
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.records = state.records.filter((r) => r.id !== action.payload && r._id !== action.payload);
      });
  },
});

export const { clearItemsError } = itemsSlice.actions;
export default itemsSlice.reducer;
