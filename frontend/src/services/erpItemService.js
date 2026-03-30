import api from './api';

const erpItemService = {
  createItem: async (data) => {
    const response = await api.post('/items', data);
    return response.data;
  },
  
  updateItem: async (id, data) => {
    const response = await api.put(`/items/${id}`, data);
    return response.data;
  },
  
  deleteItem: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },
  
  allocateGroups: async (id, groupIds) => {
    const response = await api.post(`/items/${id}/allocate-group`, { groupIds });
    return response.data;
  },
  
  deallocateGroups: async (id, groupIds) => {
    const response = await api.post(`/items/${id}/deallocate-group`, { groupIds });
    return response.data;
  },
  
  importItems: async (formData, mapping, autoBarcode = false, overwrite = false) => {
    const data = new FormData();
    data.append('file', formData.get('file'));
    data.append('mapping', JSON.stringify(mapping));
    data.append('autoBarcode', autoBarcode);
    data.append('overwrite', overwrite);
    
    const response = await api.post('/import/items', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.results;
  },
  
  getItems: async (filters) => {
    const response = await api.get('/items', { params: filters });
    return response.data.items;
  },

  getHSNCodes: async () => {
    const response = await api.get('/setup/hsn');
    return response.data.data || response.data.hsns || response.data.hsnCodes || [];
  },

  getFormulas: async () => {
    const response = await api.get('/setup/formula');
    return response.data.data || response.data.formulas || [];
  }
};

export default erpItemService;
