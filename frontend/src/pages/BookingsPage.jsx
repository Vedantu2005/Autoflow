import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookingModal } from '../components/modals/BookingModal';
import { CheckInModal } from '../components/modals/CheckInModal';
import { CalendarCheck, Plus, Search, Car, Clock } from 'lucide-react';

export const BookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [checkInBooking, setCheckInBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Service Appointment Bookings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              Scheduling Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Incoming appointments, slot capacity, and reception check-ins.
          </p>
        </div>
        <button
          onClick={() => setIsBookingModalOpen(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Book Appointment
        </button>
      </div>

      {/* Bookings Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold">Booking Ref</th>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Service Package</th>
                <th className="py-3 px-4 font-semibold">Slot Schedule</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{b.bookingNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {b.vehicleId?.make} {b.vehicleId?.model}
                    <span className="block text-[11px] font-mono text-slate-500">
                      {b.vehicleId?.registrationNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {b.customerId?.name}
                    <span className="block text-[11px] text-slate-500">{b.customerId?.phone}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{b.serviceType}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">
                      {new Date(b.preferredDate).toLocaleDateString()}
                    </span>
                    <span className="block text-[11px] text-slate-500">{b.preferredTimeSlot}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        b.status === 'BOOKED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : b.status === 'CHECKED_IN'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {b.status === 'BOOKED' && (user?.role === 'SERVICE_ADVISOR' || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => setCheckInBooking(b)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                      >
                        Check-In
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={fetchBookings}
      />
      <CheckInModal
        isOpen={!!checkInBooking}
        booking={checkInBooking}
        onClose={() => setCheckInBooking(null)}
        onSuccess={fetchBookings}
      />
    </div>
  );
};

export default BookingsPage;
