import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';

export const fetchChallans = createAsyncThunk('dispatch/fetchChallans', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/dispatch');
        const raw = response.data.dispatches || response.data.data || [];
        return normalizeResponse(raw, 'dispatch');
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch delivery challans');
    }
});

export const addChallan = createAsyncThunk('dispatch/addChallan', async (challanData, { rejectWithValue }) => {
    try {
        const response = await api.post('/dispatch', challanData);
        const raw = response.data.dispatch || response.data.data;
        return normalizeResponse(raw, 'dispatch');
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add delivery challan');
    }
});

export const updateChallan = createAsyncThunk('dispatch/updateChallan', async ({ id, data }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/dispatch/${id}`, data);
        const raw = response.data.dispatch || response.data.data;
        return normalizeResponse(raw, 'dispatch');
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update delivery challan');
    }
});

export const updateChallanStatus = createAsyncThunk(
    'dispatch/updateStatus',
    async ({ id, status }, { rejectWithValue }) => {
        try {
            let endpoint = '';
            if (status === 'RECEIVED') endpoint = `/dispatch/${id}/receive`;
            else if (status === 'DISPATCHED') endpoint = `/dispatch/${id}/confirm`;
            else if (status === 'CANCELLED') endpoint = `/dispatch/${id}/cancel-draft`;
            else throw new Error(`Unsupported status update: ${status}`);

            const response = await api.post(endpoint);
            const raw = response.data.dispatch || response.data.data;
            return normalizeResponse(raw, 'dispatch');
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update dispatch status');
        }
    }
);

const initialState = {
    records: [],
    loading: false,
    error: null,
};

const dispatchSlice = createSlice({
    name: 'dispatch',
    initialState,
    reducers: {
        clearDispatchError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChallans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchChallans.fulfilled, (state, action) => {
                state.loading = false;
                state.records = action.payload || [];
            })
            .addCase(fetchChallans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addChallan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addChallan.fulfilled, (state, action) => {
                state.loading = false;
                state.records.unshift(action.payload);
            })
            .addCase(addChallan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateChallan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateChallan.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload;
                const idx = state.records.findIndex((r) => r.id === updated.id || r._id === updated._id);
                if (idx !== -1) {
                    state.records[idx] = updated;
                }
            })
            .addCase(updateChallan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateChallanStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateChallanStatus.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload;
                const idx = state.records.findIndex(
                    (r) => r.id === updated.id || r._id === updated._id
                );
                if (idx !== -1) {
                    state.records[idx] = updated;
                }
            })
            .addCase(updateChallanStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearDispatchError } = dispatchSlice.actions;
export default dispatchSlice.reducer;
