import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { CheckInModal } from '../components/modals/CheckInModal';
import { EstimateModal } from '../components/modals/EstimateModal';
import { PaymentModal } from '../components/modals/PaymentModal';
import { useNotification } from '../context/NotificationContext';
import {
  CalendarCheck,
  ClipboardList,
  CheckCircle2,
  Clock,
  Car,
  Search,
  Send,
  Receipt,
  Truck,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdvisorDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [serviceJobs, setServiceJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [checkInBooking, setCheckInBooking] = useState(null);
  const [estimateJob, setEstimateJob] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);

  const { showToast } = useNotification();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, jRes] = await Promise.all([
        API.get('/bookings'),
        API.get('/service-jobs'),
      ]);
      setBookings(bRes.data);
      setServiceJobs(jRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pass QC & Auto-Generate Final Invoice
  const handlePassQC = async (job) => {
    try {
      const res = await API.put(`/service-jobs/${job._id}/status`, {
        status: 'READY_FOR_DELIVERY',
        notes: 'Quality inspection passed by Service Advisor. Final invoice generated.',
      });
      showToast(`QC Passed & Final Invoice generated for Job #${job.jobNumber}!`, 'success');
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update job', 'error');
    }
  };

  // Complete handover & delivery
  const handleDeliverVehicle = async (job) => {
    try {
      await API.put(`/service-jobs/${job._id}/status`, {
        status: 'COMPLETED',
        notes: 'Customer cleared payment and received keys. Vehicle delivered.',
      });
      showToast(`Vehicle delivered! Job #${job.jobNumber} archived to Service History.`, 'success');
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Delivery blocked', 'error');
    }
  };

  // Filter bookings awaiting check-in
  const pendingBookings = bookings.filter((b) => b.status === 'BOOKED');

  // Filter service jobs
  const filteredJobs = serviceJobs.filter((j) => {
    const matchesSearch =
      j.jobNumber?.toLowerCase().includes(search.toLowerCase()) ||
      j.vehicleId?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      j.customerId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? j.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-sm">Loading advisor command desk...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Service Advisor Command Desk</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Operations Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conduct vehicle check-ins, oversee mechanics, issue repair estimates, and manage delivery desk.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Pending Check-Ins</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingBookings.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">In Workshop Active</span>
            <p className="text-2xl font-black text-sky-600 mt-1">
              {serviceJobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Awaiting Estimates/Sign-off</span>
            <p className="text-2xl font-black text-orange-600 mt-1">
              {serviceJobs.filter((j) => j.status === 'ESTIMATE_PENDING' || j.status === 'CUSTOMER_APPROVAL').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Ready for Delivery Desk</span>
            <p className="text-2xl font-black text-teal-600 mt-1">
              {serviceJobs.filter((j) => j.status === 'READY_FOR_DELIVERY').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Section 1: Incoming Arrival / Booking Queue */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-indigo-600" />
          Vehicle Arrival & Booking Queue ({pendingBookings.length})
        </h3>

        {pendingBookings.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-sm">
            No incoming bookings waiting for check-in right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingBookings.map((b) => (
              <div
                key={b._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      {b.bookingNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{b.preferredTimeSlot}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">
                    {b.vehicleId?.make} {b.vehicleId?.model}
                  </h4>
                  <p className="font-mono text-xs font-semibold text-sky-700">{b.vehicleId?.registrationNumber}</p>
                  <p className="text-xs text-slate-700 mt-1.5 font-medium">Customer: {b.customerId?.name} ({b.customerId?.phone})</p>
                  <p className="text-xs text-slate-500 mt-0.5 italic">"{b.customerComments || 'Standard Booking'}"</p>
                </div>

                <button
                  onClick={() => setCheckInBooking(b)}
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Car className="w-4 h-4" /> Check-In Vehicle & Create Job Card
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Active Service Job Cards Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-sky-600" />
            Active Service Job Cards ({filteredJobs.length})
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job #, vehicle, customer..."
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
            >
              <option value="">All Statuses</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="INSPECTION">Inspection</option>
              <option value="ESTIMATE_PENDING">Estimate Pending</option>
              <option value="CUSTOMER_APPROVAL">Customer Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_SERVICE">In Service</option>
              <option value="QUALITY_CHECK">Quality Check</option>
              <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Job Card #</th>
                  <th className="py-3.5 px-4 font-semibold">Vehicle</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned Mechanic</th>
                  <th className="py-3.5 px-4 font-semibold">Current State</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No service jobs match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                        {job.jobNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {job.vehicleId?.make} {job.vehicleId?.model}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 font-medium">
                          {job.vehicleId?.registrationNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{job.customerId?.name}</div>
                        <div className="text-[11px] text-slate-500">{job.customerId?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-purple-700">
                          {job.mechanicId?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Workflow button: If ESTIMATE_PENDING, advisor builds estimate */}
                          {job.status === 'ESTIMATE_PENDING' && (
                            <button
                              onClick={() => setEstimateJob(job)}
                              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-[11px] shadow-xs transition-all"
                            >
                              + Build Estimate
                            </button>
                          )}

                          {/* Workflow button: If QUALITY_CHECK, advisor passes QC & generates invoice */}
                          {job.status === 'QUALITY_CHECK' && (
                            <button
                              onClick={() => handlePassQC(job)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-xs transition-all"
                            >
                              Pass QC & Issue Invoice
                            </button>
                          )}

                          {/* Workflow button: If READY_FOR_DELIVERY, advisor marks completed */}
                          {job.status === 'READY_FOR_DELIVERY' && (
                            <button
                              onClick={() => handleDeliverVehicle(job)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" /> Deliver Vehicle
                            </button>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => navigate(`/service-jobs/${job._id}`)}
                            title="View Full Job Card"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CheckInModal
        isOpen={!!checkInBooking}
        booking={checkInBooking}
        onClose={() => setCheckInBooking(null)}
        onSuccess={fetchData}
      />
      <EstimateModal
        isOpen={!!estimateJob}
        job={estimateJob}
        onClose={() => setEstimateJob(null)}
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

export default AdvisorDashboard;
