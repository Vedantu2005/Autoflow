import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, Calendar, Clock, Car, Wrench, MessageSquare } from 'lucide-react';

export const BookingModal = ({ isOpen, onClose, onSuccess, initialVehicleId }) => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(initialVehicleId || '');
  const [serviceType, setServiceType] = useState('General Periodic Service');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('09:00 AM - 11:00 AM');
  const [customerComments, setCustomerComments] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      API.get('/vehicles')
        .then((res) => {
          setVehicles(res.data);
          if (!vehicleId && res.data.length > 0) {
            setVehicleId(res.data[0]._id);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId) {
      showToast('Please select or register a vehicle first', 'warning');
      return;
    }

    setLoading(true);
    try {
      await API.post('/bookings', {
        vehicleId,
        serviceType,
        preferredDate,
        preferredTimeSlot,
        customerComments,
      });
      showToast('Service slot booked successfully!', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to book service', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Book Service Appointment</h3>
              <p className="text-xs text-slate-500">Select your vehicle, service package & slot</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-sky-600" /> Select Vehicle
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
              required
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.make} {v.model} ({v.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-sky-600" /> Service Category
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
            >
              <option value="General Periodic Service">General Periodic Service (Oil, Filters, Fluids)</option>
              <option value="Brake Overhaul & Inspection">Brake Overhaul & Inspection</option>
              <option value="Suspension & Steering Check">Suspension & Steering Check</option>
              <option value="AC Cooling & Electrical Overhaul">AC Cooling & Electrical Overhaul</option>
              <option value="Engine Diagnosis & Tuning">Engine Diagnosis & Tuning</option>
              <option value="Full Comprehensive Service">Full Comprehensive Multi-Point Service</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" /> Preferred Date
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" /> Preferred Slot
              </label>
              <select
                value={preferredTimeSlot}
                onChange={(e) => setPreferredTimeSlot(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
              >
                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-sky-600" /> Customer Problem Symptoms / Notes
            </label>
            <textarea
              rows={3}
              value={customerComments}
              onChange={(e) => setCustomerComments(e.target.value)}
              placeholder="e.g. Brake pedal vibrates at high speed, engine oil warning light flicker..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-sky-500 resize-none shadow-xs"
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
              className="px-5 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Booking...' : 'Confirm Service Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
