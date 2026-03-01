import { createSlice, nanoid } from '@reduxjs/toolkit';
import {
  loyaltyConfigData,
  loyaltyTransactionsData,
  vouchersData,
  creditNotesData,
} from './data';

const initialState = {
  loyaltyConfig: loyaltyConfigData,
  loyaltyTransactions: loyaltyTransactionsData,
  vouchers: vouchersData,
  creditNotes: creditNotesData,
};

const customerRewardsSlice = createSlice({
  name: 'customerRewards',
  initialState,
  reducers: {
    updateLoyaltyConfig: (state, action) => {
      state.loyaltyConfig = { ...state.loyaltyConfig, ...action.payload };
    },

    addLoyaltyTransaction: {
      reducer: (state, action) => {
        state.loyaltyTransactions.unshift(action.payload);
      },
      prepare: (tx) => ({
        payload: {
          id: tx.id || nanoid(10),
          ...tx,
        },
      }),
    },

    addVoucher: {
      reducer: (state, action) => {
        const items = Array.isArray(action.payload) ? action.payload : [action.payload];
        state.vouchers.unshift(...items);
      },
      prepare: (voucher) => ({
        payload: voucher,
      }),
    },
    addVouchersBulk: {
      reducer: (state, action) => {
        state.vouchers.unshift(...action.payload);
      },
      prepare: (vouchers) => ({
        payload: vouchers,
      }),
    },
    updateVoucher: (state, action) => {
      const { id, voucher } = action.payload;
      const index = state.vouchers.findIndex((v) => v.id === id);
      if (index === -1) return;
      state.vouchers[index] = { ...state.vouchers[index], ...voucher };
    },
    redeemVoucher: (state, action) => {
      const { id, redeemedDate, redeemedInvoice, customerId } = action.payload;
      const v = state.vouchers.find((x) => x.id === id);
      if (v) {
        v.status = 'Redeemed';
        v.redeemedDate = redeemedDate || new Date().toISOString().slice(0, 10);
        v.redeemedInvoice = redeemedInvoice;
        if (customerId) v.customerId = customerId;
      }
    },

    addCreditNote: {
      reducer: (state, action) => {
        state.creditNotes.unshift(action.payload);
      },
      prepare: (note) => ({
        payload: {
          id: note.id || nanoid(10),
          status: note.status || 'Available',
          ...note,
        },
      }),
    },
    updateCreditNote: (state, action) => {
      const { id, creditNote } = action.payload;
      const index = state.creditNotes.findIndex((c) => c.id === id);
      if (index === -1) return;
      state.creditNotes[index] = { ...state.creditNotes[index], ...creditNote };
    },
  },
});

export const {
  updateLoyaltyConfig,
  addLoyaltyTransaction,
  addVoucher,
  addVouchersBulk,
  updateVoucher,
  redeemVoucher,
  addCreditNote,
  updateCreditNote,
} = customerRewardsSlice.actions;

export default customerRewardsSlice.reducer;
