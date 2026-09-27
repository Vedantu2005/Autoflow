import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Wrench,
  Search,
  Filter,
  Mail,
  Phone,
  Briefcase,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const SPECIALIZATIONS = [
  'General Technician',
  'Engine & Transmission Overhaul',
  'Electrical, ECU & Diagnostics',
  'Brakes & Suspension Specialist',
  'Air Conditioning & Climate Systems',
  'Body Shop & Painting',
  'Periodic Maintenance & Quick Service',
];

export const StaffManagementPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'MECHANIC',
    specialization: 'General Technician',
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load workshop staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      phone: '',
      role: 'MECHANIC',
      specialization: 'General Technician',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff) => {
    setIsEditing(true);
    setEditingId(staff._id);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
      phone: staff.phone || '',
      role: staff.role || 'MECHANIC',
      specialization: staff.specialization || 'General Technician',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await API.put(`/auth/staff/${editingId}`, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          specialization: formData.role === 'MECHANIC' ? formData.specialization : '',
        });
        showToast(`Staff member "${formData.name}" updated successfully!`, 'success');
      } else {
        await API.post('/auth/staff', formData);
        showToast(
          `Onboarded ${formData.name} as ${formData.role.replace(/_/g, ' ')}! Temporary password: ${formData.password || 'password123'}`,
          'success'
        );
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed. Please check inputs.';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (staff) => {
    if (staff._id === user?._id) {
      showToast('You cannot delete your own admin account.', 'error');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to deactivate and remove ${staff.name} (${staff.role}) from the workshop?`
      )
    ) {
      return;
    }

    try {
      await API.delete(`/auth/staff/${staff._id}`);
      showToast(`Removed ${staff.name} from active staff roster.`, 'success');
      fetchStaff();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove staff member', 'error');
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.specialization?.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const totalStaff = staffList.length;
  const totalAdvisors = staffList.filter((s) => s.role === 'SERVICE_ADVISOR').length;
  const totalMechanics = staffList.filter((s) => s.role === 'MECHANIC').length;
  const totalAdmins = staffList.filter((s) => s.role === 'ADMIN').length;

  return (
    <>
      <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Workshop Staff & Technician Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              RBAC Dynamic Routing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Service Advisors and Floor Mechanics, assign technical specializations, and configure workbench access.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
          style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
        >
          <UserPlus className="w-4 h-4 text-white" />
          <span className="text-white font-bold tracking-wide">+ Onboard New Staff</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Workshop Staff</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalStaff}</div>
          <p className="text-[11px] text-slate-500 mt-1">Registered active personnel</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Advisors</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">{totalAdvisors}</div>
          <p className="text-[11px] text-slate-500 mt-1">Intake, diagnosis & customer front</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Floor Mechanics</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{totalMechanics}</div>
          <p className="text-[11px] text-slate-500 mt-1">Available for job card dispatch</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Administrators</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">{totalAdmins}</div>
          <p className="text-[11px] text-slate-500 mt-1">Full audit & platform control</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, skill..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Role:
          </span>
          {['ALL', 'SERVICE_ADVISOR', 'MECHANIC', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                roleFilter === role
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'ALL' ? 'All Staff' : role.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Roster Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading workshop personnel roster...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No staff members found</p>
          <p className="text-xs text-slate-400 mt-1">Try changing your search query or onboard a new team member.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            const isAdvisor = staff.role === 'SERVICE_ADVISOR';
            const isMechanic = staff.role === 'MECHANIC';
            const isAdmin = staff.role === 'ADMIN';

            const badgeColor = isAdvisor
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : isMechanic
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-purple-50 text-purple-700 border-purple-200';

            const avatarBg = isAdvisor
              ? 'bg-blue-600'
              : isMechanic
              ? 'bg-emerald-600'
              : 'bg-purple-600';

            const initials = staff.name
              ? staff.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'ST';

            return (
              <div
                key={staff._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top line with Avatar and Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl text-white font-black flex items-center justify-center text-sm shadow-xs ${avatarBg}`}
                      >
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{staff.name}</h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${badgeColor}`}
                        >
                          {staff.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(staff)}
                        title="Edit Staff"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {staff._id !== user?._id && (
                        <button
                          onClick={() => handleDelete(staff)}
                          title="Remove Staff"
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Technical Specialization for Mechanics */}
                  {isMechanic && (
                    <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Specialization:</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5 pl-5">
                        {staff.specialization || 'General Technician'}
                      </p>
                    </div>
                  )}

                  {/* Details List */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                    {staff.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Joined: {new Date(staff.createdAt || Date.now()).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Onboard / Edit Staff Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-11 sm:pt-14 px-4 pb-8 !m-0 overflow-y-auto"
          style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isEditing ? 'Update Staff Member' : 'Onboard New Workshop Personnel'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEditing
                    ? 'Modify details or assign a new technical specialization'
                    : 'Create login credentials and role assignment'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kadam"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {!isEditing && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Email Address (Login ID) *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. ramesh@autoflow.com"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Initial Password *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="e.g. password123"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Staff can log in immediately using this password.</p>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Staff Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold text-slate-800"
                    >
                      <option value="MECHANIC">Mechanic / Technician</option>
                      <option value="SERVICE_ADVISOR">Service Advisor</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>

                {formData.role === 'MECHANIC' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Technical Specialization
                    </label>
                    <select
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold text-slate-800"
                    >
                      {SPECIALIZATIONS.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Used by Service Advisors to assign optimal jobs to this mechanic.
                    </p>
                  </div>
                )}
              </div>

              {/* Pinned Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02] cursor-pointer"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
                >
                  {isEditing ? 'Save Changes' : 'Confirm & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffManagementPage;
