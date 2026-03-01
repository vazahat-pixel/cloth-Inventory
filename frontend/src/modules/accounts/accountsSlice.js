import { createSlice, nanoid } from '@reduxjs/toolkit';
import { bankPaymentsData, bankReceiptsData } from './data';

const initialState = {
  bankPayments: bankPaymentsData,
  bankReceipts: bankReceiptsData,
};

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    addBankPayment: {
      reducer: (state, action) => {
        state.bankPayments.unshift(action.payload);
      },
      prepare: (payment) => ({
        payload: {
          id: payment.id || nanoid(10),
          bankId: payment.bankId,
          supplierId: payment.supplierId,
          date: payment.date,
          chequeNo: payment.chequeNo,
          amount: payment.amount,
          narration: payment.narration || '',
          allocatedBills: payment.allocatedBills || [],
          ...payment,
        },
      }),
    },
    addBankReceipt: {
      reducer: (state, action) => {
        state.bankReceipts.unshift(action.payload);
      },
      prepare: (receipt) => ({
        payload: {
          id: receipt.id || nanoid(10),
          bankId: receipt.bankId,
          customerId: receipt.customerId,
          date: receipt.date,
          chequeNo: receipt.chequeNo,
          amount: receipt.amount,
          narration: receipt.narration || '',
          allocatedBills: receipt.allocatedBills || [],
          ...receipt,
        },
      }),
    },
  },
});

export const { addBankPayment, addBankReceipt } = accountsSlice.actions;

export default accountsSlice.reducer;
