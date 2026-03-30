import { useEffect, useState } from 'react';
import monitoringService from '../../services/monitoringService';
import { 
  Activity, 
  AlertCircle, 
  Package, 
  Clock, 
  User, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const MonitoringDashboard = () => {
  const [data, setData] = useState({
    totalStock: 0,
    recentActivity: [],
    recentErrors: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 60000); // 1 min auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchSummary = async () => {
    try {
      const summary = await monitoringService.getDashboardSummary();
      setData(summary);
    } catch (e) {
      console.error('Monitoring load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-indigo-500">Initializing ERP Monitoring...</div>;

  return (
    <div className="erp-screen space-y-8 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="erp-card p-6 bg-gradient-to-br from-indigo-50 to-white border-l-4 border-l-indigo-600 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700">
               <Package size={24} />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inventory Stock</p>
               <h2 className="text-3xl font-black text-slate-800">{data.totalStock.toLocaleString()}</h2>
             </div>
           </div>
        </div>

        <div className="erp-card p-6 bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-600 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
               <Activity size={24} />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Activity (24h)</p>
               <h2 className="text-3xl font-black text-slate-800">{data.recentActivity.length}+</h2>
             </div>
           </div>
        </div>

        <div className="erp-card p-6 bg-gradient-to-br from-rose-50 to-white border-l-4 border-l-rose-600 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-rose-100 rounded-lg text-rose-700">
               <AlertCircle size={24} />
             </div>
             <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Errors</p>
               <h2 className="text-3xl font-black text-slate-800">{data.recentErrors.length}</h2>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Timeline */}
        <div className="erp-card bg-white shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
           <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Clock size={16} className="text-indigo-600" />
               Live System Activity
             </h3>
             <span className="text-[10px] px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold">REAL-TIME</span>
           </div>
           
           <div className="p-6">
              <div className="space-y-6">
                {data.recentActivity.length > 0 ? data.recentActivity.map((log, i) => (
                  <div key={log._id} className="flex gap-4 group">
                     <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 text-sm font-bold">
                           {log.userId?.name?.[0] || 'S'}
                        </div>
                        {i !== data.recentActivity.length - 1 && (
                          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-100 group-hover:bg-indigo-100 transition-colors"></div>
                        )}
                     </div>
                     <div className="pb-6">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-bold text-slate-700 text-sm">{log.userId?.name || 'System'}</span>
                           <span className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                           <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">{log.module}</span>
                           {log.action}
                        </p>
                     </div>
                  </div>
                )) : (
                  <div className="p-10 text-center opacity-30">No activities found</div>
                )}
              </div>
           </div>
        </div>

        {/* System Error Monitor */}
        <div className="erp-card bg-white shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
           <div className="p-5 border-b border-rose-50 bg-rose-50/30 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <ShieldCheck size={16} className="text-emerald-600" />
               Health & Errors
             </h3>
             <span className="text-[10px] px-2 py-1 bg-rose-200 text-rose-800 rounded-full font-bold">DEBUGGER</span>
           </div>

           <div className="p-6">
              <div className="space-y-4">
                {data.recentErrors.length > 0 ? data.recentErrors.map((error) => (
                  <div key={error._id} className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex gap-4">
                     <div className="text-rose-600">
                        <AlertCircle size={20} />
                     </div>
                     <div>
                        <p className="font-bold text-rose-900 text-xs truncate max-w-[300px]">{error.message}</p>
                        <p className="text-[10px] text-rose-700 font-medium mt-1">
                          <span className="font-bold uppercase mr-2">{error.method}</span>
                          {error.path}
                        </p>
                        <p className="text-[9px] text-rose-400 mt-2">{new Date(error.createdAt).toLocaleString()}</p>
                     </div>
                  </div>
                )) : (
                  <div className="p-10 text-center text-emerald-600 font-bold bg-emerald-50 rounded-2xl border border-emerald-100">
                     <ShieldCheck size={32} className="mx-auto mb-2 opacity-50" />
                     All Systems Fully Operational
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
