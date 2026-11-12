import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  FileText,
  CheckCircle2,
  Sparkles,
  Bell,
  Archive,
  User,
  Users,
  ShieldAlert,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isStudent, isAdmin, isSuperAdmin } = useAuth();

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/browse', label: 'Browse Items', icon: Search },
    { to: '/report', label: 'Report Item', icon: PlusCircle },
    { to: '/my-reports', label: 'My Reports', icon: FileText },
    { to: '/my-claims', label: 'My Claims', icon: CheckCircle2 },
    { to: '/matches', label: 'Smart Matches', icon: Sparkles },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/recovery', label: 'Recovery History', icon: Archive },
    { to: '/profile', label: 'Profile Settings', icon: User },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/reports', label: 'All Reports', icon: ClipboardList },
    { to: '/admin/claims', label: 'Claims Verification', icon: CheckCircle2 },
    { to: '/admin/disputes', label: 'Dispute Management', icon: ShieldAlert },
    { to: '/recovery', label: 'Recovery Archive', icon: Archive },
    { to: '/admin/audit', label: 'Admin Audit Log', icon: ShieldCheck },
    { to: '/profile', label: 'Profile Settings', icon: User },
  ];

  const superAdminLinks = [
    { to: '/superadmin', label: 'Super Admin Overview', icon: LayoutDashboard },
    { to: '/superadmin/admins', label: 'Manage Admins', icon: Users },
    { to: '/admin/reports', label: 'All Reports', icon: ClipboardList },
    { to: '/admin/claims', label: 'Claims Verification', icon: CheckCircle2 },
    { to: '/admin/disputes', label: 'Dispute Management', icon: ShieldAlert },
    { to: '/superadmin/audit', label: 'System Audit Logs', icon: ShieldCheck },
    { to: '/profile', label: 'Profile Settings', icon: User },
  ];

  const links = isSuperAdmin
    ? superAdminLinks
    : isAdmin
    ? adminLinks
    : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col justify-between shrink-0">
      <div>
        {/* User Card */}
        <div className="p-3 mb-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</h4>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-700 bg-indigo-100/60 px-1.5 py-0.5 rounded">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/dashboard' || link.to === '/admin' || link.to === '/superadmin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 stroke-[1.8] shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-600">CUFind Platform</p>
        <p>Chandigarh University Lost & Found</p>
      </div>
    </aside>
  );
};
