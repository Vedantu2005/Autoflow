import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Users,
  Car,
  Wrench,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Boxes,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0284c7', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#14b8a6'];

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/analytics/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-sm">Loading executive analytics...</div>;
  }

  const { metrics, statusDistribution, vehicleDistribution, lowStockParts } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Executive Operations Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Admin Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workshop velocity, financial throughput, inventory health, and quality metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Revenue Settled</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              ₹{metrics?.totalRevenue?.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Service Orders</span>
            <p className="text-2xl font-black text-sky-600 mt-1">{metrics?.activeServiceJobs || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Registered Customers</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{metrics?.totalCustomers || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Low Stock Inventory Alerts</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{metrics?.lowStockCount || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Service Jobs by Workflow State</h3>
            <span className="text-xs text-slate-500 font-medium">Live Stage Distribution</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution || []}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Vehicle Makes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Vehicle Fleet by Manufacturer</h3>
            <span className="text-xs text-slate-500 font-medium">Make Distribution</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleDistribution || []}
                  dataKey="count"
                  nameKey="make"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ make, count }) => `${make} (${count})`}
                  labelLine={false}
                >
                  {(vehicleDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Parts Alerts */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Urgent Low Stock Inventory Items ({lowStockParts?.length || 0})
          </h3>
          <button
            onClick={() => navigate('/inventory')}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1"
          >
            Manage Inventory Catalog <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {lowStockParts?.length === 0 ? (
          <p className="text-xs text-emerald-700 py-3 font-medium">All parts inventory stock levels are healthy above minimum thresholds.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Part Number</th>
                  <th className="py-2.5 px-4 font-semibold">Part Name</th>
                  <th className="py-2.5 px-4 font-semibold">Category</th>
                  <th className="py-2.5 px-4 font-semibold">Current Stock</th>
                  <th className="py-2.5 px-4 font-semibold">Min Level</th>
                  <th className="py-2.5 px-4 font-semibold">Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockParts?.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{p.partNumber}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-medium">{p.category}</td>
                    <td className="py-2.5 px-4 font-bold text-rose-600">{p.currentStock} {p.unit}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-medium">{p.minStockLevel} {p.unit}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                        Restock Needed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
