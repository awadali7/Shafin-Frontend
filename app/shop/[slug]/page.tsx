"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
    ArrowLeft,
    Download,
    Package,
    ShoppingCart,
    Star,
    Play,
    X,
    ShieldCheck,
    Link2,
    Share2,
    Check,
    FileText,
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
    isContactOnly?: boolean;
    requiresKyc?: boolean;
    description: string;
    english_description?: string;
    malayalam_description?: string;
    hindi_description?: string;
    product_detail_pdf?: string;
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
        isContactOnly: p.is_contact_only || false,
        requiresKyc: p.requires_kyc || false,
        description:
            p.description ||
            (p.type === "digital"
                ? "Digital product. Download available after payment."
                : "Physical product. Shipping available."),
        english_description: p.english_description,
        malayalam_description: p.malayalam_description,
        hindi_description: p.hindi_description,
        product_detail_pdf: p.product_detail_pdf,
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
    const [copied, setCopied] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ml' | 'hi'>('en');
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

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
                `Format: ${product.digitalFile?.format?.toUpperCase() || "DIGITAL"
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

    const handleCopyLink = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        const text = `Check out ${product?.name} on our shop!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: product?.name,
                    text: text,
                    url: url,
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback to copy link
            handleCopyLink();
        }
    };

    // Convert YouTube URL to embed format
    const convertToEmbedUrl = (videoUrl: string): string => {
        if (!videoUrl) return videoUrl;

        // Extract YouTube video ID from various URL formats
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = videoUrl.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) {
            const videoId = youtubeMatch[1];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // Extract Vimeo video ID
        const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
        const vimeoMatch = videoUrl.match(vimeoRegex);
        if (vimeoMatch && vimeoMatch[1]) {
            const videoId = vimeoMatch[1];
            return `https://player.vimeo.com/video/${videoId}`;
        }

        // If already an embed URL or unrecognized format, return as-is
        return videoUrl;
    };

    // Get video thumbnail from URL if not provided
    const getVideoThumbnail = (videoUrl: string): string | null => {
        if (!videoUrl) return null;

        // YouTube thumbnail - use hqdefault which is more reliable than maxresdefault
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = videoUrl.match(youtubeRegex);
        if (youtubeMatch && youtubeMatch[1]) {
            // Use hqdefault.jpg - it's available for all YouTube videos
            return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
        }

        // Vimeo thumbnail (use a default pattern)
        const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
        const vimeoMatch = videoUrl.match(vimeoRegex);
        if (vimeoMatch && vimeoMatch[1]) {
            // Vimeo thumbnails require API call, so we'll use a placeholder
            // You could implement a backend endpoint to fetch Vimeo thumbnails if needed
            return null; // Will fall back to Play icon
        }

        return null;
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
                <div className="space-y-3">
                    {/* Main Image - Click to open gallery */}
                    <div
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-[#B00000] transition-colors"
                        onClick={() => setIsGalleryOpen(true)}
                    >
                        <img
                            src={
                                product.images?.[selectedImageIndex] ||
                                product.image
                            }
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
                                    className={`relative border-2 rounded-lg overflow-hidden aspect-square ${selectedImageIndex === index
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

                    {/* Click to view hint */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 py-1.5">
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                        <span>Click image to view gallery</span>
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                    <div>
                        {/* Product Title */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h1 className="text-2xl font-bold text-slate-900">
                                {product.name}
                            </h1>

                            {/* Share & Copy Link Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={handleCopyLink}
                                    className="p-2 rounded-lg border border-gray-300 hover:border-[#B00000] hover:bg-red-50 transition-colors"
                                    title="Copy link"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Link2 className="w-4 h-4 text-gray-600" />
                                    )}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="p-2 rounded-lg border border-gray-300 hover:border-[#B00000] hover:bg-red-50 transition-colors"
                                    title="Share"
                                >
                                    <Share2 className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Badges Row */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                            {/* Coming Soon Badge */}
                            {product.isComingSoon && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-orange-50 text-orange-700 border-orange-200">
                                    🚀 Coming Soon
                                </span>
                            )}

                            {/* KYC Required Badge */}
                            {product.requiresKyc && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                                    <ShieldCheck className="w-3 h-3" />
                                    KYC Required
                                </span>
                            )}

                            {/* Product Type Badge */}
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${product.type === "digital"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}
                            >
                                {product.type === "digital" ? (
                                    <Download className="w-3 h-3" />
                                ) : (
                                    <Package className="w-3 h-3" />
                                )}
                                {product.type === "digital"
                                    ? `${product.digitalFile?.format?.toUpperCase() ||
                                    "DIGITAL"
                                    }`
                                    : "PHYSICAL"}
                            </span>
                        </div>

                        {/* Price */}
                        <div className="mb-3 pb-3 border-b border-gray-200">
                            {product.isContactOnly ? (
                                // Contact Only Product
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-[#B00000]">
                                            ₹{product.price.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {product.type === "digital" ? "Digital Product" : "Physical Product"} • Please contact us via WhatsApp
                                    </p>
                                </>
                            ) : (
                                // Normal Product
                                <>
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
                                            ? `Instant download (${product.digitalFile?.format?.toUpperCase() ||
                                            "DIGITAL"
                                            })`
                                            : product.inStock
                                                ? "In Stock"
                                                : "Out of Stock"}
                                    </p>
                                </>
                            )}
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

                        {/* Description with Language Selector */}
                        <div className="mb-4">
                            {/* Language Selector - Only show if multi-language descriptions exist */}
                            {(product.english_description || product.malayalam_description || product.hindi_description) && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-medium text-gray-500">Language:</span>
                                    <div className="flex gap-1">
                                        {product.english_description && (
                                            <button
                                                onClick={() => setSelectedLanguage('en')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedLanguage === 'en'
                                                    ? 'bg-[#B00000] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                English
                                            </button>
                                        )}
                                        {product.malayalam_description && (
                                            <button
                                                onClick={() => setSelectedLanguage('ml')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedLanguage === 'ml'
                                                    ? 'bg-[#B00000] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                മലയാളം
                                            </button>
                                        )}
                                        {product.hindi_description && (
                                            <button
                                                onClick={() => setSelectedLanguage('hi')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedLanguage === 'hi'
                                                    ? 'bg-[#B00000] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                हिन्दी
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description Text */}
                            <div className="prose prose-sm max-w-none text-gray-600">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 text-gray-900" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 text-gray-900" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-1 text-gray-900" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                        li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-[#B00000] hover:underline" {...props} />,
                                    }}
                                >
                                    {selectedLanguage === 'en' && product.english_description
                                        ? product.english_description
                                        : selectedLanguage === 'ml' && product.malayalam_description
                                            ? product.malayalam_description
                                            : selectedLanguage === 'hi' && product.hindi_description
                                                ? product.hindi_description
                                                : product.description}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Contact Only or Normal Purchase Options */}
                        {product.isContactOnly ? (
                            // Contact Only Product - WhatsApp Button
                            <div className="space-y-3">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-900 font-medium mb-2">
                                        📱 Contact via WhatsApp
                                    </p>
                                    <p className="text-xs text-green-700 mb-3">
                                        This product requires direct contact. Our team will assist you with pricing, availability, and customization options.
                                    </p>
                                    <a
                                        href="https://wa.me/919037313107"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        Chat on WhatsApp
                                    </a>
                                </div>
                            </div>
                        ) : (
                            // Normal Product - Quantity and Cart
                            <>
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
                            </>
                        )}

                        {/* Stock Status - Hide for contact-only products */}
                        {!product.isContactOnly && (
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
                        )}

                        {/* Product Documents - Brochure */}
                        {product.product_detail_pdf && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Product Documents</h3>
                                <a
                                    href={product.product_detail_pdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#B00000] hover:bg-red-50 transition-all group"
                                >
                                    <div className="p-2 bg-white rounded-md border border-gray-200 group-hover:border-red-200">
                                        <FileText className="w-5 h-5 text-[#B00000]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 group-hover:text-[#B00000]">
                                            Download Product Brochure
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PDF Specification Sheet
                                        </p>
                                    </div>
                                    <Download className="w-4 h-4 text-gray-400 ml-auto group-hover:text-[#B00000]" />
                                </a>
                            </div>
                        )}
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
                        {product.videos.map((video, index) => {
                            // Auto-generate YouTube thumbnail from URL
                            const thumbnailUrl = getVideoThumbnail(video.url);

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedVideo(video)}
                                    className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#B00000] transition-colors"
                                >
                                    <div className="relative aspect-video bg-gray-900">
                                        {thumbnailUrl ? (
                                            <>
                                                <img
                                                    src={thumbnailUrl}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // If thumbnail fails to load, hide it
                                                        e.currentTarget.style.display = 'none';
                                                        // Show the fallback play icon instead
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            const fallback = parent.querySelector('.fallback-icon');
                                                            if (fallback) {
                                                                (fallback as HTMLElement).style.display = 'flex';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="fallback-icon absolute inset-0 hidden items-center justify-center">
                                                    <Play className="w-12 h-12 text-white opacity-80" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Play className="w-12 h-12 text-white opacity-80" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center ">
                                            <Play className="w-16 h-16 text-white" />
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-sm font-medium text-slate-900 text-left line-clamp-2">
                                            {video.title}
                                        </h3>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {selectedVideo && (
                <>
                    {/* Backdrop Overlay */}
                    <div
                        className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
                        onClick={() => setSelectedVideo(null)}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="relative w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-2xl pointer-events-auto">
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-700" />
                            </button>
                            <div className="aspect-video">
                                <iframe
                                    src={convertToEmbedUrl(selectedVideo.url)}
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
                </>
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

            {/* Image Gallery Modal */}
            {isGalleryOpen && product.images && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/90"
                        onClick={() => setIsGalleryOpen(false)}
                    />

                    {/* Gallery Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsGalleryOpen(false)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Main Image */}
                        <div className="relative max-w-6xl w-full">
                            <img
                                src={product.images[selectedImageIndex]}
                                alt={`${product.name} ${selectedImageIndex + 1}`}
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                            />

                            {/* Navigation Arrows */}
                            {product.images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImageIndex((prev) =>
                                                prev === 0 ? product.images!.length - 1 : prev - 1
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
                                                prev === product.images!.length - 1 ? 0 : prev + 1
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
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm rounded-full">
                                {selectedImageIndex + 1} / {product.images.length}
                            </div>
                        </div>

                        {/* Thumbnail Strip */}
                        {product.images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-4xl w-full px-4">
                                <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
                                    {product.images.map((img, index) => (
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
                                                src={img}
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
        </div>
    );
}
