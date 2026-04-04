import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// COMPANY PROFILE (Warehouse Settings)
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

const initialState = {
  companyProfile: {},
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
      .addCase(fetchCompanyProfile.fulfilled, (state, action) => {
        state.companyProfile = action.payload;
      })
      .addCase(updateCompanyProfile.fulfilled, (state, action) => {
        state.companyProfile = action.payload;
      });
  },
});

export const { clearSettingsError } = settingsSlice.actions;
export default settingsSlice.reducer;
