import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchStockOverview = createAsyncThunk(
  'inventory/fetchStock',
  async (params, { rejectWithValue }) => {
    try {
      // Backend: GET /api/store-inventory
      const response = await api.get('/store-inventory', { params });
      const raw = response.data.inventory || response.data.data || [];

      // Normalize populated sub-documents into flat shape the UI expects
      return raw.map((doc) => {
        const product = doc.productId || {};
        const store = doc.storeId || {};
        return {
          id: doc._id,
          // Product fields
          itemName: product.name || '',
          styleCode: product.sku || '',
          sku: product.barcode || product.sku || '',
          size: product.size || '',
          color: product.color || '',
          brand: product.brand || '',
          category: product.category || '',
          // Store / warehouse info
          warehouseId: store._id || doc.storeId,
          warehouseName: store.name || '',
          // Quantities
          quantity: doc.quantityAvailable ?? 0,
          reserved: doc.quantityReserved ?? 0,
          // Low-stock status
          status:
            (doc.quantityAvailable ?? 0) <= (doc.minStockLevel ?? 0)
              ? 'LOW_STOCK'
              : 'OK',
          // Keep raw fields for fallback
          lotNumber: doc.lotNumber || null,
          minStockLevel: doc.minStockLevel ?? 0,
        };
      });
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchMovements = createAsyncThunk(
  'inventory/fetchMovements',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/reports/movement', { params });
      return response.data.movements || response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const transferStock = createAsyncThunk(
  'inventory/transfer',
  async (transferData, { rejectWithValue }) => {
    try {
      // Backend: POST /api/dispatch
      const response = await api.post('/dispatch', transferData);
      return response.data.dispatch || response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
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
      const response = await api.post('/store-inventory/audit', auditData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Added to satisfy "Replace with: ... POST /api/sales, POST /api/returns"
export const applySaleDispatch = createAsyncThunk(
  'inventory/sale',
  async (saleData, { rejectWithValue }) => {
    try {
      // Backend: POST /api/sales
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
      // Backend: POST /api/returns
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
      // Backend: POST /api/returns
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
      // Fetch - Update state with fresh data
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
      .addCase(fetchMovements.fulfilled, (state, action) => {
        state.movements = action.payload || [];
      })
      // Mutations - NO LOCAL STATE MUTATION OF STOCK.
      .addMatcher(
        (action) =>
          action.type.endsWith('/fulfilled') &&
          [
            'inventory/transfer',
            'inventory/adjust',
            'inventory/audit',
            'inventory/sale',
            'inventory/salesReturn',
            'inventory/purchaseReturn',
          ].some((prefix) => action.type.startsWith(prefix)),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (action) =>
          action.type.endsWith('/pending') &&
          [
            'inventory/transfer',
            'inventory/adjust',
            'inventory/audit',
            'inventory/sale',
            'inventory/salesReturn',
            'inventory/purchaseReturn',
          ].some((prefix) => action.type.startsWith(prefix)),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          action.type.endsWith('/rejected') &&
          [
            'inventory/transfer',
            'inventory/adjust',
            'inventory/audit',
            'inventory/sale',
            'inventory/salesReturn',
            'inventory/purchaseReturn',
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
