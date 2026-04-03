import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchSupplierOutwards = createAsyncThunk('supplierOutward/fetchAll', async (params, { rejectWithValue }) => {
    try {
        const res = await api.get('/supplier-outward', { params });
        return res.data.data.outwards;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const addSupplierOutward = createAsyncThunk('supplierOutward/add', async (data, { rejectWithValue }) => {
    try {
        const res = await api.post('/supplier-outward', data);
        return res.data.data.outward;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const supplierOutwardSlice = createSlice({
    name: 'supplierOutward',
    initialState: { records: [], loading: false, error: null },
    reducers: { clearError: (state) => { state.error = null; } },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSupplierOutwards.pending, (state) => { state.loading = true; })
            .addCase(fetchSupplierOutwards.fulfilled, (state, { payload }) => { state.loading = false; state.records = payload; })
            .addCase(fetchSupplierOutwards.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            .addCase(addSupplierOutward.fulfilled, (state, { payload }) => { state.records.unshift(payload); });
    }
});

export const { clearError } = supplierOutwardSlice.actions;
export default supplierOutwardSlice.reducer;
