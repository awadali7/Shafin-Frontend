"use client";

import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { landingBannersApi, getBannerImageUrl, type LandingBanner } from "@/lib/api/landingBanners";

export const LandingBannersTab: React.FC = () => {
    const [banners, setBanners] = useState<LandingBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const resp = await landingBannersApi.getAll();
            setBanners(Array.isArray(resp.data) ? resp.data : []);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to load banners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBanners(); }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploading(true);
            const fd = new FormData();
            fd.append('image', file);
            await landingBannersApi.upload(fd);
            toast.success('Banner uploaded successfully');
            await fetchBanners();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleToggle = async (banner: LandingBanner) => {
        try {
            await landingBannersApi.toggleStatus(banner.id, !banner.is_active);
            await fetchBanners();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to update');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this banner?')) return;
        try {
            setDeletingId(id);
            await landingBannersApi.delete(id);
            toast.success('Banner deleted');
            await fetchBanners();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    const activeBanners = banners.filter(b => b.is_active);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Landing Page Banners</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Upload images to display as a slider on the homepage.{" "}
                        <span className="font-medium text-brand-red">{activeBanners.length} active</span>
                    </p>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Upload Image
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : banners.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                    <ImageIcon className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-500">No banners yet</p>
                    <p className="mt-1 text-xs text-gray-400">Upload your first image to show it on the landing page.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {banners.map((banner) => (
                        <div
                            key={banner.id}
                            className={`group relative overflow-hidden rounded-xl border ${banner.is_active ? 'border-brand-red/30 ring-1 ring-brand-red/20' : 'border-gray-200'} bg-white`}
                        >
                            {/* Image */}
                            <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                                <img
                                    src={getBannerImageUrl(banner.image_url)}
                                    alt="Banner"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            {/* Footer */}
                            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                                <button
                                    onClick={() => handleToggle(banner)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                                        banner.is_active
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${banner.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    {banner.is_active ? 'Active' : 'Hidden'}
                                </button>
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    disabled={deletingId === banner.id}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                >
                                    {deletingId === banner.id
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Trash2 className="h-3.5 w-3.5" />
                                    }
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
