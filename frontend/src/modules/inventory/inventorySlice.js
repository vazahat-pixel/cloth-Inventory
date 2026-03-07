import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks
export const fetchStockOverview = createAsyncThunk(
  'inventory/fetchStock',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/store-inventory', { params });
      const raw = response.data.inventory || response.data.data || [];
      return normalizeResponse(raw, 'inventory');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stock');
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
      // 1. Create Dispatch
      const payload = {
        storeId: transferData.storeId || transferData.warehouseId,
        products: (transferData.products || transferData.items || []).map(p => ({
          productId: p.productId || p.variantId || p.id,
          quantity: p.quantity,
          price: p.price || 0
        }))
      };

      const response = await api.post('/dispatch', payload);
      const dispatch = response.data.dispatch || response.data.data;

      if (!dispatch || (!dispatch._id && !dispatch.id)) {
        throw new Error('Failed to create dispatch');
      }

      const dispatchId = dispatch._id || dispatch.id;

      // 2. Mark as RECEIVED to update store stock immediately (Factory -> Store flow)
      await api.patch(`/dispatch/${dispatchId}/status`, { status: 'RECEIVED' });

      return normalizeResponse(dispatch, 'dispatch');
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
