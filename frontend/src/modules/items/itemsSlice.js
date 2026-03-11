import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks
export const fetchItems = createAsyncThunk('items/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/products');
    const raw = response.data.products || response.data.data || [];
    return normalizeResponse(raw, 'product');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addItem = createAsyncThunk('items/add', async (itemData, { rejectWithValue }) => {
  try {
    // Map style + variants into products array for bulk-import
    const products = (itemData.variants || []).map((v) => ({
      name: itemData.name,
      category: itemData.category,
      brand: itemData.brand,
      size: v.size,
      color: v.color,
      salePrice: Number(v.sellingPrice || 0),
      costPrice: Number(v.costPrice || 0),
      factoryStock: Number(v.stock || 0),
      // Let backend generate SKU/barcode; we still pass the user-facing SKU to keep a record if needed
      sku: null,
      barcode: null,
      gstSlabId: itemData.hsnCodeId ? undefined : undefined, // optional mapping if you later link GST slabs at product level
    }));

    if (!products.length) {
      throw new Error('At least one variant is required to create products.');
    }

    const response = await api.post('/products/bulk-import', { products, warehouseId: null });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateItem = createAsyncThunk('items/update', async ({ id, item }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/products/${id}`, item);
    return response.data.product || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteItem = createAsyncThunk('items/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/products/${id}`);
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
      .addCase(addItem.fulfilled, (state) => {
        // Bulk import: rely on a fresh fetchItems instead of trying to infer created products here
        state.loading = false;
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
