import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

const endpointMap = {
  suppliers: '/suppliers',
  customers: '/customers',
  warehouses: '/warehouses',
  stores: '/stores',
  brands: '/brands',
  sizes: '/sizes',
  hsnCodes: '/setup/hsn',
};

const responseKeyMap = {
  suppliers: 'suppliers',
  customers: 'customers',
  warehouses: 'warehouses',
  stores: 'stores',
  brands: 'brands',
  sizes: 'sizes',
  hsnCodes: 'hsns',
};

const singularKeyMap = {
  suppliers: 'supplier',
  customers: 'customer',
  warehouses: 'warehouse',
  stores: 'store',
  brands: 'brand',
  sizes: 'size',
  hsnCodes: 'hsn',
};

// Async Thunks for different master entities
export const fetchMasters = createAsyncThunk('masters/fetchAll', async (entityKey, { rejectWithValue }) => {
  try {
    const endpoint = endpointMap[entityKey];
    if (!endpoint) return rejectWithValue(`No endpoint defined for ${entityKey}`);

    const response = await api.get(endpoint);
    const key = responseKeyMap[entityKey];
    const singularKey = singularKeyMap[entityKey];
    const raw = response.data[key] || response.data.data?.[key] || response.data[singularKey] || response.data.data?.[singularKey] || response.data.data || [];

    const entityTypeMapping = {
      warehouses: 'warehouse',
      stores: 'store',
    };
    const entityType = entityTypeMapping[entityKey] || entityKey.slice(0, -1);
    return { entityKey, data: normalizeResponse(raw, entityType) };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addMasterRecord = createAsyncThunk('masters/add', async ({ entityKey, record }, { rejectWithValue }) => {
  try {
    const endpoint = endpointMap[entityKey];
    if (!endpoint) return rejectWithValue(`No endpoint defined for ${entityKey}`);

    // Map frontend fields to backend payloads for specific entities
    let payload = record;
    if (entityKey === 'suppliers') {
      // Map frontend fields (supplierName, gstNo) to backend (name, gstNumber)
      payload = {
        name: record.supplierName,
        supplierCode: record.supplierCode,
        contactPerson: record.contactPerson,
        phone: record.phone,
        email: record.email,
        address: record.addressLine1 || record.address,
        addressLine1: record.addressLine1,
        addressLine2: record.addressLine2,
        city: record.city,
        state: record.state,
        pincode: record.pincode,
        country: record.country,
        bankDetails: record.bankDetails,
        gstNumber: record.gstNo || record.gstNumber,
        panNo: record.panNo,
        supplierType: record.supplierType,
        alternatePhone: record.alternatePhone,
        notes: record.notes,
        status: record.status,
        groupId: record.groupId === '' ? null : record.groupId,
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
        gstNumber: record.gstNumber || record.gstNo,
        isActive: record.status !== 'Inactive',
      };
    } else if (entityKey === 'sizes') {
      payload = {
        code: record.sizeCode,
        label: record.sizeLabel,
        sequence: record.sequence,
        group: record.group,
        isActive: record.status !== 'Inactive',
      };
    } else if (entityKey === 'hsnCodes') {
      payload = {
        code: record.hsnCode,
        description: record.description,
        gstRate: record.gstRate,
        status: record.status,
      };
    }

    const response = await api.post(endpoint, payload);

    const key = responseKeyMap[entityKey];
    const singularKey = singularKeyMap[entityKey];
    const raw = response.data[key] || response.data.data?.[key] || response.data[singularKey] || response.data.data?.[singularKey] || response.data.data;

    const entityTypeMapping = {
      warehouses: 'warehouse',
      stores: 'store',
    };
    const entityType = entityTypeMapping[entityKey] || entityKey.slice(0, -1);
    return { entityKey, data: normalizeResponse(raw, entityType) };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateMasterRecord = createAsyncThunk('masters/update', async ({ entityKey, id, updates }, { rejectWithValue }) => {
  try {
    const endpoint = `${endpointMap[entityKey]}/${id}`;
    if (!endpoint) return rejectWithValue(`No endpoint defined for ${entityKey}`);

    // Map update payloads similar to addMasterRecord
    let payload = updates;
    if (entityKey === 'suppliers') {
      payload = {
        name: updates.supplierName,
        supplierCode: updates.supplierCode,
        contactPerson: updates.contactPerson,
        phone: updates.phone,
        email: updates.email,
        address: updates.addressLine1 || updates.address,
        addressLine1: updates.addressLine1,
        addressLine2: updates.addressLine2,
        city: updates.city,
        state: updates.state,
        pincode: updates.pincode,
        country: updates.country,
        bankDetails: updates.bankDetails,
        gstNumber: updates.gstNo || updates.gstNumber,
        panNo: updates.panNo,
        supplierType: updates.supplierType,
        alternatePhone: updates.alternatePhone,
        notes: updates.notes,
        status: updates.status,
        groupId: updates.groupId === '' ? null : updates.groupId,
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
        gstNumber: updates.gstNumber || updates.gstNo,
        isActive: updates.status !== 'Inactive',
      };
    } else if (entityKey === 'sizes') {
      payload = {
        code: updates.sizeCode,
        label: updates.sizeLabel,
        sequence: updates.sequence,
        group: updates.group,
        isActive: updates.status !== 'Inactive',
      };
    } else if (entityKey === 'hsnCodes') {
      payload = {
        code: updates.hsnCode,
        description: updates.description,
        gstRate: updates.gstRate,
        status: updates.status,
      };
    }

    const response = await api.patch(endpoint, payload);

    const key = responseKeyMap[entityKey];
    const singularKey = singularKeyMap[entityKey];
    const raw = response.data[key] || response.data.data?.[key] || response.data[singularKey] || response.data.data?.[singularKey] || response.data.data;

    const entityTypeMapping = {
      warehouses: 'warehouse',
      stores: 'store',
    };
    const entityType = entityTypeMapping[entityKey] || entityKey.slice(0, -1);
    return { entityKey, data: normalizeResponse(raw, entityType) };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteMasterRecord = createAsyncThunk('masters/delete', async ({ entityKey, id }, { rejectWithValue }) => {
  try {
    const endpoint = `${endpointMap[entityKey]}/${id}`;
    if (!endpoint) return rejectWithValue(`No endpoint defined for ${entityKey}`);
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
  brands: [],
  sizes: [],
  hsnCodes: [],
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
