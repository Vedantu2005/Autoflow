import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, Calculator, Plus, Trash2, AlertTriangle, Send, CheckCircle2, Sparkles, Wrench } from 'lucide-react';

export const EstimateModal = ({ isOpen, onClose, onSuccess, job }) => {
  const [availableParts, setAvailableParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [labourItems, setLabourItems] = useState([]);
  const [taxPercent, setTaxPercent] = useState(18);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inspectionData, setInspectionData] = useState(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen && job) {
      setLoading(true);
      Promise.all([
        API.get('/parts'),
        API.get(`/inspections/job/${job._id}`).catch(() => ({ data: null })),
      ])
        .then(([partsRes, inspRes]) => {
          const parts = partsRes.data || [];
          setAvailableParts(parts);

          const insp = inspRes.data;
          setInspectionData(insp);

          const prefilledParts = [];
          const prefilledLabour = [];

          if (insp) {
            // 1. If mechanic explicitly requisitioned parts
            if (insp.requestedParts && insp.requestedParts.length > 0) {
              insp.requestedParts.forEach((rp) => {
                const pId = rp.partId?._id || rp.partId;
                const matched = parts.find((p) => p._id === pId);
                if (matched && !prefilledParts.some((p) => p.partId === matched._id)) {
                  prefilledParts.push({
                    partId: matched._id,
                    quantity: rp.quantity || 1,
                    name: matched.name,
                    price: matched.sellingPrice,
                    stock: matched.currentStock,
                  });
                }
              });
            }

            // 2. Auto-match from checklist items marked REPLACE or NEEDS_ATTENTION
            if (insp.checklist && insp.checklist.length > 0) {
              const issues = insp.checklist.filter(
                (c) => c.condition === 'REPLACE' || c.condition === 'NEEDS_ATTENTION'
              );

              issues.forEach((ci) => {
                const itemLower = ci.item.toLowerCase();
                const matched = parts.find((p) => {
                  const pName = p.name.toLowerCase();
                  if (itemLower.includes('oil') && !itemLower.includes('filter') && pName.includes('oil') && !pName.includes('filter')) return true;
                  if (itemLower.includes('oil filter') && pName.includes('oil filter')) return true;
                  if (itemLower.includes('brake pad') && pName.includes('brake pad')) return true;
                  if (itemLower.includes('brake shoe') && pName.includes('brake shoe')) return true;
                  if (itemLower.includes('brake fluid') && pName.includes('brake fluid')) return true;
                  if (itemLower.includes('battery') && pName.includes('battery')) return true;
                  if (itemLower.includes('spark') && pName.includes('spark')) return true;
                  if ((itemLower.includes('strut') || itemLower.includes('shock')) && (pName.includes('strut') || pName.includes('shock'))) return true;
                  if (itemLower.includes('air filter') && pName.includes('air filter')) return true;
                  if (itemLower.includes('cabin') && pName.includes('cabin')) return true;
                  if (itemLower.includes('coolant') && pName.includes('coolant')) return true;
                  if (itemLower.includes('wiper') && pName.includes('wiper')) return true;
                  return false;
                });

                if (matched && !prefilledParts.some((p) => p.partId === matched._id)) {
                  prefilledParts.push({
                    partId: matched._id,
                    quantity: 1,
                    name: matched.name,
                    price: matched.sellingPrice,
                    stock: matched.currentStock,
                  });
                }
              });
            }

            // 3. Match from recommendedRepairs strings
            if (insp.recommendedRepairs && insp.recommendedRepairs.length > 0) {
              insp.recommendedRepairs.forEach((rep) => {
                const repLower = rep.toLowerCase();
                const matched = parts.find((p) => {
                  const pName = p.name.toLowerCase();
                  if (repLower.includes('oil filter') && pName.includes('oil filter')) return true;
                  if (repLower.includes('engine oil') && pName.includes('oil') && !pName.includes('filter')) return true;
                  if (repLower.includes('brake pad') && pName.includes('brake pad')) return true;
                  if (repLower.includes('battery') && pName.includes('battery')) return true;
                  if (repLower.includes('coolant') && pName.includes('coolant')) return true;
                  return false;
                });

                if (matched && !prefilledParts.some((p) => p.partId === matched._id)) {
                  prefilledParts.push({
                    partId: matched._id,
                    quantity: 1,
                    name: matched.name,
                    price: matched.sellingPrice,
                    stock: matched.currentStock,
                  });
                }

                // Add to labour items!
                prefilledLabour.push({
                  description: rep.replace(/^Replace\s+/i, 'Install & Fit '),
                  hours: 1,
                  ratePerHour: 450,
                });
              });
            }
          }

          // Fallback if no specific parts matched: suggest primary periodic maintenance parts
          if (prefilledParts.length === 0 && parts.length > 0) {
            const oilPart = parts.find((p) => p.name.toLowerCase().includes('engine oil'));
            const filterPart = parts.find((p) => p.name.toLowerCase().includes('oil filter'));
            if (oilPart) {
              prefilledParts.push({
                partId: oilPart._id,
                quantity: 1,
                name: oilPart.name,
                price: oilPart.sellingPrice,
                stock: oilPart.currentStock,
              });
            }
            if (filterPart) {
              prefilledParts.push({
                partId: filterPart._id,
                quantity: 1,
                name: filterPart.name,
                price: filterPart.sellingPrice,
                stock: filterPart.currentStock,
              });
            }
          }

          if (prefilledLabour.length === 0) {
            prefilledLabour.push({
              description: `Comprehensive Vehicle Diagnostic & Inspection (${job.serviceType || 'Periodic Service'})`,
              hours: 1.5,
              ratePerHour: 450,
            });
          }

          setSelectedParts(prefilledParts);
          setLabourItems(prefilledLabour);
          setAutoFilled(true);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  // Add a part row
  const handleAddPart = (partId) => {
    const part = availableParts.find((p) => p._id === partId);
    if (!part) return;

    if (selectedParts.some((p) => p.partId === partId)) {
      showToast('Part already added to estimate', 'info');
      return;
    }

    setSelectedParts([
      ...selectedParts,
      {
        partId: part._id,
        quantity: 1,
        name: part.name,
        price: part.sellingPrice,
        stock: part.currentStock,
      },
    ]);
  };

  const handleUpdatePartQty = (index, qty) => {
    const updated = [...selectedParts];
    const newQty = Math.max(1, Number(qty));
    updated[index].quantity = newQty;
    setSelectedParts(updated);
  };

  const handleRemovePart = (index) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  // Labour items handling
  const handleAddLabour = () => {
    setLabourItems([...labourItems, { description: '', hours: 1, ratePerHour: 0 }]);
  };

  const handleUpdateLabour = (index, field, value) => {
    const updated = [...labourItems];
    updated[index][field] = field === 'description' ? value : Number(value);
    setLabourItems(updated);
  };

  const handleRemoveLabour = (index) => {
    setLabourItems(labourItems.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const partsSubtotal = selectedParts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const labourSubtotal = labourItems.reduce((sum, l) => sum + l.hours * l.ratePerHour, 0);
  const taxableAmount = Math.max(0, partsSubtotal + labourSubtotal - Number(discountAmount));
  const taxAmount = (taxableAmount * Number(taxPercent)) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any part exceeds stock
    for (const p of selectedParts) {
      if (p.quantity > p.stock) {
        showToast(`Stock Shortage: ${p.name} requested (${p.quantity}) exceeds in-hand stock (${p.stock})`, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      await API.post('/estimates', {
        serviceJobId: job._id,
        parts: selectedParts.map((p) => ({ partId: p.partId, quantity: p.quantity, unitPrice: p.price })),
        labour: labourItems,
        taxPercent: Number(taxPercent),
        discountAmount: Number(discountAmount),
      });

      showToast(`Estimate generated for Job #${job.jobNumber} and sent to Customer!`, 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create estimate', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Service Cost Estimate Generator</h3>
              <p className="text-xs text-slate-500">
                Job #{job.jobNumber} — {job.vehicleId?.make} {job.vehicleId?.model} ({job.vehicleId?.registrationNumber})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Dynamic Auto-Population Notice */}
          {inspectionData ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-emerald-900">
                    Auto-Populated from Mechanic's Digital Inspection
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/70 text-emerald-800">
                    Technician: {inspectionData.mechanicId?.name || 'Floor Mechanic'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Required parts and labor operations diagnosed during vehicle physical inspection have been pre-filled automatically. Please review, adjust quantities or discounts if needed, and forward to the customer.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-2.5 text-xs text-sky-800">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Pre-loaded standard parts & operations for <strong>{job.serviceType}</strong>. You may add or modify items below.
              </span>
            </div>
          )}

          {/* Parts Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Parts & Consumables
              </h4>
              <div className="w-64">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddPart(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-orange-500 shadow-xs"
                >
                  <option value="">+ Add Part from Inventory...</option>
                  {availableParts.map((p) => (
                    <option key={p._id} value={p._id} disabled={p.currentStock <= 0}>
                      {p.name} (₹{p.sellingPrice} | Stock: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {selectedParts.map((part, idx) => (
                <div key={part.partId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-3 text-xs">
                  <div className="flex-1 font-semibold text-slate-900">
                    <div>{part.name}</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      ₹{part.price.toLocaleString('en-IN')} / unit • Current Stock: {part.stock}
                      {part.quantity > part.stock && (
                        <span className="text-rose-600 font-bold ml-2">⚠️ Exceeds Stock!</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={(e) => handleUpdatePartQty(idx, e.target.value)}
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 text-center focus:outline-none focus:border-orange-500 shadow-xs"
                    />
                    <div className="w-20 text-right font-bold text-slate-900">
                      ₹{(part.price * part.quantity).toLocaleString('en-IN')}
                    </div>
                    <button type="button" onClick={() => handleRemovePart(idx)} className="text-slate-400 hover:text-rose-600 ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="text-right text-xs font-bold text-slate-700 pr-2">
                Parts Subtotal: ₹{partsSubtotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Labour Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                2. Labour & Service Operations
              </h4>
              <button
                type="button"
                onClick={handleAddLabour}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>

            <div className="space-y-2">
              {labourItems.map((labour, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <input
                    type="text"
                    value={labour.description}
                    onChange={(e) => handleUpdateLabour(idx, 'description', e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-orange-500 shadow-xs"
                    placeholder="Labour Task Description"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-500 font-medium">Hrs:</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={labour.hours}
                      onChange={(e) => handleUpdateLabour(idx, 'hours', e.target.value)}
                      className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-center shadow-xs"
                    />
                    <span className="text-slate-500 font-medium">Rate:</span>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={labour.ratePerHour}
                      onChange={(e) => handleUpdateLabour(idx, 'ratePerHour', e.target.value)}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-center shadow-xs"
                    />
                    <div className="w-16 text-right font-bold text-slate-900">
                      ₹{(labour.hours * labour.ratePerHour).toLocaleString('en-IN')}
                    </div>
                    <button type="button" onClick={() => handleRemoveLabour(idx)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="text-right text-xs font-bold text-slate-700 pr-2">
                Labour Subtotal: ₹{labourSubtotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Pricing Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Parts Subtotal:</span>
              <span className="text-slate-900 font-semibold">₹{partsSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Labour Subtotal:</span>
              <span className="text-slate-900 font-semibold">₹{labourSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Discount Amount:</span>
              <div className="flex items-center gap-1">
                <span>₹</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-20 bg-white border border-slate-200 rounded px-2 py-0.5 text-right text-slate-900 shadow-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>GST / Tax ({taxPercent}%):</span>
              <span className="text-slate-900 font-semibold">₹{taxAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-orange-700">
              <span>Total Estimated Amount:</span>
              <span>₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
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
              className="px-5 py-2.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Submitting...' : 'Send Estimate for Customer Sign-Off'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EstimateModal;
