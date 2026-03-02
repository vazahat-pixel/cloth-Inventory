import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks

// USERS
export const fetchUsers = createAsyncThunk('settings/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/users');
    return response.data.users || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addUser = createAsyncThunk('settings/addUser', async (userData, { rejectWithValue }) => {
  try {
    const payload = {
      name: userData.userName,
      email: userData.email,
      password: userData.password || 'Temporary@123',
      mobile: userData.mobile,
      role: userData.roleId === 'Admin' ? 'admin' : 'store_staff',
    };
    const response = await api.post('/auth/users', payload);
    return response.data.user || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateUser = createAsyncThunk('settings/updateUser', async ({ id, user }, { rejectWithValue }) => {
  try {
    const payload = {
      name: user.userName,
      email: user.email,
      mobile: user.mobile,
      role: user.roleId?.toLowerCase(),
      status: user.status
    };
    const response = await api.patch(`/auth/users/${id}`, payload);
    return response.data.user || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// AUDIT LOG
export const fetchAuditLog = createAsyncThunk('settings/fetchAudit', async (params, { rejectWithValue }) => {
  try {
    const response = await api.get('/reports/audit-logs', { params });
    return response.data.logs || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// COMPANY PROFILE
export const fetchCompanyProfile = createAsyncThunk('settings/fetchCompany', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/company');
    return response.data.company || response.data.data || {};
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateCompanyProfile = createAsyncThunk('settings/updateCompany', async (companyData, { rejectWithValue }) => {
  try {
    const response = await api.patch('/settings/company', companyData);
    return response.data.company || response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// ROLES
export const fetchRoles = createAsyncThunk('settings/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/roles');
    return response.data.roles || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addRole = createAsyncThunk('settings/addRole', async (roleData, { rejectWithValue }) => {
  try {
    const response = await api.post('/settings/roles', roleData);
    return response.data.role || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateRole = createAsyncThunk('settings/updateRole', async ({ id, role }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/settings/roles/${id}`, role);
    return response.data.role || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// NUMBER SERIES
export const fetchNumberSeries = createAsyncThunk('settings/fetchNumberSeries', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/number-series');
    return response.data.numberSeries || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addNumberSeries = createAsyncThunk('settings/addNS', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/settings/number-series', data);
    return response.data.numberSeries || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateNumberSeries = createAsyncThunk('settings/updateNS', async ({ id, numberSeries }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/settings/number-series/${id}`, numberSeries);
    return response.data.numberSeries || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// PRINT TEMPLATES
export const fetchPrintTemplates = createAsyncThunk('settings/fetchTemplates', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/print-templates');
    return response.data.templates || response.data.data || [];
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const addPrintTemplate = createAsyncThunk('settings/addTemplate', async (data, { rejectWithValue }) => {
  try {
    const response = await api.post('/settings/print-templates', data);
    return response.data.template || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updatePrintTemplate = createAsyncThunk('settings/updateTemplate', async ({ id, printTemplate }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/settings/print-templates/${id}`, printTemplate);
    return response.data.template || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// PREFERENCES & CONFIG
export const fetchPreferences = createAsyncThunk('settings/fetchPrefs', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/preferences');
    return response.data.preferences || response.data.data || {};
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updatePreferences = createAsyncThunk('settings/updatePrefs', async (data, { rejectWithValue }) => {
  try {
    const response = await api.patch('/settings/preferences', data);
    return response.data.preferences || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchPurchaseVoucherConfig = createAsyncThunk('settings/fetchPVConfig', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/settings/purchase-voucher-config');
    return response.data.config || response.data.data || {};
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updatePurchaseVoucherConfig = createAsyncThunk('settings/updatePVConfig', async (data, { rejectWithValue }) => {
  try {
    const response = await api.patch('/settings/purchase-voucher-config', data);
    return response.data.config || response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  companyProfile: {},
  users: [],
  roles: [],
  numberSeries: [],
  preferences: {},
  purchaseVoucherConfig: {},
  printTemplates: [],
  auditLog: [],
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Users
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload || [];
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id || u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Audit
      .addCase(fetchAuditLog.fulfilled, (state, action) => {
        state.auditLog = action.payload || [];
      })
      // Company
      .addCase(fetchCompanyProfile.fulfilled, (state, action) => {
        state.companyProfile = action.payload;
      })
      .addCase(updateCompanyProfile.fulfilled, (state, action) => {
        state.companyProfile = action.payload;
      })
      // Roles
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload || [];
      })
      .addCase(addRole.fulfilled, (state, action) => {
        state.roles.unshift(action.payload);
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        const index = state.roles.findIndex((r) => r.id === action.payload.id || r._id === action.payload._id);
        if (index !== -1) state.roles[index] = action.payload;
      })
      // Number Series
      .addCase(fetchNumberSeries.fulfilled, (state, action) => {
        state.numberSeries = action.payload || [];
      })
      .addCase(addNumberSeries.fulfilled, (state, action) => {
        state.numberSeries.unshift(action.payload);
      })
      .addCase(updateNumberSeries.fulfilled, (state, action) => {
        const index = state.numberSeries.findIndex((ns) => ns.id === action.payload.id || ns._id === action.payload._id);
        if (index !== -1) state.numberSeries[index] = action.payload;
      })
      // Templates
      .addCase(fetchPrintTemplates.fulfilled, (state, action) => {
        state.printTemplates = action.payload || [];
      })
      .addCase(addPrintTemplate.fulfilled, (state, action) => {
        state.printTemplates.unshift(action.payload);
      })
      .addCase(updatePrintTemplate.fulfilled, (state, action) => {
        const index = state.printTemplates.findIndex((t) => t.id === action.payload.id || t._id === action.payload._id);
        if (index !== -1) state.printTemplates[index] = action.payload;
      })
      // Prefs
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      // Voucher Config
      .addCase(fetchPurchaseVoucherConfig.fulfilled, (state, action) => {
        state.purchaseVoucherConfig = action.payload;
      })
      .addCase(updatePurchaseVoucherConfig.fulfilled, (state, action) => {
        state.purchaseVoucherConfig = action.payload;
      });
  },
});

export const { clearSettingsError } = settingsSlice.actions;
export default settingsSlice.reducer;
