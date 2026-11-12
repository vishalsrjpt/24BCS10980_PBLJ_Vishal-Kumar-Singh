import React, { useState, useEffect } from 'react';
import { ShieldCheck, Archive, Calendar, MapPin, Tag, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ItemReport, PlatformStatistics, PageResponse, ApiResponse } from '../types';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const RecoveryHistoryPage: React.FC = () => {
  const { user, hasAdminAccess, isAuthenticated } = useAuth();

  const [recoveredItems, setRecoveredItems] = useState<ItemReport[]>([]);
  const [stats, setStats] = useState<PlatformStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRecoveryData = async () => {
      setIsLoading(true);
      try {
        // Fetch recovery stats
        const statsRes = await api.get<ApiResponse<PlatformStatistics>>('/recovery/stats');
        if (statsRes.data.success && statsRes.data.data) {
          setStats(statsRes.data.data);
        }

        // Fetch recovered items: admin sees all, student sees their own
        const endpoint = hasAdminAccess ? '/recovery/all?size=50' : '/recovery/my-history?size=50';
        if (isAuthenticated) {
          const itemsRes = await api.get<ApiResponse<PageResponse<ItemReport>>>(endpoint);
          if (itemsRes.data.success && itemsRes.data.data) {
            setRecoveredItems(itemsRes.data.data.content);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecoveryData();
  }, [hasAdminAccess, isAuthenticated]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Recovery Archives</h1>
        <p className="text-xs text-slate-500 mt-1">
          Verified historical records of lost belongings safely recovered and reunited with students
        </p>
      </div>

      {/* Recovery Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Reports</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalReports || 0}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Campus-wide filings</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">Found Items</p>
          <h3 className="text-2xl font-bold text-teal-700 mt-1">{stats?.totalFoundReports || 0}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Safely handed in</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Successfully Recovered</p>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">{stats?.recoveredItems || 0}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Returned to owners</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Recovery Success Rate</p>
          <h3 className="text-2xl font-bold text-indigo-700 mt-1">
            {stats?.recoveryRate ? `${stats.recoveryRate}%` : '0%'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Reunion efficiency</p>
        </div>
      </div>

      {/* Items Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {hasAdminAccess ? 'All Recovered Belongings' : 'My Recovered Belongings'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {recoveredItems.length} records archived
          </span>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading recovery records..." />
        ) : recoveredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recoveredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recovered items recorded"
            description={
              hasAdminAccess
                ? 'No items have been marked recovered yet.'
                : 'You do not have any recovered items in your account history yet.'
            }
            icon={Archive}
          />
        )}
      </div>
    </div>
  );
};
