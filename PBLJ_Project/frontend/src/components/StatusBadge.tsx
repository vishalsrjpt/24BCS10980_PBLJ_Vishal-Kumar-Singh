import React from 'react';
import { ReportStatus, ClaimStatus } from '../types';

interface StatusBadgeProps {
  status: ReportStatus | ClaimStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyle = () => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10';
      case 'CLAIM_PENDING':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10';
      case 'DISPUTED':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10 font-semibold';
      case 'RECOVERED':
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10 font-semibold';
      case 'REJECTED':
      case 'EXPIRED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'ADDITIONAL_INFO_REQUIRED':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'CLAIM_PENDING':
        return 'Claim Pending';
      case 'ADDITIONAL_INFO_REQUIRED':
        return 'Info Requested';
      default:
        return status.replace(/_/g, ' ');
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border capitalize ${getStyle()} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {getLabel()}
    </span>
  );
};
