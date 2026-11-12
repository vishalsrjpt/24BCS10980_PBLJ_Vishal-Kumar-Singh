import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, MapPin, Tag } from 'lucide-react';
import { ItemMatch } from '../types';

interface MatchCardProps {
  match: ItemMatch;
  currentUserId?: number;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, currentUserId }) => {
  const isHighMatch = match.similarityScore >= 80;

  // Identify which item is opposite to current user's item
  const isLostOwner = currentUserId && match.lostReporterId === currentUserId;
  const targetItem = isLostOwner
    ? { id: match.foundReportId, title: match.foundTitle, category: match.foundCategory, location: match.foundLocation, image: match.foundImageUrl, type: 'FOUND' }
    : { id: match.lostReportId, title: match.lostTitle, category: match.lostCategory, location: match.lostLocation, image: match.lostImageUrl, type: 'LOST' };

  return (
    <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                isHighMatch
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {match.matchLevel}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold text-indigo-600">{Math.round(match.similarityScore)}%</span>
          <span className="text-[10px] text-slate-400 block -mt-1 font-medium">Similarity</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHighMatch ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, match.similarityScore))}%` }}
        />
      </div>

      {/* Matched Item Brief */}
      <div className="flex gap-3 mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
        <div className="w-14 h-14 rounded-md bg-slate-200 overflow-hidden shrink-0">
          {targetItem.image ? (
            <img src={targetItem.image} alt={targetItem.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Tag className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">
            {targetItem.type} ITEM
          </div>
          <h4 className="text-xs font-bold text-slate-800 truncate mb-1">{targetItem.title}</h4>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{targetItem.location}</span>
          </div>
        </div>
      </div>

      {/* Match Reason Breakdown */}
      <p className="text-xs text-slate-600 mb-3 bg-indigo-50/50 p-2 rounded border border-indigo-50 leading-relaxed">
        <span className="font-semibold text-indigo-900">Why it matched: </span>
        {match.matchReason}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-400">Potential match suggestion</span>
        <Link
          to={`/items/${targetItem.id}`}
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <span>View Item</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
