import api from './api';

const erpGroupService = {
  getGroupTree: async () => {
    const response = await api.get('/groups/tree');
    return response.data.tree;
  },
  
  createGroup: async (data) => {
    const response = await api.post('/groups', data);
    return response.data.group;
  },
  
  updateGroup: async (id, data) => {
    const response = await api.put(`/groups/${id}`, data);
    return response.data.group;
  },
  
  deleteGroup: async (id) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  }
};

export default erpGroupService;
