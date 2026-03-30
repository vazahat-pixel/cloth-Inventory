import React, { useState, useEffect } from 'react';
import erpItemService from '../../services/erpItemService';
import erpGroupService from '../../services/erpGroupService';
import { Save, Plus, Trash2, Search, Share2, Layers, Tag, Box, ArrowRightLeft, FileSpreadsheet, Eye, EyeOff } from 'lucide-react';
import './erp.css';

const ItemMasterScreen = () => {
  const [activeTab, setActiveTab] = useState('header');
  const [loading, setLoading] = useState(false);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [groupTree, setGroupTree] = useState([]);
  
  const initialItem = {
    itemCode: '',
    itemName: '',
    brand: '',
    shade: '',
    description: '',
    groupIds: [],
    hsCodeId: '',
    gstTax: 0,
    vendorId: '',
    session: '',
    attributes: {},
    sizes: [
      { size: 'FREE', barcode: '', costPrice: 0, salePrice: 0, mrp: 0 }
    ],
    autoGenerateName: true,
    formulaName: 'primary',
    isActive: true
  };

  const [formData, setFormData] = useState(initialItem);
  const [attributeRows, setAttributeRows] = useState([{ key: '', value: '' }]);
  const [selectedGroupsForAllocation, setSelectedGroupsForAllocation] = useState([]);

  const toGroupIdList = (groups = []) =>
    [...new Set((Array.isArray(groups) ? groups : [groups])
      .map((group) => {
        const id = group?._id || group?.id || group;
        return id ? String(id) : null;
      })
      .filter(Boolean))];

  const attributesToRows = (attributes = {}) => {
    const entries = Object.entries(attributes || {}).filter(([key]) => key);
    return entries.length
      ? entries.map(([key, value]) => ({ key, value: value ?? '' }))
      : [{ key: '', value: '' }];
  };

  const rowsToAttributes = (rows = []) =>
    rows.reduce((acc, row) => {
      const key = String(row.key || '').trim();
      if (!key) {
        return acc;
      }
      acc[key] = row.value ?? '';
      return acc;
    }, {});

  const hydrateLoadedItem = (item) => {
    setFormData(item);
    setAttributeRows(attributesToRows(item?.attributes));
    setSelectedGroupsForAllocation(toGroupIdList(item?.groupIds));
  };

  useEffect(() => {
    fetchStaticData();
  }, []);

  const fetchStaticData = async () => {
    try {
      const [hsn, forms, tree] = await Promise.all([
        erpItemService.getHSNCodes(),
        erpItemService.getFormulas(),
        erpGroupService.getGroupTree()
      ]);
      setHsnCodes(hsn || []);
      setFormulas(forms || []);
      setGroupTree(tree || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFieldChange = (field, value, isAttribute = false) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAttributeRow = () => {
    setAttributeRows(prev => [...prev, { key: '', value: '' }]);
  };

  const updateAttributeRow = (index, field, value) => {
    setAttributeRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeAttributeRow = (index) => {
    setAttributeRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ key: '', value: '' }];
    });
  };

  const addSizeRow = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', barcode: '', costPrice: 0, salePrice: 0, mrp: 0 }]
    }));
  };

  const updateSizeRow = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][field] = value;
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const removeSizeRow = (index) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (isNewOnly = false) => {
    if (!formData.itemCode.trim()) return alert('Item Code is required');
    if (!formData.brand.trim()) return alert('Brand is required');
    if (!formData.autoGenerateName && !formData.itemName.trim()) return alert('Item Name is required');
    const currentGroupIds = toGroupIdList(formData.groupIds);
    const saveGroupIds = formData._id
      ? currentGroupIds
      : (currentGroupIds.length ? currentGroupIds : selectedGroupsForAllocation);
    if (!saveGroupIds.length) return alert('Select at least one group');
    if (!formData.sizes.length) return alert('Add at least one size row');

    setLoading(true);
    try {
      const itemPayload = {
        ...formData,
        groupIds: saveGroupIds,
        attributes: rowsToAttributes(attributeRows),
      };

      let result;
      if (formData._id && !isNewOnly) {
        result = await erpItemService.updateItem(formData._id, itemPayload);
      } else {
        const { _id, ...createData } = itemPayload;
        result = await erpItemService.createItem(createData);
      }
      alert('Item Master Saved Successfully');
      if (isNewOnly) handleReset();
      else hydrateLoadedItem(result.item);
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialItem);
    setAttributeRows([{ key: '', value: '' }]);
    setSelectedGroupsForAllocation([]);
    setActiveTab('header');
  };

  const toggleAllocationGroup = (id) => {
    setSelectedGroupsForAllocation(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const runAllocation = async () => {
    if (!formData._id) return alert('Save item first to allocate groups');
    if (!selectedGroupsForAllocation.length) return alert('Select groups to allocate');
    try {
      await erpItemService.allocateGroups(formData._id, selectedGroupsForAllocation);
      alert('Allocation completed');
      // Refresh item to show new groups in TAB 4 list
      const updated = await erpItemService.getItems({ _id: formData._id });
      if (updated[0]) hydrateLoadedItem(updated[0]);
    } catch (e) { alert(e.message); }
  };

  const runDeallocation = async (id) => {
    try {
      await erpItemService.deallocateGroups(formData._id, [id]);
      const updated = await erpItemService.getItems({ _id: formData._id });
      if (updated[0]) hydrateLoadedItem(updated[0]);
    } catch (e) { alert(e.message); }
  };

  const Tabs = [
    { id: 'header', label: 'Header', icon: <Tag size={12} /> },
    { id: 'attributes', label: 'Attributes', icon: <Box size={12} /> },
    { id: 'sizes', label: 'Sizes / Variants', icon: <FileSpreadsheet size={12} /> },
    { id: 'allocation', label: 'Group Allocation', icon: <Share2 size={12} /> }
  ];

  return (
    <div className="erp-main-area">
      {/* Toolbar */}
      <div className="erp-toolbar">
        <button className="erp-tool-btn" onClick={handleReset}><Plus size={14} /> New Item</button>
        <button
          className="erp-tool-btn"
          onClick={() => handleSave(false)}
          disabled={loading}
        >
          <Save size={14} /> Save
        </button>
        <button className="erp-tool-btn" onClick={() => handleSave(true)} disabled={loading}>
          <Save size={14} /> Save & New
        </button>
        <div className="w-[1px] h-6 bg-slate-300 mx-2" />
        <button className="erp-tool-btn text-red-600"><Trash2 size={14} /> Delete</button>
        <button className="erp-tool-btn" onClick={() => handleFieldChange('isActive', !formData.isActive)}>
          {formData.isActive ? <><Eye size={14} /> Hide</> : <><EyeOff size={14} /> Unhide</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="erp-tab-header">
        {Tabs.map(t => (
          <div key={t.id} onClick={() => setActiveTab(t.id)} className={`erp-tab-item ${activeTab === t.id ? 'active' : ''}`}>
            {t.icon} {t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="erp-content-pane">
        {activeTab === 'header' && (
          <div className="erp-field-group">
            <div className="erp-field">
              <label>Item Code</label>
              <input value={formData.itemCode} onChange={e => handleFieldChange('itemCode', e.target.value)} placeholder="SKU-2024-XX" />
            </div>
            <div className="erp-field">
              <label>Item Name</label>
              <div className="flex w-full gap-1">
                <input value={formData.itemName} onChange={e => handleFieldChange('itemName', e.target.value)} disabled={formData.autoGenerateName} className="flex-1" />
                <button 
                  onClick={() => handleFieldChange('autoGenerateName', !formData.autoGenerateName)}
                  className={`px-2 text-[10px] uppercase font-bold border rounded ${formData.autoGenerateName ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {formData.autoGenerateName ? 'Auto' : 'Manual'}
                </button>
              </div>
            </div>
            <div className="erp-field">
              <label>Formula</label>
              <select value={formData.formulaName} onChange={e => handleFieldChange('formulaName', e.target.value)}>
                <option value="primary">Default Primary</option>
                {formulas.map(f => <option key={f._id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div className="erp-field">
              <label>Brand</label>
              <input value={formData.brand} onChange={e => handleFieldChange('brand', e.target.value)} />
            </div>
            <div className="erp-field">
              <label>Shade</label>
              <input value={formData.shade} onChange={e => handleFieldChange('shade', e.target.value)} />
            </div>
            <div className="erp-field">
              <label>HSN Code</label>
              <select value={formData.hsCodeId} onChange={e => handleFieldChange('hsCodeId', e.target.value)}>
                <option value="">Select HSN</option>
                {hsnCodes.map(h => <option key={h._id} value={h._id}>{h.code} - {h.description}</option>)}
              </select>
            </div>
            <div className="erp-field">
              <label>GST Tax %</label>
              <input type="number" value={formData.gstTax} onChange={e => handleFieldChange('gstTax', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        )}

        {activeTab === 'attributes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-bold"><Box size={16} /> Dynamic Attributes</h4>
              <button className="erp-tool-btn" onClick={addAttributeRow}><Plus size={14} /> Add Attribute</button>
            </div>
            <div className="space-y-3">
              {attributeRows.map((row, index) => (
                <div key={`${row.key || 'attribute'}-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div className="erp-field">
                    <label>Attribute Key</label>
                    <input
                      value={row.key}
                      onChange={(e) => updateAttributeRow(index, 'key', e.target.value)}
                      placeholder="type, design, fabric, color"
                    />
                  </div>
                  <div className="erp-field">
                    <label>Attribute Value</label>
                    <input
                      value={row.value}
                      onChange={(e) => updateAttributeRow(index, 'value', e.target.value)}
                      placeholder="e.g. Cotton"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttributeRow(index)}
                    className="erp-tool-btn h-10 text-red-600"
                    disabled={attributeRows.length === 1}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Attributes are stored as a dynamic object on the item record.
            </div>
          </div>
        )}

        {activeTab === 'sizes' && (
          <div>
            <div className="flex justify-between mb-2">
              <h4 className="flex items-center gap-2 font-bold"><FileSpreadsheet size={16} /> Pricing Matrix</h4>
              <button className="erp-tool-btn" onClick={addSizeRow}><Plus size={14} /> Add Row</button>
            </div>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="erp-matrix-table">
                <thead>
                  <tr>
                    <th width="30">#</th>
                    <th>Size</th>
                    <th>Barcode</th>
                    <th>Cost Price</th>
                    <th>Sale Price</th>
                    <th>MRP</th>
                    <th width="40"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.sizes.map((s, i) => (
                    <tr key={i}>
                      <td className="text-center text-[10px] text-slate-400 font-bold">{i+1}</td>
                      <td><input value={s.size} onChange={e => updateSizeRow(i, 'size', e.target.value)} /></td>
                      <td><input value={s.barcode} onChange={e => updateSizeRow(i, 'barcode', e.target.value)} placeholder="(Auto)" /></td>
                      <td><input type="number" value={s.costPrice} onChange={e => updateSizeRow(i, 'costPrice', parseFloat(e.target.value) || 0)} /></td>
                      <td><input type="number" value={s.salePrice} onChange={e => updateSizeRow(i, 'salePrice', parseFloat(e.target.value) || 0)} /></td>
                      <td><input type="number" value={s.mrp} onChange={e => updateSizeRow(i, 'mrp', parseFloat(e.target.value) || 0)} /></td>
                      <td className="text-center"><button onClick={() => removeSizeRow(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="flex gap-6 h-[400px]">
            <div className="flex-1 border p-3 bg-slate-50 overflow-y-auto">
              <h5 className="font-bold text-[11px] uppercase mb-4 text-slate-400">Section Hierarchy Tree</h5>
              <HierarchySelector nodes={groupTree} selected={selectedGroupsForAllocation} onToggle={toggleAllocationGroup} />
            </div>
            <div className="w-16 flex flex-col justify-center gap-2">
              <button className="bg-indigo-600 text-white p-2 rounded shadow-lg hover:scale-110 transition-all" onClick={runAllocation}><ArrowRightLeft size={16} /></button>
            </div>
            <div className="flex-1 border p-3 flex flex-col">
              <h5 className="font-bold text-[11px] uppercase mb-4 text-orange-400">Assigned Item Groups</h5>
              <div className="flex-1 overflow-y-auto space-y-1">
                {formData.groupIds?.map(g => (
                  <div key={g._id} className="flex items-center justify-between p-2 bg-white border border-indigo-100 rounded text-xs font-bold shadow-sm">
                    {g.name} <button onClick={() => runDeallocation(g._id)} className="text-red-400"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HierarchySelector = ({ nodes, selected, onToggle, level = 0 }) => (
  <div className="space-y-1">
    {nodes.map(node => (
      <div key={node._id} style={{ paddingLeft: `${level * 16}px` }}>
        <div 
          onClick={() => onToggle(node._id)}
          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-[12px] font-medium
          ${selected.includes(node._id) ? 'bg-indigo-100 border border-indigo-200' : 'hover:bg-slate-100 border border-transparent'}`}
        >
          <div className={`w-3 h-3 rounded-sm border ${selected.includes(node._id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`} />
          {node.name}
        </div>
        {node.children && <HierarchySelector nodes={node.children} selected={selected} onToggle={onToggle} level={level + 1} />}
      </div>
    ))}
  </div>
);

export default ItemMasterScreen;
