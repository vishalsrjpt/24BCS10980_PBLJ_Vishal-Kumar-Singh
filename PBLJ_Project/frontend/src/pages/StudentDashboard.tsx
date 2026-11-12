import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileQuestion,
  CheckCircle,
  Clock,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Bell,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { MatchCard } from '../components/MatchCard';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ItemReport, ItemMatch, Notification, ApiResponse, PageResponse } from '../types';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [myReports, setMyReports] = useState<ItemReport[]>([]);
  const [topMatches, setTopMatches] = useState<ItemMatch[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [claimsCount, setClaimsCount] = useState<number>(0);
  const [recoveredCount, setRecoveredCount] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [reportsRes, matchesRes, notifsRes, claimsRes, recoveryRes] = await Promise.all([
          api.get<ApiResponse<PageResponse<ItemReport>>>('/items/my-reports?size=5'),
          api.get<ApiResponse<ItemMatch[]>>('/matches/top'),
          api.get<ApiResponse<Notification[]>>('/notifications/recent'),
          api.get<ApiResponse<PageResponse<any>>>('/claims/my-claims?size=1'),
          api.get<ApiResponse<PageResponse<any>>>('/recovery/my-history?size=1'),
        ]);

        if (reportsRes.data.success && reportsRes.data.data) {
          setMyReports(reportsRes.data.data.content);
        }
        if (matchesRes.data.success && matchesRes.data.data) {
          setTopMatches(matchesRes.data.data);
        }
        if (notifsRes.data.success && notifsRes.data.data) {
          setRecentNotifications(notifsRes.data.data);
        }
        if (claimsRes.data.success && claimsRes.data.data) {
          setClaimsCount(claimsRes.data.data.totalElements);
        }
        if (recoveryRes.data.success && recoveryRes.data.data) {
          setRecoveredCount(recoveryRes.data.data.totalElements);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const lostCount = myReports.filter((r) => r.reportType === 'LOST').length;
  const foundCount = myReports.filter((r) => r.reportType === 'FOUND').length;

  if (isLoading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Hello, {user?.fullName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Track your lost items, review match suggestions, manage your ownership claims, and report newly found belongings around campus.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/report?type=LOST"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </Link>
            <Link
              to="/report?type=FOUND"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Found Item</span>
            </Link>
            <Link
              to="/browse"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
            >
              <Search className="w-4 h-4" />
              <span>Browse All Items</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Lost Reported"
          value={lostCount}
          subtitle="Items you lost"
          icon={FileQuestion}
          color="rose"
        />
        <StatCard
          title="Found Reported"
          value={foundCount}
          subtitle="Items you reported finding"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Active Claims"
          value={claimsCount}
          subtitle="Verification pending"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Items Recovered"
          value={recoveredCount}
          subtitle="Successfully reunited"
          icon={ShieldCheck}
          color="indigo"
        />
      </div>

      {/* Smart Matching Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Smart Match Suggestions</h2>
              <p className="text-xs text-slate-500">
                Automated similarity scores calculated between your reports and opposite postings
              </p>
            </div>
          </div>
          {topMatches.length > 0 && (
            <Link
              to="/matches"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All Matches</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {topMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topMatches.map((match) => (
              <MatchCard key={match.id} match={match} currentUserId={user?.id} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            <Sparkles className="w-6 h-6 mx-auto text-teal-400 mb-2 stroke-[1.5]" />
            <p className="font-semibold text-slate-700 mb-0.5">No high match suggestions right now</p>
            <p className="text-[11px] text-slate-400">
              When a student reports an item matching your lost or found post, you'll be notified automatically!
            </p>
          </div>
        )}
      </div>

      {/* Two Column Grid: My Recent Reports & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: My Reports */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">My Recent Reports</h2>
            <Link
              to="/my-reports"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {myReports.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myReports.slice(0, 4).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No reports created yet"
              description="Have you lost or found something on campus? File your first report now."
              actionText="Create Report"
              onAction={() => window.location.href = '/report'}
            />
          )}
        </div>

        {/* Right Column: Recent Activity & Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>Recent Activity</span>
            </h2>
            <Link
              to="/notifications"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              See All
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((n) => (
                <div key={n.id} className="p-3.5 text-xs hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 truncate">{n.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No recent notifications
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
