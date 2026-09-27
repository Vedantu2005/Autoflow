import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  ClipboardList,
  Boxes,
  Receipt,
  History,
  Activity,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['CUSTOMER', 'SERVICE_ADVISOR', 'MECHANIC', 'ADMIN'],
    },
    {
      label: 'My Vehicles',
      path: '/vehicles',
      icon: Car,
      roles: ['CUSTOMER'],
    },
    {
      label: 'Vehicle Fleet',
      path: '/vehicles',
      icon: Car,
      roles: ['SERVICE_ADVISOR', 'ADMIN'],
    },
    {
      label: 'Book Service',
      path: '/book-service',
      icon: CalendarCheck,
      roles: ['CUSTOMER'],
    },
    {
      label: 'Booking Requests',
      path: '/bookings',
      icon: CalendarCheck,
      roles: ['SERVICE_ADVISOR', 'ADMIN'],
    },
    {
      label: 'Service Job Cards',
      path: '/service-jobs',
      icon: ClipboardList,
      roles: ['SERVICE_ADVISOR', 'ADMIN'],
    },
    {
      label: 'Assigned Work',
      path: '/service-jobs',
      icon: WrenchIcon,
      roles: ['MECHANIC'],
    },
    {
      label: 'Parts Inventory',
      path: '/inventory',
      icon: Boxes,
      roles: ['ADMIN', 'SERVICE_ADVISOR'],
    },
    {
      label: 'Invoices & Billing',
      path: '/invoices',
      icon: Receipt,
      roles: ['CUSTOMER', 'SERVICE_ADVISOR', 'ADMIN'],
    },
    {
      label: 'Service History Vault',
      path: '/service-history',
      icon: History,
      roles: ['CUSTOMER', 'SERVICE_ADVISOR', 'MECHANIC', 'ADMIN'],
    },
    {
      label: 'Workshop Staff',
      path: '/staff',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      label: 'System Audit Trail',
      path: '/audit-logs',
      icon: Activity,
      roles: ['ADMIN'],
    },
  ];

  function WrenchIcon(props) {
    return <CheckCircle2 {...props} />;
  }

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 shrink-0 hidden md:block border-r border-slate-200 bg-white min-h-[calc(100vh-5rem)] p-4 shadow-xs">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation ({role.replace(/_/g, ' ')})
        </div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold border-sky-200/90 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
