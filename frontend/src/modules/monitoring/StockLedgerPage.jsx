import { useEffect, useState } from 'react';
import monitoringService from '../../services/monitoringService';
import erpItemService from '../../services/erpItemService';
import { 
  Package, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Barcode, 
  Tag, 
  Info,
  Layers,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';

const StockLedgerPage = () => {
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      // Logic ERP style item list
      const response = await erpItemService.getAllItems();
      setItems(response.items || []);
    } catch (e) {
      console.error('Items load error:', e);
    }
  };

  const fetchLedger = async (itemId) => {
    setLoading(true);
    try {
      const { history } = await monitoringService.getStockLedger(itemId);
      setLedger(history);
    } catch (e) {
      console.error('Ledger load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
    fetchLedger(itemId);
  };

  const filteredItems = items.filter(item => 
    item.itemCode?.toLowerCase().includes(search.toLowerCase()) || 
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="erp-screen grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Left Sidebar: Item Selection */}
      <div className="lg:col-span-4 space-y-4">
         <div className="erp-card p-6 bg-white shadow-sm border border-slate-100 flex flex-col gap-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 tracking-tight">
               <Package size={18} className="text-indigo-600" />
               Select Item for Ledger
            </h3>
            <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                  type="text" 
                  placeholder="Search item code/name..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <div className="max-h-[500px] overflow-y-auto erp-scrollbar pr-2 space-y-2">
               {filteredItems.map(item => (
                 <button 
                    key={item._id}
                    className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${
                      selectedItemId === item._id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                    onClick={() => handleItemSelect(item._id)}
                 >
                    <div className={`p-2 rounded-lg ${selectedItemId === item._id ? 'bg-white/20' : 'bg-slate-100'}`}>
                       <Barcode size={14} />
                    </div>
                    <div>
                       <p className={`text-[10px] font-black uppercase tracking-widest ${selectedItemId === item._id ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {item.itemCode}
                       </p>
                       <p className="text-xs font-bold truncate w-[150px]">{item.name}</p>
                    </div>
                 </button>
               ))}
               {filteredItems.length === 0 && <div className="p-10 text-center text-xs text-slate-400 opacity-50">No items found</div>}
            </div>
         </div>
      </div>

      {/* Main Panel: Ledger History */}
      <div className="lg:col-span-8">
         <div className="erp-card bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[600px] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center shrink-0">
               <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <History size={18} className="text-indigo-600" />
                  Stock Movement Ledger
               </h3>
               {selectedItemId && (
                 <div className="flex items-center gap-4 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 text-slate-500">
                    <span className="flex items-center gap-1.5"><Tag size={12} /> SKU: {items.find(i => i._id === selectedItemId)?.itemCode}</span>
                 </div>
               )}
            </div>

            <div className="flex-1 overflow-y-auto erp-scrollbar p-6">
               {!selectedItemId ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 space-y-4">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-100 flex items-center justify-center">
                       <Package size={48} />
                    </div>
                    <p className="font-bold text-sm tracking-widest uppercase">Select an item to view history</p>
                 </div>
               ) : loading ? (
                 <div className="space-y-4 animate-pulse">
                    {[1,2,3,4,5].map(n => <div key={n} className="h-20 bg-slate-50 rounded-2xl border border-slate-50" />)}
                 </div>
               ) : ledger.length > 0 ? (
                 <div className="space-y-4">
                    {ledger.map(entry => (
                       <div key={entry._id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-6 group hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/30 transition-all cursor-default relative overflow-hidden">
                          {/* Type Indicator Bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${entry.type === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${entry.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {entry.type === 'IN' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                          </div>

                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-3 mb-1">
                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-widest border ${
                                  entry.type === 'IN' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                                }`}>
                                   {entry.source}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                   <LinkIcon size={10} /> {entry.referenceId.slice(-8).toUpperCase()}
                                </span>
                             </div>
                             <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Barcode size={14} className="text-slate-400" />
                                {entry.barcode}
                                <span className="text-slate-300 mx-2">|</span>
                                <User size={14} className="text-slate-400" />
                                {entry.userId?.name || 'System'}
                             </p>
                          </div>

                          <div className="text-right">
                             <p className={`text-xl font-black ${entry.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {entry.type === 'IN' ? '+' : '-'}{entry.quantity}
                             </p>
                             <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-bold text-slate-500">
                                <span className="text-slate-300 uppercase letter-spacing-wide">BalanceAfter:</span>
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">{entry.balanceAfter}</span>
                             </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 ml-4 border-l border-slate-50 pl-6 text-slate-400">
                             <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                <Calendar size={12} />
                                {new Date(entry.createdAt).toLocaleDateString()}
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                <Clock size={12} />
                                {new Date(entry.createdAt).toLocaleTimeString()}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                 <div className="p-20 text-center space-y-4">
                    <Info size={48} className="mx-auto text-slate-100" />
                    <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">No ledger history available for this item</p>
                    <p className="text-xs text-slate-300">New arrivals or sales will appear here automatically.</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default StockLedgerPage;
