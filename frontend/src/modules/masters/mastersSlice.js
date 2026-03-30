import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

// Async Thunks for different master entities
export const fetchMasters = createAsyncThunk('masters/fetchAll', async (entityKey, { rejectWithValue }) => {
  try {
    const endpointMap = {
      suppliers: '/suppliers',
      customers: '/customers',
      warehouses: '/warehouses',
      stores: '/stores',
      itemGroups: '/groups',
      salesmen: '/auth/users',
      brands: '/brands',
      accountGroups: '/account-groups',
      banks: '/banks',
    };

    const responseKeyMap = {
      suppliers: 'suppliers',
      customers: 'customers',
      warehouses: 'warehouses',
      stores: 'stores',
      itemGroups: 'groups',
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
      itemGroups: 'group',
      warehouses: 'warehouse',
      stores: 'store',
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
      warehouses: '/warehouses',
      stores: '/stores',
      itemGroups: '/groups',
      salesmen: '/auth/users',
      brands: '/brands',
      accountGroups: '/account-groups',
      banks: '/banks',
    };
    const endpoint = endpointMap[entityKey];

    // Map frontend fields to backend payloads for specific entities
    let payload = record;
    if (entityKey === 'itemGroups') {
      // Item groups are backed by Group model
      payload = {
        name: record.groupName,
        groupType: record.groupType || record.type,
        parentId: record.parentId || record.parentGroup || null,
        isActive: record.isActive !== undefined ? record.isActive : record.status !== 'Inactive',
      };
    } else if (entityKey === 'customers') {
      // Customers: map UI fields to customer model fields
      payload = {
        name: record.customerName,
        phone: record.mobileNumber,
        email: record.email,
        address: record.address,
        points: record.loyaltyPoints ?? 0,
        isActive: record.status !== 'Inactive',
      };
    } else if (entityKey === 'banks') {
      // Banks: map bankName -> name
      payload = {
        name: record.bankName,
        accountNumber: record.accountNumber,
        branch: record.branch,
        ifsc: record.ifsc,
      };
    } else if (entityKey === 'warehouses') {
      // Warehouses: map dialog fields to backend warehouse schema
      payload = {
        name: record.warehouseName,
        code: record.code,
        contactPerson: record.managerName,
        contactPhone: record.contactNumber,
        location: {
          address: record.location,
          city: record.city,
          state: record.state,
          pincode: record.pincode || '',
        },
        isActive: record.status !== 'Inactive',
      };
    }

    const response = await api.post(endpoint, payload);

    let raw;
    if (entityKey === 'itemGroups') {
      raw = response.data.group || response.data.data?.group;
    } else {
      raw = response.data.data || response.data[entityKey.slice(0, -1)] || response.data[entityKey];
    }

    const entityTypeMapping = {
      itemGroups: 'group',
      warehouses: 'warehouse',
      stores: 'store',
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
      warehouses: '/warehouses',
      stores: '/stores',
      itemGroups: '/groups',
      salesmen: '/auth/users',
      brands: '/brands',
      accountGroups: '/account-groups',
      banks: '/banks',
    };
    const endpoint = `${endpointMap[entityKey]}/${id}`;

    // Map update payloads similar to addMasterRecord
    let payload = updates;
    if (entityKey === 'itemGroups') {
      payload = {
        name: updates.groupName,
        groupType: updates.groupType || updates.type,
        parentId: updates.parentId || updates.parentGroup || null,
        isActive: updates.isActive !== undefined ? updates.isActive : updates.status !== 'Inactive',
      };
    } else if (entityKey === 'customers') {
      payload = {
        name: updates.customerName,
        phone: updates.mobileNumber,
        email: updates.email,
        address: updates.address,
        points: updates.loyaltyPoints ?? 0,
        isActive: updates.status !== 'Inactive',
      };
    } else if (entityKey === 'banks') {
      payload = {
        name: updates.bankName,
        accountNumber: updates.accountNumber,
        branch: updates.branch,
        ifsc: updates.ifsc,
      };
    } else if (entityKey === 'warehouses') {
      payload = {
        name: updates.warehouseName,
        code: updates.code,
        contactPerson: updates.managerName,
        contactPhone: updates.contactNumber,
        location: {
          address: updates.location,
          city: updates.city,
          state: updates.state,
          pincode: updates.pincode || '',
        },
        isActive: updates.status !== 'Inactive',
      };
    }

    const response = await api.patch(endpoint, payload);

    let raw;
    if (entityKey === 'itemGroups') {
      raw = response.data.group || response.data.data?.group;
    } else {
      raw = response.data.data || response.data[entityKey.slice(0, -1)] || response.data[entityKey];
    }

    const entityTypeMapping = {
      itemGroups: 'group',
      warehouses: 'warehouse',
      stores: 'store',
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
      warehouses: '/warehouses',
      stores: '/stores',
      itemGroups: '/groups',
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
  stores: [],
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
