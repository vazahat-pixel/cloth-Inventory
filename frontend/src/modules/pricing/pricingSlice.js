import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

const mapCouponToBackend = (data) => ({
  code: data.code,
  type: data.discountType === 'percentage' ? 'PERCENTAGE' : 'FLAT',
  value: Number(data.value),
  minPurchaseAmount: Number(data.minAmount),
  startDate: new Date(),
  endDate: data.expiry ? new Date(data.expiry) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  usageLimit: Number(data.usageLimit || 1),
  isActive: data.status === 'Active'
});

// Async Thunks
export const fetchPriceLists = createAsyncThunk('pricing/fetchLists', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pricing');
    return response.data.pricingRules || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchPricingRules = fetchPriceLists;

export const addPriceList = createAsyncThunk('pricing/addList', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/pricing', data);
    return response.data.pricingRule || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updatePriceList = createAsyncThunk('pricing/updateList', async ({ id, priceList }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/pricing/${id}`, priceList);
    return response.data.pricingRule || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSchemes = createAsyncThunk('pricing/fetchSchemes', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pricing/schemes');
    const raw = response.data.schemes || response.data.data || [];
    return normalizeResponse(raw, 'scheme');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addScheme = createAsyncThunk('pricing/addScheme', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/pricing/schemes', data);
    return normalizeResponse(response.data.scheme || response.data.data, 'scheme');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateScheme = createAsyncThunk('pricing/updateScheme', async ({ id, scheme }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/pricing/schemes/${id}`, scheme);
    return normalizeResponse(response.data.scheme || response.data.data, 'scheme');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchCoupons = createAsyncThunk('pricing/fetchCoupons', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pricing/coupons');
    const raw = response.data.coupons || response.data.data || [];
    return normalizeResponse(raw, 'coupon');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addCoupon = createAsyncThunk('pricing/addCoupon', async (data, { rejectWithValue }) => {
  try {
    const payload = mapCouponToBackend(data);
    const response = await api.post('/pricing/coupons', payload);
    return normalizeResponse(response.data.coupon || response.data.data, 'coupon');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addCouponsBulk = createAsyncThunk('pricing/addCouponsBulk', async (coupons, { dispatch, rejectWithValue }) => {
  try {
    const created = [];
    // Sequentially create coupons using existing addCoupon thunk
    for (const coupon of coupons) {
      const result = await dispatch(addCoupon(coupon)).unwrap();
      created.push(result);
    }
    return created;
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to create coupons in bulk');
  }
});

export const updateCoupon = createAsyncThunk('pricing/updateCoupon', async ({ id, coupon }, { rejectWithValue }) => {
  try {
    const payload = mapCouponToBackend(coupon);
    const response = await api.patch(`/pricing/coupons/${id}`, payload);
    return normalizeResponse(response.data.coupon || response.data.data, 'coupon');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const setPriceListStatus = createAsyncThunk('pricing/setStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/pricing/${id}`, { status });
    return response.data.pricingRule || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const setSchemeStatus = createAsyncThunk('pricing/setSchemeStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/pricing/schemes/${id}`, { isActive: status === 'ACTIVE' });
    return normalizeResponse(response.data.scheme || response.data.data, 'scheme');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteScheme = createAsyncThunk('pricing/deleteScheme', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/pricing/schemes/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const evaluateOffers = createAsyncThunk('pricing/evaluateOffers', async (cartData, { rejectWithValue }) => {
  try {
    const response = await api.post('/pricing/evaluate', cartData);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  priceLists: [],
  schemes: [],
  coupons: [],
  eligibleOffers: [],
  loading: false,
  evaluateLoading: false,
  error: null,
};

const pricingSlice = createSlice({
  name: 'pricing',
  initialState,
  reducers: {
    clearPricingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriceLists.fulfilled, (state, action) => {
        state.priceLists = action.payload || [];
      })
      .addCase(addPriceList.fulfilled, (state, action) => {
        state.priceLists.unshift(action.payload);
      })
      .addCase(updatePriceList.fulfilled, (state, action) => {
        const index = state.priceLists.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.priceLists[index] = action.payload;
        }
      })
      .addCase(fetchSchemes.fulfilled, (state, action) => {
        state.schemes = action.payload || [];
      })
      .addCase(addScheme.fulfilled, (state, action) => {
        state.schemes.unshift(action.payload);
      })
      .addCase(updateScheme.fulfilled, (state, action) => {
        const index = state.schemes.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.schemes[index] = action.payload;
        }
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.coupons = action.payload || [];
      })
      .addCase(addCoupon.fulfilled, (state, action) => {
        state.coupons.unshift(action.payload);
      })
      .addCase(addCouponsBulk.fulfilled, (state, action) => {
        // Prepend newly created coupons to the list
        state.coupons = [...action.payload, ...state.coupons];
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        const index = state.coupons.findIndex((c) => c.id === action.payload.id || c._id === action.payload._id);
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
      })
      .addCase(setPriceListStatus.fulfilled, (state, action) => {
        const index = state.priceLists.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.priceLists[index] = action.payload;
        }
      })
      .addCase(setSchemeStatus.fulfilled, (state, action) => {
        const index = state.schemes.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) {
          state.schemes[index] = action.payload;
        }
      })
      .addCase(evaluateOffers.pending, (state) => {
        state.evaluateLoading = true;
      })
      .addCase(evaluateOffers.fulfilled, (state, action) => {
        state.evaluateLoading = false;
        state.eligibleOffers = action.payload?.eligibleSchemes || [];
      })
      .addCase(evaluateOffers.rejected, (state) => {
        state.evaluateLoading = false;
      })
      .addCase(deleteScheme.fulfilled, (state, action) => {
        state.schemes = state.schemes.filter((s) => s.id !== action.payload && s._id !== action.payload);
      });
  },
});

export const { clearPricingError } = pricingSlice.actions;
export default pricingSlice.reducer;
