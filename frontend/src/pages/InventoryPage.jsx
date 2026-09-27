import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Search,
  Plus,
  AlertTriangle,
  Package,
  Layers,
  IndianRupee,
  RefreshCw,
  X,
} from 'lucide-react';

export const InventoryPage = () => {
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const { showToast } = useNotification();
  const { user } = useAuth();

  const fetchParts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/parts');
      setParts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedPart) return;

    try {
      const updatedStock = selectedPart.currentStock + Number(restockQty);
      await API.put(`/parts/${selectedPart._id}`, { currentStock: updatedStock });
      showToast(`Restocked ${selectedPart.name} (+${restockQty} units)!`, 'success');
      setIsRestockOpen(false);
      fetchParts();
    } catch (error) {
      showToast('Failed to restock part', 'error');
    }
  };

  const filteredParts = parts.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.partNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Engine', 'Brakes', 'Suspension', 'Electrical', 'Fluids', 'General'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Spare Parts Inventory & Stock Control</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              Auto Inventory Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time automated inventory decrement when estimates are authorized by customers.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                (selectedCategory === '' && cat === 'All') || selectedCategory === cat
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search part name, #..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Part Number</th>
                <th className="py-3.5 px-4 font-semibold">Item Description</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Unit Price</th>
                <th className="py-3.5 px-4 font-semibold">In-Hand Stock</th>
                <th className="py-3.5 px-4 font-semibold">Min Threshold</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No matching parts catalog entries found.
                  </td>
                </tr>
              ) : (
                filteredParts.map((p) => {
                  const isLow = p.currentStock <= p.minStockLevel;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.partNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{p.category}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        ₹{p.sellingPrice?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {p.currentStock} {p.unit}
                        </span>
                        {isLow && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{p.minStockLevel} {p.unit}</td>
                      <td className="py-3.5 px-4 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'SERVICE_ADVISOR') && (
                          <button
                            onClick={() => {
                              setSelectedPart(p);
                              setIsRestockOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors shadow-xs"
                          >
                            + Restock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {isRestockOpen && selectedPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Restock Part Inventory</h3>
              <button onClick={() => setIsRestockOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <p className="text-xs text-slate-900 font-semibold">{selectedPart.name}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Part #: {selectedPart.partNumber} • Current Stock: {selectedPart.currentStock} {selectedPart.unit}</p>
            </div>
            <form onSubmit={handleRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity to Add ({selectedPart.unit})</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-xs"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md shadow-sky-600/20 transition-all"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
