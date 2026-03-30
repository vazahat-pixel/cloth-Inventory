import React, { useState, useEffect } from 'react';
import erpGroupService from '../../services/erpGroupService';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, Folder, Type, Layout, Tag, Smartphone, Save } from 'lucide-react';
import './erp.css';

const SetupGroupsScreen = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());
  const [currentGroup, setCurrentGroup] = useState({ name: '', groupType: 'Type', parentId: null });

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const data = await erpGroupService.getGroupTree();
      setTree(data);
    } catch (e) {
      console.error(e);
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

  const handleSave = async () => {
    if (!currentGroup.name.trim()) {
      alert('Group name is required');
      return;
    }

    try {
      if (currentGroup._id) await erpGroupService.updateGroup(currentGroup._id, currentGroup);
      else await erpGroupService.createGroup(currentGroup);
      alert('Group saved successfully');
      fetchTree();
      setCurrentGroup({ name: '', groupType: 'Type', parentId: null });
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this group?')) {
      try {
        await erpGroupService.deleteGroup(id);
        fetchTree();
      } catch (e) { alert(e.message); }
    }
  };

  const renderNode = (node) => {
    const isExpanded = expanded.has(node._id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node._id} style={{ paddingLeft: '1.25rem' }}>
        <div className={`flex items-center gap-2 py-1 px-2 hover:bg-indigo-50 border border-transparent rounded cursor-pointer transition-all
          ${currentGroup._id === node._id ? 'bg-indigo-100 border-indigo-200' : ''}`}
          onClick={() => setCurrentGroup({...node})}
        >
          <div onClick={(e) => { e.stopPropagation(); toggleExpand(node._id); }} className="w-4">
            {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
          </div>
          <span className="flex-1 font-semibold text-slate-700">{node.name}</span>
          <span className="text-[10px] text-slate-400 uppercase font-black">{node.groupType || 'Section'}</span>
          <div className="flex gap-1">
             <button onClick={() => setCurrentGroup({ name: '', groupType: 'Type', parentId: node._id })} className="p-1 hover:text-indigo-600"><Plus size={12} /></button>
             <button onClick={() => handleDelete(node._id)} className="p-1 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
        </div>
        {isExpanded && node.children && (
          <div className="border-l border-slate-100 ml-1.5">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="erp-main-area">
      <div className="flex h-full">
        {/* Left Tree */}
        <div className="w-1/2 p-4 border-r overflow-y-auto bg-white flex flex-col">
            <h3 className="font-bold border-b pb-2 mb-4 flex items-center gap-2"><Folder size={16} className="text-indigo-600" /> Group Hierarchy Master</h3>
            {loading ? <div className="animate-pulse flex-1 bg-slate-50 border border-slate-100 rounded-lg"></div> : (
              <div className="flex-1 overflow-y-auto">
                {tree.map(node => renderNode(node))}
              </div>
            )}
        </div>

        {/* Right Detail Pane */}
        <div className="w-1/2 p-10 bg-slate-50/50 flex flex-col">
          <div className="erp-card p-6 bg-white shadow-xl shadow-indigo-100/30 border-t-2 border-t-indigo-600">
             <h4 className="font-bold mb-6 text-slate-700 flex items-center gap-2">
               {currentGroup._id ? <Edit2 size={16} /> : <Plus size={16} />} 
               {currentGroup._id ? 'Edit Selected Group' : 'Add New Group'}
             </h4>
             <div className="space-y-4">
               <div className="erp-field">
                 <label>Parent ID</label>
                 <input value={currentGroup.parentId || '(Root)'} readOnly className="bg-slate-50" />
               </div>
               <div className="erp-field">
                 <label>Group Name</label>
                 <input value={currentGroup.name} onChange={e => setCurrentGroup({...currentGroup, name: e.target.value})} />
               </div>
               <div className="erp-field">
                 <label>Group Type</label>
                 <select value={currentGroup.groupType} onChange={e => setCurrentGroup({...currentGroup, groupType: e.target.value})}>
                   <option>Sub Section</option>
                   <option>Type</option>
                   <option>Design</option>
                   <option>Fabric</option>
                   <option>Vendor</option>
                   <option>Season</option>
                   <option>Brand</option>
                   <option>other</option>
                 </select>
               </div>
               <div className="pt-6 border-t flex justify-end">
                 <button className="erp-tool-btn h-10 px-8 bg-indigo-600 text-white font-bold" onClick={handleSave}>
                   <Save size={16} /> Save Changes
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGroupsScreen;
