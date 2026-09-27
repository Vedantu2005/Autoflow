import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { WorkflowStepper } from '../components/common/WorkflowStepper';
import { BookingModal } from '../components/modals/BookingModal';
import { VehicleModal } from '../components/modals/VehicleModal';
import { ApprovalModal } from '../components/modals/ApprovalModal';
import { PaymentModal } from '../components/modals/PaymentModal';
import {
  Car,
  CalendarCheck,
  CreditCard,
  History,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Wrench,
  ChevronRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [approvalJob, setApprovalJob] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);

  const handleDeleteVehicle = async (vehicle) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove vehicle ${vehicle.registrationNumber} (${vehicle.make} ${vehicle.model}) from your fleet?`
    );
    if (!confirmed) return;

    try {
      await API.delete(`/vehicles/${vehicle._id}`);
      showToast(`Vehicle ${vehicle.registrationNumber} removed successfully!`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete vehicle', 'error');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, jRes, iRes] = await Promise.all([
        API.get('/vehicles'),
        API.get('/service-jobs'),
        API.get('/invoices'),
      ]);
      setVehicles(vRes.data);
      setActiveJobs(jRes.data);
      setInvoices(iRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentActiveJob = activeJobs.find((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED');
  const pendingApprovalJob = activeJobs.find((j) => j.status === 'CUSTOMER_APPROVAL');
  const unpaidInvoice = invoices.find((inv) => inv.paymentStatus === 'PENDING' || inv.paymentStatus === 'PARTIAL');

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-sm">Loading customer portal...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Welcome, {user?.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              Customer Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track live workshop progress, review repair estimates, and manage your vehicle maintenance.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingVehicle(null);
              setIsVehicleOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Car className="w-3.5 h-3.5 text-sky-600" /> + Add Vehicle
          </button>
          <button
            onClick={() => setIsBookingOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all"
          >
            <CalendarCheck className="w-3.5 h-3.5 stroke-[2.5]" /> Book Service
          </button>
        </div>
      </div>

      {/* Action Banner: Pending Estimate Approval */}
      {pendingApprovalJob && (
        <div className="p-4 sm:p-5 rounded-2xl bg-pink-50 border border-pink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-100 text-pink-700 shrink-0 border border-pink-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pink-950">Repair Estimate Requires Your Authorization</h3>
              <p className="text-xs text-pink-800 mt-0.5">
                Technician completed inspection for{' '}
                <span className="font-semibold text-pink-900">
                  {pendingApprovalJob.vehicleId?.make} {pendingApprovalJob.vehicleId?.model} ({pendingApprovalJob.vehicleId?.registrationNumber})
                </span>
                . Please review and approve to begin repairs.
              </p>
            </div>
          </div>
          <button
            onClick={() => setApprovalJob(pendingApprovalJob)}
            className="px-5 py-2.5 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-md shadow-pink-600/25 shrink-0 transition-all"
          >
            Review & Authorize Estimate
          </button>
        </div>
      )}

      {/* Action Banner: Unpaid Invoice */}
      {unpaidInvoice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700 shrink-0 border border-teal-200">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-teal-950">Invoice Ready for Settlement</h3>
              <p className="text-xs text-teal-800 mt-0.5">
                Invoice #{unpaidInvoice.invoiceNumber} has an outstanding balance of{' '}
                <span className="font-bold text-teal-900">₹{unpaidInvoice.dueAmount?.toLocaleString('en-IN')}</span>. Settle to complete vehicle handover.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPaymentInvoice(unpaidInvoice)}
            className="px-5 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-600/20 shrink-0 transition-all"
          >
            Pay Now (Simulated Gateway)
          </button>
        </div>
      )}

      {/* Active Service Job Card with Stepper */}
      {currentActiveJob ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{currentActiveJob.jobNumber}</span>
                <StatusBadge status={currentActiveJob.status} size="lg" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {currentActiveJob.vehicleId?.make} {currentActiveJob.vehicleId?.model} —{' '}
                <span className="font-mono text-slate-600">{currentActiveJob.vehicleId?.registrationNumber}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Service Type: <span className="text-slate-800 font-semibold">{currentActiveJob.serviceType}</span> • Advisor:{' '}
                <span className="text-slate-800 font-semibold">{currentActiveJob.advisorId?.name}</span>
              </p>
            </div>

            <button
              onClick={() => navigate(`/service-jobs/${currentActiveJob._id}`)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View Full Job Audit Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">Live Progress Status</span>
            <WorkflowStepper currentStatus={currentActiveJob.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block font-medium">Assigned Mechanic</span>
              <span className="font-semibold text-slate-800 text-sm">
                {currentActiveJob.mechanicId?.name || 'Pending Allocation'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block font-medium">Check-in Odometer</span>
              <span className="font-semibold text-slate-800 text-sm">
                {currentActiveJob.checkInDetails?.odometer?.toLocaleString('en-IN') || 0} KM
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block font-medium">Check-in Time</span>
              <span className="font-semibold text-slate-800 text-sm">
                {new Date(currentActiveJob.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2 shadow-sm">
          <Car className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No Active Service In Progress</h3>
          <p className="text-xs text-slate-500">All your vehicles are running smoothly. Book an appointment when ready!</p>
        </div>
      )}

      {/* Registered Vehicles Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            My Registered Vehicles ({vehicles.length})
          </h3>
          <button
            onClick={() => {
              setEditingVehicle(null);
              setIsVehicleOpen(true);
            }}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
          >
            + Register Another Vehicle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v._id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {v.make} {v.model}
                    </h4>
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {v.registrationNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {v.fuelType}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVehicle(v);
                        setIsVehicleOpen(true);
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
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>Year: <span className="text-slate-800 font-semibold">{v.year}</span></div>
                  <div>Mileage: <span className="text-slate-800 font-semibold">{v.mileage?.toLocaleString('en-IN')} KM</span></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="flex-1 py-2 px-3 text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl transition-all shadow-xs"
                >
                  Book Service
                </button>
                <button
                  onClick={() => navigate(`/service-history?vehicleId=${v._id}`)}
                  className="py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  History
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={fetchData}
      />
      <VehicleModal
        isOpen={isVehicleOpen}
        vehicle={editingVehicle}
        onClose={() => {
          setIsVehicleOpen(false);
          setEditingVehicle(null);
        }}
        onSuccess={fetchData}
      />
      <ApprovalModal
        isOpen={!!approvalJob}
        job={approvalJob}
        onClose={() => setApprovalJob(null)}
        onSuccess={fetchData}
      />
      <PaymentModal
        isOpen={!!paymentInvoice}
        invoice={paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default CustomerDashboard;
