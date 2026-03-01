import { createSlice, nanoid } from '@reduxjs/toolkit';
import { taxRatesData, taxGroupsData } from './data';

const initialState = {
  taxRates: taxRatesData,
  taxGroups: taxGroupsData,
};

const gstSlice = createSlice({
  name: 'gst',
  initialState,
  reducers: {
    addTaxRate: {
      reducer: (state, action) => {
        state.taxRates.unshift(action.payload);
      },
      prepare: (rate) => ({
        payload: {
          id: rate.id || nanoid(10),
          status: rate.status || 'Active',
          ...rate,
        },
      }),
    },
    updateTaxRate: (state, action) => {
      const { id, taxRate } = action.payload;
      const index = state.taxRates.findIndex((r) => r.id === id);
      if (index === -1) return;
      state.taxRates[index] = { ...state.taxRates[index], ...taxRate };
    },
    setTaxRateStatus: (state, action) => {
      const { id, status } = action.payload;
      const rate = state.taxRates.find((r) => r.id === id);
      if (rate) rate.status = status;
    },

    addTaxGroup: {
      reducer: (state, action) => {
        state.taxGroups.unshift(action.payload);
      },
      prepare: (group) => ({
        payload: {
          id: group.id || nanoid(10),
          status: group.status || 'Active',
          ...group,
        },
      }),
    },
    updateTaxGroup: (state, action) => {
      const { id, taxGroup } = action.payload;
      const index = state.taxGroups.findIndex((g) => g.id === id);
      if (index === -1) return;
      state.taxGroups[index] = { ...state.taxGroups[index], ...taxGroup };
    },
    setTaxGroupStatus: (state, action) => {
      const { id, status } = action.payload;
      const group = state.taxGroups.find((g) => g.id === id);
      if (group) group.status = status;
    },
  },
});

export const {
  addTaxRate,
  updateTaxRate,
  setTaxRateStatus,
  addTaxGroup,
  updateTaxGroup,
  setTaxGroupStatus,
} = gstSlice.actions;

export default gstSlice.reducer;
