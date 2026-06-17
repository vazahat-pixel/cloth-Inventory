import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { normalizeResponse } from '../../services/normalization';
import { extractPaginationMeta } from '../../utils/paginationMeta';
import { fetchAllPaginatedList } from '../../utils/fetchAllPages';

// Async Thunks
export const fetchSales = createAsyncThunk(
  'sales/fetchAll',
  async (params = {}, { rejectWithValue }) => {
  try {
    const response = await api.get('/sales', { params });
    const raw = response.data.sales || response.data.data?.sales || [];
    const meta = extractPaginationMeta(response.data);
    return {
      records: normalizeResponse(raw, 'sale'),
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
    };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales');
  }
  },
);

/** Report pages only — keeps list/POS sales data separate from report totals */
export const fetchSalesForReport = createAsyncThunk(
  'sales/fetchForReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page: _p, limit: _l, forReport: _f, ...query } = params;
      const { records: raw, total, page, limit } = await fetchAllPaginatedList(
        '/sales',
        query,
        ['sales'],
      );
      return {
        records: normalizeResponse(raw, 'sale'),
        total,
        page,
        limit,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales report');
    }
  },
);

export const addSale = createAsyncThunk('sales/add', async (saleData, { rejectWithValue }) => {
  try {
    // Basic mapping: warehouseId -> storeId if needed, though BillingPage should handle it
    const payload = {
      ...saleData,
      storeId: saleData.storeId || saleData.warehouseId,
      paymentMode: saleData.paymentMode?.toUpperCase() || 'CASH',
    };
    const response = await api.post('/sales', payload);
    const raw = response.data.sale || response.data.data;
    return normalizeResponse(raw, 'sale');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add sale');
  }
});

export const updateSale = createAsyncThunk('sales/update', async ({ id, saleData }, { rejectWithValue }) => {
  try {
    const payload = {
      ...saleData,
      storeId: saleData.storeId || saleData.warehouseId,
      paymentMode: saleData.paymentMode?.toUpperCase() || 'CASH',
    };
    const response = await api.put(`/sales/${id}`, payload);
    const raw = response.data.sale || response.data.data;
    return normalizeResponse(raw, 'sale');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update sale');
  }
});

export const deleteSale = createAsyncThunk('sales/delete', async ({ id, reason }, { rejectWithValue }) => {
  try {
    await api.delete(`/sales/${id}`, { data: { reason } });
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete sale');
  }
});

export const cancelSale = createAsyncThunk('sales/cancel', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/sales/${id}/cancel`, { reason });
    const raw = response.data.sale || response.data.data;
    return normalizeResponse(raw, 'sale');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to cancel sale');
  }
});

export const fetchSalesReturns = createAsyncThunk('sales/fetchReturns', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/returns?type=CUSTOMER_RETURN');
    const raw = response.data.returns || response.data.data || [];
    return normalizeResponse(raw, 'return');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch returns');
  }
});

export const addSalesReturn = createAsyncThunk('sales/addReturn', async (returnData, { rejectWithValue }) => {
  try {
    const payload = {
      ...returnData,
      type: returnData.type || 'CUSTOMER_RETURN',
      paymentMode: returnData.paymentMode?.toUpperCase() || 'CASH',
    };
    const response = await api.post('/returns', payload);
    const raw = response.data.returnEntry || response.data.data;
    return normalizeResponse(raw, 'return');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add return');
  }
});

const initialState = {
  records: [],
  reportRecords: [],
  reportTotal: 0,
  returns: [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  reportLoading: false,
  error: null,
  lastFetchedAt: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearSalesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Sales
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records || [];
        state.total = action.payload.total ?? 0;
        state.page = action.payload.page ?? 1;
        state.limit = action.payload.limit ?? 20;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSalesForReport.pending, (state) => {
        state.reportLoading = true;
        state.error = null;
      })
      .addCase(fetchSalesForReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.reportRecords = action.payload.records || [];
        state.reportTotal = action.payload.total ?? 0;
      })
      .addCase(fetchSalesForReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.error = action.payload;
      })
      // Add Sale
      .addCase(addSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSale.fulfilled, (state, action) => {
        state.loading = false;
        state.records.unshift(action.payload);
      })
      .addCase(addSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Sale
      .addCase(updateSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSale.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.records.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      .addCase(updateSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Sale
      .addCase(deleteSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSale.fulfilled, (state, action) => {
        state.loading = false;
        state.records = state.records.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel Sale
      .addCase(cancelSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelSale.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.records.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      .addCase(cancelSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Returns
      .addCase(fetchSalesReturns.fulfilled, (state, action) => {
        state.returns = action.payload || [];
      })
      // Add Return
      .addCase(addSalesReturn.fulfilled, (state, action) => {
        state.returns.unshift(action.payload);
      });
  },
});

export const { clearSalesError } = salesSlice.actions;
export default salesSlice.reducer;
