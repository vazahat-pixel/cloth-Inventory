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
            });
    },
});

export const { clearDispatchError } = dispatchSlice.actions;
export default dispatchSlice.reducer;
