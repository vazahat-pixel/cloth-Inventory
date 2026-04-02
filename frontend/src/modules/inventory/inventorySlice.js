import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks
export const fetchStockOverview = createAsyncThunk(
  'inventory/fetchStock',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/store-inventory', { params });
      const data = response.data.data || response.data;
      const raw = data.inventory || data.data || (Array.isArray(data) ? data : []);
      return normalizeResponse(raw, 'inventory');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stock');
    }
  }
);

export const fetchInventoryExport = createAsyncThunk(
  'inventory/fetchExport',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/inventory-export', { params });
      return response.data.rows || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory export');
    }
  }
);

// Specific for Warehouse Dispatches
export const fetchWarehouseStock = createAsyncThunk(
  'inventory/fetchWarehouseStock',
  async (warehouseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/inventory/warehouse-stock/${warehouseId}`);
      // Backend now sends { success: true, items: [...] }
      const data = response.data.data || response.data;
      return data.items || data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch warehouse stock');
    }
  }
);

export const fetchDispatches = createAsyncThunk(
  'inventory/fetchDispatches',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/dispatch', { params });
      // Backend returns { success: true, data: { dispatches: [...] } }
      const data = response.data.data || response.data;
      const raw = data.dispatches || data.data || (Array.isArray(data) ? data : []);
      return raw;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dispatches');
    }
  }
);


export const receiveStock = createAsyncThunk(
  'inventory/receive',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post(`/dispatch/${id}/receive`);
      dispatch(fetchStockOverview());
      dispatch(fetchDispatches());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to receive stock');
    }
  }
);

export const fetchMovements = createAsyncThunk(
  'inventory/fetchMovements',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/movement', { params });
      const raw = response.data.movements || response.data.report || response.data.data || [];
      return normalizeResponse(raw, 'movement');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const transferStock = createAsyncThunk(
  'inventory/transfer',
  async (transferData, { dispatch, rejectWithValue }) => {
    try {
      const payload = {
        sourceWarehouseId: transferData.sourceWarehouseId,
        destinationStoreId: transferData.destinationStoreId,
        products: (transferData.products || transferData.items || []).map(p => ({
            productId: p.productId || p.variantId || p.id,
            quantity: p.quantity || p.qty
        })),
        notes: transferData.notes
      };

      const response = await api.post('/dispatch', payload);
      dispatch(fetchStockOverview());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to transfer stock');
    }
  }
);

export const applyStockAdjustment = createAsyncThunk(
  'inventory/adjust',
  async (adjustmentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/store-inventory/adjust', adjustmentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const applyStockAudit = createAsyncThunk(
  'inventory/audit',
  async (auditData, { rejectWithValue }) => {
    try {
      const payload = {
        storeId: auditData.storeId || auditData.warehouseId,
        items: (auditData.items || auditData.entries || []).map((item) => ({
          productId: item.productId || item.variantId || item.stockId || item.id,
          physicalQty: Number(item.physicalQty ?? item.quantity ?? 0),
        })),
      };
      const response = await api.post('/store-inventory/reconcile', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Added for compatibility
export const applySaleDispatch = createAsyncThunk(
  'inventory/sale',
  async (saleData, { rejectWithValue }) => {
    try {
      const response = await api.post('/sales', saleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const applySalesReturnReceipt = createAsyncThunk(
  'inventory/salesReturn',
  async (returnData, { rejectWithValue }) => {
    try {
      const response = await api.post('/returns', returnData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const applyPurchaseReturn = createAsyncThunk(
  'inventory/purchaseReturn',
  async (returnData, { rejectWithValue }) => {
    try {
      const response = await api.post('/returns', returnData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  warehouses: [],
  stock: [],
  export: [],
  dispatches: [],
  movements: [],
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Stock
      .addCase(fetchStockOverview.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStockOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.stock = action.payload || [];
      })
      .addCase(fetchStockOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Inventory Export
      .addCase(fetchInventoryExport.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInventoryExport.fulfilled, (state, action) => {
        state.loading = false;
        state.export = action.payload || [];
      })
      .addCase(fetchInventoryExport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Warehouse Stock
      .addCase(fetchWarehouseStock.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWarehouseStock.fulfilled, (state, action) => {
        state.loading = false;
        state.stock = action.payload || [];
      })
      .addCase(fetchWarehouseStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Dispatches
      .addCase(fetchDispatches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDispatches.fulfilled, (state, action) => {
        state.loading = false;
        state.dispatches = action.payload || [];
      })
      .addCase(fetchDispatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMovements.fulfilled, (state, action) => {
        state.movements = action.payload || [];
      })
      // Global loading/error matchers
      .addMatcher(
        (action) =>
          action.type.endsWith('/pending') &&
          [
            'inventory/transfer',
            'inventory/adjust',
            'inventory/audit',
            'inventory/receive',
          ].some((prefix) => action.type.startsWith(prefix)),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type.endsWith('/fulfilled') &&
          [
            'inventory/transfer',
            'inventory/adjust',
            'inventory/audit',
            'inventory/receive',
          ].some((prefix) => action.type.startsWith(prefix)),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (action) =>
          action.type.endsWith('/rejected') &&
          [
            'inventory/transfer',
            'inventory/adjust',
            'inventory/audit',
            'inventory/receive',
          ].some((prefix) => action.type.startsWith(prefix)),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;
