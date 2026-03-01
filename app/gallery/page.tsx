"use client";

import React, { useEffect, useState } from "react";
import { galleryApi, GalleryImage, getImageUrl } from "@/lib/api/gallery";
import { Loader2, X } from "lucide-react";
import Image from "next/image";

export default function GalleryPage() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                setLoading(true);
                const data = await galleryApi.getActive();
                setImages((data.data as GalleryImage[]) || []);
                setError(null);
            } catch (err: any) {
                setError(err.message || "Failed to load gallery");
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    return (
        <div className="flex flex-col bg-gray-50">
            <main className="flex-1">
                {/* Hero Section */}
                <div className="relative text-white py-24  overflow-hidden bg-gray-900">
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1920&q=80&fit=crop')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    ></div>
                    <div className="absolute inset-0 bg-black/50 z-0"></div>
                    <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">Our Gallery</h1>
                        <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                            Explore moments, events, and memories from our community.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 text-[#B00000] animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading gallery images...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-8 text-center">
                            <p className="text-lg font-medium">{error}</p>
                            <p className="mt-2 text-sm text-red-500">Please try refreshing the page later.</p>
                        </div>
                    ) : images.length > 0 ? (
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                            {images.map((image, index) => (
                                <div
                                    key={image.id}
                                    className="break-inside-avoid bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group cursor-pointer"
                                    onClick={() => setSelectedImageIndex(index)}
                                >
                                    <div className="relative w-full">
                                        <img
                                            src={getImageUrl(image.image_url)}
                                            alt={image.heading || "Gallery image"}
                                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    </div>
                                    {image.heading && (
                                        <div className="p-4 border-t border-gray-100">
                                            <h3 className="text-lg font-medium text-slate-900">{image.heading}</h3>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Image src="/logo.png" alt="Logo" width={32} height={32} className="opacity-50 grayscale" />
                            </div>
                            <h3 className="text-xl font-medium text-slate-900 mb-2">No Images Yet</h3>
                            <p className="text-gray-500">We're curating our gallery. Check back soon for beautiful moments!</p>
                        </div>
                    )}
                </div>

                {/* Image Gallery Modal */}
                {selectedImageIndex !== null && images.length > 0 && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-50 bg-black/90"
                            onClick={() => setSelectedImageIndex(null)}
                        />

                        {/* Gallery Content */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedImageIndex(null)}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[60]"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>

                            {/* Main Image */}
                            <div className="relative max-w-6xl w-full flex flex-col items-center">
                                <img
                                    src={getImageUrl(images[selectedImageIndex].image_url)}
                                    alt={images[selectedImageIndex].heading || "Gallery image preview"}
                                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                                />

                                {/* Heading if exists */}
                                {images[selectedImageIndex].heading && (
                                    <h3 className="text-white text-xl mt-4 font-medium text-center">
                                        {images[selectedImageIndex].heading}
                                    </h3>
                                )}

                                {/* Navigation Arrows */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedImageIndex((prev) =>
                                                    prev === 0 ? images.length - 1 : prev! - 1
                                                );
                                            }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            <svg
                                                className="w-6 h-6 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 19l-7-7 7-7"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedImageIndex((prev) =>
                                                    prev === images.length - 1 ? 0 : prev! + 1
                                                );
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            <svg
                                                className="w-6 h-6 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>
                                    </>
                                )}

                                {/* Image Counter */}
                                <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 text-white text-sm rounded-full">
                                    {selectedImageIndex + 1} / {images.length}
                                </div>
                            </div>

                            {/* Thumbnail Strip */}
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-4xl w-full px-4">
                                    <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
                                        {images.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedImageIndex(index);
                                                }}
                                                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                                                    ? "border-[#B00000] scale-110"
                                                    : "border-white/30 hover:border-white/60"
                                                    }`}
                                            >
                                                <img
                                                    src={getImageUrl(img.image_url)}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
