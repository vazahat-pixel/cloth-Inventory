import { createSlice, nanoid } from '@reduxjs/toolkit';
import { priceListsData, schemesData, couponsData } from './data';

const initialState = {
  priceLists: priceListsData,
  schemes: schemesData,
  coupons: couponsData,
};

const pricingSlice = createSlice({
  name: 'pricing',
  initialState,
  reducers: {
    addPriceList: {
      reducer: (state, action) => {
        state.priceLists.unshift(action.payload);
      },
      prepare: (priceList) => ({
        payload: {
          id: priceList.id || nanoid(10),
          status: priceList.status || 'Active',
          ...priceList,
        },
      }),
    },
    updatePriceList: (state, action) => {
      const { id, priceList } = action.payload;
      const index = state.priceLists.findIndex((p) => p.id === id);
      if (index === -1) return;
      state.priceLists[index] = { ...state.priceLists[index], ...priceList };
    },
    setPriceListStatus: (state, action) => {
      const { id, status } = action.payload;
      const priceList = state.priceLists.find((p) => p.id === id);
      if (priceList) priceList.status = status;
    },

    addScheme: {
      reducer: (state, action) => {
        state.schemes.unshift(action.payload);
      },
      prepare: (scheme) => ({
        payload: {
          id: scheme.id || nanoid(10),
          status: scheme.status || 'Active',
          ...scheme,
        },
      }),
    },
    updateScheme: (state, action) => {
      const { id, scheme } = action.payload;
      const index = state.schemes.findIndex((s) => s.id === id);
      if (index === -1) return;
      state.schemes[index] = { ...state.schemes[index], ...scheme };
    },
    setSchemeStatus: (state, action) => {
      const { id, status } = action.payload;
      const scheme = state.schemes.find((s) => s.id === id);
      if (scheme) scheme.status = status;
    },

    addCoupon: {
      reducer: (state, action) => {
        state.coupons.unshift(action.payload);
      },
      prepare: (coupon) => ({
        payload: {
          id: coupon.id || nanoid(10),
          usageCount: coupon.usageCount || 0,
          status: coupon.status || 'Active',
          ...coupon,
        },
      }),
    },
    addCouponsBulk: {
      reducer: (state, action) => {
        state.coupons.unshift(...action.payload);
      },
      prepare: (coupons) => ({
        payload: coupons.map((c) => ({
          id: c.id || nanoid(10),
          usageCount: c.usageCount || 0,
          status: c.status || 'Active',
          ...c,
        })),
      }),
    },
    updateCoupon: (state, action) => {
      const { id, coupon } = action.payload;
      const index = state.coupons.findIndex((c) => c.id === id);
      if (index === -1) return;
      state.coupons[index] = { ...state.coupons[index], ...coupon };
    },
  },
});

export const {
  addPriceList,
  updatePriceList,
  setPriceListStatus,
  addScheme,
  updateScheme,
  setSchemeStatus,
  addCoupon,
  addCouponsBulk,
  updateCoupon,
} = pricingSlice.actions;

export default pricingSlice.reducer;
