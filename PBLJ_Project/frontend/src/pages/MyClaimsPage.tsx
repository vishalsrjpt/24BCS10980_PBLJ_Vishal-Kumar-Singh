import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, ShieldAlert, Clock, AlertCircle, MapPin, Tag } from 'lucide-react';
import api from '../services/api';
import { Claim, PageResponse, ApiResponse } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const MyClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMyClaims = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<ApiResponse<PageResponse<Claim>>>('/claims/my-claims?size=50');
      if (res.data.success && res.data.data) {
        setClaims(res.data.data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClaims();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Ownership Claims</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track verification progress and administrative decisions on items you claimed
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading your claims..." />
      ) : claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-200 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {claim.itemPrimaryImageUrl ? (
                      <img src={claim.itemPrimaryImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Tag className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 block">
                      {claim.itemCategory}
                    </span>
                    <Link
                      to={`/items/${claim.itemReportId}`}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {claim.itemTitle}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {claim.itemLocation}
                      </span>
                      <span>•</span>
                      <span>Submitted: {new Date(claim.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={claim.status} />
                </div>
              </div>

              {/* Claim Summary & Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Your Explanation:</span>
                  <p className="text-slate-600 leading-relaxed line-clamp-2">{claim.explanation}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Proof Details Provided:</span>
                  <p className="text-slate-600 leading-relaxed line-clamp-2">{claim.identifyingDetails}</p>
                </div>
              </div>

              {/* Admin Feedback Box */}
              {claim.adminNotes && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    claim.status === 'APPROVED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : claim.status === 'REJECTED'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-purple-50 border-purple-200 text-purple-800'
                  }`}
                >
                  <span className="font-bold block mb-0.5">
                    Administrator Note ({claim.reviewerName || 'Campus Admin'}):
                  </span>
                  <p className="leading-relaxed">{claim.adminNotes}</p>
                  {claim.status === 'APPROVED' && (
                    <div className="mt-2 pt-2 border-t border-emerald-200/60 font-semibold text-emerald-900">
                      📍 Collection Instructions: Bring your student ID to Campus Safety Security Desk to retrieve your item.
                    </div>
                  )}
                </div>
              )}

              {/* Dispute Alert */}
              {claim.dispute && claim.status !== 'APPROVED' && claim.status !== 'REJECTED' && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-100">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    Multiple students have submitted claims for this item. Formal administrator dispute comparison is underway.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No claims submitted yet"
          description="If you see an item in 'Browse Items' that belongs to you, submit an ownership claim to verify and retrieve it."
          actionText="Browse Found Items"
          onAction={() => window.location.href = '/browse?reportType=FOUND'}
        />
      )}
    </div>
  );
};
