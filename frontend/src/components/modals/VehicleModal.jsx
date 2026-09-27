import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { X, Car, Edit3 } from 'lucide-react';

export const VehicleModal = ({ isOpen, onClose, onSuccess, vehicle = null }) => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [make, setMake] = useState('Honda');
  const [model, setModel] = useState('City');
  const [year, setYear] = useState(2022);
  const [fuelType, setFuelType] = useState('PETROL');
  const [mileage, setMileage] = useState(30000);
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  const isEditing = Boolean(vehicle && vehicle._id);

  useEffect(() => {
    if (vehicle) {
      setRegistrationNumber(vehicle.registrationNumber || '');
      setMake(vehicle.make || 'Honda');
      setModel(vehicle.model || 'City');
      setYear(vehicle.year || 2022);
      setFuelType(vehicle.fuelType || 'PETROL');
      setMileage(vehicle.mileage || 0);
      setVin(vehicle.vin || '');
    } else {
      setRegistrationNumber('');
      setMake('');
      setModel('');
      setYear(new Date().getFullYear());
      setFuelType('PETROL');
      setMileage(0);
      setVin('');
    }
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        registrationNumber: registrationNumber.toUpperCase().trim(),
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        fuelType,
        mileage: Number(mileage),
        vin: vin.trim(),
      };

      if (isEditing) {
        await API.put(`/vehicles/${vehicle._id}`, payload);
        showToast(`Vehicle ${payload.registrationNumber} updated successfully!`, 'success');
      } else {
        await API.post('/vehicles', payload);
        showToast(`Vehicle ${payload.registrationNumber} registered successfully!`, 'success');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'register'} vehicle`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${isEditing ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
              {isEditing ? <Edit3 className="w-5 h-5" /> : <Car className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {isEditing ? 'Edit Vehicle Information' : 'Register New Vehicle'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `Update parameters for ${vehicle.registrationNumber}` : 'Add vehicle to your fleet'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Registration Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Registration Number (e.g. MH12CD5678)
            </label>
            <input
              type="text"
              required
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              placeholder="e.g. MH11DR2687, MH12CD5678"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm uppercase font-mono tracking-wider font-semibold text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Make</label>
              <input
                type="text"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. TVS, Honda, Hyundai"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Model</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Jupiter, City, Creta"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>
          </div>

          {/* Year, Fuel, Mileage */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Year</label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fuel</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
              >
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Odometer (KM)</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
              />
            </div>
          </div>

          {/* VIN / Chassis Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              VIN / Chassis Number (Optional)
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="e.g. MALC381CLNM109283"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer ${
                isEditing
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
              }`}
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleModal;
