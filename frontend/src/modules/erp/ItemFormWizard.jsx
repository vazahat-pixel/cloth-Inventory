import React, { useState, useEffect } from 'react';
import SizeMatrixTable from './SizeMatrixTable';
import erpItemService from '../../services/erpItemService';
import erpGroupService from '../../services/erpGroupService';
import { Save, ChevronRight, ChevronLeft, Check, Info, Box, Tag, Layers, Share2 } from 'lucide-react';

const ItemFormWizard = ({ onSaveSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState([]);
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    brand: '',
    shade: '',
    description: '',
    groupIds: [],
    attributes: {
      fabric: '',
      design: '',
      fabricType: '',
      type: ''
    },
    sizes: [{ size: 'FREE', basicRate: 0, saleRate: 0, mrp: 0 }],
    hsCode: '',
    gst: 12,
    vendor: '',
    session: ''
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await erpGroupService.getGroupTree();
      setTree(data);
    } catch (error) {
      console.error('Failed to fetch groups', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (attr, value) => {
    setFormData(prev => ({ 
      ...prev, 
      attributes: { ...prev.attributes, [attr]: value } 
    }));
  };

  const toggleGroup = (groupId) => {
    const newGroupIds = [...formData.groupIds];
    const index = newGroupIds.indexOf(groupId);
    if (index > -1) newGroupIds.splice(index, 1);
    else newGroupIds.push(groupId);
    handleChange('groupIds', newGroupIds);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await erpItemService.createItem(formData);
      alert('Item created successfully!');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4">
      {[1, 2, 3, 4].map(s => (
        <div key={s} className="flex flex-col items-center flex-1 relative">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 
            ${step === s ? 'bg-brand-primary border-brand-primary text-white scale-110 shadow-lg shadow-indigo-200' : 
              step > s ? 'bg-success border-success text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
            {step > s ? <Check size={18} /> : s}
          </div>
          <span className={`text-[10px] font-bold uppercase mt-2 tracking-wider 
            ${step === s ? 'text-brand-primary' : 'text-slate-400'}`}>
            {s === 1 ? 'General' : s === 2 ? 'Attributes' : s === 3 ? 'Pricing' : 'Allocation'}
          </span>
          {s < 4 && <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 
            ${step > s ? 'bg-success' : 'bg-slate-200'}`}></div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fade-in max-w-5xl mx-auto p-4 md:p-8">
      <div className="erp-card p-4 md:p-10 shadow-xl border-slate-100 min-h-[600px] flex flex-col">
        <header className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
            <Box size={32} className="text-brand-primary" /> Create New Inventory Item
          </h2>
          <p className="text-slate-500 mt-1">Full-spectrum clothing ERP item initialization system.</p>
        </header>

        <StepIndicator />

        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-6 fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="erp-label">Item Code (SKU)</label>
                    <input className="erp-input h-12" value={formData.itemCode} onChange={(e) => handleChange('itemCode', e.target.value)} required />
                  </div>
                  <div>
                    <label className="erp-label">Product Name</label>
                    <input className="erp-input h-12" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="erp-label">Brand</label>
                    <input className="erp-input h-12" value={formData.brand} onChange={(e) => handleChange('brand', e.target.value)} required />
                  </div>
                  <div>
                    <label className="erp-label">Shade / Color</label>
                    <input className="erp-input h-12" value={formData.shade} onChange={(e) => handleChange('shade', e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="erp-label">Short Description</label>
                <textarea className="erp-input min-h-[100px]" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 fade-in">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex gap-3 text-indigo-700">
                <Info size={20} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium">Dynamic attributes help in fine-grained reports and stock filtration. Ensure values are consistent for better analytics.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="erp-label">Fabric Material</label>
                  <input className="erp-input" value={formData.attributes.fabric} onChange={(e) => handleAttributeChange('fabric', e.target.value)} placeholder="e.g. 100% Cotton, Linen" />
                </div>
                <div>
                  <label className="erp-label">Fabric Type</label>
                  <input className="erp-input" value={formData.attributes.fabricType} onChange={(e) => handleAttributeChange('fabricType', e.target.value)} placeholder="e.g. Printed, Plain, Jacquard" />
                </div>
                <div>
                  <label className="erp-label">Design Specification</label>
                  <input className="erp-input" value={formData.attributes.design} onChange={(e) => handleAttributeChange('design', e.target.value)} placeholder="e.g. Casual, Slim Fit" />
                </div>
                <div>
                  <label className="erp-label">Clothing Type</label>
                  <input className="erp-input" value={formData.attributes.type} onChange={(e) => handleAttributeChange('type', e.target.value)} placeholder="e.g. H/S Shirt, Trouser" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 fade-in">
              <SizeMatrixTable sizes={formData.sizes} onChange={(val) => handleChange('sizes', val)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="erp-label">HSN Code</label>
                  <input className="erp-input" value={formData.hsCode} onChange={(e) => handleChange('hsCode', e.target.value)} />
                </div>
                <div>
                  <label className="erp-label">GST % Slab</label>
                  <select className="erp-input" value={formData.gst} onChange={(e) => handleChange('gst', parseFloat(e.target.value))}>
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Clothing & Textiles)</option>
                    <option value={12}>12% (Apparel Luxury)</option>
                    <option value={18}>18% (Services/Other)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 fade-in">
              <div className="flex gap-4">
                <div className="flex-1 erp-card p-4 bg-slate-50 min-h-[300px]">
                  <h4 className="erp-label mb-3">Group Hierarchy</h4>
                  <div className="space-y-1">
                    {/* Simplified flat list for allocation UI in wizard */}
                    <RecursiveGroupSelector nodes={tree} selected={formData.groupIds} onToggle={toggleGroup} />
                  </div>
                </div>
                <div className="w-1/3 erp-card p-4 border-dashed bg-white">
                  <h4 className="erp-label mb-3">Selected ({formData.groupIds.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.groupIds.map(id => (
                      <span key={id} className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Group {id.slice(-4)}</span>
                    ))}
                    {formData.groupIds.length === 0 && <p className="text-xs text-slate-400 italic">No groups selected. At least one group is mandatory.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-12 flex justify-between pt-6 border-t border-slate-100">
          <button 
            type="button" 
            onClick={prevStep} 
            disabled={step === 1}
            className={`erp-btn erp-btn-secondary ${step === 1 ? 'opacity-0' : ''}`}
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          {step < 4 ? (
            <button type="button" onClick={nextStep} className="erp-btn erp-btn-primary">
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={loading || formData.groupIds.length === 0}
              className="erp-btn erp-btn-primary px-10 h-12 text-lg shadow-lg"
            >
              <Save size={20} /> {loading ? 'Saving...' : 'Finalize & Save Item'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

const RecursiveGroupSelector = ({ nodes, selected, onToggle, level = 0 }) => {
  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <div key={node._id} style={{ paddingLeft: `${level * 16}px` }}>
          <label className="flex items-center gap-3 p-2 rounded-md hover:bg-white transition-colors cursor-pointer group shadow-sm border border-transparent hover:border-slate-200">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              checked={selected.includes(node._id)}
              onChange={() => onToggle(node._id)}
            />
            <span className="text-sm font-medium text-slate-700">{node.name}</span>
            <span className="ml-auto text-[10px] text-slate-400 uppercase font-black opacity-0 group-hover:opacity-100">{node.type}</span>
          </label>
          {node.children && <RecursiveGroupSelector nodes={node.children} selected={selected} onToggle={onToggle} level={level + 1} />}
        </div>
      ))}
    </div>
  );
};

export default ItemFormWizard;
