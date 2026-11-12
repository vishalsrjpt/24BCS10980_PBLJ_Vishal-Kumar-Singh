import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  User,
  Tag,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Trash2,
  Edit,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ItemReport, ItemMatch, ApiResponse, Claim } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MatchCard } from '../components/MatchCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState<ItemReport | null>(null);
  const [matches, setMatches] = useState<ItemMatch[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Claim Modal state
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [identifyingDetails, setIdentifyingDetails] = useState<string>('');
  const [purchaseDetails, setPurchaseDetails] = useState<string>('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState<boolean>(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const fetchItemDetails = async () => {
    setIsLoading(true);
    try {
      const [itemRes, matchesRes] = await Promise.all([
        api.get<ApiResponse<ItemReport>>(`/items/${id}`),
        api.get<ApiResponse<ItemMatch[]>>(`/matches/item/${id}`),
      ]);

      if (itemRes.data.success && itemRes.data.data) {
        setItem(itemRes.data.data);
      }
      if (matchesRes.data.success && matchesRes.data.data) {
        setMatches(matchesRes.data.data);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load item report details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const handleProofFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProofFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeProofFile = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!explanation.trim() || !identifyingDetails.trim()) {
      setClaimErrorMessage('Please provide both an explanation and unique identifying details');
      return;
    }

    setIsSubmittingClaim(true);
    setClaimErrorMessage(null);

    try {
      const formData = new FormData();
      const claimPayload = {
        itemReportId: item.id,
        explanation: explanation.trim(),
        identifyingDetails: identifyingDetails.trim(),
        purchaseDetails: purchaseDetails.trim() || null,
      };

      formData.append(
        'claim',
        new Blob([JSON.stringify(claimPayload)], { type: 'application/json' })
      );

      for (const file of proofFiles) {
        formData.append('proofImages', file);
      }

      const res = await api.post<ApiResponse<Claim>>('/claims', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setClaimSuccessMessage(
          'Your ownership claim has been submitted! Administrators will review your proof details.'
        );
        setItem((prev) => (prev ? { ...prev, hasClaimed: true, canClaim: false } : null));
        setTimeout(() => {
          setShowClaimModal(false);
          setClaimSuccessMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      setClaimErrorMessage(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!item) return;
    try {
      await api.delete(`/items/${item.id}`);
      navigate('/my-reports');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not delete report');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading item details..." />;
  }

  if (errorMessage || !item) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-500 mb-2" />
        <h2 className="text-lg font-bold text-slate-800">Item Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">{errorMessage || 'The requested report could not be found.'}</p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === item.reporterId;
  const isFound = item.reportType === 'FOUND';
  const primaryImage =
    item.images && item.images.length > 0 ? item.images[activeImageIndex]?.url : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button & Actions bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </Link>

        {isOwner && item.status !== 'RECOVERED' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Images Gallery Left, Details Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Left Column: Image Showcase */}
        <div className="space-y-4">
          <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200/80">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <Tag className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
                <span className="text-xs font-medium">No photographs uploaded</span>
              </div>
            )}

            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase shadow-sm ${
                  isFound ? 'bg-teal-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {item.reportType}
              </span>
            </div>

            <div className="absolute top-3 right-3">
              <StatusBadge status={item.status} />
            </div>
          </div>

          {/* Thumbnails row if multiple images exist */}
          {item.images && item.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {item.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                    activeImageIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Privacy Note for Found Items */}
          {isFound && (
            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-xs text-teal-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Fraud Protection & Privacy Safe</span>
              </div>
              <p className="text-[11px] leading-relaxed text-teal-700">
                Identifying serial numbers and private contents are kept hidden. Claimants must provide proof details to verify true ownership before item handover.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Information & Claim CTA */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                {item.category}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {item.title}
              </h1>
            </div>

            {/* Spec pills */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Location</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Date & Time</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                </span>
              </div>

              {item.color && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Color</span>
                  <span className="font-semibold text-slate-800">{item.color}</span>
                </div>
              )}

              {item.brand && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Brand / Make</span>
                  <span className="font-semibold text-slate-800">{item.brand}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Description</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {item.description}
              </p>
            </div>

            {/* Identifying Details (Only visible to reporter or admin) */}
            {item.identifyingDetails && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-1">Confidential Identifying Details (Owner / Admin View):</span>
                <p className="text-amber-800">{item.identifyingDetails}</p>
              </div>
            )}

            {/* Reporter Public Identity */}
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
              <User className="w-4 h-4 text-slate-400" />
              <span>Reported by: <strong className="text-slate-800">{item.reporterName}</strong></span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-100">
            {item.status === 'RECOVERED' ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">Item Successfully Recovered</h4>
                  <p className="text-[11px] text-emerald-700">
                    This item has been verified and returned to its rightful owner on{' '}
                    {item.recoveredAt ? new Date(item.recoveredAt).toLocaleDateString() : 'archive'}.
                  </p>
                </div>
              </div>
            ) : isFound ? (
              item.hasClaimed ? (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold">Claim Submitted</h4>
                    <p className="text-[11px] text-indigo-700">
                      You have submitted an ownership claim for this item. Check "My Claims" for administrative review status.
                    </p>
                  </div>
                </div>
              ) : isOwner ? (
                <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-600 text-center font-medium">
                  You are the student who reported finding this item.
                </div>
              ) : isAuthenticated ? (
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Claim This Item (Verify Ownership)</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 text-center block shadow-sm transition"
                >
                  Sign in to Claim This Item
                </Link>
              )
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
                This is a LOST item report. If you found this item, please report it via the "Report Found Item" page!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Potential Smart Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Calculated Smart Matches ({matches.length})</h2>
            <p className="text-xs text-slate-500">
              Potential matching {isFound ? 'LOST' : 'FOUND'} reports identified by deterministic algorithm
            </p>
          </div>
        </div>

        {matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} currentUserId={user?.id} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            No smart matches with similarity above 60% calculated for this item yet.
          </div>
        )}
      </div>

      {/* Claim Submission Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Claim Item: {item.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit ownership verification information</p>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {claimSuccessMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{claimSuccessMessage}</span>
              </div>
            )}

            {claimErrorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{claimErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Why do you believe this item belongs to you? *
                </label>
                <textarea
                  rows={2}
                  required
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain when and where you lost it, context, etc."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unique Identifying Details (Proof) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={identifyingDetails}
                  onChange={(e) => setIdentifyingDetails(e.target.value)}
                  placeholder="Describe unique marks, scratches, exact stickers, lockscreen wallpaper, serial numbers, inner pocket contents, etc."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purchase or Ownership Details (Optional)
                </label>
                <input
                  type="text"
                  value={purchaseDetails}
                  onChange={(e) => setPurchaseDetails(e.target.value)}
                  placeholder="e.g. Purchased from Amazon on Jan 2024, gift from parents..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Proof image uploads */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supporting Proof Photos (Receipts, Photos of You with Item, Box)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProofFilesChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-xs text-indigo-600 font-semibold">Upload Proof Photos</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">JPEG, PNG, WebP up to 10MB</span>
                </div>

                {proofFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {proofFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200 text-xs text-slate-700"
                      >
                        <span className="max-w-[120px] truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeProofFile(idx)}
                          className="text-slate-500 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="px-5 py-2 text-xs font-bold rounded-lg text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingClaim ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Claim</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Item Report?"
        message="Are you sure you want to delete this report? This will remove all associated matches and photographs."
        confirmText="Yes, Delete"
        onConfirm={handleDeleteItem}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
