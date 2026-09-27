import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { History, Car, Search, Calendar, Wrench, IndianRupee, ArrowRight } from 'lucide-react';

export const ServiceHistoryPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicleId');
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(preselectedVehicleId || '');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/vehicles').then((res) => {
      setVehicles(res.data);
      if (!selectedVehicleId && res.data.length > 0) {
        setSelectedVehicleId(res.data[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      setLoading(true);
      API.get(`/vehicles/${selectedVehicleId}/history`)
        .then((res) => setHistoryData(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [selectedVehicleId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Vehicle Service History Vault</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
              Permanent Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete lifecycle maintenance records, diagnoses, and financial statements per vehicle.
          </p>
        </div>

        {/* Vehicle Selector */}
        <div className="w-full sm:w-72">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-sky-600" /> Select Vehicle
          </label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
          >
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.make} {v.model} ({v.registrationNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading service ledger...</div>
      ) : !historyData || historyData.history?.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-2 shadow-sm">
          <History className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No Past Service Records Found</h3>
          <p className="text-xs text-slate-500">
            This vehicle has not completed any service jobs yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 font-medium">Vehicle:</span>{' '}
              <span className="font-bold text-slate-900">
                {historyData.vehicle?.make} {historyData.vehicle?.model} ({historyData.vehicle?.year})
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">VIN:</span>{' '}
              <span className="font-mono font-semibold text-slate-700">{historyData.vehicle?.vin || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Total Visits:</span>{' '}
              <span className="font-bold text-sky-700">{historyData.history?.length}</span>
            </div>
          </div>

          <div className="space-y-3">
            {historyData.history?.map((job) => (
              <div
                key={job._id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {job.jobNumber}
                    </span>
                    <StatusBadge status={job.status} />
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{job.serviceType}</h4>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Odometer: <strong className="text-slate-800 font-semibold">{job.checkInDetails?.odometer} KM</strong></span>
                    <span>Advisor: <strong className="text-slate-800 font-semibold">{job.advisorId?.name}</strong></span>
                    <span>Mechanic: <strong className="text-slate-800 font-semibold">{job.mechanicId?.name || 'Assigned Staff'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/service-jobs/${job._id}`)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    View Job Dossier <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceHistoryPage;
