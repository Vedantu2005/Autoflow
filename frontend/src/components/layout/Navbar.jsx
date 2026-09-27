import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wrench, User, LogOut, Shield, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Shield className="w-3 h-3 text-amber-600" />,
        };
      case 'SERVICE_ADVISOR':
        return {
          badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: <Briefcase className="w-3 h-3 text-indigo-600" />,
        };
      case 'MECHANIC':
        return {
          badge: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <Wrench className="w-3 h-3 text-purple-600" />,
        };
      case 'CUSTOMER':
      default:
        return {
          badge: 'bg-sky-50 text-sky-800 border-sky-200',
          icon: <User className="w-3 h-3 text-sky-600" />,
        };
    }
  };

  const roleStyle = user ? getRoleStyle(user.role) : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="flex h-20 sm:h-22 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center cursor-pointer group py-1.5"
        >
          <img
            src="/autoflow.png"
            alt="AutoFlow"
            className="h-14 sm:h-16 md:h-18 w-auto max-w-[280px] sm:max-w-[360px] md:max-w-[420px] object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${roleStyle?.badge}`}>
                    {roleStyle?.icon}
                    {user.role.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-xs"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors shadow-md shadow-sky-600/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
