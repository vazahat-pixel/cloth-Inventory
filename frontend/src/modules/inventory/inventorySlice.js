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
          qty: p.quantity || p.qty
        })),
        notes: transferData.notes
      };

      // 1. Create Pending Dispatch
      const response = await api.post('/dispatch', payload);
      const resData = response.data.dispatch || response.data.data;
      const dispatchId = resData._id || resData.id;

      // 2. Transition to DISPATCHED to trigger ATOMIC STOCK MOVEMENT
      const statusResponse = await api.patch(`/dispatch/${dispatchId}/status`, { status: 'DISPATCHED' });
      
      // 3. Refresh local stock overview to reflect change
      dispatch(fetchStockOverview());

      return statusResponse.data;
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
