import React from 'react';

const statusConfig = {
  BOOKED: { label: 'Booked', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  CHECKED_IN: { label: 'Checked In', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  INSPECTION: { label: 'Inspection', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  ESTIMATE_PENDING: { label: 'Estimate Pending', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
  CUSTOMER_APPROVAL: { label: 'Approval Required', bg: 'bg-pink-50 text-pink-800 border-pink-200' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  IN_SERVICE: { label: 'In Service', bg: 'bg-sky-50 text-sky-800 border-sky-200', pulse: true },
  QUALITY_CHECK: { label: 'Quality Check', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  READY_FOR_DELIVERY: { label: 'Ready for Delivery', bg: 'bg-teal-50 text-teal-800 border-teal-200' },
  COMPLETED: { label: 'Delivered / Completed', bg: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  const sizeClasses = size === 'lg' ? 'px-3.5 py-1.5 text-xs font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} transition-all`}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
      )}
      {config.label}
    </span>
  );
};

export default StatusBadge;
