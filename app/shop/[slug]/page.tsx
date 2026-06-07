"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Syne } from "next/font/google";
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
    Truck,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { productsApi } from "@/lib/api/products";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, UserDashboardData } from "@/lib/api/types";

// Display font for this page only — the rest of the site keeps Bricolage Grotesque
const syne = Syne({
    subsets: ["latin"],
    weight: ["700", "800"],
    display: "swap",
});

type ProductType = "physical" | "digital";
type DigitalFileFormat = "zip" | "rar";

type ShopProductDetails = {
    id: string;
    name: string;
    slug: string;
    price: number;
    offer_price?: number | null;
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
    stockQuantity?: number | null; // physical only
    isComingSoon?: boolean;
    isContactOnly?: boolean;
    requiresKyc?: boolean;
    requiresKycMultiple?: boolean;
    showPriceBeforeKyc?: boolean;
    weight?: number;
    volumetric_weight?: number;
    extra_shipping_charge?: number;
    origin_city?: string | null;
    origin_state?: string | null;
    origin_pincode?: string | null;
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
        stockQuantity: p.type === "digital" ? null : (p.stock_quantity ?? 0),
        isComingSoon: p.is_coming_soon || false,
        isContactOnly: p.is_contact_only || false,
        requiresKyc: p.requires_kyc || false,
        requiresKycMultiple: p.requires_kyc_multiple || false,
        showPriceBeforeKyc: p.show_price_before_kyc || false,
        weight: p.weight,
        volumetric_weight: p.volumetric_weight,
        extra_shipping_charge: p.extra_shipping_charge,
        origin_city: p.origin_city,
        origin_state: p.origin_state,
        origin_pincode: p.origin_pincode,
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
        offer_price: p.offer_price ? Number(p.offer_price) : null,
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
    const [stockNotice, setStockNotice] = useState<string | null>(null);
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
    const { user, isAuth } = useAuth();
    const [userKycStatus, setUserKycStatus] = useState<UserDashboardData["kyc_status"] | null>(null);

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
            } catch (e) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : "Failed to load product");
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

    // Fetch user KYC status if authenticated
    useEffect(() => {
        let mounted = true;
        if (isAuth && user) {
            (async () => {
                try {
                    const resp = await authApi.getUserDashboard();
                    if (mounted && resp.success && resp.data) {
                        setUserKycStatus(resp.data.kyc_status);
                    }
                } catch (e) {
                    console.error("Failed to load user KYC status:", e);
                }
            })();
        } else {
            setUserKycStatus(null);
        }
        return () => {
            mounted = false;
        };
    }, [isAuth, user]);

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
            setCalculatedPrice((tier.price_per_item * quantity));
            setAppliedTier({ ...tier });
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

    // For physical products with tracked stock, customers can never select more
    // than what's currently available.
    const maxOrderableQuantity =
        product?.type === "physical" && typeof product.stockQuantity === "number"
            ? Math.max(product.stockQuantity, 0)
            : Infinity;

    const handleAddToCart = () => {
        if (!product) return;
        const finalQty = product.type === "digital" ? 1 : quantity;
        const isPhysicalInStock =
            product.type !== "physical" ? true : !!product.inStock;
        if (!isPhysicalInStock) {
            setStockNotice("This product is currently out of stock.");
            return;
        }

        if (product.type === "physical" && finalQty > maxOrderableQuantity) {
            setStockNotice(
                maxOrderableQuantity > 0
                    ? `Only ${maxOrderableQuantity} unit${maxOrderableQuantity === 1 ? "" : "s"} left in stock. Please reduce the quantity.`
                    : "This product is currently out of stock."
            );
            return;
        }

        setStockNotice(null);

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            type: product.type,
            quantity: finalQty,
            slug: product.slug,
            weight: product.weight,
            volumetric_weight: product.volumetric_weight,
            extra_shipping_charge: product.extra_shipping_charge,
            origin_city: product.origin_city || undefined,
            origin_state: product.origin_state || undefined,
            origin_pincode: product.origin_pincode || undefined,
            quantity_pricing: product.quantity_pricing,
            stock_quantity: product.stockQuantity ?? undefined,
        });

        // Open the cart drawer
        setIsOpen(true);
    };

    const requiresKycForSelectedQuantity =
        !!product &&
        (product.requiresKyc ||
            (product.requiresKycMultiple && quantity > 1));

    const showPriceAndAddToCartGlobal = product
        ? (!requiresKycForSelectedQuantity || (
            user?.user_type === "business_owner" &&
            userKycStatus?.status === "verified"
          ))
        : false;

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
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 animate-pulse">
                    <div className="h-4 w-32 bg-[#F8F9FC] rounded mb-3" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-80 bg-[#F8F9FC] rounded-lg" />
                        <div className="space-y-3">
                            <div className="h-3 w-24 bg-[#F8F9FC] rounded" />
                            <div className="h-6 w-3/4 bg-[#F8F9FC] rounded" />
                            <div className="h-8 w-32 bg-[#F8F9FC] rounded" />
                            <div className="h-20 bg-[#F8F9FC] rounded" />
                            <div className="h-10 bg-[#F8F9FC] rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-[#C41E3A]/5 border border-[#C41E3A]/20 rounded-xl p-3 mb-4">
                    <p className="text-sm text-[#C41E3A]">
                        {error || "Product not found"}
                    </p>
                </div>
                <Link
                    href="/shop"
                    className="inline-flex items-center text-[#C41E3A] hover:underline text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-24 lg:pb-10">
            {/* Back Button */}
            <Link
                href="/shop"
                className="inline-flex items-center text-[#6B7280] hover:text-[#C41E3A] mb-3 transition-colors text-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Shop
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                {/* Product Images */}
                <div className="space-y-3">
                    {/* Main Image - Click to open gallery */}
                    <div
                        className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden cursor-pointer hover:border-[#C41E3A] transition-colors"
                        onClick={() => setIsGalleryOpen(true)}
                    >
                        <img
                            src={
                                product.images?.[selectedImageIndex] ||
                                product.image
                            }
                            alt={product.name}
                            className="w-full h-60 sm:h-80 lg:h-96 object-contain"
                        />
                    </div>

                    {/* Image Thumbnails — horizontal scroll so any number fits */}
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden ${selectedImageIndex === index
                                        ? "border-[#C41E3A]"
                                        : "border-[#E5E7EB] hover:border-[#E5E7EB]"
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
                    <div className="hidden sm:flex items-center justify-center gap-1.5 text-xs text-gray-400 py-1">
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
                            <h1 className={`${syne.className} text-lg sm:text-2xl font-bold tracking-[-0.5px] text-[#0D0D14] leading-snug`}>
                                {product.name}
                            </h1>

                            {/* Share & Copy Link Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={handleCopyLink}
                                    className="p-2 rounded-lg border border-[#E5E7EB] hover:border-[#C41E3A] hover:bg-[#C41E3A]/5 transition-colors"
                                    title="Copy link"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Link2 className="w-4 h-4 text-[#6B7280]" />
                                    )}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="p-2 rounded-lg border border-[#E5E7EB] hover:border-[#C41E3A] hover:bg-[#C41E3A]/5 transition-colors"
                                    title="Share"
                                >
                                    <Share2 className="w-4 h-4 text-[#6B7280]" />
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
                            {(product.requiresKyc || product.requiresKycMultiple) && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                                    <ShieldCheck className="w-3 h-3" />
                                    {product.requiresKyc
                                        ? "KYC Required"
                                        : "Bulk KYC"}
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

                        {/* Verify KYC conditions */}
                        {(() => {
                            const showPriceAndAddToCart = !requiresKycForSelectedQuantity || (
                                user?.user_type === "business_owner" &&
                                userKycStatus?.status === "verified"
                            );
                            const canShowPrice =
                                showPriceAndAddToCart ||
                                product.showPriceBeforeKyc;

                            if (!canShowPrice) {
                                return (
                                    <div className="flex flex-col w-full gap-3 mt-4 mb-4 p-4 border rounded-lg bg-amber-50 border-amber-200">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-amber-600" />
                                            <h3 className="text-sm font-semibold text-amber-900">Business KYC Required</h3>
                                        </div>
                                        <p className="text-xs text-amber-800">
                                            {product.requiresKycMultiple && !product.requiresKyc
                                                ? "You need an approved Business KYC to buy more than one unit of this product."
                                                : "You need an approved Business KYC to view pricing and purchase this product."}
                                        </p>
                                        <Link
                                            href="/kyc/product"
                                            className="w-full text-center px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors mt-2"
                                        >
                                            Update Business KYC
                                        </Link>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    {/* Price */}
                                    <div className="mb-3 pb-3 border-b border-[#E5E7EB]">
                                        {product.isContactOnly ? (
                                            // Contact Only Product
                                            <>
                                                {canShowPrice ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-2xl sm:text-3xl font-bold text-[#C41E3A]">
                                                            ₹{product.price.toLocaleString("en-IN")}
                                                        </p>
                                                    </div>
                                                ) : null}
                                                <p className="text-xs text-[#6B7280] mt-1">
                                                    {product.type === "digital" ? "Digital Product" : "Physical Product"} • Please contact us via WhatsApp
                                                </p>
                                            </>
                                        ) : (
                                            // Normal Product
                                            <>
                                                {canShowPrice ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-2xl sm:text-3xl font-bold text-[#C41E3A]">
                                                            ₹{(product.offer_price && product.offer_price > 0 ? product.offer_price : product.price).toLocaleString("en-IN")}
                                                        </p>
                                                        {product.offer_price && product.offer_price > 0 && product.offer_price < product.price && (
                                                            <span className="text-base text-gray-400 line-through">
                                                                ₹{product.price.toLocaleString("en-IN")}
                                                            </span>
                                                        )}
                                                        {product.type !== "digital" && quantity > 1 && (
                                                            <span className="text-xs text-[#6B7280]">
                                                                per item
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : null}
                                                <p className="text-xs text-[#6B7280] mt-1">
                                                    {!showPriceAndAddToCart && requiresKycForSelectedQuantity
                                                        ? product.requiresKycMultiple && !product.requiresKyc
                                                            ? "Business KYC required for quantities above 1"
                                                            : "Business KYC required to purchase"
                                                        : product.type === "digital"
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
                                    {canShowPrice &&
                                        product.type !== "digital" &&
                                        product.quantity_pricing &&
                                        product.quantity_pricing.length > 0 &&
                                        (product.quantity_pricing.length > 1 || Number(product.quantity_pricing[0]?.min_qty || 1) > 1) && (
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
                                                                    <span className="text-[#6B7280]">
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
                                                <span className="text-xs font-medium text-[#6B7280]">Language:</span>
                                                <div className="flex gap-1">
                                                    {product.english_description && (
                                                        <button
                                                            onClick={() => setSelectedLanguage('en')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedLanguage === 'en'
                                                                ? 'bg-[#C41E3A] text-white'
                                                                : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            English
                                                        </button>
                                                    )}
                                                    {product.malayalam_description && (
                                                        <button
                                                            onClick={() => setSelectedLanguage('ml')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedLanguage === 'ml'
                                                                ? 'bg-[#C41E3A] text-white'
                                                                : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            മലയാളം
                                                        </button>
                                                    )}
                                                    {product.hindi_description && (
                                                        <button
                                                            onClick={() => setSelectedLanguage('hi')}
                                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${selectedLanguage === 'hi'
                                                                ? 'bg-[#C41E3A] text-white'
                                                                : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            हिन्दी
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Description Text */}
                                        <div className="prose prose-sm max-w-none text-[#6B7280]">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[rehypeRaw]}
                                                components={{
                                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 text-[#0D0D14]" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 text-[#0D0D14]" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-1 text-[#0D0D14]" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-bold text-[#0D0D14]" {...props} />,
                                                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                                                    a: ({ node, ...props }) => <a className="text-[#C41E3A] hover:underline" {...props} />,
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
                                                    href="https://wa.me/918714388741"
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
                                                <div className="mb-4 flex items-center gap-2 p-3 border border-[#E5E7EB] rounded-lg bg-[#F8F9FC]">
                                                    <Download className="w-4 h-4 text-[#C41E3A] shrink-0" />
                                                    <p className="text-sm text-[#6B7280]">
                                                        Digital download after payment
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="mb-4">
                                                    <label className="block text-xs font-medium text-[#6B7280] mb-2">
                                                        Quantity
                                                    </label>
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <button
                                                            onClick={() => {
                                                                setStockNotice(null);
                                                                setQuantity(
                                                                    Math.max(1, quantity - 1)
                                                                );
                                                            }}
                                                            className="w-9 h-9 border border-[#E5E7EB] rounded hover:bg-[#F8F9FC] text-sm"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-10 text-center font-medium text-sm">
                                                            {quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                if (quantity >= maxOrderableQuantity) {
                                                                    setStockNotice(
                                                                        `Only ${maxOrderableQuantity} unit${maxOrderableQuantity === 1 ? "" : "s"} available in stock.`
                                                                    );
                                                                    return;
                                                                }
                                                                setStockNotice(null);
                                                                setQuantity(quantity + 1);
                                                            }}
                                                            disabled={quantity >= maxOrderableQuantity}
                                                            className="w-9 h-9 border border-[#E5E7EB] rounded hover:bg-[#F8F9FC] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {Number.isFinite(maxOrderableQuantity) && maxOrderableQuantity > 0 && (
                                                        <p className="mb-2 text-xs text-[#6B7280]">
                                                            Only {maxOrderableQuantity} unit{maxOrderableQuantity === 1 ? "" : "s"} left in stock
                                                        </p>
                                                    )}

                                                    {stockNotice && (
                                                        <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                                            {stockNotice}
                                                        </p>
                                                    )}

                                                    {product.requiresKycMultiple && !product.requiresKyc && (
                                                        <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                            1 unit can be purchased normally. Business KYC is required for quantities above 1.
                                                        </p>
                                                    )}

                                                    {/* Total Price with Discount Display */}
                                                    <div className="p-3 bg-[#F8F9FC] rounded-lg border border-[#E5E7EB]">
                                                        <div className="flex justify-between items-center text-sm text-[#6B7280] mb-1">
                                                            <span>Subtotal:</span>
                                                            <span className="font-medium text-[#0D0D14]">
                                                                ₹
                                                                {((appliedTier ? appliedTier.price_per_item : product.price) * quantity).toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="mb-2 pb-2 border-b border-[#E5E7EB]" />

                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-semibold text-[#0D0D14]">
                                                                Total:
                                                            </span>
                                                            <span className="text-lg sm:text-xl font-bold text-[#C41E3A]">
                                                                ₹
                                                                {calculatedPrice.toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </span>
                                                        </div>

                                                        {appliedTier && Number(appliedTier.min_qty || 1) > 1 && (product.price * quantity) - (appliedTier.price_per_item * quantity) > 0 && (
                                                            <div className="text-xs text-green-600 mt-2 flex items-center gap-1 bg-green-50 p-1.5 rounded-md border border-green-100">
                                                                <span className="font-semibold">
                                                                    Discount applied
                                                                </span>
                                                                <span>
                                                                    • Save ₹
                                                                    {(
                                                                        (product.price * quantity) - (appliedTier.price_per_item * quantity)
                                                                    ).toLocaleString("en-IN")}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Delivery Estimates */}
                                                    <div className="mt-3 p-3 bg-[#F8F9FC] border border-[#E5E7EB] rounded-lg">
                                                        <p className="text-xs font-semibold text-[#0D0D14] mb-1.5 flex items-center gap-1.5">
                                                            <Truck className="w-3.5 h-3.5 text-[#C41E3A]" />
                                                            Estimated Delivery
                                                        </p>
                                                        <ul className="text-[11px] text-[#6B7280] space-y-1">
                                                            <li className="flex justify-between">
                                                                <span>Within Kerala:</span>
                                                                <span className="font-medium">2–3 business days</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span>Outside Kerala:</span>
                                                                <span className="font-medium">3–10 business days</span>
                                                            </li>
                                                        </ul>
                                                        <p className="text-[10px] text-gray-400 mt-2 italic">
                                                            * For any courier-related queries (Road or Air), please contact us via WhatsApp within 12 hours of placing your order.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Add to Cart Button */}
                                            <button
                                                onClick={() => {
                                                    if (showPriceAndAddToCart) {
                                                        handleAddToCart();
                                                    }
                                                }}
                                                disabled={
                                                    !showPriceAndAddToCart ||
                                                    product.isComingSoon ||
                                                    (product.type === "physical" &&
                                                        !product.inStock)
                                                }
                                                className="w-full px-4 py-3 bg-[#C41E3A] text-white rounded-xl text-sm font-semibold hover:bg-[#8B0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                <span>
                                                    {!showPriceAndAddToCart
                                                        ? "KYC Required"
                                                        : product.isComingSoon
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
                                </>
                            );
                        })()}

                        {/* Stock Status - Hide for contact-only products */}
                        {!product.isContactOnly && (
                            <div className="flex items-center gap-1.5 mt-3">
                                {product.isComingSoon ? (
                                    <>
                                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                        <span className="text-xs text-[#6B7280]">
                                            Coming Soon
                                        </span>
                                    </>
                                ) : product.type === "digital" ? (
                                    <>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        <span className="text-xs text-[#6B7280]">
                                            Digital product
                                        </span>
                                    </>
                                ) : product.inStock ? (
                                    <>
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span className="text-xs text-[#6B7280]">
                                            In Stock
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        <span className="text-xs text-[#6B7280]">
                                            Out of Stock
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Product Documents - Brochure */}
                        {product.product_detail_pdf && (
                            <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                                <h3 className="text-sm font-medium text-[#0D0D14] mb-3">Product Documents</h3>
                                <a
                                    href={product.product_detail_pdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-[#F8F9FC] border border-[#E5E7EB] rounded-lg hover:border-[#C41E3A] hover:bg-[#C41E3A]/5 transition-all group"
                                >
                                    <div className="p-2 bg-white rounded-md border border-[#E5E7EB] group-hover:border-[#C41E3A]/30">
                                        <FileText className="w-5 h-5 text-[#C41E3A]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#0D0D14] group-hover:text-[#C41E3A]">
                                            Download Product Brochure
                                        </p>
                                        <p className="text-xs text-[#6B7280]">
                                            PDF Specification Sheet
                                        </p>
                                    </div>
                                    <Download className="w-4 h-4 text-gray-400 ml-auto group-hover:text-[#C41E3A]" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Videos Section */}
            {product.videos && product.videos.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-[#0D0D14] mb-4">
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
                                    className="group relative bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:border-[#C41E3A] transition-colors"
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
                                        <h3 className="text-sm font-medium text-[#0D0D14] text-left line-clamp-2">
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
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedVideo(null)}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="relative w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-2xl pointer-events-auto">
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-[#6B7280]" />
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
                                <h3 className="text-xl font-semibold text-[#0D0D14]">
                                    {selectedVideo.title}
                                </h3>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile sticky bottom CTA */}
            {product && !product.isContactOnly && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center gap-3 shadow-lg">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#6B7280] truncate">{product.name}</p>
                        {showPriceAndAddToCartGlobal ? (
                            <p className="text-base font-bold text-[#C41E3A]">
                                ₹{(product.offer_price && product.offer_price > 0 && product.offer_price < product.price ? product.offer_price : product.price).toLocaleString("en-IN")}
                            </p>
                        ) : (
                            <p className="text-xs text-amber-700 font-medium">KYC Required</p>
                        )}
                    </div>
                    {product.isComingSoon ? (
                        <span className="px-4 py-2.5 bg-gray-200 text-[#6B7280] text-sm font-medium rounded-xl">Coming Soon</span>
                    ) : product.isContactOnly ? null : (
                        <button
                            onClick={() => { if (showPriceAndAddToCartGlobal) handleAddToCart(); }}
                            disabled={!showPriceAndAddToCartGlobal || (product.type === "physical" && !product.inStock)}
                            className="shrink-0 px-5 py-2.5 bg-[#C41E3A] text-white text-sm font-medium rounded-xl hover:bg-[#8B0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            {!showPriceAndAddToCartGlobal ? "KYC Required" : product.type === "physical" && !product.inStock ? "Out of Stock" : "Add to Cart"}
                        </button>
                    )}
                </div>
            )}

            {/* Specifications and Features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
                    <h2 className="text-sm font-semibold text-[#0D0D14] mb-3">
                        Specifications
                    </h2>
                    <ul className="space-y-1.5">
                        {specifications.map((spec, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                            >
                                {product.type === "digital" ? (
                                    <Download className="w-3.5 h-3.5 text-[#C41E3A] mt-0.5 shrink-0" />
                                ) : (
                                    <Package className="w-3.5 h-3.5 text-[#C41E3A] mt-0.5 shrink-0" />
                                )}
                                <span className="text-[#6B7280]">{spec}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
                    <h2 className="text-sm font-semibold text-[#0D0D14] mb-3">
                        Features
                    </h2>
                    <ul className="space-y-1.5">
                        {features.map((feature, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 text-sm"
                            >
                                {product.type === "digital" ? (
                                    <Download className="w-3.5 h-3.5 text-[#C41E3A] mt-0.5 shrink-0" />
                                ) : (
                                    <Star className="w-3.5 h-3.5 text-[#C41E3A] mt-0.5 shrink-0" />
                                )}
                                <span className="text-[#6B7280]">{feature}</span>
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
                                                ? "border-[#C41E3A] scale-110"
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
