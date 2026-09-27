import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { WorkflowStepper } from '../components/common/WorkflowStepper';
import { ApprovalModal } from '../components/modals/ApprovalModal';
import { PaymentModal } from '../components/modals/PaymentModal';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Car,
  User,
  Wrench,
  Gauge,
  Fuel,
  ClipboardCheck,
  Calculator,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  CreditCard,
} from 'lucide-react';

export const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/service-jobs/${id}`);
      setJob(res.data);

      // Fetch related inspection, estimate, invoice in parallel
      const [inspRes, estRes, invRes] = await Promise.allSettled([
        API.get(`/inspections/job/${id}`),
        API.get(`/estimates/job/${id}`),
        API.get('/invoices'),
      ]);

      if (inspRes.status === 'fulfilled') setInspection(inspRes.value.data);
      if (estRes.status === 'fulfilled') setEstimate(estRes.value.data);
      if (invRes.status === 'fulfilled') {
        const matchingInv = invRes.value.data.find((i) => i.serviceJobId?._id === id || i.serviceJobId === id);
        if (matchingInv) setInvoice(matchingInv);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-sm">Loading job card dossier...</div>;
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Service Job not found.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-3 text-xs text-sky-600 hover:underline font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <StatusBadge status={job.status} size="lg" />
      </div>

      {/* Main Job Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                {job.jobNumber}
              </span>
              <span className="text-xs text-slate-500 font-medium">Created: {new Date(job.createdAt).toLocaleString()}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
              {job.vehicleId?.make} {job.vehicleId?.model} —{' '}
              <span className="font-mono text-slate-600 font-bold">{job.vehicleId?.registrationNumber}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Service: <span className="text-slate-800 font-semibold">{job.serviceType}</span>
            </p>
          </div>

          {/* Action triggers depending on role and status */}
          <div className="flex items-center gap-2">
            {job.status === 'CUSTOMER_APPROVAL' && (user?.role === 'CUSTOMER' || user?.role === 'ADMIN') && (
              <button
                onClick={() => setIsApprovalOpen(true)}
                className="px-4 py-2 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-md shadow-pink-600/20 transition-all"
              >
                Review & Authorize Estimate
              </button>
            )}

            {invoice && (invoice.paymentStatus === 'PENDING' || invoice.paymentStatus === 'PARTIAL') && (
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-600/20 transition-all"
              >
                Pay Outstanding (₹{invoice.dueAmount?.toLocaleString('en-IN')})
              </button>
            )}
          </div>
        </div>

        {/* Workflow Stepper */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
            Service Workflow Lifecycle State
          </span>
          <WorkflowStepper currentStatus={job.status} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check-In Details Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-600" /> Check-In Details
          </h3>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Odometer Reading:</span>
              <span className="font-semibold text-slate-900">{job.checkInDetails?.odometer} KM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Fuel Level:</span>
              <span className="font-semibold text-slate-900">{job.checkInDetails?.fuelLevelPercent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Service Advisor:</span>
              <span className="font-semibold text-indigo-700">{job.advisorId?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Assigned Mechanic:</span>
              <span className="font-semibold text-purple-700">{job.mechanicId?.name || 'Unassigned'}</span>
            </div>
            {job.checkInDetails?.existingDamages?.length > 0 && (
              <div className="pt-2 border-t border-slate-100 text-rose-600 font-medium">
                <span>Existing Damages:</span>
                <p className="mt-0.5">{job.checkInDetails.existingDamages.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Inspection Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-purple-600" /> Digital Inspection & Diagnosis
          </h3>
          {!inspection ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Inspection has not been completed by the technician yet.
            </p>
          ) : (
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[11px] font-medium">Overall Diagnosis:</span>
                <p className="font-semibold text-slate-800 mt-1">{inspection.overallDiagnosis}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-slate-500 text-[11px] block font-medium">Key Observations:</span>
                {inspection.checklist?.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded-lg bg-slate-50">
                    <span className="text-slate-700 font-medium">{item.item}</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      item.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.condition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Estimate Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-orange-600" /> Repair Estimate #{estimate?.estimateNumber || ''}
            </h3>
            {estimate && (
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                estimate.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-orange-50 text-orange-800 border-orange-200'
              }`}>
                {estimate.status}
              </span>
            )}
          </div>
          {!estimate ? (
            <p className="text-xs text-slate-500 py-4 text-center">No estimate created for this job yet.</p>
          ) : (
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Parts Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{estimate.partsSubtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Labour Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{estimate.labourSubtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Tax (18%):</span>
                <span className="font-semibold text-slate-900">₹{estimate.taxAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-orange-700">
                <span>Grand Total:</span>
                <span>₹{estimate.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" /> Final Invoice #{invoice?.invoiceNumber || ''}
            </h3>
            {invoice && (
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                invoice.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {invoice.paymentStatus}
              </span>
            )}
          </div>
          {!invoice ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Invoice will be generated once service passes Quality Check.
            </p>
          ) : (
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Billed Total:</span>
                <span className="font-semibold text-slate-900">₹{invoice.grandTotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Amount Paid:</span>
                <span className="font-semibold text-emerald-700">₹{invoice.paidAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-teal-700 pt-2 border-t border-slate-100">
                <span>Outstanding Balance:</span>
                <span>₹{invoice.dueAmount?.toLocaleString('en-IN')}</span>
              </div>
              {invoice.paymentStatus !== 'PAID' && (
                <button
                  onClick={() => setIsPaymentOpen(true)}
                  className="w-full mt-3 py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Settle Payment (₹{invoice.dueAmount?.toLocaleString('en-IN')})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Immutable Status History Audit Trail */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-sky-600" /> Immutable Lifecycle Audit History
        </h3>
        <div className="space-y-3 pt-2">
          {job.statusHistory?.map((entry, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{entry.status}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700 mt-0.5">{entry.notes}</p>
                {entry.updatedByName && (
                  <span className="text-[10px] text-slate-500">By: {entry.updatedByName}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ApprovalModal
        isOpen={isApprovalOpen}
        job={job}
        onClose={() => setIsApprovalOpen(false)}
        onSuccess={fetchJobData}
      />
      <PaymentModal
        isOpen={isPaymentOpen}
        invoice={invoice}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={fetchJobData}
      />
    </div>
  );
};

export default JobDetails;
