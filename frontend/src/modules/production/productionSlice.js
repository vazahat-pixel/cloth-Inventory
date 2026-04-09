import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchOutwards = createAsyncThunk(
    'production/fetchOutwards',
    async (filters = {}, { rejectWithValue }) => {
        try {
            const response = await api.get('/production/outwards', { params: filters });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch job work records');
        }
    }
);

export const addOutward = createAsyncThunk(
    'production/addOutward',
    async (outwardData, { rejectWithValue }) => {
        try {
            const response = await api.post('/production/outwards', outwardData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to record job work issue');
        }
    }
);

export const fetchOutwardById = createAsyncThunk(
    'production/fetchOutwardById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/production/outwards/${id}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch job work detail');
        }
    }
);

const initialState = {
    outwards: [],
    loading: false,
    error: null,
    currentOutward: null
};

const productionSlice = createSlice({
    name: 'production',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Outwards
            .addCase(fetchOutwards.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOutwards.fulfilled, (state, action) => {
                state.loading = false;
                state.outwards = action.payload;
            })
            .addCase(fetchOutwards.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add Outward
            .addCase(addOutward.pending, (state) => {
                state.loading = true;
            })
            .addCase(addOutward.fulfilled, (state, action) => {
                state.loading = false;
                state.outwards.unshift(action.payload);
            })
            .addCase(addOutward.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Outward by ID
            .addCase(fetchOutwardById.fulfilled, (state, action) => {
                state.currentOutward = action.payload;
            });
    }
});

export const { clearError } = productionSlice.actions;
export default productionSlice.reducer;
