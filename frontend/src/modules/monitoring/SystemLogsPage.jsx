import { useEffect, useState } from 'react';
import monitoringService from '../../services/monitoringService';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  User, 
  Calendar,
  Layers,
  Activity
} from 'lucide-react';

const SystemLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { logs } = await monitoringService.getSystemLogs();
      setLogs(logs);
    } catch (e) {
      console.error('System logs load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(filter.toLowerCase()) || 
    log.module?.toLowerCase().includes(filter.toLowerCase()) ||
    log.userId?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="erp-screen space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Search and Filters */}
      <div className="erp-card p-6 bg-white shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-4 w-full md:w-1/2">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
               <FileText size={24} />
            </div>
            <div className="w-full relative">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               <input 
                  type="text" 
                  placeholder="Search logs by action, user or module..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
               />
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 text-sm font-bold border border-slate-200 transition-all">
               <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black text-sm font-bold shadow-lg shadow-slate-200 transition-all">
               <Download size={16} /> Export
            </button>
         </div>
      </div>

      {/* Logs Table */}
      <div className="erp-card bg-white shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
         <div className="p-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center font-bold text-slate-400 text-[10px] uppercase tracking-widest">
            <div className="w-1/6 flex items-center gap-2"><User size={12} /> User</div>
            <div className="w-1/6 flex items-center gap-2"><Layers size={12} /> Module</div>
            <div className="w-2/6 flex items-center gap-2"><Activity size={12} /> Action</div>
            <div className="w-1/6 flex items-center gap-2"><Calendar size={12} /> Date</div>
            <div className="w-1/6 text-right">Details</div>
         </div>

         <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-20 text-center animate-pulse text-slate-400">Loading audit trail...</div>
            ) : filteredLogs.length > 0 ? filteredLogs.map(log => (
               <div key={log._id} className="p-5 flex items-center hover:bg-slate-50/50 transition-colors group cursor-default">
                  <div className="w-1/6 flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                        {log.userId?.name?.[0] || 'S'}
                     </div>
                     <span className="font-bold text-slate-700 text-sm">{log.userId?.name || 'System'}</span>
                  </div>
                  <div className="w-1/6">
                     <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold text-[9px] uppercase border border-slate-200">
                        {log.module}
                     </span>
                  </div>
                  <div className="w-2/6">
                     <p className="text-sm font-medium text-slate-600 truncate mr-4">{log.action}</p>
                  </div>
                  <div className="w-1/6">
                     <p className="text-xs text-slate-400 font-medium">
                        {new Date(log.createdAt).toLocaleDateString()}
                        <span className="block text-[10px] opacity-70 mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</span>
                     </p>
                  </div>
                  <div className="w-1/6 text-right">
                     <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50">
                        <FileText size={18} />
                     </button>
                  </div>
               </div>
            )) : (
              <div className="p-20 text-center text-slate-400 opacity-50">No matching logs found in system</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SystemLogsPage;
