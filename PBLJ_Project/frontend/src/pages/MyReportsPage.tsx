import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Trash2, Eye, ShieldCheck, Tag } from 'lucide-react';
import api from '../services/api';
import { ItemReport, PageResponse, ApiResponse } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const fetchMyReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<ItemReport>>>('/items/my-reports?size=50');
      if (res.data.success && res.data.data) {
        setReports(res.data.data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const handleDelete = async () => {
    if (!selectedReportId) return;
    try {
      await api.delete(`/items/${selectedReportId}`);
      setReports((prev) => prev.filter((r) => r.id !== selectedReportId));
      setShowDeleteModal(false);
      setSelectedReportId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterType === 'LOST') return r.reportType === 'LOST';
    if (filterType === 'FOUND') return r.reportType === 'FOUND';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Reports</h1>
          <p className="text-xs text-slate-500 mt-1">Manage lost items you posted and found items you registered</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/report?type=LOST"
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Lost</span>
          </Link>
          <Link
            to="/report?type=FOUND"
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Found</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterType === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Reports ({reports.length})
        </button>
        <button
          onClick={() => setFilterType('LOST')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterType === 'LOST' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lost Items ({reports.filter((r) => r.reportType === 'LOST').length})
        </button>
        <button
          onClick={() => setFilterType('FOUND')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filterType === 'FOUND' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Found Items ({reports.filter((r) => r.reportType === 'FOUND').length})
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading your reports..." />
      ) : filteredReports.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-4">Item</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {report.images && report.images.length > 0 ? (
                            <img src={report.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Tag className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/items/${report.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 line-clamp-1 text-xs"
                          >
                            {report.title}
                          </Link>
                          {report.claimsCount > 0 && (
                            <span className="text-[10px] text-amber-600 font-semibold block">
                              {report.claimsCount} claim(s) submitted
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          report.reportType === 'FOUND'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {report.reportType}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{report.category}</td>
                    <td className="p-4 text-slate-600 max-w-[150px] truncate">{report.location}</td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(report.eventDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/items/${report.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {report.status !== 'RECOVERED' && (
                          <button
                            onClick={() => {
                              setSelectedReportId(report.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No reports found"
          description="You haven't submitted any reports in this category yet."
          actionText="Create Report"
          onAction={() => window.location.href = '/report'}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Item Report?"
        message="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Yes, Delete"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedReportId(null);
        }}
      />
    </div>
  );
};
