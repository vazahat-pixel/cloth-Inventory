import { createSlice, nanoid } from '@reduxjs/toolkit';
import { saleOrdersData, packingSlipsData, deliveryOrdersData } from './data';

const initialState = {
  saleOrders: saleOrdersData,
  packingSlips: packingSlipsData,
  deliveryOrders: deliveryOrdersData,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addSaleOrder: {
      reducer: (state, action) => {
        state.saleOrders.unshift(action.payload);
      },
      prepare: (order) => ({
        payload: {
          id: order.id || nanoid(10),
          orderNumber: order.orderNumber || `SO-${Date.now().toString().slice(-6)}`,
          status: order.status || 'Pending',
          ...order,
        },
      }),
    },
    updateSaleOrder: (state, action) => {
      const { id, order } = action.payload;
      const idx = state.saleOrders.findIndex((o) => o.id === id);
      if (idx >= 0) state.saleOrders[idx] = { ...state.saleOrders[idx], ...order };
    },
    addPackingSlip: {
      reducer: (state, action) => {
        state.packingSlips.unshift(action.payload);
      },
      prepare: (slip) => ({
        payload: {
          id: slip.id || nanoid(10),
          slipNumber: slip.slipNumber || `PS-${Date.now().toString().slice(-6)}`,
          status: slip.status || 'Completed',
          ...slip,
        },
      }),
    },
    addDeliveryOrder: {
      reducer: (state, action) => {
        state.deliveryOrders.unshift(action.payload);
      },
      prepare: (doOrder) => ({
        payload: {
          id: doOrder.id || nanoid(10),
          doNumber: doOrder.doNumber || `DO-${Date.now().toString().slice(-6)}`,
          status: doOrder.status || 'Pending',
          ...doOrder,
        },
      }),
    },
    updateDeliveryOrder: (state, action) => {
      const { id, order } = action.payload;
      const idx = state.deliveryOrders.findIndex((o) => o.id === id);
      if (idx >= 0) state.deliveryOrders[idx] = { ...state.deliveryOrders[idx], ...order };
    },
  },
});

export const {
  addSaleOrder,
  updateSaleOrder,
  addPackingSlip,
  addDeliveryOrder,
  updateDeliveryOrder,
} = ordersSlice.actions;

export default ordersSlice.reducer;
