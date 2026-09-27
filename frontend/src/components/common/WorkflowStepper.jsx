import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

const steps = [
  { key: 'CHECKED_IN', label: 'Check-In' },
  { key: 'INSPECTION', label: 'Inspection' },
  { key: 'ESTIMATE_PENDING', label: 'Estimate' },
  { key: 'CUSTOMER_APPROVAL', label: 'Approval' },
  { key: 'APPROVED', label: 'Authorized' },
  { key: 'IN_SERVICE', label: 'In Service' },
  { key: 'QUALITY_CHECK', label: 'Quality Check' },
  { key: 'READY_FOR_DELIVERY', label: 'Ready Delivery' },
  { key: 'COMPLETED', label: 'Delivered' },
];

export const WorkflowStepper = ({ currentStatus }) => {
  const currentIndex = steps.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        <AlertCircle className="w-5 h-5 text-rose-600" />
        <span>This service request was cancelled.</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center min-w-[720px] justify-between">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center group relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : isCurrent
                      ? 'bg-sky-600 text-white ring-4 ring-sky-500/20 shadow-md shadow-sky-600/30'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : isCurrent ? <Clock className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                    isCurrent ? 'text-sky-700 font-bold' : isDone ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-all duration-500 ${
                    idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
