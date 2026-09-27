import React, { useState } from 'react';
import API from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, ClipboardCheck, AlertCircle, CheckCircle2, Wrench } from 'lucide-react';

const initialChecklist = [
  { category: 'Engine', item: 'Engine Oil Quality & Level', condition: 'NEEDS_ATTENTION', notes: 'Oil viscosity degraded. Replacement needed.' },
  { category: 'Engine', item: 'Oil Filter Element', condition: 'REPLACE', notes: 'Filter saturated with debris.' },
  { category: 'Brakes', item: 'Front Ceramic Brake Pads', condition: 'NEEDS_ATTENTION', notes: 'Pad thickness below 3mm.' },
  { category: 'Brakes', item: 'Brake Fluid Moisture & Level', condition: 'GOOD', notes: 'Brake fluid level optimal.' },
  { category: 'Electrical', item: 'Battery Voltage & Terminals', condition: 'GOOD', notes: '12.6V resting voltage.' },
  { category: 'Suspension', item: 'Front Struts & Bushings', condition: 'GOOD', notes: 'No fluid leak detected.' },
  { category: 'Tyres', item: 'Tyre Tread Depth & PSI', condition: 'GOOD', notes: 'All 4 tyres at 33 PSI.' },
];

export const InspectionModal = ({ isOpen, onClose, onSuccess, job }) => {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [overallDiagnosis, setOverallDiagnosis] = useState(
    'Periodic inspection completed. Engine oil heavily degraded, oil filter saturated, front brake pads worn down and squeaking.'
  );
  const [recommendedRepairs, setRecommendedRepairs] = useState([
    'Replace Engine Oil with Synthetic 5W-30',
    'Replace Oil Filter',
    'Replace Front Ceramic Brake Pad Set & Bleed Lines',
  ]);
  const [newRepair, setNewRepair] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  if (!isOpen || !job) return null;

  const handleConditionChange = (index, condition) => {
    const updated = [...checklist];
    updated[index].condition = condition;
    setChecklist(updated);
  };

  const handleNotesChange = (index, notes) => {
    const updated = [...checklist];
    updated[index].notes = notes;
    setChecklist(updated);
  };

  const handleAddRepair = () => {
    if (newRepair.trim()) {
      setRecommendedRepairs([...recommendedRepairs, newRepair.trim()]);
      setNewRepair('');
    }
  };

  const handleRemoveRepair = (index) => {
    setRecommendedRepairs(recommendedRepairs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('/inspections', {
        serviceJobId: job._id,
        checklist,
        overallDiagnosis,
        recommendedRepairs,
      });

      showToast(`Inspection diagnosis saved for Job #${job.jobNumber}!`, 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit inspection', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Multi-Point Digital Inspection</h3>
              <p className="text-xs text-slate-500">
                Job #{job.jobNumber} — {job.vehicleId?.make} {job.vehicleId?.model} ({job.vehicleId?.registrationNumber})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Inspection Checklist Items
            </h4>
            <div className="space-y-3">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700 mr-2">
                      {item.category}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{item.item}</span>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleNotesChange(idx, e.target.value)}
                      placeholder="Technician observation..."
                      className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-purple-500 shadow-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {['GOOD', 'NEEDS_ATTENTION', 'REPLACE'].map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => handleConditionChange(idx, cond)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
                          item.condition === cond
                            ? cond === 'GOOD'
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : cond === 'NEEDS_ATTENTION'
                              ? 'bg-amber-600 text-white font-bold shadow-xs'
                              : 'bg-rose-600 text-white font-bold shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cond.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Overall Diagnostic Summary
            </label>
            <textarea
              rows={3}
              value={overallDiagnosis}
              onChange={(e) => setOverallDiagnosis(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-purple-500 resize-none shadow-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Recommended Repairs for Estimate
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newRepair}
                onChange={(e) => setNewRepair(e.target.value)}
                placeholder="Add recommended repair item..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500 shadow-xs"
              />
              <button
                type="button"
                onClick={handleAddRepair}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs"
              >
                Add
              </button>
            </div>
            <div className="space-y-1.5">
              {recommendedRepairs.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                  <span>{r}</span>
                  <button type="button" onClick={() => handleRemoveRepair(i)} className="text-slate-400 hover:text-rose-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
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
              className="px-5 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Submit Diagnosis & Send to Estimate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InspectionModal;
