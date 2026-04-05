"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Image as ImageIcon, Loader2, Lock } from "lucide-react";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { productExtraInfoApi, ProductExtraInfo } from "@/lib/api/product-extra-info";

export default function ProductExtraInfoPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { isAuth, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<ProductExtraInfo | null>(null);
    const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            setLoading(false);
            return;
        }

        if (authLoading || !isAuth || !slug) {
            return;
        }

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const resp = await productExtraInfoApi.getAccessibleBySlug(slug);
                if (resp.success && resp.data) {
                    setInfo(resp.data);
                    setSelectedPdfUrl(resp.data.pdf_files?.[0]?.url || "");
                } else {
                    setError(resp.message || "Failed to load extra information");
                }
            } catch (e: any) {
                setError(
                    e?.message || "Failed to load extra information"
                );
            } finally {
                setLoading(false);
            }
        })();
    }, [authLoading, isAuth, slug]);

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
                <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4">
                    <div className="max-w-md text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        <Lock className="w-12 h-12 text-[#B00000] mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Login Required
                        </h1>
                        <p className="text-gray-600">
                            Please sign in to view this protected product extra information page.
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

    if (error || !info) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#B00000] mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
                <div className="bg-white border border-red-200 rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Access Unavailable
                    </h1>
                    <p className="text-red-600">
                        {error || "This product extra information could not be opened."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#B00000]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <Link
                        href="/downloads"
                        className="text-sm text-[#B00000] hover:underline"
                    >
                        My Downloads
                    </Link>
                </div>

                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-6 sm:px-8 py-8 border-b border-gray-100 bg-gradient-to-r from-red-50 via-white to-gray-50">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#B00000] mb-3">
                            Product Extra Information
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                            {info.title}
                        </h1>
                    </div>

                    <div className="p-6 sm:p-8 space-y-8">
                        {info.body ? (
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Content
                                </h2>
                                <div
                                    className="prose prose-sm sm:prose max-w-none"
                                    dangerouslySetInnerHTML={{ __html: info.body }}
                                />
                            </section>
                        ) : null}

                        {(info.image_files?.length || 0) > 0 ? (
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-[#B00000]" />
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Images
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {info.image_files?.map((image) => (
                                        <a
                                            key={image.url}
                                            href={image.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-md transition-shadow"
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.name}
                                                className="w-full h-60 object-cover"
                                            />
                                            <div className="p-3 text-sm text-gray-700 truncate">
                                                {image.name}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {(info.pdf_files?.length || 0) > 0 ? (
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-[#B00000]" />
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        PDF Files
                                    </h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {info.pdf_files?.map((pdf) => (
                                        <button
                                            key={pdf.url}
                                            onClick={() => setSelectedPdfUrl(pdf.url)}
                                            className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                                                selectedPdfUrl === pdf.url
                                                    ? "bg-[#B00000] text-white border-[#B00000]"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {pdf.name}
                                        </button>
                                    ))}
                                </div>
                                {selectedPdfUrl ? (
                                    <div className="space-y-3">
                                        <a
                                            href={selectedPdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex text-sm text-[#B00000] hover:underline"
                                        >
                                            Open selected PDF in new tab
                                        </a>
                                        <iframe
                                            src={selectedPdfUrl}
                                            title="PDF Preview"
                                            className="w-full h-[720px] rounded-2xl border border-gray-200"
                                        />
                                    </div>
                                ) : null}
                            </section>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
