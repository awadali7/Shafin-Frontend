"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Download,
    Package,
    ShoppingCart,
    Star,
    Play,
    X,
} from "lucide-react";
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
    categories?: string[];
    type: ProductType;
    rating: number;
    reviews: number;
    inStock?: boolean; // physical only
    isComingSoon?: boolean;
    description: string;
    digitalFile?: {
        format?: DigitalFileFormat;
        filename?: string;
    };
    quantity_pricing?: Array<{
        min_qty: number;
        max_qty: number | null;
        price_per_item: number;
        courier_charge?: number;
    }>;
};

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop";

function mapApiProductToDetails(p: Product): ShopProductDetails {
    const allImages =
        p.images && p.images.length > 0
            ? p.images
            : p.cover_image
            ? [p.cover_image]
            : [FALLBACK_IMAGE];

    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        image: allImages[0] || FALLBACK_IMAGE,
        images: allImages,
        videos: p.videos || [],
        category: p.category || "Other",
        categories: p.categories || [],
        type: p.type,
        rating: Number(p.rating ?? 0),
        reviews: Number(p.reviews_count ?? 0),
        inStock:
            p.type === "digital"
                ? true
                : p.in_stock ?? (p.stock_quantity ?? 0) > 0,
        isComingSoon: p.is_coming_soon || false,
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
        quantity_pricing: p.tiered_pricing || p.quantity_pricing || undefined,
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
    const [selectedVideo, setSelectedVideo] = useState<{
        title: string;
        url: string;
    } | null>(null);
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [appliedTier, setAppliedTier] = useState<{
        min_qty: number;
        max_qty: number | null;
        price_per_item: number;
    } | null>(null);
    const [showMagnifier, setShowMagnifier] = useState(false);
    const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

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

    // Calculate price based on quantity and tiered pricing
    useEffect(() => {
        if (!product) return;

        if (
            !product.quantity_pricing ||
            product.quantity_pricing.length === 0
        ) {
            setCalculatedPrice(product.price * quantity);
            setAppliedTier(null);
            return;
        }

        // Find tier that matches this quantity range
        const tier = product.quantity_pricing.find((t) => {
            const minQty = t.min_qty || 1;
            const maxQty = t.max_qty || Infinity;
            return quantity >= minQty && quantity <= maxQty;
        });

        if (tier) {
            const courierCharge = tier.courier_charge || 0;
            setCalculatedPrice((tier.price_per_item * quantity) + courierCharge);
            setAppliedTier(tier);
        } else {
            setCalculatedPrice(product.price * quantity);
            setAppliedTier(null);
        }
    }, [quantity, product]);

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
            quantity_pricing: product.quantity_pricing,
        });

        // Open the cart drawer
        setIsOpen(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const elem = e.currentTarget;
        const { left, top, width, height } = elem.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMagnifierPosition({ x, y });
        setImageSize({ width, height });
    };

    const handleMouseEnter = () => {
        setShowMagnifier(true);
    };

    const handleMouseLeave = () => {
        setShowMagnifier(false);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="h-4 w-32 bg-gray-100 rounded mb-3" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-80 bg-gray-100 rounded-lg" />
                        <div className="space-y-3">
                            <div className="h-3 w-24 bg-gray-100 rounded" />
                            <div className="h-6 w-3/4 bg-gray-100 rounded" />
                            <div className="h-8 w-32 bg-gray-100 rounded" />
                            <div className="h-20 bg-gray-100 rounded" />
                            <div className="h-10 bg-gray-100 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600">
                        {error || "Product not found"}
                    </p>
                </div>
                <Link
                    href="/shop"
                    className="inline-flex items-center text-[#B00000] hover:underline text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Back Button */}
            <Link
                href="/shop"
                className="inline-flex items-center text-gray-600 hover:text-[#B00000] mb-4 transition-colors text-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Shop
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Images */}
                <div className="space-y-3 lg:relative">
                    {/* Main Image with Magnifier */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
                        <div
                            className="relative cursor-crosshair"
                            onMouseMove={handleMouseMove}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <img
                                src={
                                    product.images?.[selectedImageIndex] ||
                                    product.image
                                }
                                alt={product.name}
                                className="w-full h-96 object-cover"
                            />

                            {/* Magnifier Lens Indicator */}
                            {showMagnifier && (
                                <div
                                    className="absolute pointer-events-none border-2 border-[#B00000] bg-white/30 backdrop-blur-[1px]"
                                    style={{
                                        width: "120px",
                                        height: "120px",
                                        left: `calc(${magnifierPosition.x}% - 60px)`,
                                        top: `calc(${magnifierPosition.y}% - 60px)`,
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Magnified View - Positioned outside main image container */}
                    {showMagnifier && (
                        <div className="hidden lg:block absolute left-full top-0 ml-4 w-96 h-96 border-2 border-[#B00000] rounded-lg shadow-2xl bg-white overflow-hidden z-50">
                            <div
                                className="w-full h-full"
                                style={{
                                    backgroundImage: `url(${
                                        product.images?.[selectedImageIndex] ||
                                        product.image
                                    })`,
                                    backgroundSize: `${imageSize.width * 2}px ${
                                        imageSize.height * 2
                                    }px`,
                                    backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
                                    backgroundRepeat: "no-repeat",
                                }}
                            />
                        </div>
                    )}

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

                    {/* Magnifier Hint */}
                    <div className="hidden lg:flex items-center justify-center gap-1.5 text-xs text-gray-500 py-1.5">
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                        </svg>
                        <span>Hover to zoom</span>
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                    <div>
                        {/* Product Title & Category */}
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            {product.name}
                        </h1>

                        {/* Category Breadcrumb & Coming Soon Badge Row */}
                        <div className="flex items-center gap-3 mb-3">
                            {/* Category Breadcrumb */}
                            {(product.categories &&
                            product.categories.length > 0
                                ? product.categories
                                : product.category
                                ? [product.category]
                                : []
                            ).filter((cat) => cat && cat.trim()).length > 0 && (
                                <div className="flex items-center gap-1.5 text-xs">
                                    {(product.categories &&
                                    product.categories.length > 0
                                        ? product.categories
                                        : product.category
                                        ? [product.category]
                                        : []
                                    )
                                        .filter((cat) => cat && cat.trim())
                                        .map((cat, idx, arr) => (
                                            <React.Fragment key={idx}>
                                                <span className="text-[#B00000] font-medium">
                                                    {cat}
                                                </span>
                                                {idx < arr.length - 1 && (
                                                    <span className="text-gray-400">
                                                        ›
                                                    </span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                </div>
                            )}

                            {/* Coming Soon Badge */}
                            {product.isComingSoon && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-orange-50 text-orange-700 border-orange-200">
                                    🚀 Coming Soon
                                </span>
                            )}
                        </div>

                        {/* Price */}
                        <div className="mb-3 pb-3 border-b border-gray-200">
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-[#B00000]">
                                    ₹{product.price.toLocaleString("en-IN")}
                                </p>
                                {product.type !== "digital" && quantity > 1 && (
                                    <span className="text-xs text-gray-500">
                                        per item
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                {product.type === "digital"
                                    ? `Instant download (${
                                          product.digitalFile?.format?.toUpperCase() ||
                                          "DIGITAL"
                                      })`
                                    : product.inStock
                                    ? "In Stock"
                                    : "Out of Stock"}
                            </p>
                        </div>

                        {/* Tiered Pricing - Minimal */}
                        {product.type !== "digital" &&
                            product.quantity_pricing &&
                            product.quantity_pricing.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                    <h3 className="font-semibold text-green-900 text-sm mb-2">
                                        Bulk Discounts Available
                                    </h3>
                                    <div className="space-y-1.5">
                                        {product.quantity_pricing
                                            .sort(
                                                (a, b) =>
                                                    (a.min_qty || 1) -
                                                    (b.min_qty || 1)
                                            )
                                            .map((tier, idx) => {
                                                const pricePerItem =
                                                    tier.price_per_item;
                                                const savingsPerItem =
                                                    product.price -
                                                    pricePerItem;
                                                const savingsPercent =
                                                    product.price > 0
                                                        ? (
                                                              (savingsPerItem /
                                                                  product.price) *
                                                              100
                                                          ).toFixed(0)
                                                        : "0";
                                                const rangeText = tier.max_qty
                                                    ? `${tier.min_qty}-${tier.max_qty}`
                                                    : `${tier.min_qty}+`;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex justify-between items-center text-sm"
                                                    >
                                                        <span className="text-gray-700">
                                                            {rangeText} items
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-green-700">
                                                                ₹
                                                                {pricePerItem.toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </span>
                                                            {savingsPerItem >
                                                                0 && (
                                                                <span className="text-xs text-green-600">
                                                                    (
                                                                    {
                                                                        savingsPercent
                                                                    }
                                                                    % off)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            {product.description}
                        </p>

                        {/* Quantity / Delivery */}
                        {product.type === "digital" ? (
                            <div className="mb-4 flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <Download className="w-4 h-4 text-[#B00000] shrink-0" />
                                <p className="text-sm text-gray-700">
                                    Digital download after payment
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Quantity
                                </label>
                                <div className="flex items-center space-x-2 mb-2">
                                    <button
                                        onClick={() =>
                                            setQuantity(
                                                Math.max(1, quantity - 1)
                                            )
                                        }
                                        className="w-9 h-9 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                    >
                                        -
                                    </button>
                                    <span className="w-10 text-center font-medium text-sm">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setQuantity(quantity + 1)
                                        }
                                        className="w-9 h-9 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Total Price with Discount Display */}
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">
                                            Total:
                                        </span>
                                        <span className="text-xl font-bold text-[#B00000]">
                                            ₹
                                            {calculatedPrice.toLocaleString(
                                                "en-IN"
                                            )}
                                        </span>
                                    </div>
                                    {appliedTier && (
                                        <div className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                                            <span className="font-semibold">
                                                Discount applied
                                            </span>
                                            <span>
                                                • Save ₹
                                                {(
                                                    product.price * quantity -
                                                    calculatedPrice
                                                ).toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={
                                product.isComingSoon ||
                                (product.type === "physical" &&
                                    !product.inStock)
                            }
                            className="w-full px-4 py-2.5 bg-[#B00000] text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span>
                                {product.isComingSoon
                                    ? "Coming Soon"
                                    : product.type === "digital"
                                    ? "Add to Cart"
                                    : product.inStock
                                    ? "Add to Cart"
                                    : "Out of Stock"}
                            </span>
                        </button>

                        {/* Stock Status */}
                        <div className="flex items-center gap-1.5 mt-3">
                            {product.isComingSoon ? (
                                <>
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                    <span className="text-xs text-gray-600">
                                        Coming Soon
                                    </span>
                                </>
                            ) : product.type === "digital" ? (
                                <>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    <span className="text-xs text-gray-600">
                                        Digital product
                                    </span>
                                </>
                            ) : product.inStock ? (
                                <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-xs text-gray-600">
                                        In Stock
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                                    <span className="text-xs text-gray-600">
                                        Out of Stock
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Videos Section */}
            {product.videos && product.videos.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                        Product Videos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-slate-900 mb-3">
                        Specifications
                    </h2>
                    <ul className="space-y-1.5">
                        {specifications.map((spec, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                            >
                                {product.type === "digital" ? (
                                    <Download className="w-3.5 h-3.5 text-[#B00000] mt-0.5 shrink-0" />
                                ) : (
                                    <Package className="w-3.5 h-3.5 text-[#B00000] mt-0.5 shrink-0" />
                                )}
                                <span className="text-gray-600">{spec}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-slate-900 mb-3">
                        Features
                    </h2>
                    <ul className="space-y-1.5">
                        {features.map((feature, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                            >
                                {product.type === "digital" ? (
                                    <Download className="w-3.5 h-3.5 text-[#B00000] mt-0.5 shrink-0" />
                                ) : (
                                    <Star className="w-3.5 h-3.5 text-[#B00000] mt-0.5 shrink-0" />
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
