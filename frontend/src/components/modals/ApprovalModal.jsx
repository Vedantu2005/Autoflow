import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, CheckCircle, ShieldAlert, FileText, Wrench, PackageCheck, AlertCircle } from 'lucide-react';

export const ApprovalModal = ({ isOpen, onClose, onSuccess, job }) => {
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen && job) {
      setLoading(true);
      API.get(`/estimates/job/${job._id}`)
        .then((res) => setEstimate(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  const handleDecision = async (action) => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      showToast('Please provide a reason for declining the estimate', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const res = await API.put(`/estimates/${estimate._id}/approve`, {
        action,
        rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
      });

      if (action === 'APPROVE') {
        showToast('Estimate approved! Parts inventory updated & service authorized.', 'success');
      } else {
        showToast('Estimate rejected. Returned to service advisor for revision.', 'info');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Review & Authorize Service Estimate</h3>
              <p className="text-xs text-slate-500">
                Job #{job.jobNumber} — {job.vehicleId?.make} {job.vehicleId?.model} ({job.vehicleId?.registrationNumber})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading estimate line items...</div>
        ) : !estimate ? (
          <div className="p-8 text-center text-rose-600 text-sm">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            No active estimate record found for this job card.
          </div>
        ) : (
          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            {/* Estimate Header */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 font-medium">Estimate Reference</span>
                <p className="font-bold text-slate-900">{estimate.estimateNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Grand Total</span>
                <p className="text-lg font-extrabold text-emerald-700">
                  ₹{estimate.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Parts Breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-sky-600" /> Spare Parts & Consumables
              </h4>
              <div className="space-y-1.5">
                {estimate.parts?.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                    <div>
                      <span className="font-semibold">{p.partName}</span>
                      <span className="text-slate-500 ml-2 font-mono">({p.partNumber})</span>
                    </div>
                    <div className="text-right font-medium">
                      {p.quantity} × ₹{p.unitPrice?.toLocaleString('en-IN')} = <span className="font-bold text-slate-900">₹{p.totalPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
                <div className="text-right text-xs text-slate-500 pr-2">
                  Parts Subtotal: <span className="font-bold text-slate-900">₹{estimate.partsSubtotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Labour Breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Labour Tasks
              </h4>
              <div className="space-y-1.5">
                {estimate.labour?.map((l, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                    <span className="font-semibold">{l.description}</span>
                    <span className="font-bold text-slate-900">₹{l.totalCost?.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="text-right text-xs text-slate-500 pr-2">
                  Labour Subtotal: <span className="font-bold text-slate-900">₹{estimate.labourSubtotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Tax Box */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>GST / Tax ({estimate.taxPercent}%):</span>
                <span className="font-semibold text-slate-900">₹{estimate.taxAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              {estimate.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Special Discount:</span>
                  <span>-₹{estimate.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Rejection input box */}
            {showRejectBox && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in">
                <label className="block text-xs font-semibold text-rose-800">
                  Reason for Rejecting Estimate:
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Please remove brake pads replacement for now, only perform engine oil change..."
                  className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 resize-none shadow-xs"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {!showRejectBox ? (
                <button
                  type="button"
                  onClick={() => setShowRejectBox(true)}
                  className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Decline / Request Revision
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('REJECT')}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow transition-all disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleDecision('APPROVE')}
                  className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  {actionLoading ? 'Approving...' : 'Approve Estimate & Authorize Service'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalModal;
