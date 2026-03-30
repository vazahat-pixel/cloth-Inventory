import React, { useState, useEffect } from 'react';
import erpGroupService from '../../services/erpGroupService';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, Folder, Type, Layout, Tag } from 'lucide-react';

const GroupManagement = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({ name: '', type: 'category', parentId: null });

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const data = await erpGroupService.getGroupTree();
      setTree(data);
    } catch (error) {
      console.error('Failed to fetch tree', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const openAddModal = (parentId = null) => {
    setCurrentGroup({ name: '', type: 'category', parentId });
    setIsModalOpen(true);
  };

  const openEditModal = (group) => {
    setCurrentGroup({ ...group });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentGroup._id) {
        await erpGroupService.updateGroup(currentGroup._id, currentGroup);
      } else {
        await erpGroupService.createGroup(currentGroup);
      }
      setIsModalOpen(false);
      fetchTree();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await erpGroupService.deleteGroup(id);
        fetchTree();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const GroupIcons = {
    category: <Folder size={18} className="text-blue-500" />,
    brand: <Layout size={18} className="text-purple-500" />,
    fabric: <Tag size={18} className="text-green-500" />,
    type: <Type size={18} className="text-orange-500" />,
    other: <Tag size={18} />
  };

  const renderNode = (node) => {
    const isExpanded = expanded.has(node._id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node._id} className="group-node-container" style={{ paddingLeft: '1.25rem' }}>
        <div className="flex items-center gap-2 py-2 hover:bg-slate-50 rounded-md px-2 cursor-pointer transition-all">
          <div onClick={() => toggleExpand(node._id)} className="w-5 flex items-center">
            {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : null}
          </div>
          
          {GroupIcons[node.type] || <Folder size={18} />}
          
          <span className="flex-1 font-medium text-slate-700">{node.name}</span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openAddModal(node._id)} className="p-1 hover:bg-white rounded-md text-slate-500"><Plus size={14} /></button>
            <button onClick={() => openEditModal(node)} className="p-1 hover:bg-white rounded-md text-slate-500"><Edit2 size={14} /></button>
            <button onClick={() => handleDelete(node._id)} className="p-1 hover:bg-white rounded-md text-red-500"><Trash2 size={14} /></button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l border-slate-200 ml-2">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in max-w-4xl mx-auto p-6">
      <div className="erp-card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Group Management</h2>
            <p className="text-slate-500 text-sm">Organize your clothing inventory hierarchy</p>
          </div>
          <button onClick={() => openAddModal()} className="erp-btn erp-btn-primary">
            <Plus size={18} /> New Master Group
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden p-4">
            {tree.length > 0 ? tree.map(node => renderNode(node)) : (
              <div className="text-center p-12 text-slate-400">No groups found. Create your first group to get started.</div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="erp-card w-full max-w-md p-6 fade-in">
            <h3 className="text-xl font-bold mb-4">{currentGroup._id ? 'Edit Group' : 'Add New Group'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="erp-label">Group Name</label>
                <input 
                  autoFocus
                  required
                  className="erp-input"
                  value={currentGroup.name}
                  onChange={(e) => setCurrentGroup({...currentGroup, name: e.target.value})}
                  placeholder="Enter name (e.g., Fabric, Men's Wear)"
                />
              </div>
              <div>
                <label className="erp-label">Type</label>
                <select 
                  className="erp-input"
                  value={currentGroup.type}
                  onChange={(e) => setCurrentGroup({...currentGroup, type: e.target.value})}
                >
                  <option value="category">Category</option>
                  <option value="brand">Brand</option>
                  <option value="fabric">Fabric</option>
                  <option value="type">Type</option>
                  <option value="design">Design</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="erp-btn erp-btn-secondary">Cancel</button>
                <button type="submit" className="erp-btn erp-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
