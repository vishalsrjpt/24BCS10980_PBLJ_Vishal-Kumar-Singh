import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { ItemReport } from '../types';
import { StatusBadge } from './StatusBadge';

interface ItemCardProps {
  item: ItemReport;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const isFound = item.reportType === 'FOUND';
  const primaryImage = item.images && item.images.length > 0 ? item.images[0].url : null;

  const formattedDate = new Date(item.eventDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Image Thumbnail Header */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100">
            <Tag className="w-10 h-10 stroke-[1.5] mb-1 text-slate-300" />
            <span className="text-xs font-medium text-slate-400">No photo uploaded</span>
          </div>
        )}

        {/* Report Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase shadow-sm ${
              isFound
                ? 'bg-teal-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {item.reportType}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} size="sm" />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs font-medium text-indigo-600 mb-1 flex items-center gap-1">
          <span>{item.category}</span>
          {item.brand && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{item.brand}</span>
            </>
          )}
        </div>

        <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors text-base mb-2">
          {item.title}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
          {item.description}
        </p>

        {/* Metadata Footer */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            {item.status === 'RECOVERED' && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Recovered
              </span>
            )}
          </div>
        </div>

        <Link
          to={`/items/${item.id}`}
          className="w-full text-center py-2 px-3 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};
