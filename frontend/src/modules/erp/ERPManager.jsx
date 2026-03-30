import React, { useState } from 'react';
import GroupManagement from './GroupManagement';
import ItemFormWizard from './ItemFormWizard';
import GroupAllocationUI from './GroupAllocationUI';
import ExcelImportUI from './ExcelImportUI';
import { Layers, Box, Share2, Upload, ChevronRight, Home, LayoutList } from 'lucide-react';

const ERPManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: <Home size={18} /> },
    { id: 'groups', label: 'Group Master', icon: <Layers size={18} /> },
    { id: 'items', label: 'Add New Item', icon: <Box size={18} /> },
    { id: 'allocation', label: 'Group Allocation', icon: <Share2 size={18} /> },
    { id: 'import', label: 'Excel Import', icon: <Upload size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm">
        <header className="mb-10 px-2">
          <h1 className="text-xl font-black tracking-tighter text-indigo-700 flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-md shadow-indigo-200">
              <Box size={22} strokeWidth={3} />
            </span>
            INVENTORY<span className="text-slate-400 font-light">ERP</span>
          </h1>
        </header>

        <nav className="flex-1 space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all group relative
              ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-2' : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
            >
              {item.icon}
              {item.label}
              {activeTab === item.id && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
              {activeTab !== item.id && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
          ))}
        </nav>

        <footer className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 shadow-inner">JD</div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-slate-800 truncate">Inventory Admin</p>
              <p className="text-[10px] text-slate-400 truncate">Senior Master Logic</p>
            </div>
          </div>
        </footer>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
          {activeTab === 'dashboard' && <ERPOverview onNavigate={setActiveTab} />}
          {activeTab === 'groups' && <GroupManagement />}
          {activeTab === 'items' && <ItemFormWizard onSaveSuccess={() => setActiveTab('allocation')} />}
          {activeTab === 'allocation' && <GroupAllocationUI />}
          {activeTab === 'import' && <ExcelImportUI />}
        </div>
      </main>
    </div>
  );
};

const ERPOverview = ({ onNavigate }) => (
  <div className="space-y-10 fade-in p-2">
    <header>
      <h2 className="text-4xl font-black text-slate-800 tracking-tight">Clothing Inventory <span className="text-indigo-600">Master Logic</span></h2>
      <p className="text-slate-500 text-lg mt-2 max-w-2xl font-medium">Control your entire clothing catalog hierarchy, attributes, and pricing from a single centralized hub.</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { id: 'groups', title: 'Group Hierarchy', desc: 'Recursive category management for items.', icon: <Layers className="text-indigo-500" />, color: 'bg-indigo-50 border-indigo-100' },
        { id: 'items', title: 'Smart Item Wizard', desc: '4-step creation with pricing matrix.', icon: <Box className="text-brand-secondary" />, color: 'bg-purple-50 border-purple-100' },
        { id: 'allocation', title: 'Bulk Allocation', desc: 'Manage multi-group item mapping.', icon: <Share2 className="text-teal-500" />, color: 'bg-teal-50 border-teal-100' },
        { id: 'import', title: 'Spreadsheet Sync', desc: 'Intelligent Excel import engine.', icon: <Upload className="text-orange-500" />, color: 'bg-orange-50 border-orange-100' }
      ].map(p => (
        <div key={p.id} onClick={() => onNavigate(p.id)} className={`erp-card group cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all p-6 border-b-4 border-b-transparent hover:border-b-indigo-500 ${p.color}`}>
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 group-hover:rotate-6 transition-all">{p.icon}</div>
          <h3 className="font-black text-slate-800 text-lg tracking-tight">{p.title}</h3>
          <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">{p.desc}</p>
          <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Launch System <ChevronRight size={14} />
          </div>
        </div>
      ))}
    </div>

    <section className="erp-card bg-slate-900 p-10 text-white overflow-hidden relative">
      <div className="relative z-10 max-w-xl">
        <h3 className="text-3xl font-black mb-4 flex items-center gap-2">
          <LayoutList size={32} className="text-indigo-400" /> System Architecture
        </h3>
        <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
          This system uses an advanced recursive schema for unlimited grouping, a dynamic attribute engine for property tagging, and a matrix-based pricing model for individual item variants.
        </p>
        <div className="flex gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm">MongoDB Recursive</div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm">Excel Parser</div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm">Size Matrix v2.0</div>
        </div>
      </div>
      <Share2 size={300} className="absolute -right-20 -bottom-20 text-slate-800 opacity-30 rotate-12" />
    </section>
  </div>
);

export default ERPManager;
