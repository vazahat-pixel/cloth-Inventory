import api from './api';

const monitoringService = {
  getDashboardSummary: async () => {
    const response = await api.get('/inventory/dashboard-summary');
    return response.data.data;
  },

  getSystemLogs: async () => {
    const response = await api.get('/inventory/system-logs');
    return response.data.data;
  },

  getErrorLogs: async () => {
    const response = await api.get('/inventory/error-logs');
    return response.data.data;
  },

  getStockLedger: async (itemId) => {
    const response = await api.get(`/inventory/stock-ledger/${itemId}`);
    return response.data.data;
  }
};

export default monitoringService;
