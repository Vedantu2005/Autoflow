import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { VehicleModal } from '../components/modals/VehicleModal';
import { BookingModal } from '../components/modals/BookingModal';
import { Car, Plus, Search, Calendar, History, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [bookingVehicleId, setBookingVehicleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await API.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicle) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove vehicle ${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model}) from the registry?`
    );
    if (!confirmed) return;

    try {
      await API.delete(`/vehicles/${vehicle._id}`);
      showToast(`Vehicle ${vehicle.registrationNumber} removed successfully!`, 'success');
      fetchVehicles();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete vehicle', 'error');
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filtered = vehicles.filter((v) => {
    return (
      v.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.make?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase()) ||
      v.customerId?.name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Vehicle Fleet Register</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
              Fleet Management
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered customer vehicles, technical parameters, and service links.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setIsVehicleModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Register Vehicle
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reg #, model, customer..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div
            key={v._id}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{v.make} {v.model}</h4>
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                    {v.registrationNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {v.fuelType}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVehicle(v);
                      setIsVehicleModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                    title="Edit Vehicle Details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVehicle(v)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                    title="Delete Vehicle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>Year: <span className="font-semibold text-slate-800">{v.year}</span></div>
                <div>Mileage: <span className="font-semibold text-slate-800">{v.mileage?.toLocaleString('en-IN')} KM</span></div>
                <div className="col-span-2">Owner: <span className="text-slate-800 font-semibold">{v.customerId?.name || 'Customer'}</span></div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setBookingVehicleId(v._id)}
                className="flex-1 py-1.5 px-3 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all"
              >
                Book Service
              </button>
              <button
                onClick={() => navigate(`/service-history?vehicleId=${v._id}`)}
                className="py-1.5 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" /> History
              </button>
            </div>
          </div>
        ))}
      </div>

      <VehicleModal
        isOpen={isVehicleModalOpen}
        vehicle={editingVehicle}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSuccess={fetchVehicles}
      />
      <BookingModal
        isOpen={!!bookingVehicleId}
        initialVehicleId={bookingVehicleId}
        onClose={() => setBookingVehicleId(null)}
        onSuccess={fetchVehicles}
      />
    </div>
  );
};

export default VehiclesPage;
