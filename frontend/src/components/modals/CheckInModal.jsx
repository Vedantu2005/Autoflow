import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, CheckCircle, Gauge, Fuel, UserCheck, AlertTriangle, FileText } from 'lucide-react';

export const CheckInModal = ({ isOpen, onClose, onSuccess, booking }) => {
  const [mechanics, setMechanics] = useState([]);
  const [mechanicId, setMechanicId] = useState('');
  const [odometer, setOdometer] = useState(booking?.vehicleId?.mileage ?? '');
  const [fuelLevelPercent, setFuelLevelPercent] = useState(70);
  const [damageNotes, setDamageNotes] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      API.get('/auth/staff')
        .then((res) => {
          const mechs = res.data.filter((u) => u.role === 'MECHANIC');
          setMechanics(mechs);
          setMechanicId('');
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const damages = damageNotes.trim() ? damageNotes.split(',').map((d) => d.trim()) : [];
      await API.post('/service-jobs', {
        bookingId: booking._id,
        vehicleId: booking.vehicleId._id,
        customerId: booking.customerId._id,
        mechanicId,
        serviceType: booking.serviceType,
        odometer: Number(odometer),
        fuelLevelPercent: Number(fuelLevelPercent),
        existingDamages: damages,
        checkInNotes,
      });

      showToast(`Vehicle ${booking.vehicleId?.registrationNumber} checked in! Job card generated.`, 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Check-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Vehicle Check-In & Job Card</h3>
              <p className="text-xs text-slate-500">
                {booking.vehicleId?.make} {booking.vehicleId?.model} ({booking.vehicleId?.registrationNumber})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCheckIn} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-sky-600" /> Current Odometer (KM)
              </label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-amber-600" /> Fuel Level ({fuelLevelPercent}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={fuelLevelPercent}
                onChange={(e) => setFuelLevelPercent(e.target.value)}
                className="w-full mt-2 accent-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-purple-600" /> Assign Primary Mechanic
            </label>
            <select
              value={mechanicId}
              onChange={(e) => setMechanicId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
              required
            >
              {mechanics.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} — {m.specialization || 'Technician'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Existing Body Damages / Scratches
            </label>
            <input
              type="text"
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              placeholder="e.g. Scratched left door, dent on rear bumper (comma separated)"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" /> Check-in Remarks
            </label>
            <textarea
              rows={2}
              value={checkInNotes}
              onChange={(e) => setCheckInNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 resize-none shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Check-In & Generate Job Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;
