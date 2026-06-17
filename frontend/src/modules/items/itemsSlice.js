import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { extractPaginationMeta } from '../../utils/paginationMeta';

export const fetchItems = createAsyncThunk('items/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/items', { params });
    const resData = response.data.data || response.data || {};
    const meta = extractPaginationMeta(response.data);
    const items = resData.items || resData.records || [];
    const records = Array.isArray(items) ? items : (items.items || []);
    return {
      records,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
    };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchItemById = createAsyncThunk('items/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/items/${id}`);
    const data = response.data?.data || response.data;
    return data?.item || data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addItem = createAsyncThunk('items/add', async (itemPayload, { rejectWithValue }) => {
  try {
    const response = await api.post('/items', itemPayload);
    return response.data.item || response.data.data;
  } catch (error) {
    const data = error.response?.data;
    const message = data?.message
      || (Array.isArray(data?.errors) ? data.errors.join(', ') : null)
      || (error instanceof Error ? error.message : String(error));
    return rejectWithValue(message);
  }
});

export const updateItem = createAsyncThunk('items/update', async ({ id, item: itemPayload }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/items/${id}`, itemPayload);
    return response.data.item || response.data.data;
  } catch (error) {
    const data = error.response?.data;
    const message = data?.message
      || (Array.isArray(data?.errors) ? data.errors.join(', ') : null)
      || (error instanceof Error ? error.message : String(error));
    return rejectWithValue(message);
  }
});

export const deleteItem = createAsyncThunk('items/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/items/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  records: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  currentItem: null,
  currentItemLoading: false,
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
        state.records = action.payload.records || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 20;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single item
      .addCase(fetchItemById.pending, (state) => {
        state.currentItemLoading = true;
        state.error = null;
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.currentItemLoading = false;
        state.currentItem = action.payload;
        if (action.payload) {
          const itemId = action.payload.id || action.payload._id;
          const index = state.records.findIndex((r) => r.id === itemId || r._id === itemId);
          if (index !== -1) {
            state.records[index] = action.payload;
          }
        }
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.currentItemLoading = false;
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
