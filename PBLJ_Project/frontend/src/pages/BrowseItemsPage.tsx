import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
} from 'lucide-react';
import api from '../services/api';
import { ItemReport, ItemCategory, ReportType, ReportStatus, PageResponse, ApiResponse } from '../types';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

const CATEGORIES: ItemCategory[] = [
  'Electronics',
  'Documents and ID Cards',
  'Bags',
  'Wallets and Money',
  'Books and Stationery',
  'Keys',
  'Clothing',
  'Accessories',
  'Other',
];

export const BrowseItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState<string>(searchParams.get('keyword') || '');
  const [category, setCategory] = useState<string>(searchParams.get('category') || '');
  const [location, setLocation] = useState<string>(searchParams.get('location') || '');
  const [reportType, setReportType] = useState<string>(searchParams.get('reportType') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'createdAt');
  const [direction, setDirection] = useState<string>(searchParams.get('direction') || 'desc');
  const [page, setPage] = useState<number>(0);

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pageData, setPageData] = useState<PageResponse<ItemReport> | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.append('keyword', keyword.trim());
      if (category) params.append('category', category);
      if (location.trim()) params.append('location', location.trim());
      if (reportType) params.append('reportType', reportType);
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('size', '12');
      params.append('sortBy', sortBy);
      params.append('direction', direction);

      const res = await api.get<ApiResponse<PageResponse<ItemReport>>>(`/items/search?${params.toString()}`);
      if (res.data.success && res.data.data) {
        setPageData(res.data.data);
      }
    } catch (err) {
      console.error('Search request failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, reportType, status, sortBy, direction, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchItems();
  };

  const handleClearFilters = () => {
    setKeyword('');
    setCategory('');
    setLocation('');
    setReportType('');
    setStatus('');
    setSortBy('createdAt');
    setDirection('desc');
    setPage(0);
    setSearchParams({});
  };

  const activeFilterCount =
    (category ? 1 : 0) +
    (location ? 1 : 0) +
    (reportType ? 1 : 0) +
    (status ? 1 : 0) +
    (keyword ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Search Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Browse Lost & Found Items</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search items reported across college departments, buildings, and study areas
          </p>
        </div>

        {/* Search input & action row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search keyword (e.g. laptop, blue bottle, student ID, keys, casio...)"
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                showFilters || activeFilterCount > 0
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Report Type Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setReportType(''); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === '' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => { setReportType('LOST'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === 'LOST' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lost Only
            </button>
            <button
              type="button"
              onClick={() => { setReportType('FOUND'); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === 'FOUND' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Found Only
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={`${sortBy}-${direction}`}
              onChange={(e) => {
                const [sb, dir] = e.target.value.split('-');
                setSortBy(sb);
                setDirection(dir);
                setPage(0);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="eventDate-desc">Recent Event Date</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location Area</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => { setPage(0); fetchItems(); }}
                placeholder="e.g. Library, Lab 3, Cafeteria"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="CLAIM_PENDING">Claim Pending</option>
                <option value="DISPUTED">Disputed</option>
                <option value="RECOVERED">Recovered</option>
              </select>
            </div>

            {activeFilterCount > 0 && (
              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <LoadingSpinner text="Searching reports..." />
      ) : pageData && pageData.content.length > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing {pageData.pageNumber * pageData.pageSize + 1}–
              {Math.min((pageData.pageNumber + 1) * pageData.pageSize, pageData.totalElements)} of{' '}
              {pageData.totalElements} items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pageData.content.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pageData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={pageData.pageNumber === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-medium text-slate-600 px-3">
                Page {pageData.pageNumber + 1} of {pageData.totalPages}
              </span>

              <button
                disabled={pageData.last}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No matching reports found"
          description="Try broadening your search term or clearing some filters to see more results."
          actionText="Clear Filters"
          onAction={handleClearFilters}
          icon={PackageSearch}
        />
      )}
    </div>
  );
};
