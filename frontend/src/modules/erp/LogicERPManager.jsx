import React, { useState } from 'react';
import ItemMasterScreen from './ItemMasterScreen';
import SetupGroupsScreen from './SetupGroupsScreen';
import ExcelImportUI from './ExcelImportUI';
import HSNCodePage from '../setup/HSNCodePage';
import FormulaPage from '../setup/FormulaPage';
import MonitoringDashboard from '../monitoring/MonitoringDashboard';
import SystemLogsPage from '../monitoring/SystemLogsPage';
import StockLedgerPage from '../monitoring/StockLedgerPage';
import { 
  LayoutDashboard, 
  Box, 
  Layers, 
  Tag, 
  Upload, 
  ShoppingCart, 
  ShoppingBag, 
  Settings, 
  ChevronRight,
  Activity,
  History,
  FileText
} from 'lucide-react';
import './erp.css';

const LogicERPManager = () => {
  const [activeModule, setActiveModule] = useState('items');

  const navMenuItems = [
    { id: 'dashboard', label: 'ERP Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'monitoring', label: 'Monitor Health', icon: <Activity size={18} /> },
    { id: 'ledger', label: 'Stock Ledger', icon: <History size={18} /> },
    { id: 'logs', label: 'System Logs', icon: <FileText size={18} /> },
    { id: 'items', label: 'Item Master', icon: <Box size={18} /> },
    { id: 'groups', label: 'Setup Groups', icon: <Layers size={18} /> },
    { id: 'hsn', label: 'HS Code Master', icon: <Tag size={18} /> },
    { id: 'import', label: 'Excel Import', icon: <Upload size={18} /> },
    { id: 'purchase', label: 'Purchase/GRN', icon: <ShoppingCart size={18} /> },
    { id: 'sales', label: 'Sales/Billing', icon: <ShoppingBag size={18} /> },
    { id: 'settings', label: 'Formula Master', icon: <Settings size={18} /> }
  ];

  return (
    <div className="erp-compact-root">
      {/* Sidebar */}
      <aside className="erp-sidebar-legacy">
        <header className="p-4 border-b border-white/10 mb-4">
          <h1 className="text-sm font-black tracking-widest flex items-center gap-2">
            <span className="bg-white text-[#2b3a4a] p-1 rounded font-bold uppercase text-[9px]">LOGIC</span>
            GARMENT<span className="text-sky-400">ERP</span>
          </h1>
        </header>
        
        <div className="flex-1 overflow-y-auto space-y-1">
          {navMenuItems.map(m => (
            <button 
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`erp-sidebar-btn ${activeModule === m.id ? 'active' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">{m.icon} {m.label}</div>
                {activeModule === m.id && <ChevronRight size={12} />}
              </div>
            </button>
          ))}
        </div>

        <footer className="p-4 bg-black/10 border-t border-white/5">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-sky-500 border-2 border-white/20 flex items-center justify-center font-bold text-xs">U</div>
             <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-white truncate">Super Administrator</p>
                <div className="flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                   <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Online</p>
                </div>
             </div>
          </div>
        </footer>
      </aside>

      {/* Module Content */}
      <main className="erp-main-area">
        {activeModule === 'dashboard' && <MonitoringDashboard />}
        {activeModule === 'monitoring' && <MonitoringDashboard />}
        {activeModule === 'ledger' && <StockLedgerPage />}
        {activeModule === 'logs' && <SystemLogsPage />}
        {activeModule === 'items' && <ItemMasterScreen />}
        {activeModule === 'groups' && <SetupGroupsScreen />}
        {activeModule === 'hsn' && <HSNCodePage />}
        {activeModule === 'import' && <ExcelImportUI />}
        {activeModule === 'settings' && <FormulaPage />}
        {activeModule === 'purchase' && (
          <div className="p-10 flex flex-col items-center justify-center h-full opacity-30 grayscale">
             <ShoppingCart size={64} className="mb-4" />
             <h4 className="text-xl font-bold">Purchase & GRN</h4>
             <p className="text-xs font-medium">Integrated with Item Master for rapid entry.</p>
          </div>
        )}
        {activeModule === 'sales' && (
          <div className="p-10 flex flex-col items-center justify-center h-full opacity-30 grayscale">
             <ShoppingBag size={64} className="mb-4" />
             <h4 className="text-xl font-bold">Sales & Billing</h4>
             <p className="text-xs font-medium">Supports offline & online counter sales.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default LogicERPManager;
