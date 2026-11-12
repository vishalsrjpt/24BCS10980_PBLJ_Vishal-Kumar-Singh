import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { ItemReport, PlatformStatistics, ApiResponse, PageResponse } from '../types';
import { ItemCard } from '../components/ItemCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [recentItems, setRecentItems] = useState<ItemReport[]>([]);
  const [stats, setStats] = useState<PlatformStatistics | null>(null);

  useEffect(() => {
    // Fetch recent items
    api.get<ApiResponse<PageResponse<ItemReport>>>('/items?size=6&sortBy=createdAt&direction=desc')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setRecentItems(res.data.data.content);
        }
      })
      .catch((err) => console.error(err));

    // Fetch recovery stats
    api.get<ApiResponse<PlatformStatistics>>('/recovery/stats')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setStats(res.data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/browse?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold backdrop-blur-sm animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chandigarh University Smart Lost & Found</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Lost Something on Campus? <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-indigo-200 to-indigo-400">
              We Help You Find It Faster.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            CUFind centralizes reports across all Chandigarh University departments, uses intelligent keyword & location matching, and protects private ownership details with verified claim workflows.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-6">
            <div className="flex items-center bg-white rounded-xl p-1.5 shadow-2xl border border-slate-200 text-slate-800">
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search lost laptop, blue water bottle, keys, student ID..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shrink-0 shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/report?type=LOST"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>I Lost an Item</span>
            </Link>
            <Link
              to="/report?type=FOUND"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold shadow-lg shadow-teal-900/30 transition transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>I Found an Item</span>
            </Link>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <span>Browse All Items</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live Platform Stats Bar */}
        <div className="max-w-5xl mx-auto mt-16 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats?.totalReports ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Total Reported</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-400">{stats?.totalFoundReports ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Items Found</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{stats?.recoveredItems ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Reunited / Recovered</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{stats?.recoveryRate ? `${stats.recoveryRate}%` : '0%'}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Success Recovery Rate</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
            How CUFind Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Centralized coordination ensures belongings reach their true owners with safety and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base mb-4 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Publish a Report</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe what was lost or found with campus location, date, color, brand, and photos. Found item identifying details are kept confidential.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-teal-300 transition">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-base mb-4 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Smart Matching Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our 7-parameter weighted algorithm compares title, description, category, color, brand, location, and dates to automatically alert matching parties.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-emerald-300 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base mb-4 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Verify & Claim</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Claimants submit proof details. Campus administrators review claims, resolve competing claims, and authorize safe physical retrieval.
            </p>
          </div>
        </div>
      </section>

      {/* Recently Reported Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Recently Reported Belongings</h2>
            <p className="text-xs text-slate-500 mt-1">Latest items reported across college halls and classrooms</p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Package className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500">No recent reports available right now.</p>
          </div>
        )}
      </section>
    </div>
  );
};
