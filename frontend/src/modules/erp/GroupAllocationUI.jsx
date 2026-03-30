import React, { useState, useEffect } from 'react';
import erpGroupService from '../../services/erpGroupService';
import erpItemService from '../../services/erpItemService';
import { Share2, ChevronRight, CheckCircle2, Circle, AlertCircle, Package, ArrowRightLeft } from 'lucide-react';

const GroupAllocationUI = () => {
  const [tree, setTree] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [groupTree, itemList] = await Promise.all([
        erpGroupService.getGroupTree(),
        erpItemService.getItems()
      ]);
      setTree(groupTree);
      setItems(itemList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupSelection = (id) => {
    setSelectedGroups(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAllocate = async () => {
    if (selectedGroups.length === 0 || selectedItems.length === 0) {
      alert('Please select at least one group and one item.');
      return;
    }
    
    setLoading(true);
    try {
      // Bulk allocation logic (sequential for simplicity of current API or we could add a bulk API)
      for (const itemId of selectedItems) {
        await erpItemService.allocateGroups(itemId, selectedGroups);
      }
      alert('Allocation successful!');
      fetchInitialData();
      setSelectedItems([]);
      setSelectedGroups([]);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const RecursiveGroupTree = ({ nodes, level = 0 }) => (
    <div className="space-y-1">
      {nodes.map(node => (
        <div key={node._id} style={{ paddingLeft: `${level * 16}px` }}>
          <div 
            onClick={() => toggleGroupSelection(node._id)}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border 
            ${selectedGroups.includes(node._id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}
          >
            {selectedGroups.includes(node._id) ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-slate-300" />}
            <span className="text-sm font-semibold">{node.name}</span>
            <span className="ml-auto text-[10px] text-slate-400 font-bold uppercase">{node.type}</span>
          </div>
          {node.children && <RecursiveGroupTree nodes={node.children} level={level + 1} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fade-in max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Share2 size={32} className="text-brand-primary" /> Group Allocation Engine
          </h2>
          <p className="text-slate-500">Bulk associate products with hierarchy groups for catalogs & accounting.</p>
        </div>
        <div className="bg-indigo-600 text-white rounded-xl px-6 py-3 shadow-lg flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] opacity-70 uppercase font-black">Ready to Process</div>
            <div className="text-xl font-bold leading-none">{selectedItems.length} Items → {selectedGroups.length} Groups</div>
          </div>
          <button 
            onClick={handleBulkAllocate}
            disabled={loading || selectedItems.length === 0 || selectedGroups.length === 0}
            className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Run Allocation'} <ArrowRightLeft size={18} />
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Group Tree Selection */}
        <section className="lg:col-span-4 erp-card bg-white p-6 flex flex-col h-[700px]">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4 pb-2 border-b">
            <Layers size={18} className="text-indigo-500" /> 1. Select Target Groups
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <RecursiveGroupTree nodes={tree} />
          </div>
        </section>

        {/* Right: Item Selection */}
        <section className="lg:col-span-8 erp-card bg-white p-6 flex flex-col h-[700px]">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4 pb-2 border-b">
            <Package size={18} className="text-brand-secondary" /> 2. Select Inventory Items
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <table className="erp-table">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="w-10">
                    <input type="checkbox" onChange={(e) => setSelectedItems(e.target.checked ? items.map(i => i._id) : [])} />
                  </th>
                  <th>Style Code</th>
                  <th>Product Name</th>
                  <th>Current Groups</th>
                  <th>Brand</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr 
                    key={item._id} 
                    onClick={() => toggleItemSelection(item._id)}
                    className={`cursor-pointer transition-all ${selectedItems.includes(item._id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <td>
                      <input type="checkbox" checked={selectedItems.includes(item._id)} readOnly />
                    </td>
                    <td className="font-mono font-bold text-xs">{item.itemCode}</td>
                    <td className="font-semibold">{item.name}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {item.groupIds?.map(g => (
                          <span key={g._id} className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">{g.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="text-slate-500 text-sm">{item.brand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <div className="text-center p-12 text-slate-400">No items available for allocation.</div>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GroupAllocationUI;
