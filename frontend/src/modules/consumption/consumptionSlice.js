import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchConsumptions = createAsyncThunk('consumption/fetchAll', async (params, { rejectWithValue }) => {
    try {
        const res = await api.get('/consumption', { params });
        return res.data.consumptions;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

export const addConsumption = createAsyncThunk('consumption/add', async (data, { rejectWithValue }) => {
    try {
        const res = await api.post('/consumption', data);
        return res.data.consumption;
    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
});

const consumptionSlice = createSlice({
    name: 'consumption',
    initialState: { records: [], loading: false, error: null },
    reducers: { clearError: (state) => { state.error = null; } },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConsumptions.pending, (state) => { state.loading = true; })
            .addCase(fetchConsumptions.fulfilled, (state, { payload }) => { state.loading = false; state.records = payload; })
            .addCase(fetchConsumptions.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
            .addCase(addConsumption.fulfilled, (state, { payload }) => { state.records.unshift(payload); });
    }
});

export const { clearError } = consumptionSlice.actions;
export default consumptionSlice.reducer;
