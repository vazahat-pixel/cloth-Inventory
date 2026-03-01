import { createSlice, nanoid } from '@reduxjs/toolkit';
import { salesData, salesReturnsData } from './data';

const getSoldQty = (sale) =>
  sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

const getReturnedQty = (returns, saleId) =>
  returns
    .filter((entry) => entry.saleId === saleId)
    .reduce(
      (sum, entry) =>
        sum + entry.items.reduce((lineSum, line) => lineSum + Number(line.returnQty || 0), 0),
      0,
    );

const deriveSaleStatus = (soldQty, returnedQty) => {
  if (!returnedQty) {
    return 'Completed';
  }

  if (returnedQty >= soldQty) {
    return 'Returned';
  }

  return 'Partially Returned';
};

const refreshSaleStatus = (state, saleId) => {
  const sale = state.records.find((entry) => entry.id === saleId);
  if (!sale) {
    return;
  }

  const soldQty = getSoldQty(sale);
  const returnedQty = getReturnedQty(state.returns, saleId);
  sale.status = deriveSaleStatus(soldQty, returnedQty);
};

const initialState = {
  records: salesData,
  returns: salesReturnsData,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    addSale: {
      reducer: (state, action) => {
        state.records.unshift(action.payload);
      },
      prepare: (sale) => ({
        payload: {
          id: sale.id || nanoid(10),
          invoiceNumber:
            sale.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          status: sale.status || 'Completed',
          ...sale,
        },
      }),
    },

    addSalesReturn: {
      reducer: (state, action) => {
        const entry = action.payload;
        state.returns.unshift(entry);
        refreshSaleStatus(state, entry.saleId);
      },
      prepare: (returnEntry) => ({
        payload: {
          id: returnEntry.id || nanoid(10),
          returnNumber:
            returnEntry.returnNumber || `SRET-${Date.now().toString().slice(-6)}`,
          ...returnEntry,
        },
      }),
    },
  },
});

export const { addSale, addSalesReturn } = salesSlice.actions;

export default salesSlice.reducer;
