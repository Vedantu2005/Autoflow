import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { InspectionModal } from '../components/modals/InspectionModal';
import { useNotification } from '../context/NotificationContext';
import {
  Wrench,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Play,
  CheckSquare,
  AlertTriangle,
  FileText,
  Eye,
  UserCheck,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MechanicDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [scope, setScope] = useState('all'); // 'assigned' or 'all'
  const [loading, setLoading] = useState(true);
  const [inspectJob, setInspectJob] = useState(null);
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const fetchJobs = async (targetScope = scope) => {
    try {
      setLoading(true);
      const url = targetScope === 'all' ? '/service-jobs?scope=all' : '/service-jobs';
      const res = await API.get(url);
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(scope);
  }, [scope]);

  // Mechanic takes over or claims job
  const handleClaimJob = async (job) => {
    try {
      await API.put(`/service-jobs/${job._id}/assign`, {
        mechanicId: user._id,
      });
      showToast(`Assigned Job #${job.jobNumber} to ${user?.name}!`, 'success');
      fetchJobs();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to claim job', 'error');
    }
  };

  // Mechanic begins work (moves APPROVED -> IN_SERVICE)
  const handleStartWork = async (job) => {
    try {
      await API.put(`/service-jobs/${job._id}/status`, {
        status: 'IN_SERVICE',
        notes: `Technician ${user?.name} began service execution. Parts picked from inventory.`,
      });
      showToast(`Work started on Job #${job.jobNumber}!`, 'success');
      fetchJobs();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to start work', 'error');
    }
  };

  // Mechanic finishes work (moves IN_SERVICE -> QUALITY_CHECK)
  const handleCompleteWork = async (job) => {
    try {
      await API.put(`/service-jobs/${job._id}/status`, {
        status: 'QUALITY_CHECK',
        notes: `Technician ${user?.name} completed labor tasks. Passed to Service Advisor for QA.`,
      });
      showToast(`Job #${job.jobNumber} marked completed! Forwarded to Quality Inspection.`, 'success');
      fetchJobs();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update job', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-sm">Loading technician workbench...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Technician Workbench</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Mechanic
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.specialization || 'Master Technician'})
          </p>
        </div>

        {/* View Scope Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
          <button
            onClick={() => setScope('assigned')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scope === 'assigned'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => setScope('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scope === 'all'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Workshop Jobs
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Pending Diagnosis / Inspection</span>
            <p className="text-2xl font-black text-purple-600 mt-1">
              {jobs.filter((j) => j.status === 'CHECKED_IN' || j.status === 'INSPECTION').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Authorized to Begin</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {jobs.filter((j) => j.status === 'APPROVED').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Play className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Currently In Wrench-Time</span>
            <p className="text-2xl font-black text-sky-600 mt-1">
              {jobs.filter((j) => j.status === 'IN_SERVICE').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Service Jobs Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            {scope === 'assigned' ? 'My Assigned Work Orders' : 'All Workshop Service Orders'} ({jobs.length})
          </h3>
          <span className="text-xs text-slate-500">
            {scope === 'all' ? 'Showing all active jobs across workshop bays' : 'Showing jobs assigned to your technician profile'}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-sm">
            No service jobs found under the selected view.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => {
              const isAssignedToMe = job.mechanicId?._id === user?._id || job.mechanicId === user?._id;

              return (
                <div
                  key={job._id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                          {job.jobNumber}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-2">
                          {job.vehicleId?.make} {job.vehicleId?.model}
                        </h4>
                        <p className="font-mono text-xs text-slate-500">{job.vehicleId?.registrationNumber}</p>
                      </div>
                      <StatusBadge status={job.status} size="lg" />
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-500 font-medium">Service Task:</span>{' '}
                        <span className="font-semibold text-slate-800">{job.serviceType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Assigned Tech:</span>{' '}
                        <span className={`font-semibold ${isAssignedToMe ? 'text-purple-700' : 'text-slate-800'}`}>
                          {job.mechanicId?.name || 'Unassigned'}
                        </span>
                        {!isAssignedToMe && (
                          <button
                            type="button"
                            onClick={() => handleClaimJob(job)}
                            className="ml-2 px-2 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[10px] font-bold"
                          >
                            Assign to Me
                          </button>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Odometer:</span>{' '}
                        <span className="font-semibold text-slate-800">{job.checkInDetails?.odometer} KM</span> • Fuel:{' '}
                        <span className="font-semibold text-slate-800">{job.checkInDetails?.fuelLevelPercent}%</span>
                      </div>
                      {job.checkInDetails?.existingDamages?.length > 0 && (
                        <div className="text-rose-600 font-medium text-[11px]">
                          Damages: {job.checkInDetails.existingDamages.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Workflow Actions Based on State */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(`/service-jobs/${job._id}`)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                      title="View Job Card"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Action 1: Digital Inspection */}
                      {(job.status === 'CHECKED_IN' || job.status === 'INSPECTION') && (
                        <button
                          onClick={() => setInspectJob(job)}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
                        >
                          <ClipboardCheck className="w-4 h-4" /> Multi-Point Inspection
                        </button>
                      )}

                      {/* Action 2: Customer Approval in Progress */}
                      {job.status === 'CUSTOMER_APPROVAL' && (
                        <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Awaiting Customer Sign-off
                        </span>
                      )}

                      {/* Action 3: Start Work once APPROVED */}
                      {job.status === 'APPROVED' && (
                        <button
                          onClick={() => handleStartWork(job)}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                        >
                          <Play className="w-4 h-4 fill-white" /> Start Repair Work
                        </button>
                      )}

                      {/* Action 4: Complete Repairs and send to QC */}
                      {job.status === 'IN_SERVICE' && (
                        <button
                          onClick={() => handleCompleteWork(job)}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
                        >
                          <CheckSquare className="w-4 h-4 stroke-[2.5]" /> Complete & Submit for QC
                        </button>
                      )}

                      {job.status === 'QUALITY_CHECK' && (
                        <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">Under Advisor QC</span>
                      )}

                      {job.status === 'READY_FOR_DELIVERY' && (
                        <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">Vehicle Ready at Desk</span>
                      )}

                      {job.status === 'COMPLETED' && (
                        <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">Delivered to Owner</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      <InspectionModal
        isOpen={!!inspectJob}
        job={inspectJob}
        onClose={() => setInspectJob(null)}
        onSuccess={() => fetchJobs(scope)}
      />
    </div>
  );
};

export default MechanicDashboard;
