import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Upload,
  X,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { ItemCategory, ReportType, ApiResponse, ItemReport } from '../types';

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

const reportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(2, 'Location is required'),
  eventDate: z.string().min(1, 'Date is required'),
  color: z.string().optional(),
  brand: z.string().optional(),
  identifyingDetails: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export const ReportItemPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType: ReportType = searchParams.get('type') === 'FOUND' ? 'FOUND' : 'LOST';
  const [reportType, setReportType] = useState<ReportType>(initialType);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      eventDate: new Date().toISOString().slice(0, 16),
      category: 'Electronics',
    },
  });

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);

      // Generate preview URLs
      const newUrls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      // Ensure proper ISO format with timezone for OffsetDateTime
      const eventDateISO = new Date(data.eventDate).toISOString();

      const reportPayload = {
        title: data.title.trim(),
        description: data.description.trim(),
        reportType: reportType,
        category: data.category,
        location: data.location.trim(),
        eventDate: eventDateISO,
        color: data.color?.trim() || null,
        brand: data.brand?.trim() || null,
        identifyingDetails: data.identifyingDetails?.trim() || null,
        additionalNotes: data.additionalNotes?.trim() || null,
      };

      formData.append(
        'report',
        new Blob([JSON.stringify(reportPayload)], { type: 'application/json' })
      );

      for (const file of selectedFiles) {
        formData.append('images', file);
      }

      const res = await api.post<ApiResponse<ItemReport>>('/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.data) {
        navigate(`/items/${res.data.data.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit item report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Publish Item Report</h1>
        <p className="text-xs text-slate-500 mt-1">
          Provide complete details to maximize chance of item matching and fast recovery
        </p>
      </div>

      {/* Type Toggle Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex items-center shadow-xs">
        <button
          type="button"
          onClick={() => setReportType('LOST')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            reportType === 'LOST'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current"></span>
          <span>I Lost Something (Report Lost Item)</span>
        </button>

        <button
          type="button"
          onClick={() => setReportType('FOUND')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            reportType === 'FOUND'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current"></span>
          <span>I Found Something (Report Found Item)</span>
        </button>
      </div>

      {reportType === 'FOUND' && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-teal-600" />
            <span>Fraud Prevention Notice for Found Items</span>
          </p>
          <p className="text-[11px] leading-relaxed text-teal-700">
            Please describe the item generally. Do not expose private identifying information (such as student names on cards, lock codes, or detailed markings) in the public title or description. Put secret details into the "Private Identifying Details" box below.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Item Title *
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder={
              reportType === 'LOST'
                ? 'e.g. Navy Blue Hydro Flask Water Bottle (32oz)'
                : 'e.g. Found Blue Stainless Steel Water Bottle'
            }
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.title && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date & Approximate Time {reportType === 'LOST' ? 'Lost' : 'Found'} *
            </label>
            <input
              type="datetime-local"
              {...register('eventDate')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.eventDate && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.eventDate.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {reportType === 'LOST' ? 'Last Seen Campus Location *' : 'Location Where Found *'}
          </label>
          <input
            type="text"
            {...register('location')}
            placeholder="e.g. Central Library 2nd Floor Study Desks, Turing Hall Lab 3, Cafeteria Counter"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.location && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.location.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Colour
            </label>
            <input
              type="text"
              {...register('color')}
              placeholder="e.g. Navy Blue, Matte Black, Silver"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              {...register('brand')}
              placeholder="e.g. Apple, Dell, Hydro Flask, Casio"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            General Description *
          </label>
          <textarea
            rows={3}
            {...register('description')}
            placeholder="Provide relevant details (size, condition, stickers, case style, etc.)"
            className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.description && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Private / Identifying Details */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {reportType === 'LOST'
              ? 'Private Identifying Proof (Visible only to Admins & You)'
              : 'Private Confidential Details (Keep hidden from public claimants)'}
          </label>
          <textarea
            rows={2}
            {...register('identifyingDetails')}
            placeholder="e.g. Serial number, secret scratch on rear, exact contents of bag, student roll number on ID card..."
            className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50"
          />
        </div>

        {/* Image Upload Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Item Photographs (Optional, Multiple Allowed)
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer relative">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFilesSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
            <span className="text-xs text-indigo-600 font-semibold">Click to select photographs</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">JPEG, PNG, WebP up to 10MB each</span>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-3">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2.5 text-xs font-bold rounded-xl text-white transition shadow-sm flex items-center gap-2 ${
              reportType === 'LOST'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-teal-600 hover:bg-teal-700'
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Submit {reportType} Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
