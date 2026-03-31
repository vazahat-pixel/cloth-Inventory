import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks
export const fetchPurchases = createAsyncThunk('purchase/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/purchase');
    const raw = response.data.purchases || response.data.data || [];
    return normalizeResponse(raw, 'purchase');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch purchases');
  }
});

export const addPurchase = createAsyncThunk('purchase/add', async (purchaseData, { rejectWithValue }) => {
  try {
    // Map fields for backend
    const payload = {
      supplierId: purchaseData.supplierId,
      storeId: purchaseData.storeId || purchaseData.warehouseId,
      invoiceNumber: purchaseData.invoiceNumber || purchaseData.billNumber,
      invoiceDate: purchaseData.invoiceDate || purchaseData.billDate,
      notes: purchaseData.notes || purchaseData.remarks,
      products: (purchaseData.products || purchaseData.items || []).map(p => ({
        productId: p.productId || p.id || p.variantId,
        quantity: p.quantity,
        rate: p.rate || p.price,
        lotNumber: p.lotNumber || ''
      }))
    };

    const response = await api.post('/purchase', payload);
    const raw = response.data.purchase || response.data.data;
    return normalizeResponse(raw, 'purchase');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add purchase');
  }
});

export const updatePurchase = createAsyncThunk('purchase/update', async ({ id, purchaseData }, { rejectWithValue }) => {
  try {
    // Map fields for backend consistency (same as addPurchase)
    const payload = {
      supplierId: purchaseData.supplierId,
      storeId: purchaseData.storeId || purchaseData.warehouseId,
      invoiceNumber: purchaseData.invoiceNumber || purchaseData.billNumber,
      invoiceDate: purchaseData.invoiceDate || purchaseData.billDate,
      notes: purchaseData.notes || purchaseData.remarks,
      products: (purchaseData.products || purchaseData.items || []).map(p => ({
        productId: p.productId || p.id || p.variantId,
        quantity: p.quantity,
        rate: p.rate || p.price,
        lotNumber: p.lotNumber || ''
      }))
    };
    const response = await api.patch(`/purchase/${id}`, payload);
    const raw = response.data.purchase || response.data.data;
    return normalizeResponse(raw, 'purchase');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update purchase');
  }
});

export const fetchPurchaseOrders = createAsyncThunk('purchase/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/purchase-orders');
    return response.data.purchaseOrders || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch purchase orders');
  }
});

export const fetchPurchaseOrderById = createAsyncThunk('purchase/fetchOrderById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data.purchaseOrder || response.data.po || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch purchase order details');
  }
});


export const addPurchaseOrder = createAsyncThunk('purchase/addOrder', async (orderData, { rejectWithValue }) => {
  try {
    const response = await api.post('/purchase-orders', orderData);
    return response.data.purchaseOrder || response.data.po || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create purchase order');
  }
});

export const updatePurchaseOrder = createAsyncThunk('purchase/updateOrder', async ({ id, orderData }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/purchase-orders/${id}`, orderData);
    return response.data.purchaseOrder || response.data.po || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update purchase order');
  }
});

export const generatePOFromVoucher = createAsyncThunk('purchase/generatePOFromVoucher', async (voucherId, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.post(`/purchase-orders/from-voucher/${voucherId}`);
    dispatch(fetchPurchases()); // Refresh list to show linked PO
    return response.data.po || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to generate PO');
  }
});

export const fetchPurchaseReturns = createAsyncThunk('purchase/fetchReturns', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/returns?type=STORE_TO_FACTORY');
    const raw = response.data.returns || response.data.data || [];
    return normalizeResponse(raw, 'return');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addPurchaseReturn = createAsyncThunk('purchase/addReturn', async (returnData, { rejectWithValue }) => {
  try {
    const payload = { ...returnData };
    if (!payload.type) payload.type = 'PURCHASE_RETURN';
    const response = await api.post('/returns', payload);
    const raw = response.data.returnEntry || response.data.data;
    return normalizeResponse(raw, 'return');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  records: [],
  orders: [],
  returns: [],
  loading: false,
  error: null,
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    clearPurchaseError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Purchases
      .addCase(fetchPurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload || [];
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Purchase
      .addCase(addPurchase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPurchase.fulfilled, (state, action) => {
        state.loading = false;
        state.records.unshift(action.payload);
      })
      .addCase(addPurchase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Purchase
      .addCase(updatePurchase.fulfilled, (state, action) => {
        const index = state.records.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      // Purchase Orders
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(addPurchaseOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((o) => o.id === action.payload.id || o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      // Fetch Returns
      .addCase(fetchPurchaseReturns.fulfilled, (state, action) => {
        state.returns = action.payload || [];
      })
      // Add Return
      .addCase(addPurchaseReturn.fulfilled, (state, action) => {
        state.returns.unshift(action.payload);
      });
  },
});

export const { clearPurchaseError } = purchaseSlice.actions;
export default purchaseSlice.reducer;
