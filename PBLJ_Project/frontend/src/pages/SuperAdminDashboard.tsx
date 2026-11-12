import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ShieldAlert,
  UserPlus,
  Users,
  ShieldCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import api from '../services/api';
import { User as UserType, AdminAuditLog, PageResponse, ApiResponse } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

const createAdminSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Temporary password must be at least 6 characters'),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

export const SuperAdminDashboard: React.FC = () => {
  const [admins, setAdmins] = useState<UserType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Create Admin Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Password Modal
  const [selectedAdminForReset, setSelectedAdminForReset] = useState<UserType | null>(null);
  const [newTempPassword, setNewTempPassword] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset: resetCreateForm,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [adminsRes, auditRes] = await Promise.all([
        api.get<ApiResponse<PageResponse<UserType>>>('/superadmin/admins?size=50'),
        api.get<ApiResponse<PageResponse<AdminAuditLog>>>('/superadmin/audit-logs?size=30'),
      ]);

      if (adminsRes.data.success && adminsRes.data.data) {
        setAdmins(adminsRes.data.data.content);
      }
      if (auditRes.data.success && auditRes.data.data) {
        setAuditLogs(auditRes.data.data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAdmin = async (data: CreateAdminFormData) => {
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const res = await api.post<ApiResponse<UserType>>('/superadmin/admins', data);
      if (res.data.success && res.data.data) {
        setCreateSuccess(`Administrator account created for ${data.fullName}!`);
        resetCreateForm();
        fetchData();
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create admin');
    }
  };

  const handleToggleStatus = async (adminId: number, currentActive: boolean) => {
    try {
      await api.put(`/superadmin/admins/${adminId}/status`, { active: !currentActive });
      setAdmins((prev) =>
        prev.map((a) => (a.id === adminId ? { ...a, active: !currentActive } : a))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminForReset || !newTempPassword.trim()) return;

    try {
      await api.put(`/superadmin/admins/${selectedAdminForReset.id}/reset-password`, {
        password: newTempPassword.trim(),
      });
      setResetSuccess(`Password updated for ${selectedAdminForReset.fullName}`);
      setTimeout(() => {
        setSelectedAdminForReset(null);
        setNewTempPassword('');
        setResetSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading Super Administrator Console..." />;
  }

  return (
    <div className="space-y-8">
      {/* Super Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white">
              👑 Root Authorization
            </span>
            <span className="text-xs text-slate-300">Exclusive Super Administrator Console</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1 tracking-tight">Campus Administrator Governance</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Authorize campus safety officers, manage administrator accounts, reset credentials, and monitor full system audit trails.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 transition shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Admin</span>
        </button>
      </div>

      {/* Admin Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Campus Safety Administrators ({admins.length})
            </h2>
          </div>
          <button
            onClick={fetchData}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {admins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="p-3.5">Admin Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                          {admin.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span>{admin.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">{admin.email}</td>
                    <td className="p-3.5 text-slate-600">{admin.department || 'Campus Security'}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          admin.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                        {admin.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedAdminForReset(admin)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin.id, admin.active)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                            admin.active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {admin.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No campus administrators created yet. Click "Create New Admin" to add one.
          </div>
        )}
      </div>

      {/* System Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            System & Administrative Governance Logs
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{log.adminName}</td>
                  <td className="p-3.5 font-semibold text-indigo-700 whitespace-nowrap">{log.action}</td>
                  <td className="p-3.5 text-slate-600 whitespace-nowrap">
                    {log.targetType} #{log.targetId}
                  </td>
                  <td className="p-3.5 text-slate-600 max-w-sm truncate" title={log.details || ''}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Create Campus Administrator</h3>
                <p className="text-xs text-slate-500 mt-0.5">SUPERADMIN authorization only</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{createSuccess}</span>
              </div>
            )}

            {createError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleCreateAdmin)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  {...register('fullName')}
                  placeholder="Officer Jane Doe"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin.officer@campus.edu"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {errors.password && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  {...register('department')}
                  placeholder="e.g. Campus Safety & Security"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {selectedAdminForReset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Reset Admin Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedAdminForReset.fullName}</p>
              </div>
              <button
                onClick={() => setSelectedAdminForReset(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAdminForReset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
