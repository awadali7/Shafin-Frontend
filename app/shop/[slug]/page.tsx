"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Package, ShoppingCart, Star, Play, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";

type ProductType = "physical" | "digital";
type DigitalFileFormat = "zip" | "rar";

type ShopProductDetails = {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    images?: string[];
    videos?: Array<{
        title: string;
        url: string;
        thumbnail?: string;
    }>;
    category: string;
    type: ProductType;
    rating: number;
    reviews: number;
    inStock?: boolean; // physical only
    description: string;
    digitalFile?: {
        format?: DigitalFileFormat;
        filename?: string;
    };
};

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop";

function mapApiProductToDetails(p: Product): ShopProductDetails {
    const allImages = p.images && p.images.length > 0 
        ? p.images 
        : (p.cover_image ? [p.cover_image] : [FALLBACK_IMAGE]);
    
    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        image: allImages[0] || FALLBACK_IMAGE,
        images: allImages,
        videos: p.videos || [],
        category: p.category || "Other",
        type: p.type,
        rating: Number(p.rating ?? 0),
        reviews: Number(p.reviews_count ?? 0),
        inStock:
            p.type === "digital"
                ? true
                : p.in_stock ?? (p.stock_quantity ?? 0) > 0,
        description:
            p.description ||
            (p.type === "digital"
                ? "Digital product. Download available after payment."
                : "Physical product. Shipping available."),
        digitalFile:
            p.type === "digital"
                ? {
                      format: p.digital_file_format || undefined,
                      filename: p.digital_file_name || undefined,
                  }
                : undefined,
    };
}

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { addToCart, setIsOpen } = useCart();

    const [product, setProduct] = useState<ShopProductDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState<{ title: string; url: string } | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const resp = await productsApi.getBySlug(slug);
                if (!mounted) return;
                if (!resp.success || !resp.data) {
                    setError("Product not found");
                    setProduct(null);
                    return;
                }
                setProduct(mapApiProductToDetails(resp.data));
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || "Failed to load product");
                setProduct(null);
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [slug]);

    const specifications = useMemo(() => {
        if (!product) return [];
        if (product.type === "digital") {
            return [
                "Instant download after payment",
                `Format: ${
                    product.digitalFile?.format?.toUpperCase() || "DIGITAL"
                }`,
                product.digitalFile?.filename
                    ? `File: ${product.digitalFile.filename}`
                    : "File provided after purchase",
                "Access available in My Downloads",
            ];
        }
        return [
            "Shipping available",
            product.inStock ? "In stock" : "Out of stock",
            "Ships after payment confirmation",
        ];
    }, [product]);

    const features = useMemo(() => {
        if (!product) return [];
        if (product.type === "digital") {
            return [
                "Secure download link",
                "Access from any device after login",
                "Admin can grant free access",
            ];
        }
        return ["Quality checked", "Fast shipping", "Support available"];
    }, [product]);

    const handleAddToCart = () => {
        if (!product) return;
        const finalQty = product.type === "digital" ? 1 : quantity;
        const isPhysicalInStock =
            product.type !== "physical" ? true : !!product.inStock;
        if (!isPhysicalInStock) return;

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            type: product.type,
            quantity: finalQty,
            slug: product.slug,
        });

        // Open the cart drawer
        setIsOpen(true);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg border border-gray-200 p-8 animate-pulse">
                    <div className="h-6 w-40 bg-gray-100 rounded mb-4" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="h-96 bg-gray-100 rounded-lg" />
                        <div className="space-y-4">
                            <div className="h-4 w-32 bg-gray-100 rounded" />
                            <div className="h-8 w-3/4 bg-gray-100 rounded" />
                            <div className="h-10 w-40 bg-gray-100 rounded" />
                            <div className="h-24 bg-gray-100 rounded" />
                            <div className="h-12 bg-gray-100 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-600">
                        {error || "Product not found"}
                    </p>
                </div>
                <Link
                    href="/shop"
                    className="inline-flex items-center text-[#B00000] hover:underline text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <Link
                href="/shop"
                className="inline-flex items-center text-gray-600 hover:text-[#B00000] mb-6 transition-colors text-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Images */}
                <div className="space-y-4">
                    {/* Main Image */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <img
                            src={product.images?.[selectedImageIndex] || product.image}
                            alt={product.name}
                            className="w-full h-96 object-cover"
                        />
                    </div>
                    
                    {/* Image Thumbnails */}
                    {product.images && product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`relative border-2 rounded-lg overflow-hidden aspect-square ${
                                        selectedImageIndex === index
                                            ? "border-[#B00000]"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                >
                                    <img
                                        src={img}
                                        alt={`${product.name} ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <span className="text-sm text-gray-500">
                            {product.category}
                        </span>
                        <h1 className="text-3xl font-bold text-slate-900 mt-2 mb-4">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-5 h-5 ${
                                            i < Math.floor(product.rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-600">
                                {product.rating} ({product.reviews} reviews)
                            </span>
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <p className="text-4xl font-bold text-[#B00000]">
                                ₹{product.price.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {product.type === "digital"
                                    ? `Instant download (${
                                          product.digitalFile?.format?.toUpperCase() ||
                                          "DIGITAL"
                                      }) after payment`
                                    : product.inStock
                                    ? "In Stock - Ready to Ship"
                                    : "Out of Stock"}
                            </p>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 leading-relaxed mb-6">
                            {product.description}
                        </p>

                        {/* Quantity / Delivery */}
                        {product.type === "digital" ? (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery
                                </label>
                                <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <Download className="w-5 h-5 text-[#B00000] mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            Digital download
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Available after payment (or admin
                                            grant)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity
                                </label>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(1, quantity - 1)
                                            )
                                        }
                                        className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center font-medium">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setQuantity(quantity + 1)
                                        }
                                        className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={
                                product.type === "physical" && !product.inStock
                            }
                            className="w-full px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span>
                                {product.type === "digital"
                                    ? "Add Digital Product"
                                    : product.inStock
                                    ? "Add to Cart"
                                    : "Out of Stock"}
                            </span>
                        </button>

                        {/* Stock Status */}
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                                {product.type === "digital" ? (
                                    <>
                                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                        <span className="text-sm text-gray-600">
                                            Available after payment
                                        </span>
                                    </>
                                ) : product.inStock ? (
                                    <>
                                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                                        <span className="text-sm text-gray-600">
                                            In Stock
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                                        <span className="text-sm text-gray-600">
                                            Out of Stock
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Videos Section */}
            {product.videos && product.videos.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">
                        Product Videos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {product.videos.map((video, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedVideo(video)}
                                className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#B00000] transition-colors"
                            >
                                <div className="relative aspect-video bg-gray-100">
                                    {video.thumbnail ? (
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <Play className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-opacity">
                                        <Play className="w-16 h-16 text-white" />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-slate-900 text-left line-clamp-2">
                                        {video.title}
                                    </h3>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
                    <div className="relative w-full max-w-4xl bg-white rounded-lg overflow-hidden">
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>
                        <div className="aspect-video">
                            <iframe
                                src={selectedVideo.url}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-slate-900">
                                {selectedVideo.title}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Specifications and Features */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Specifications
                    </h2>
                    <ul className="space-y-2">
                        {specifications.map((spec, index) => (
                            <li
                                key={index}
                                className="flex items-start space-x-2"
                            >
                                {product.type === "digital" ? (
                                    <Download className="w-5 h-5 text-[#B00000] mt-0.5 shrink-0" />
                                ) : (
                                    <Package className="w-5 h-5 text-[#B00000] mt-0.5 shrink-0" />
                                )}
                                <span className="text-gray-600">{spec}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        Features
                    </h2>
                    <ul className="space-y-2">
                        {features.map((feature, index) => (
                            <li
                                key={index}
                                className="flex items-start space-x-2"
                            >
                                {product.type === "digital" ? (
                                    <Download className="w-5 h-5 text-[#B00000] mt-0.5 shrink-0" />
                                ) : (
                                    <Star className="w-5 h-5 text-[#B00000] mt-0.5 shrink-0" />
                                )}
                                <span className="text-gray-600">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
