import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Activity, Search, ShieldCheck, Clock, FileText } from 'lucide-react';

export const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/audit-logs')
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = entityFilter ? log.entity === entityFilter : true;
    return matchesSearch && matchesEntity;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'SERVICE_ADVISOR':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'MECHANIC':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'CUSTOMER':
      default:
        return 'bg-sky-50 text-sky-800 border-sky-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Enterprise System Audit Trail</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Immutable Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Append-only record of every workflow state change, estimate authorization, and transaction.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
          >
            <option value="">All Entities</option>
            <option value="ServiceJob">ServiceJob</option>
            <option value="Estimate">Estimate</option>
            <option value="Inspection">Inspection</option>
            <option value="Payment">Payment</option>
            <option value="Invoice">Invoice</option>
            <option value="Part">Part / Inventory</option>
            <option value="User">User / Auth</option>
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, user, or details..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Actor / User</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Action Trigger</th>
                <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                <th className="py-3.5 px-4 font-semibold">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Loading system audit ledger...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getRoleBadge(log.userRole)}`}>
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-800">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
