import { createSlice, nanoid } from '@reduxjs/toolkit';
import { purchasesData, purchaseReturnsData } from './data';

const getPurchasedQty = (purchase) =>
  purchase.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

const getReturnedQty = (returns, purchaseId) =>
  returns
    .filter((entry) => entry.purchaseId === purchaseId)
    .reduce(
      (sum, entry) =>
        sum + entry.items.reduce((lineSum, line) => lineSum + Number(line.returnQty || 0), 0),
      0,
    );

const derivePurchaseStatus = (purchasedQty, returnedQty) => {
  if (!returnedQty) {
    return 'Received';
  }

  if (returnedQty >= purchasedQty) {
    return 'Returned';
  }

  return 'Partially Returned';
};

const refreshPurchaseStatus = (state, purchaseId) => {
  const purchase = state.records.find((entry) => entry.id === purchaseId);
  if (!purchase) {
    return;
  }

  const purchasedQty = getPurchasedQty(purchase);
  const returnedQty = getReturnedQty(state.returns, purchaseId);
  purchase.status = derivePurchaseStatus(purchasedQty, returnedQty);
};

const initialState = {
  records: purchasesData,
  returns: purchaseReturnsData,
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    addPurchase: {
      reducer: (state, action) => {
        state.records.unshift(action.payload);
      },
      prepare: (purchase) => ({
        payload: {
          id: purchase.id || nanoid(10),
          status: purchase.status || 'Received',
          ...purchase,
        },
      }),
    },

    updatePurchase: (state, action) => {
      const { id, purchase } = action.payload;
      const targetIndex = state.records.findIndex((entry) => entry.id === id);
      if (targetIndex === -1) {
        return;
      }

      state.records[targetIndex] = {
        ...state.records[targetIndex],
        ...purchase,
      };

      refreshPurchaseStatus(state, id);
    },

    addPurchaseReturn: {
      reducer: (state, action) => {
        const entry = action.payload;
        state.returns.unshift(entry);
        refreshPurchaseStatus(state, entry.purchaseId);
      },
      prepare: (returnEntry) => ({
        payload: {
          id: returnEntry.id || nanoid(10),
          returnNumber:
            returnEntry.returnNumber || `RET-${Date.now().toString().slice(-6)}`,
          ...returnEntry,
        },
      }),
    },
  },
});

export const { addPurchase, updatePurchase, addPurchaseReturn } = purchaseSlice.actions;

export default purchaseSlice.reducer;
