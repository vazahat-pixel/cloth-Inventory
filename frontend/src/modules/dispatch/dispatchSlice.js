import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';
import { extractPaginationMeta } from '../../utils/paginationMeta';
import { extractApiErrorMessage } from '../../utils/apiError';
import { createOperationIdempotencyKey, idempotencyHeaders } from '../../utils/idempotencyKey';

const postWithIdempotency = (url, body = {}, idempotencyKey) =>
    api.post(url, body, { headers: idempotencyHeaders(idempotencyKey) });

const putWithIdempotency = (url, body = {}, idempotencyKey) =>
    api.put(url, body, { headers: idempotencyHeaders(idempotencyKey) });

export const fetchChallans = createAsyncThunk('dispatch/fetchChallans', async (params = {}, { rejectWithValue }) => {
    try {
        const response = await api.get('/dispatch', { params });
        const data = response.data.data || response.data;
        const raw = data.dispatches || response.data.dispatches || [];
        const meta = extractPaginationMeta(response.data);
        return {
            records: normalizeResponse(raw, 'dispatch'),
            total: meta.total,
            page: meta.page,
            limit: meta.limit,
        };
    } catch (error) {
        return rejectWithValue(extractApiErrorMessage(error, 'Failed to fetch delivery challans'));
    }
});

export const addChallan = createAsyncThunk('dispatch/addChallan', async (challanData, { rejectWithValue }) => {
    try {
        const { idempotencyKey: providedKey, ...payload } = challanData;
        const idempotencyKey = providedKey || createOperationIdempotencyKey('challan-create');
        const response = await postWithIdempotency('/dispatch', payload, idempotencyKey);
        const raw = response.data.dispatch || response.data.data;
        return normalizeResponse(raw, 'dispatch');
    } catch (error) {
        return rejectWithValue(extractApiErrorMessage(error, 'Failed to add delivery challan'));
    }
});

export const updateChallan = createAsyncThunk('dispatch/updateChallan', async ({ id, data, idempotencyKey }, { rejectWithValue }) => {
    try {
        const key = idempotencyKey || createOperationIdempotencyKey('challan-update', id);
        const response = await putWithIdempotency(`/dispatch/${id}`, data, key);
        const raw = response.data.dispatch || response.data.data;
        return normalizeResponse(raw, 'dispatch');
    } catch (error) {
        return rejectWithValue(extractApiErrorMessage(error, 'Failed to update delivery challan'));
    }
});

export const confirmChallan = createAsyncThunk(
    'dispatch/confirmChallan',
    async ({ id, idempotencyKey } = {}, { rejectWithValue }) => {
        try {
            const key = idempotencyKey || createOperationIdempotencyKey('challan-confirm', id);
            const response = await postWithIdempotency(`/dispatch/${id}/confirm`, {}, key);
            const raw = response.data.dispatch || response.data.data;
            return normalizeResponse(raw, 'dispatch');
        } catch (error) {
            return rejectWithValue(extractApiErrorMessage(error, 'Failed to confirm and dispatch challan'));
        }
    }
);

export const combineAndConfirmDispatch = createAsyncThunk(
    'dispatch/combineAndConfirmDispatch',
    async (combineData, { rejectWithValue }) => {
        try {
            const { idempotencyKey: providedKey, ...payload } = combineData;
            const idempotencyKey = providedKey || createOperationIdempotencyKey('combine-dispatch');
            const response = await postWithIdempotency('/dispatch/combine-dispatch', payload, idempotencyKey);
            const raw = response.data.dispatch || response.data.data;
            return normalizeResponse(raw, 'dispatch');
        } catch (error) {
            return rejectWithValue(extractApiErrorMessage(error, 'Failed to combine and dispatch challans'));
        }
    }
);

export const deleteChallan = createAsyncThunk(
    'dispatch/deleteChallan',
    async (arg, { rejectWithValue }) => {
        try {
            const id = typeof arg === 'string' ? arg : arg?.id;
            const idempotencyKey = typeof arg === 'object' ? arg?.idempotencyKey : undefined;
            const key = idempotencyKey || createOperationIdempotencyKey('challan-delete', id);
            await api.delete(`/dispatch/${id}`, { headers: idempotencyHeaders(key) });
            return id;
        } catch (error) {
            return rejectWithValue(extractApiErrorMessage(error, 'Failed to delete delivery challan'));
        }
    }
);

export const updateChallanStatus = createAsyncThunk(
    'dispatch/updateStatus',
    async ({ id, status, receivedItems, idempotencyKey }, { rejectWithValue }) => {
        try {
            let endpoint = '';
            if (status === 'RECEIVED') endpoint = `/dispatch/${id}/receive`;
            else if (status === 'PACKED') endpoint = `/dispatch/${id}/pack`;
            else if (status === 'DISPATCHED') endpoint = `/dispatch/${id}/confirm`;
            else if (status === 'CANCELLED') endpoint = `/dispatch/${id}/cancel-draft`;
            else throw new Error(`Unsupported status update: ${status}`);

            const key = idempotencyKey || createOperationIdempotencyKey(`dispatch-${status}`, id);
            const body = status === 'RECEIVED' && receivedItems ? { receivedItems } : {};
            const response = await postWithIdempotency(endpoint, body, key);
            const raw = response.data.dispatch || response.data.data;
            return normalizeResponse(raw, 'dispatch');
        } catch (error) {
            return rejectWithValue(extractApiErrorMessage(error, 'Failed to update dispatch status'));
        }
    }
);

const initialState = {
    records: [],
    total: 0,
    page: 1,
    limit: 20,
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
                state.records = action.payload.records || [];
                state.total = action.payload.total ?? 0;
                state.page = action.payload.page ?? 1;
                state.limit = action.payload.limit ?? 20;
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
            })
            .addCase(deleteChallan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteChallan.fulfilled, (state, action) => {
                state.loading = false;
                state.records = state.records.filter((r) => r.id !== action.payload && r._id !== action.payload);
            })
            .addCase(deleteChallan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(combineAndConfirmDispatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(combineAndConfirmDispatch.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.records.unshift(action.payload);
                }
            })
            .addCase(combineAndConfirmDispatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearDispatchError } = dispatchSlice.actions;
export default dispatchSlice.reducer;
