import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { loadRazorpayScript } from '../../utils/razorpay';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  Lock,
  Zap,
} from 'lucide-react';

export const PaymentModal = ({ isOpen, onClose, onSuccess, invoice }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [paymentMode, setPaymentMode] = useState('RAZORPAY'); // 'RAZORPAY' | 'CASH'
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cashRef, setCashRef] = useState('');

  useEffect(() => {
    if (invoice) {
      const defaultAmt = invoice.dueAmount > 0 ? invoice.dueAmount : invoice.grandTotal || 0;
      setAmount(defaultAmt);
      setCashRef(`CASH-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  // Handle Razorpay Checkout flow
  const handleRazorpayPayment = async () => {
    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    if (payAmount > invoice.dueAmount) {
      showToast(`Amount cannot exceed due amount (₹${invoice.dueAmount})`, 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Ensure Razorpay checkout script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast('Razorpay SDK failed to load. Check your internet connection.', 'error');
        setLoading(false);
        return;
      }

      // 2. Create Razorpay Order on server
      const orderRes = await API.post('/payments/create-order', {
        invoiceId: invoice._id,
        amount: payAmount,
      });

      const { orderId, amount: orderAmountInPaise, currency, keyId, customer } = orderRes.data;

      // 3. Configure Razorpay checkout options
      const options = {
        key: keyId,
        amount: orderAmountInPaise,
        currency: currency || 'INR',
        name: 'AutoFlow Service Hub',
        description: `Settlement for Invoice #${invoice.invoiceNumber}`,
        order_id: orderId,
        theme: {
          color: '#0d9488', // Teal 600
        },
        prefill: {
          name: customer?.name || user?.name || '',
          email: customer?.email || user?.email || '',
          contact: customer?.phone || user?.phone || '9999999999',
        },
        notes: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showToast('Payment window closed. Transaction not completed.', 'info');
          },
        },
        handler: async (response) => {
          try {
            setVerifying(true);
            const verifyRes = await API.post('/payments/verify', {
              invoiceId: invoice._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: payAmount,
            });

            showToast(
              `Payment of ₹${payAmount.toLocaleString('en-IN')} verified & settled successfully via Razorpay!`,
              'success'
            );
            onSuccess?.(verifyRes.data);
            onClose();
          } catch (err) {
            console.error('Payment verification failed:', err);
            showToast(err.response?.data?.message || 'Payment signature verification failed', 'error');
          } finally {
            setVerifying(false);
            setLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (failResponse) => {
        setLoading(false);
        showToast(
          failResponse.error?.description || 'Razorpay transaction was declined or failed',
          'error'
        );
      });

      razorpayInstance.open();
    } catch (error) {
      console.error('Failed to initiate Razorpay order:', error);
      showToast(
        error.response?.data?.message || 'Failed to initialize Razorpay payment order',
        'error'
      );
      setLoading(false);
    }
  };

  // Handle Offline / Cash Desk settlement (for staff/counter collection)
  const handleCashPayment = async (e) => {
    e.preventDefault();
    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/payments', {
        invoiceId: invoice._id,
        amount: payAmount,
        paymentMethod: 'CASH',
        transactionRef: cashRef || `CASH-${Date.now()}`,
      });

      showToast(`Cash payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully!`, 'success');
      onSuccess?.(res.data);
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Cash payment recording failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isFullSettlement = Number(amount) === Number(invoice.dueAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Invoice Settlement</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  Razorpay Secured
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading || verifying}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outstanding Banner */}
        <div className="p-6 pb-2 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Outstanding Balance
                </span>
                <p className="text-3xl font-black tracking-tight text-white mt-0.5">
                  ₹{invoice.dueAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
                  <span>Grand Total: ₹{invoice.grandTotal?.toLocaleString('en-IN')}</span>
                  <span>•</span>
                  <span>Paid: ₹{invoice.paidAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                  invoice.paymentStatus === 'PAID'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {invoice.paymentStatus}
              </span>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Settlement Channel
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMode('RAZORPAY')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all text-left relative ${
                  paymentMode === 'RAZORPAY'
                    ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    paymentMode === 'RAZORPAY'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Razorpay</span>
                    <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[9px] font-extrabold rounded">
                      UPI / Cards
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Instant Online Gateway</p>
                </div>
                {paymentMode === 'RAZORPAY' && (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 ml-auto" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all text-left relative ${
                  paymentMode === 'CASH'
                    ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    paymentMode === 'CASH'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900">Cash Counter</span>
                  <p className="text-[11px] text-slate-500">Physical Cash Desk</p>
                </div>
                {paymentMode === 'CASH' && (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Amount to Settle */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">Amount to Settle (₹)</label>
              {!isFullSettlement && (
                <button
                  type="button"
                  onClick={() => setAmount(invoice.dueAmount)}
                  className="text-[11px] font-bold text-teal-600 hover:text-teal-700 underline"
                >
                  Settle Full Due (₹{invoice.dueAmount})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max={invoice.dueAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Channel Details */}
          {paymentMode === 'RAZORPAY' ? (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-teal-900 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Supported via Razorpay:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Test Mode Active
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-600">
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-medium">
                    Google Pay / PhonePe / Paytm / UPI
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-medium">
                    Credit / Debit Cards
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-medium">
                    Net Banking
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-medium">
                    Wallets
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  PCI-DSS Level 1 compliant 256-bit encrypted checkout.
                </p>
              </div>
            </div>
          ) : (
            <form id="cash-payment-form" onSubmit={handleCashPayment} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Counter Receipt / Cash Ref
                </label>
                <input
                  type="text"
                  value={cashRef}
                  onChange={(e) => setCashRef(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500 shadow-xs"
                  placeholder="e.g. CASH-100234"
                  required
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || verifying}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {paymentMode === 'RAZORPAY' ? (
            <button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={loading || verifying || !amount || Number(amount) <= 0}
              className="px-6 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading || verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {verifying ? 'Verifying Signature...' : 'Launching Razorpay...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Pay ₹{Number(amount || 0).toLocaleString('en-IN')} with Razorpay
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              form="cash-payment-form"
              disabled={loading || !amount || Number(amount) <= 0}
              className="px-6 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Cash...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Record Cash Settlement (₹{Number(amount || 0).toLocaleString('en-IN')})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
