import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import erpItemService from '../../services/erpItemService';
import { UploadCloud, FileSpreadsheet, Play, CheckCircle, AlertTriangle, ArrowRight, Settings2, Table } from 'lucide-react';
import './erp.css';

const ExcelImportUI = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [options, setOptions] = useState({ autoBarcode: true, overwrite: false });

  const erpFields = [
    { key: 'itemCode', label: 'Item Code (SKU)', required: true },
    { key: 'itemName', label: 'Product Name', required: true },
    { key: 'brand', label: 'Brand Name', required: true },
    { key: 'shade', label: 'Shade', required: true },
    { key: 'costPrice', label: 'Cost Rate', required: true },
    { key: 'salePrice', label: 'Sale Rate', required: true },
    { key: 'mrp', label: 'MRP', required: true },
    { key: 'size', label: 'Size Label', required: false },
    { key: 'groupName', label: 'Target Group', required: true }
  ];

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const fileHeaders = data[0] || [];
      setHeaders(fileHeaders);
      
      const initialMapping = {};
      fileHeaders.forEach(h => {
        const hLow = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = erpFields.find(f => f.key.toLowerCase() === hLow || f.label.toLowerCase().replace(/[^a-z0-9]/g, '') === hLow);
        if (match) initialMapping[h] = match.key;
      });
      setMapping(initialMapping);
      setPreview(XLSX.utils.sheet_to_json(ws).slice(0, 5));
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleRunImport = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const results = await erpItemService.importItems(formData, mapping, options.autoBarcode, options.overwrite);
      setImportResults(results);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="erp-main-area">
      {/* Toolbar */}
      <div className="erp-toolbar">
         <div className="flex-1 font-bold text-[13px] tracking-tight text-slate-500 uppercase flex items-center gap-2">
            <UploadCloud size={16} className="text-indigo-600" /> Excel Bulk Migration Process (Production-v2.x)
         </div>
         <button className="erp-tool-btn bg-indigo-600 text-white font-bold h-8" onClick={handleRunImport} disabled={!file || loading}>
           <Play size={14} /> Start Migration
         </button>
      </div>

      <div className="p-4 flex h-full">
         <div className="w-[30%] border-r pr-4 flex flex-col gap-4">
             <div className="p-4 border border-dashed border-slate-300 bg-slate-50 rounded flex flex-col items-center">
                 <label className="cursor-pointer flex flex-col items-center">
                    <FileSpreadsheet size={32} className="text-slate-300 mb-2" />
                    <span className="text-[11px] font-bold text-indigo-600 uppercase">Select Source Worksheet</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                 </label>
                 {file && <div className="mt-2 text-[10px] font-mono bg-white px-2 py-1 rounded border shadow-sm">{file.name}</div>}
             </div>

             <div className="erp-card p-4 bg-white space-y-4">
                <h5 className="font-bold text-[11px] border-b pb-2 uppercase text-slate-400">Migration Options</h5>
                <label className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer">
                   <input type="checkbox" checked={options.autoBarcode} onChange={e => setOptions({...options, autoBarcode: e.target.checked})} />
                   Generate unique barcodes (EAN-13)
                </label>
                <label className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer">
                   <input type="checkbox" checked={options.overwrite} onChange={e => setOptions({...options, overwrite: e.target.checked})} />
                   Overwrite existing style codes
                </label>
             </div>
         </div>

         <div className="flex-1 pl-4 flex flex-col overflow-hidden">
             {file ? (
               <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="border rounded bg-white overflow-hidden shadow-sm mb-4">
                     <h6 className="bg-slate-50 p-2 text-[10px] font-black uppercase text-slate-400 border-b flex items-center gap-2"><Settings2 size={12} /> Link ERP Fields</h6>
                     <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-2">
                        {erpFields.map(f => (
                           <div key={f.key} className="flex items-center justify-between border-b pb-1">
                              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{f.label} {f.required && <span className="text-red-500">*</span>}</span>
                              <select 
                                className="text-[11px] border-none font-medium text-indigo-600 focus:ring-0 w-1/2 text-right"
                                value={Object.keys(mapping).find(h => mapping[h] === f.key) || ''}
                                onChange={(e) => {
                                  const n = {...mapping};
                                  Object.keys(n).forEach(k => { if(n[k] === f.key) delete n[k]; });
                                  if(e.target.value) n[e.target.value] = f.key;
                                  setMapping(n);
                                }}
                              >
                                <option value="">(Manual-Ignore)</option>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex-1 border rounded bg-white overflow-hidden flex flex-col shadow-sm">
                     <h6 className="bg-slate-50 p-2 text-[10px] font-black uppercase text-slate-400 border-b flex items-center gap-2"><Table size={12} /> Top Sample Data</h6>
                     <div className="flex-1 overflow-auto">
                        <table className="erp-matrix-table">
                           <thead>
                              <tr className="sticky top-0 bg-white border-b-2">
                                 {headers.map(h => <th key={h}>{h}</th>)}
                              </tr>
                           </thead>
                           <tbody className="text-[11px] font-medium text-slate-500">
                              {preview.map((r, i) => (
                                <tr key={i}>
                                   {headers.map(h => <td key={h}>{r[h] || ''}</td>)}
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                  <UploadCloud size={100} />
                  <p className="font-black text-4xl uppercase tracking-tighter mt-4">Awaiting Data Source</p>
               </div>
             )}

             {importResults && (
               <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-10 z-[100]">
                  <div className="erp-card bg-white w-full max-w-2xl p-8 border-t-8 border-t-indigo-600 flex flex-col max-h-[80vh]">
                     <h3 className="text-2xl font-black mb-6 flex items-center gap-4"><CheckCircle size={32} className="text-green-500" /> Migration Complete</h3>
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                           <div className="text-3xl font-black text-indigo-700">{importResults.success.length}</div>
                           <div className="text-[10px] uppercase font-black text-indigo-400">Successfully Processed</div>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                           <div className="text-3xl font-black text-red-700">{importResults.errors.length}</div>
                           <div className="text-[10px] uppercase font-black text-red-400">Row Failures</div>
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {importResults.errors.map((e, i) => (
                           <div key={i} className="text-[10px] p-2 bg-slate-50 border rounded flex justify-between font-bold">
                              <span className="text-slate-400">ROW #{i+1}</span>
                              <span className="text-red-500">{e.error}</span>
                           </div>
                        ))}
                     </div>
                     <button className="erp-tool-btn h-12 w-full justify-center bg-indigo-600 text-white font-bold mt-8" onClick={() => setImportResults(null)}>Dismiss Report</button>
                  </div>
               </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default ExcelImportUI;
