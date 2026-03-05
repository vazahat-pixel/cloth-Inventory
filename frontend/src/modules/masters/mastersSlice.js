import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks for different master entities
export const fetchMasters = createAsyncThunk('masters/fetchAll', async (entityKey, { rejectWithValue }) => {
  try {
    const endpointMap = {
      suppliers: '/suppliers',
      customers: '/customers',
      warehouses: '/stores',
      itemGroups: '/categories',
      salesmen: '/auth/users',
      brands: '/brands',
      accountGroups: '/account-groups',
      banks: '/banks',
    };

    const responseKeyMap = {
      suppliers: 'suppliers',
      customers: 'customers',
      warehouses: 'stores',
      itemGroups: 'categories',
      salesmen: 'users',
      brands: 'brands',
      accountGroups: 'accountGroups',
      banks: 'banks',
    };

    const endpoint = endpointMap[entityKey];
    if (!endpoint) return rejectWithValue(`No endpoint defined for ${entityKey}`);

    const response = await api.get(endpoint);
    const key = responseKeyMap[entityKey];
    const raw = response.data[key] || response.data.data || [];

    const entityTypeMapping = {
      itemGroups: 'category',
      warehouses: 'store',
      salesmen: 'user',
    };
    const entityType = entityTypeMapping[entityKey] || entityKey.slice(0, -1);
    return { entityKey, data: normalizeResponse(raw, entityType) };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addMasterRecord = createAsyncThunk('masters/add', async ({ entityKey, record }, { rejectWithValue }) => {
  try {
    const endpointMap = {
      suppliers: '/suppliers',
      customers: '/customers',
      warehouses: '/stores',
      itemGroups: '/categories',
      salesmen: '/auth/users',
      brands: '/brands',
      accountGroups: '/account-groups',
      banks: '/banks',
    };
    const endpoint = endpointMap[entityKey];
    const response = await api.post(endpoint, record);
    const resKey = entityKey === 'warehouses' ? 'store' : entityKey.slice(0, -1);
    const raw = response.data.data || response.data[resKey] || response.data[entityKey];

    const entityTypeMapping = {
      itemGroups: 'category',
      warehouses: 'store',
      salesmen: 'user',
    };
    const entityType = entityTypeMapping[entityKey] || entityKey.slice(0, -1);
    return { entityKey, data: normalizeResponse(raw, entityType) };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateMasterRecord = createAsyncThunk('masters/update', async ({ entityKey, id, updates }, { rejectWithValue }) => {
  try {
    const endpointMap = {
      suppliers: '/suppliers',
      customers: '/customers',
      warehouses: '/stores',
      itemGroups: '/categories',
      salesmen: '/auth/users',
      brands: '/brands',
      accountGroups: '/account-groups',
      banks: '/banks',
    };
    const endpoint = `${endpointMap[entityKey]}/${id}`;
    const response = await api.patch(endpoint, updates);
    const resKey = entityKey === 'warehouses' ? 'store' : entityKey.slice(0, -1);
    const raw = response.data.data || response.data[resKey] || response.data[entityKey];

    const entityTypeMapping = {
      itemGroups: 'category',
      warehouses: 'store',
      salesmen: 'user',
    };
    const entityType = entityTypeMapping[entityKey] || entityKey.slice(0, -1);
    return { entityKey, data: normalizeResponse(raw, entityType) };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteMasterRecord = createAsyncThunk('masters/delete', async ({ entityKey, id }, { rejectWithValue }) => {
  try {
    const endpointMap = {
      suppliers: '/suppliers',
      customers: '/customers',
      warehouses: '/stores',
      itemGroups: '/categories',
      salesmen: '/auth/users',
      brands: '/brands',
      accountGroups: '/account-groups',
      banks: '/banks',
    };
    const endpoint = `${endpointMap[entityKey]}/${id}`;
    await api.delete(endpoint);
    return { entityKey, id };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  suppliers: [],
  customers: [],
  warehouses: [],
  itemGroups: [],
  salesmen: [],
  brands: [],
  accountGroups: [],
  banks: [],
  loading: false,
  error: null,
};

const mastersSlice = createSlice({
  name: 'masters',
  initialState,
  reducers: {
    clearMastersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMasters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMasters.fulfilled, (state, action) => {
        state.loading = false;
        const { entityKey, data } = action.payload;
        state[entityKey] = data || [];
      })
      .addCase(fetchMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addMasterRecord.fulfilled, (state, action) => {
        const { entityKey, data } = action.payload;
        if (state[entityKey]) {
          state[entityKey].unshift(data);
        }
      })
      .addCase(updateMasterRecord.fulfilled, (state, action) => {
        const { entityKey, data } = action.payload;
        if (state[entityKey]) {
          const index = state[entityKey].findIndex((r) => r.id === data.id || r._id === data._id);
          if (index !== -1) {
            state[entityKey][index] = data;
          }
        }
      })
      .addCase(deleteMasterRecord.fulfilled, (state, action) => {
        const { entityKey, id } = action.payload;
        if (state[entityKey]) {
          state[entityKey] = state[entityKey].filter((r) => r.id !== id && r._id !== id);
        }
      });
  },
});

export const { clearMastersError } = mastersSlice.actions;
export default mastersSlice.reducer;
