import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileQuestion,
  CheckCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Layers,
  Search,
  Filter,
  Check,
  X,
  MessageSquare,
  AlertTriangle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  PlatformStatistics,
  ItemReport,
  Claim,
  AdminAuditLog,
  PageResponse,
  ApiResponse,
} from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'claims' | 'disputes' | 'audit'>('overview');
  const [stats, setStats] = useState<PlatformStatistics | null>(null);
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [disputes, setDisputes] = useState<Claim[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Review Claim Modal
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, reportsRes, claimsRes, disputesRes, auditRes] = await Promise.all([
        api.get<ApiResponse<PlatformStatistics>>('/admin/dashboard'),
        api.get<ApiResponse<PageResponse<ItemReport>>>('/admin/reports?size=25'),
        api.get<ApiResponse<PageResponse<Claim>>>('/admin/claims?size=25'),
        api.get<ApiResponse<PageResponse<Claim>>>('/admin/disputes?size=25'),
        api.get<ApiResponse<PageResponse<AdminAuditLog>>>('/admin/audit-logs?size=25'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (reportsRes.data.success && reportsRes.data.data) setReports(reportsRes.data.data.content);
      if (claimsRes.data.success && claimsRes.data.data) setClaims(claimsRes.data.data.content);
      if (disputesRes.data.success && disputesRes.data.data) setDisputes(disputesRes.data.data.content);
      if (auditRes.data.success && auditRes.data.data) setAuditLogs(auditRes.data.data.content);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleClaimReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;

    setIsSubmittingReview(true);
    try {
      await api.put(`/admin/claims/${selectedClaim.id}/review`, {
        status: reviewStatus,
        adminNotes: adminNotes.trim(),
      });
      setSelectedClaim(null);
      setAdminNotes('');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to review claim');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: number, newStatus: string) => {
    try {
      await api.put(`/admin/reports/${reportId}/status`, { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus as any } : r))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update report status');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading Administrative Console..." />;
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Administrative Control
            </span>
            <span className="text-xs text-slate-400">Campus Safety & Found Property Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Campus Administrative Dashboard</h1>
        </div>

        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Platform Overview & Charts', icon: BarChart3 },
          { id: 'claims', label: `Claims Verification (${claims.length})`, icon: CheckCircle },
          { id: 'disputes', label: `Dispute Resolution (${disputes.length})`, icon: ShieldAlert },
          { id: 'reports', label: `Reports Management (${reports.length})`, icon: Layers },
          { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Students Enrolled"
              value={stats.totalStudents}
              subtitle="Registered accounts"
              icon={Users}
              color="indigo"
            />
            <StatCard
              title="Lost Belongings"
              value={stats.totalLostReports}
              subtitle="Reported by students"
              icon={FileQuestion}
              color="rose"
            />
            <StatCard
              title="Found Belongings"
              value={stats.totalFoundReports}
              subtitle="Safely registered"
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              title="Pending Claims"
              value={stats.pendingClaims}
              subtitle="Awaiting admin action"
              icon={Clock}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Items Recovered"
              value={stats.recoveredItems}
              subtitle="Reunited with owners"
              icon={ShieldCheck}
              color="emerald"
            />
            <StatCard
              title="Active Disputes"
              value={stats.disputedClaims}
              subtitle="Multiple claimants"
              icon={ShieldAlert}
              color="rose"
            />
            <StatCard
              title="Recovery Rate"
              value={`${stats.recoveryRate}%`}
              subtitle="Reunion success rate"
              icon={BarChart3}
              color="blue"
            />
          </div>

          {/* Graphical Analytics Distribution Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Visual Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Category Distribution</span>
                <span className="text-[10px] text-slate-400 font-medium">All item reports</span>
              </h3>

              <div className="space-y-3 pt-2">
                {Object.entries(stats.categoryDistribution || {}).map(([cat, count]) => {
                  const percent = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>{cat}</span>
                        <span>{count} items ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lost vs Found Ratio & Recovery Highlights */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900">Platform Activity Breakdown</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Lost ({stats.totalLostReports}) vs Found ({stats.totalFoundReports})</span>
                    <span>
                      {stats.totalReports > 0
                        ? `${Math.round((stats.totalFoundReports / stats.totalReports) * 100)}% Found`
                        : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-rose-200 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-teal-500 transition-all duration-500"
                      style={{
                        width: `${stats.totalReports > 0 ? (stats.totalFoundReports / stats.totalReports) * 100 : 50}%`,
                      }}
                      title="Found Items"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                    <span className="text-teal-600 font-bold">● Found items</span>
                    <span className="text-rose-600 font-bold">● Lost items</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800">Operational Integrity Notes:</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    • Every approved claim automatically marks the item as <strong>RECOVERED</strong> in a database transaction, rejects rival pending claims, and moves the item into historical recovery records.
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    • When two or more students submit claims for the same item, the system flags the report as <strong>DISPUTED</strong> for administrative intervention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLAIMS VERIFICATION */}
      {activeTab === 'claims' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Claims Pending Administrative Verification
            </h2>
            <span className="text-xs text-slate-500 font-medium">{claims.length} claims submitted</span>
          </div>

          {claims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="p-3.5">Item</th>
                    <th className="p-3.5">Claimant</th>
                    <th className="p-3.5">Explanation</th>
                    <th className="p-3.5">Proof Details</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">
                        <Link to={`/items/${claim.itemReportId}`} className="hover:text-indigo-600 line-clamp-1">
                          {claim.itemTitle}
                        </Link>
                        <span className="text-[10px] text-slate-400 block font-normal">{claim.itemCategory}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{claim.claimantName}</p>
                        <p className="text-[11px] text-slate-500">{claim.claimantEmail}</p>
                        {claim.claimantPhone && (
                          <p className="text-[10px] text-slate-400">{claim.claimantPhone}</p>
                        )}
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <p className="line-clamp-2 text-slate-600">{claim.explanation}</p>
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <p className="line-clamp-2 text-slate-600">{claim.identifyingDetails}</p>
                        {claim.images && claim.images.length > 0 && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            📷 {claim.images.length} proof photos attached
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <StatusBadge status={claim.status} size="sm" />
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setReviewStatus(claim.status === 'PENDING' ? 'APPROVED' : claim.status);
                            setAdminNotes(claim.adminNotes || '');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                        >
                          Review Claim
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No claims found" description="There are no ownership claims awaiting review." />
          )}
        </div>
      )}

      {/* TAB 3: DISPUTE RESOLUTION */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-bold text-rose-900">Disputed Items Resolution Center</h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                The reports below have multiple claimants contesting ownership. Compare claimant proofs and authorize the single rightful owner. Approving one claim automatically sets the item as RECOVERED and resolves the dispute.
              </p>
            </div>
          </div>

          {disputes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {disputes.map((claim) => (
                <div key={claim.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        Disputed Claim #{claim.id}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{claim.itemTitle}</h3>
                      <p className="text-xs text-slate-500">{claim.itemLocation}</p>
                    </div>
                    <StatusBadge status={claim.status} size="sm" />
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 text-xs space-y-1">
                    <p className="font-semibold text-slate-800">Claimant: {claim.claimantName} ({claim.claimantEmail})</p>
                    <p className="text-slate-600 line-clamp-2"><strong>Reason:</strong> {claim.explanation}</p>
                    <p className="text-slate-600 line-clamp-2"><strong>Proof:</strong> {claim.identifyingDetails}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">Total rival claims on item: {claim.totalClaimsOnItem}</span>
                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setReviewStatus('APPROVED');
                        setAdminNotes('');
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                      Resolve Dispute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No active disputes" description="All claims have been verified or currently have single claimants." />
          )}
        </div>
      )}

      {/* TAB 4: ALL REPORTS MANAGEMENT */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">All Campus Reports</h2>
            <span className="text-xs text-slate-500 font-medium">{reports.length} total reports</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="p-3.5">Item</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Reporter</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Change Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">
                      <Link to={`/items/${report.id}`} className="hover:text-indigo-600 line-clamp-1">
                        {report.title}
                      </Link>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          report.reportType === 'FOUND' ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {report.reportType}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">{report.category}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{report.reporterName}</td>
                    <td className="p-3.5 text-slate-600 max-w-[150px] truncate">{report.location}</td>
                    <td className="p-3.5">
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <select
                        value={report.status}
                        onChange={(e) => handleUpdateReportStatus(report.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-slate-300 rounded bg-white outline-none font-medium"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="CLAIM_PENDING">CLAIM PENDING</option>
                        <option value="DISPUTED">DISPUTED</option>
                        <option value="RECOVERED">RECOVERED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="EXPIRED">EXPIRED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Administrator Actions Audit Trail</h2>
            <span className="text-xs text-slate-500 font-medium">{auditLogs.length} entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Administrator</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {log.adminName}
                      <span className="block text-[10px] text-slate-400 font-normal">{log.adminEmail}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-indigo-700 whitespace-nowrap">{log.action}</td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">
                      {log.targetType} #{log.targetId}
                    </td>
                    <td className="p-3.5 max-w-sm truncate text-slate-600" title={log.details || ''}>
                      {log.details}
                    </td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Claim Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Review Claim on: {selectedClaim.itemTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Claimant: {selectedClaim.claimantName} ({selectedClaim.claimantEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-700 block">Claimant's Explanation:</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{selectedClaim.explanation}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Claimant's Identifying Details / Proof:</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{selectedClaim.identifyingDetails}</p>
              </div>
              {selectedClaim.purchaseDetails && (
                <div>
                  <span className="font-bold text-slate-700 block">Purchase Background:</span>
                  <p className="text-slate-600 mt-0.5">{selectedClaim.purchaseDetails}</p>
                </div>
              )}
              {selectedClaim.images && selectedClaim.images.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Attached Proof Photos:</span>
                  <div className="flex gap-2">
                    {selectedClaim.images.map((img) => (
                      <a
                        key={img.id}
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition"
                      >
                        <img src={img.url} alt="proof" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleClaimReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="APPROVED">APPROVE (Verified & Recover Item)</option>
                  <option value="REJECTED">REJECT (Proof Insufficient)</option>
                  <option value="ADDITIONAL_INFO_REQUIRED">REQUEST ADDITIONAL INFO</option>
                  <option value="DISPUTED">MARK AS DISPUTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Feedback Note (Sent to Claimant)
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Proof verified against serial record. Please retrieve item with ID at security desk."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
