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

export const addItem = createAsyncThunk('items/add', async (item, { rejectWithValue }) => {
  try {
    const brandId = item.brand ? String(item.brand) : null;
    const hsnId = item.hsnCodeId ? String(item.hsnCodeId) : null;

    if (!brandId) throw new Error('Brand selection is mandatory.');
    if (!hsnId) throw new Error('HSN Code selection is mandatory.');

    const payload = {
      itemName: item.itemName || item.name,
      itemCode: (item.itemCode || item.code || '').trim().toUpperCase(),
      brand: brandId,
      session: item.season ? String(item.season) : null,
      shade: item.shadeColor,
      description: item.description,
      uom: item.uom || 'PCS',
      hsCodeId: hsnId,
      fabric: item.fabric,
      pattern: item.pattern,
      fit: item.fit,
      gender: item.gender,
      section: item.sectionId ? String(item.sectionId) : null,
      category: item.categoryId ? String(item.categoryId) : null,
      subCategory: item.subCategoryId ? String(item.subCategoryId) : null,
      styleType: item.subSubCategoryId ? String(item.subSubCategoryId) : null,
      groupIds: [item.sectionId, item.categoryId, item.subCategoryId, item.subSubCategoryId].filter(Boolean).map(id => String(id)),
      defaultWarehouse: item.defaultWarehouse ? String(item.defaultWarehouse) : null,
      reorderLevel: Number(item.reorderLevel || 0),
      reorderQty: Number(item.reorderQty || 0),
      openingStock: Number(item.openingStock || 0),
      openingStockRate: Number(item.openingStockRate || 0),
      stockTrackingEnabled: item.stockTrackingEnabled ?? true,
      barcodeEnabled: item.barcodeEnabled ?? true,
      sizes: (item.variants || []).map((v) => ({
        size: v.size,
        barcode: (v.sku || v.barcode || '').trim(),
        costPrice: Number(v.costPrice || 0),
        salePrice: Number(v.salePrice || 0),
        mrp: Number(v.mrp || 0),
        stock: Number(v.stock || 0),
        isActive: v.status !== 'Inactive'
      })),
      images: (item.images || []).filter(Boolean).map(img => {
        // If it's already a string URL, return it (ignore blobs)
        if (typeof img === 'string') {
          return !img.startsWith('blob:') ? img : null;
        }
        // If it's an object (Cloudinary or custom upload response)
        if (typeof img === 'object') {
          // Check common keys from Cloudinary/Uploaders
          const url = 
            img.secure_url || 
            img.url || 
            img.data?.url || 
            img.data?.secure_url ||
            (img.preview && !img.preview.startsWith('blob:') ? img.preview : null);
          return url || null;
        }
        return null;
      }).filter(Boolean),
      isActive: true,
    };

    if (!payload.itemCode) throw new Error('Style Code (itemCode) is required');

    const response = await api.post('/items', payload);
    return response.data.item || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || (error instanceof Error ? error.message : String(error)));
  }
});

export const updateItem = createAsyncThunk('items/update', async ({ id, item }, { rejectWithValue }) => {
  try {
    const brandId = item.brand ? String(item.brand) : null;
    const hsnId = item.hsnCodeId ? String(item.hsnCodeId) : null;

    const payload = {
      itemName: item.itemName || item.name,
      itemCode: (item.itemCode || item.code || '').trim().toUpperCase(),
      brand: brandId,
      session: item.season ? String(item.season) : null,
      shade: item.shadeColor,
      description: item.description,
      uom: item.uom || 'PCS',
      hsCodeId: hsnId,
      fabric: item.fabric,
      pattern: item.pattern,
      fit: item.fit,
      gender: item.gender,
      groupIds: [item.sectionId, item.categoryId, item.subCategoryId, item.subSubCategoryId].filter(Boolean).map(id => String(id)),
      defaultWarehouse: item.defaultWarehouse ? String(item.defaultWarehouse) : null,
      reorderLevel: Number(item.reorderLevel || 0),
      reorderQty: Number(item.reorderQty || 0),
      openingStock: Number(item.openingStock || 0),
      openingStockRate: Number(item.openingStockRate || 0),
      stockTrackingEnabled: item.stockTrackingEnabled ?? true,
      barcodeEnabled: item.barcodeEnabled ?? true,
      sizes: (item.variants || []).map((v) => ({
        size: v.size,
        barcode: (v.sku || v.barcode || '').trim(),
        costPrice: Number(v.costPrice || 0),
        salePrice: Number(v.salePrice || 0),
        mrp: Number(v.mrp || 0),
        stock: Number(v.stock || 0),
        isActive: v.status !== 'Inactive'
      })),
      images: (item.images || []).filter(Boolean).map(img => {
        if (typeof img === 'string') {
          return !img.startsWith('blob:') ? img : null;
        }
        if (typeof img === 'object') {
          const url = 
            img.secure_url || 
            img.url || 
            img.data?.url || 
            img.data?.secure_url ||
            (img.preview && !img.preview.startsWith('blob:') ? img.preview : null);
          return url || null;
        }
        return null;
      }).filter(Boolean),
      isActive: true,
    };

    if (!payload.itemCode) throw new Error('Style Code (itemCode) is required');
    if (!payload.brand) delete payload.brand; 
    if (!payload.hsCodeId) delete payload.hsCodeId;

    const response = await api.patch(`/items/${id}`, payload);
    return response.data.item || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || (error instanceof Error ? error.message : String(error)));
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
