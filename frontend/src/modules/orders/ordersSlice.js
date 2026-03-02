import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchSaleOrders = createAsyncThunk('orders/fetchSaleOrders', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/orders/sales');
    return response.data.orders || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addSaleOrder = createAsyncThunk('orders/addSaleOrder', async (orderData, { rejectWithValue }) => {
  try {
    const response = await api.post('/orders/sales', orderData);
    return response.data.order || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateSaleOrder = createAsyncThunk('orders/updateSaleOrder', async ({ id, order }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/orders/sales/${id}`, order);
    return response.data.order || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addPackingSlip = createAsyncThunk('orders/addPackingSlip', async (slipData, { rejectWithValue }) => {
  try {
    const response = await api.post('/orders/packing-slips', slipData);
    return response.data.slip || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addDeliveryOrder = createAsyncThunk('orders/addDeliveryOrder', async (doData, { rejectWithValue }) => {
  try {
    const response = await api.post('/orders/delivery', doData);
    return response.data.deliveryOrder || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  saleOrders: [],
  packingSlips: [],
  deliveryOrders: [],
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrdersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSaleOrders.fulfilled, (state, action) => {
        state.saleOrders = action.payload || [];
      })
      .addCase(addSaleOrder.fulfilled, (state, action) => {
        state.saleOrders.unshift(action.payload);
      })
      .addCase(updateSaleOrder.fulfilled, (state, action) => {
        const index = state.saleOrders.findIndex((o) => o.id === action.payload.id || o._id === action.payload._id);
        if (index !== -1) {
          state.saleOrders[index] = action.payload;
        }
      })
      .addCase(addPackingSlip.fulfilled, (state, action) => {
        state.packingSlips.unshift(action.payload);
      })
      .addCase(addDeliveryOrder.fulfilled, (state, action) => {
        state.deliveryOrders.unshift(action.payload);
      });
  },
});

export const { clearOrdersError } = ordersSlice.actions;
export default ordersSlice.reducer;
