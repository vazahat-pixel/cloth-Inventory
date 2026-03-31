import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks
export const fetchItems = createAsyncThunk('items/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/items');
    const raw = response.data.items || response.data.data || [];
    return normalizeResponse(raw, 'item');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addItem = createAsyncThunk('items/add', async (itemData, { rejectWithValue }) => {
  try {
    // Map data for single Item creation (matching backend Item model from remote branch)
    const payload = {
      itemName: itemData.itemName || itemData.name,
      itemCode: (itemData.itemCode || itemData.code || '').trim().toUpperCase(),
      brand: itemData.brandId || itemData.brand,
      session: itemData.seasonId || itemData.season,
      shade: itemData.shadeColor,
      description: itemData.description,
      hsCodeId: itemData.hsnCodeId,
      gstSlabId: itemData.gstSlabId,
      groupIds: [itemData.sectionId, itemData.categoryId, itemData.subCategoryId, itemData.subSubCategoryId].filter(Boolean),
      sizes: (itemData.variants || []).map((v) => ({
        size: v.size,
        barcode: v.barcode || null,
        costPrice: Number(v.costPrice || 0),
        salePrice: Number(v.salePrice || v.sellingPrice || 0),
        mrp: Number(v.mrp || 0),
        isActive: true
      })),
      images: (itemData.images || []),
      isActive: true,
      status: itemData.status || 'Active'
    };

    const response = await api.post('/items', payload);
    return response.data.item || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateItem = createAsyncThunk('items/update', async ({ id, item }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/items/${id}`, item);
    return response.data.item || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
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
