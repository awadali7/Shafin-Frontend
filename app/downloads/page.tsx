"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Package, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { entitlementsApi } from "@/lib/api/entitlements";
import { productExtraInfoApi } from "@/lib/api/product-extra-info";
import { apiClient } from "@/lib/api/client";
import type { ProductEntitlement } from "@/lib/api/types";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";

function formatDate(dateString: string) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString();
}

type ExtendedEntitlement = ProductEntitlement & {
    isExtraInfo?: boolean;
};

export default function DownloadsPage() {
    const { isAuth, user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<ExtendedEntitlement[]>([]);
    const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);

    const apiBaseUrl = useMemo(
        () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
        []
    );

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            return;
        }
        if (isAuth && user) {
            (async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const [entResp, extraInfoResp] = await Promise.all([
                        entitlementsApi.my(),
                        productExtraInfoApi.getMyAccesses().catch(() => ({ data: [] }))
                    ]);
                    
                    const standardItems = Array.isArray(entResp.data) ? entResp.data : [];
                    const extraInfoItems = Array.isArray(extraInfoResp?.data) ? extraInfoResp.data.map((access: any) => ({
                        entitlement_id: access.id,
                        source: access.source || "admin_grant",
                        granted_at: access.granted_at,
                        product_id: "extra-info-" + access.id,
                        product_type: "digital" as any,
                        name: access.title,
                        slug: access.slug,
                        category: "Extra Package",
                        type: "digital" as any,
                        digital_file_format: "view" as any,
                        cover_image: access.image_files && access.image_files.length > 0 ? access.image_files[0].url : null,
                        isExtraInfo: true,
                    })) : [];

                    // Combine and sort by date
                    const combined = [...standardItems, ...extraInfoItems].sort((a, b) => {
                        return new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime();
                    });
                    
                    setItems(combined);
                } catch (e: any) {
                    setError(e?.message || "Failed to load downloads");
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [authLoading, isAuth, user]);

    const handleDownload = async (ent: ExtendedEntitlement) => {
        if (ent.isExtraInfo) return; // handled via route link instead

        const token = apiClient.getToken();
        if (!token) {
            setIsLoginDrawerOpen(true);
            return;
        }

        try {
            setDownloadingSlug(ent.slug);
            const resp = await fetch(
                `${apiBaseUrl}/products/${ent.slug}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg || "Download failed");
            }

            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const fallbackName =
                ent.digital_file_name ||
                `${ent.slug}.${ent.digital_file_format || "zip"}`;
            a.download = fallbackName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (e: any) {
            alert(e?.message || "Download failed");
        } finally {
            setDownloadingSlug(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    if (!isAuth) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            My Downloads
                        </h1>
                        <p className="text-gray-600">
                            Please sign in to continue
                        </p>
                    </div>
                </div>
                <LoginDrawer
                    isOpen={isLoginDrawerOpen}
                    onClose={() => setIsLoginDrawerOpen(false)}
                    onSwitchToRegister={() => {
                        setIsLoginDrawerOpen(false);
                        setIsRegisterDrawerOpen(true);
                    }}
                />
                <RegisterDrawer
                    isOpen={isRegisterDrawerOpen}
                    onClose={() => setIsRegisterDrawerOpen(false)}
                    onSwitchToLogin={() => {
                        setIsRegisterDrawerOpen(false);
                        setIsLoginDrawerOpen(true);
                    }}
                />
            </>
        );
    }

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                    My Downloads
                </h1>
                <Link
                    href="/orders"
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-slate-900 hover:bg-gray-50 transition-colors"
                >
                    My Orders
                </Link>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {items.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                        No downloads yet. After payment success (or admin
                        grant), your digital products will appear here.
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex mt-4 text-[#B00000] hover:underline text-sm font-medium"
                    >
                        Go to Shop
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((ent) => (
                        <div
                            key={ent.entitlement_id}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col"
                        >
                            <div className="h-40 w-full bg-gray-100 flex-shrink-0">
                                {ent.cover_image ? (
                                    <img
                                        src={ent.cover_image}
                                        alt={ent.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                       <Package className="w-10 h-10 text-gray-300" />
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex flex-col flex-grow">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="text-xs text-gray-500">
                                        {ent.category || "Digital"}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${ent.isExtraInfo ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                                        {(
                                            ent.digital_file_format || "digital"
                                        ).toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1 line-clamp-2">
                                    {ent.name}
                                </h3>
                                <p className="text-xs text-gray-500 mb-4 flex-grow">
                                    Granted: {formatDate(ent.granted_at)} •{" "}
                                    {ent.source === "admin_grant"
                                        ? "Admin grant"
                                        : "Paid order"}
                                </p>

                                {ent.isExtraInfo ? (
                                    <Link
                                        href={`/product-extra-info/${ent.slug}`}
                                        className="w-full mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#B00000] text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Package
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => handleDownload(ent)}
                                        disabled={downloadingSlug === ent.slug}
                                        className="w-full mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#B00000] text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors disabled:opacity-60"
                                    >
                                        {downloadingSlug === ent.slug ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        Download
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
