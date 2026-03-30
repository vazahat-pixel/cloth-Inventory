import React from 'react';
import { Plus, Trash2, Tag, Percent, DollarSign, List } from 'lucide-react';

const SizeMatrixTable = ({ sizes, onChange }) => {
  const addSize = () => {
    const newSizes = [...sizes, { size: '', basicRate: 0, saleRate: 0, mrp: 0 }];
    onChange(newSizes);
  };

  const removeSize = (index) => {
    const newSizes = sizes.filter((_, i) => i !== index);
    onChange(newSizes);
  };

  const updateSize = (index, field, value) => {
    const newSizes = [...sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    onChange(newSizes);
  };

  return (
    <div className="erp-card bg-slate-50/50 p-6 border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <List size={20} className="text-brand-primary" /> Size Pricing Matrix
        </h4>
        <button 
          type="button" 
          onClick={addSize}
          className="erp-btn erp-btn-secondary"
        >
          <Plus size={16} /> Add Variant
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
        <table className="erp-table">
          <thead>
            <tr>
              <th className="w-1/4 flex items-center gap-1"><Tag size={12} /> Size Label</th>
              <th className="w-1/4 flex items-center gap-1"><DollarSign size={12} /> Basic Rate</th>
              <th className="w-1/4 flex items-center gap-1"><Percent size={12} /> Sale Rate</th>
              <th className="w-1/4 flex items-center gap-1"><Percent size={12} /> MRP</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="p-2">
                  <input 
                    className="erp-input w-full bg-white transition-shadow" 
                    value={row.size} 
                    onChange={(e) => updateSize(index, 'size', e.target.value)} 
                    placeholder="e.g. M, XL, 38"
                    required
                  />
                </td>
                <td className="p-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                    <input 
                      type="number"
                      className="erp-input w-full pl-6 bg-white" 
                      value={row.basicRate} 
                      onChange={(e) => updateSize(index, 'basicRate', parseFloat(e.target.value) || 0)} 
                      min="0"
                      required
                    />
                  </div>
                </td>
                <td className="p-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                    <input 
                      type="number"
                      className="erp-input w-full pl-6 bg-white" 
                      value={row.saleRate} 
                      onChange={(e) => updateSize(index, 'saleRate', parseFloat(e.target.value) || 0)} 
                      min="0"
                      required
                    />
                  </div>
                </td>
                <td className="p-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                    <input 
                      type="number"
                      className="erp-input w-full pl-6 bg-white" 
                      value={row.mrp} 
                      onChange={(e) => updateSize(index, 'mrp', parseFloat(e.target.value) || 0)} 
                      min="0"
                      required
                    />
                  </div>
                </td>
                <td className="px-2 text-center">
                  <button 
                    type="button" 
                    onClick={() => removeSize(index)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sizes.length === 0 && (
          <div className="p-12 text-center bg-slate-50/30">
            <p className="text-slate-400 text-sm">No size variants added yet. Click 'Add Variant' to define pricing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SizeMatrixTable;
