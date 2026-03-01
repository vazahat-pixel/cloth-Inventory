import { createSlice, nanoid } from '@reduxjs/toolkit';
import {
  companyProfileData,
  usersData,
  rolesData,
  numberSeriesData,
  preferencesData,
  purchaseVoucherConfigData,
  printTemplatesData,
  auditLogData,
} from './data';

const initialState = {
  companyProfile: companyProfileData,
  users: usersData,
  roles: rolesData,
  numberSeries: numberSeriesData,
  preferences: preferencesData,
  purchaseVoucherConfig: purchaseVoucherConfigData,
  printTemplates: printTemplatesData,
  auditLog: auditLogData,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateCompanyProfile: (state, action) => {
      state.companyProfile = { ...state.companyProfile, ...action.payload };
    },

    addUser: {
      reducer: (state, action) => {
        state.users.unshift(action.payload);
      },
      prepare: (user) => ({
        payload: { id: user.id || nanoid(10), status: user.status || 'Active', ...user },
      }),
    },
    updateUser: (state, action) => {
      const { id, user } = action.payload;
      const idx = state.users.findIndex((u) => u.id === id);
      if (idx === -1) return;
      state.users[idx] = { ...state.users[idx], ...user };
    },

    addRole: {
      reducer: (state, action) => {
        state.roles.unshift(action.payload);
      },
      prepare: (role) => ({
        payload: { id: role.id || nanoid(10), status: role.status || 'Active', ...role },
      }),
    },
    updateRole: (state, action) => {
      const { id, role } = action.payload;
      const idx = state.roles.findIndex((r) => r.id === id);
      if (idx === -1) return;
      state.roles[idx] = { ...state.roles[idx], ...role };
    },

    addNumberSeries: {
      reducer: (state, action) => {
        state.numberSeries.unshift(action.payload);
      },
      prepare: (ns) => ({
        payload: { id: ns.id || nanoid(10), status: ns.status || 'Active', ...ns },
      }),
    },
    updateNumberSeries: (state, action) => {
      const { id, numberSeries } = action.payload;
      const idx = state.numberSeries.findIndex((n) => n.id === id);
      if (idx === -1) return;
      state.numberSeries[idx] = { ...state.numberSeries[idx], ...numberSeries };
    },

    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    addPrintTemplate: {
      reducer: (state, action) => {
        state.printTemplates.unshift(action.payload);
      },
      prepare: (tpl) => ({
        payload: { id: tpl.id || nanoid(10), status: tpl.status || 'Active', ...tpl },
      }),
    },
    updatePrintTemplate: (state, action) => {
      const { id, printTemplate } = action.payload;
      const idx = state.printTemplates.findIndex((p) => p.id === id);
      if (idx === -1) return;
      state.printTemplates[idx] = { ...state.printTemplates[idx], ...printTemplate };
    },

    addAuditEntry: {
      reducer: (state, action) => {
        state.auditLog.unshift(action.payload);
      },
      prepare: (entry) => ({
        payload: { id: entry.id || nanoid(10), ...entry },
      }),
    },
  },
});

export const {
  updateCompanyProfile,
  updatePurchaseVoucherConfig,
  addUser,
  updateUser,
  addRole,
  updateRole,
  addNumberSeries,
  updateNumberSeries,
  updatePreferences,
  addPrintTemplate,
  updatePrintTemplate,
  addAuditEntry,
} = settingsSlice.actions;

export default settingsSlice.reducer;
