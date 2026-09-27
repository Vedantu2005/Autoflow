import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { PaymentModal } from '../components/modals/PaymentModal';
import { Receipt, CreditCard, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await API.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((i) => {
    return (
      i.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      i.customerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.vehicleId?.registrationNumber?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Billing & Invoices</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Finance & Settlements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Itemized invoices, tax computations, and settlement processing.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, vehicle, customer..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500 shadow-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Billed Amount</th>
                <th className="py-3 px-4 font-semibold">Paid Amount</th>
                <th className="py-3 px-4 font-semibold">Payment Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.paymentStatus === 'PAID';
                return (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {inv.vehicleId?.make} {inv.vehicleId?.model}
                      <span className="block text-[11px] font-mono text-slate-500">
                        {inv.vehicleId?.registrationNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{inv.customerId?.name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{inv.grandTotal?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">₹{inv.paidAmount?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isPaid && (
                        <button
                          onClick={() => setPaymentInvoice(inv)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
                        >
                          Settle Payment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal
        isOpen={!!paymentInvoice}
        invoice={paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onSuccess={fetchInvoices}
      />
    </div>
  );
};

export default InvoicesPage;
