import React, { useState } from 'react';
import API from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, CreditCard, QrCode, Banknote, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const PaymentModal = ({ isOpen, onClose, onSuccess, invoice }) => {
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [amount, setAmount] = useState(invoice?.dueAmount || invoice?.grandTotal || 0);
  const [transactionRef, setTransactionRef] = useState(`UPI-${Math.floor(100000000 + Math.random() * 900000000)}`);
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  if (!isOpen || !invoice) return null;

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('/payments', {
        invoiceId: invoice._id,
        amount: Number(amount),
        paymentMethod,
        transactionRef,
      });

      showToast(`Payment of ₹${amount} recorded successfully via ${paymentMethod}!`, 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Payment processing failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Settlement & Payment Desk</h3>
              <p className="text-xs text-slate-500">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePayment} className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-500 font-medium">Total Outstanding</span>
              <p className="text-xl font-black text-teal-700">
                ₹{invoice.dueAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {invoice.paymentStatus}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                { id: 'CARD', label: 'Debit / Credit', icon: CreditCard },
                { id: 'CASH', label: 'Cash Desk', icon: Banknote },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id);
                      setTransactionRef(`${m.id}-${Math.floor(100000000 + Math.random() * 900000000)}`);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === m.id
                        ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount to Settle (₹)</label>
            <input
              type="number"
              value={amount}
              max={invoice.dueAmount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-teal-500 font-bold shadow-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transaction Reference</label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500 shadow-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              {loading ? 'Processing...' : 'Confirm Simulated Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
