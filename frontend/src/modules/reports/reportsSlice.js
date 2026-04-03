import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchYieldAnalysis = createAsyncThunk('reports/fetchYield', async (params, { rejectWithValue }) => {
    try {
        const res = await api.get('/reports/production/yield', { params });
        return res.data.data.report;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchConsolidatedStock = createAsyncThunk('reports/fetchConsolidatedStock', async (params, { rejectWithValue }) => {
    try {
        const res = await api.get('/reports/inventory/consolidated');
        return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const fetchClosurePreview = createAsyncThunk('reports/fetchClosurePreview', async (params, { rejectWithValue }) => {
    try {
        const res = await api.get('/reports/closure/preview', { params });
        return res.data.data.preview;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const postFinalizeClosure = createAsyncThunk('reports/finalizeClosure', async (data, { rejectWithValue }) => {
    try {
        const res = await api.post('/reports/closure/finalize', data);
        return res.data.data.closure;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const reportSlice = createSlice({
    name: 'reports',
    initialState: { yieldData: [], consolidatedStock: null, closurePreview: null, loading: false, error: null },
    reducers: {
        clearReportError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchYieldAnalysis.pending, (state) => { state.loading = true; })
            .addCase(fetchYieldAnalysis.fulfilled, (state, { payload }) => { state.loading = false; state.yieldData = payload; })
            .addCase(fetchYieldAnalysis.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            
            .addCase(fetchConsolidatedStock.pending, (state) => { state.loading = true; })
            .addCase(fetchConsolidatedStock.fulfilled, (state, { payload }) => { state.loading = false; state.consolidatedStock = payload; })
            .addCase(fetchConsolidatedStock.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })

            .addCase(fetchClosurePreview.pending, (state) => { state.loading = true; })
            .addCase(fetchClosurePreview.fulfilled, (state, { payload }) => { state.loading = false; state.closurePreview = payload; })
            .addCase(fetchClosurePreview.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    }
});

export const { clearReportError } = reportSlice.actions;
export default reportSlice.reducer;
