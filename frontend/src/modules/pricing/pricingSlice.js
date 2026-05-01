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

// Utility to safely sanitize data before serialization
const sanitize = (data) => {
  if (!data || typeof data !== 'object') return data;
  try {
    const cache = new WeakSet();
    return JSON.parse(JSON.stringify(data, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return; // Discard circular
        if (value instanceof HTMLElement || value.constructor?.name?.includes('HTML')) return;
        if (key.startsWith('__react')) return;
        cache.add(value);
      }
      return value;
    }));
  } catch (e) {
    return Array.isArray(data) ? [] : {};
  }
};

// Async Thunks
export const fetchPromotionTypes = createAsyncThunk('pricing/fetchTypes', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pricing/promotion-types');
    return sanitize(response.data.types || response.data.data?.types || []);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addPromotionType = createAsyncThunk('pricing/addType', async (data, { rejectWithValue }) => {
  try {
    const payload = sanitize(data);
    const response = await api.post('/pricing/promotion-types', payload);
    return sanitize(response.data.type || response.data.data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchPriceLists = createAsyncThunk('pricing/fetchLists', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pricing');
    return sanitize(response.data.pricingRules || response.data.data || []);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchPricingRules = fetchPriceLists;

export const addPriceList = createAsyncThunk('pricing/addList', async (data, { rejectWithValue }) => {
  try {
    const payload = sanitize(data);
    const response = await api.post('/pricing', payload);
    return sanitize(response.data.pricingRule || response.data.data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updatePriceList = createAsyncThunk('pricing/updateList', async ({ id, priceList }, { rejectWithValue }) => {
  try {
    const payload = sanitize(priceList);
    const response = await api.patch(`/pricing/${id}`, payload);
    return sanitize(response.data.pricingRule || response.data.data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchSchemes = createAsyncThunk('pricing/fetchSchemes', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pricing/schemes');
    const raw = response.data.schemes || response.data.data || [];
    return sanitize(normalizeResponse(raw, 'scheme'));
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addScheme = createAsyncThunk('pricing/addScheme', async (data, { rejectWithValue }) => {
  try {
    const payload = sanitize(data);
    const response = await api.post('/pricing/schemes', payload);
    return sanitize(normalizeResponse(response.data.scheme || response.data.data, 'scheme'));
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateScheme = createAsyncThunk('pricing/updateScheme', async ({ id, scheme }, { rejectWithValue }) => {
  try {
    const payload = sanitize(scheme);
    const response = await api.patch(`/pricing/schemes/${id}`, payload);
    return sanitize(normalizeResponse(response.data.scheme || response.data.data, 'scheme'));
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchCoupons = createAsyncThunk('pricing/fetchCoupons', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pricing/coupons');
    const raw = response.data.coupons || response.data.data || [];
    return sanitize(normalizeResponse(raw, 'coupon'));
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addCoupon = createAsyncThunk('pricing/addCoupon', async (data, { rejectWithValue }) => {
  try {
    const payload = sanitize(mapCouponToBackend(data));
    const response = await api.post('/pricing/coupons', payload);
    return sanitize(normalizeResponse(response.data.coupon || response.data.data, 'coupon'));
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
    const payload = sanitize(mapCouponToBackend(coupon));
    const response = await api.patch(`/pricing/coupons/${id}`, payload);
    return sanitize(normalizeResponse(response.data.coupon || response.data.data, 'coupon'));
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const setPriceListStatus = createAsyncThunk('pricing/setStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/pricing/${id}`, { status });
    return sanitize(response.data.pricingRule || response.data.data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const setSchemeStatus = createAsyncThunk('pricing/setSchemeStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/pricing/schemes/${id}`, { isActive: status === 'ACTIVE' });
    return sanitize(normalizeResponse(response.data.scheme || response.data.data, 'scheme'));
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
    const payload = sanitize(cartData);
    const response = await api.post('/pricing/evaluate', payload);
    return sanitize(response.data.data || response.data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchPromotionGroups = createAsyncThunk('pricing/fetchGroups', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/pricing/groups');
    return sanitize(response.data.groups || response.data.data?.groups || []);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addPromotionGroup = createAsyncThunk('pricing/addGroup', async (data, { rejectWithValue }) => {
  try {
    const payload = sanitize(data);
    const response = await api.post('/pricing/groups', payload);
    return sanitize(response.data.group || response.data.data);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  priceLists: [],
  schemes: [],
  coupons: [],
  promotionTypes: [],
  promotionGroups: [],
  eligibleOffers: [],
  totalPromoDiscount: 0,
  promoItems: [],
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
      .addCase(fetchPromotionTypes.fulfilled, (state, action) => {
        state.promotionTypes = action.payload || [];
      })
      .addCase(addPromotionType.fulfilled, (state, action) => {
        state.promotionTypes.unshift(action.payload);
      })
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
        state.eligibleOffers = action.payload?.appliedOffers || [];
        state.totalPromoDiscount = action.payload?.totalDiscount || 0;
        state.promoItems = action.payload?.items || [];
      })
      .addCase(evaluateOffers.rejected, (state) => {
        state.evaluateLoading = false;
        state.totalPromoDiscount = 0;
      })
      .addCase(deleteScheme.fulfilled, (state, action) => {
        state.schemes = state.schemes.filter((s) => s.id !== action.payload && s._id !== action.payload);
      })
      .addCase(fetchPromotionGroups.fulfilled, (state, action) => {
        state.promotionGroups = action.payload || [];
      })
      .addCase(addPromotionGroup.fulfilled, (state, action) => {
        state.promotionGroups.unshift(action.payload);
      });
  },
});

export const { clearPricingError } = pricingSlice.actions;
export default pricingSlice.reducer;
