"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Package,
    Search,
    X,
    ShieldCheck,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { productsApi, PaginationInfo } from "@/lib/api/products";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, UserDashboardData } from "@/lib/api/types";
import MultiLevelCategoryMenu from "@/components/shop/MultiLevelCategoryMenu";
import Pagination from "@/components/ui/Pagination";

type ProductType = "physical" | "digital";
type DigitalFileFormat = "zip" | "rar";
type SortOption = "name" | "price-asc" | "price-desc";

type ShopProduct = {
    id: string;
    name: string;
    slug: string;
    price: number;
    offerPrice?: number | null;
    image: string;
    category: string;
    categories?: string[];
    type: ProductType;
    inStock?: boolean; // physical only
    isComingSoon?: boolean;
    is_contact_only?: boolean;
    requiresKyc?: boolean;
    requiresKycMultiple?: boolean;
    showPriceBeforeKyc?: boolean;
    weight?: number;
    volumetric_weight?: number;
    extra_shipping_charge?: number;
    origin_city?: string | null;
    origin_state?: string | null;
    origin_pincode?: string | null;
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
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop";

function mapApiProductToShopProduct(p: Product): ShopProduct {
    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        offerPrice: p.offer_price ? Number(p.offer_price) : null,
        image: p.cover_image || FALLBACK_IMAGE,
        category: p.category || "Other",
        categories: p.categories || [],
        type: p.type,
        inStock:
            p.type === "digital"
                ? true
                : p.in_stock ?? (p.stock_quantity ?? 0) > 0,
        isComingSoon: p.is_coming_soon || false,
        is_contact_only: p.is_contact_only || false,
        requiresKyc: p.requires_kyc || false,
        requiresKycMultiple: p.requires_kyc_multiple || false,
        showPriceBeforeKyc: p.show_price_before_kyc || false,
        weight: p.weight,
        volumetric_weight: p.volumetric_weight,
        extra_shipping_charge: p.extra_shipping_charge,
        origin_city: p.origin_city,
        origin_state: p.origin_state,
        origin_pincode: p.origin_pincode,
        digitalFile:
            p.type === "digital"
                ? {
                    format: p.digital_file_format || undefined,
                    filename: p.digital_file_name || undefined,
                }
                : undefined,
        quantity_pricing: p.quantity_pricing || p.tiered_pricing || undefined,
    };
}

function getValidOfferPrice(product: ShopProduct): number | null {
    if (
        typeof product.offerPrice === "number" &&
        product.offerPrice > 0 &&
        product.offerPrice < product.price
    ) {
        return product.offerPrice;
    }

    return null;
}

export default function ShopPage() {
    const { user, isAuth } = useAuth();
    const [userKycStatus, setUserKycStatus] = useState<UserDashboardData["kyc_status"] | null>(null);
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [categoryProducts, setCategoryProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>(
        []
    );
    const [sortBy, setSortBy] = useState<SortOption>("name");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const itemsPerPage = 20;
    const { addToCart, setIsOpen } = useCart();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedCategoryPath]);

    // Fetch products with pagination
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const resp = await productsApi.list({
                    q: debouncedSearch || undefined,
                    categoryPath: selectedCategoryPath.length > 0 ? selectedCategoryPath : undefined,
                    page: currentPage,
                    limit: itemsPerPage,
                });

                if (!mounted) return;
                const list = Array.isArray(resp.data) ? resp.data : [];
                setProducts(list.map(mapApiProductToShopProduct));
                setPagination(resp.pagination || null);

                // Scroll to top when page changes
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e: unknown) {
                if (!mounted) return;
                setError(
                    e instanceof Error ? e.message : "Failed to load products"
                );
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [debouncedSearch, selectedCategoryPath, currentPage, itemsPerPage]);

    // Fetch a stable product catalog to build the category filter.
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const allProducts: ShopProduct[] = [];
                let page = 1;
                let totalPages = 1;

                while (page <= totalPages) {
                    const resp = await productsApi.list({
                        page,
                        limit: 100,
                    });

                    if (!mounted) return;

                    const list = Array.isArray(resp.data) ? resp.data : [];
                    allProducts.push(...list.map(mapApiProductToShopProduct));
                    totalPages = resp.pagination?.totalPages || 1;
                    page += 1;
                }

                if (!mounted) return;
                setCategoryProducts(allProducts);
            } catch (e) {
                if (!mounted) return;
                console.error("Failed to load category filter catalog:", e);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

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

    const filteredProducts = useMemo(() => {
        const sorted = [...products];
        sorted.sort((a, b) => {
            switch (sortBy) {
                case "price-asc": return a.price - b.price;
                case "price-desc": return b.price - a.price;
                default: return a.name.localeCompare(b.name);
            }
        });
        return sorted;
    }, [products, sortBy]);

    const handleAddToCart = (product: ShopProduct) => {
        const isPhysicalInStock =
            product.type !== "physical" ? true : !!product.inStock;
        if (!isPhysicalInStock) return;

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            type: product.type,
            quantity: 1,
            slug: product.slug,
            weight: product.weight,
            volumetric_weight: product.volumetric_weight,
            extra_shipping_charge: product.extra_shipping_charge,
            origin_city: product.origin_city || undefined,
            origin_state: product.origin_state || undefined,
            origin_pincode: product.origin_pincode || undefined,
            quantity_pricing: product.quantity_pricing,
        });

        // Open cart drawer after adding item
        setIsOpen(true);
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">

                    {/* ── Filters sidebar ── */}
                    <aside className="w-40 sm:w-52 shrink-0">
                        <div className="sticky top-20 rounded-lg border border-gray-200 bg-white p-3 sm:p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
                            <MultiLevelCategoryMenu
                                products={categoryProducts.length > 0 ? categoryProducts : products}
                                selectedPath={selectedCategoryPath}
                                onFilterChange={setSelectedCategoryPath}
                            />
                        </div>
                    </aside>

                    {/* ── Main content ── */}
                    <div className="flex-1 min-w-0">

                        {/* Controls bar */}
                        <div className="mb-5 flex items-center gap-2">

                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                <input
                                    type="search"
                                    placeholder="Search products…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-9 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:bg-white focus:border-[#B00000] focus:ring-1 focus:ring-[#B00000] transition-colors"
                                />
                                {searchQuery.trim().length > 0 && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-[#B00000] focus:ring-1 focus:ring-[#B00000] transition-colors shrink-0"
                            >
                                <option value="name">A – Z</option>
                                <option value="price-asc">Price ↑</option>
                                <option value="price-desc">Price ↓</option>
                            </select>

                            {/* Count */}
                            {pagination && (
                                <span className="text-sm text-gray-500 shrink-0 whitespace-nowrap hidden sm:inline">
                                    {filteredProducts.length} of {pagination.total}
                                </span>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Products Grid */}
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                {Array.from({ length: 8 }).map((_, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                                        <div className="h-32 sm:h-48 bg-gray-200" />
                                        <div className="p-3 sm:p-4 space-y-2">
                                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="border border-gray-200 rounded-xl p-12 text-center">
                                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">No products found</p>
                                {(searchQuery || selectedCategoryPath.length > 0) && (
                                    <button
                                        onClick={() => { setSearchQuery(""); setSelectedCategoryPath([]); }}
                                        className="text-sm text-[#B00000] hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                {filteredProducts.map((product) => (
                                    <article
                                        key={product.id}
                                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200 group bg-white flex flex-col"
                                    >
                                {/* Product Image */}
                                <Link href={`/shop/${product.slug}`} className="block overflow-hidden">
                                    <div className="bg-gray-50 h-32 sm:h-48 w-full">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                </Link>

                                {/* Product Info */}
                                <div className="p-2.5 sm:p-4 flex flex-col flex-1">
                                    {/* Product Title */}
                                    <Link href={`/shop/${product.slug}`}>
                                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1.5 line-clamp-2 hover:text-[#B00000] leading-snug">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    {/* Badges */}
                                    <div className="mb-2 flex items-center gap-1 flex-wrap">
                                        {product.isComingSoon && (
                                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] sm:text-xs">
                                                Soon
                                            </span>
                                        )}
                                        {(product.requiresKyc || product.requiresKycMultiple) && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] sm:text-xs">
                                                {product.requiresKyc ? "KYC" : "Bulk KYC"}
                                            </span>
                                        )}
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs ${product.type === "digital"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-green-100 text-green-700"
                                                }`}
                                        >
                                            {product.type === "digital" ? "Digital" : "Physical"}
                                        </span>
                                    </div>

                                    {/* Price and Action Button */}
                                    <div className="mt-auto pt-2 border-t border-gray-100">
                                        {(() => {
                                            const showPriceAndAddToCart = !product.requiresKyc || (
                                                user?.user_type === "business_owner" &&
                                                userKycStatus?.status === "verified"
                                            );
                                            const canShowPrice =
                                                showPriceAndAddToCart ||
                                                product.showPriceBeforeKyc;

                                            if (!canShowPrice) {
                                                return (
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1">
                                                            <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                                                            <p className="text-[10px] sm:text-xs text-amber-700 font-medium">Business KYC Required</p>
                                                        </div>
                                                        <Link
                                                            href="/kyc/product"
                                                            className="w-full text-center px-2 py-1.5 bg-amber-500 text-white text-[10px] sm:text-xs rounded-lg hover:bg-amber-600 transition-colors"
                                                        >
                                                            Update Business KYC
                                                        </Link>
                                                    </div>
                                                );
                                            }

                                            if (product.is_contact_only) {
                                                const offerPrice = getValidOfferPrice(product);
                                                return (
                                                    <div className="flex items-end justify-between gap-1">
                                                        <div>
                                                            {canShowPrice && (
                                                                offerPrice ? (
                                                                    <div>
                                                                        <p className="text-sm sm:text-base font-bold text-[#B00000] leading-none">
                                                                            ₹{offerPrice.toLocaleString()}
                                                                        </p>
                                                                        <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                                                                            ₹{product.price.toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm sm:text-base font-bold text-[#B00000]">
                                                                        ₹{product.price.toLocaleString()}
                                                                    </p>
                                                                )
                                                            )}
                                                        </div>
                                                        <a
                                                            href="https://wa.me/918714388741"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 bg-green-600 text-white text-[10px] sm:text-xs rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            WhatsApp
                                                        </a>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="flex items-end justify-between gap-1">
                                                    <div>
                                                        {(() => {
                                                            const offerPrice = getValidOfferPrice(product);
                                                            if (!canShowPrice) return null;
                                                            if (offerPrice) {
                                                                return (
                                                                    <div>
                                                                        <p className="text-sm sm:text-base font-bold text-[#B00000] leading-none">
                                                                            ₹{offerPrice.toLocaleString()}
                                                                        </p>
                                                                        <p className="text-[10px] sm:text-xs text-gray-400 line-through">
                                                                            ₹{product.price.toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <p className="text-sm sm:text-base font-bold text-[#B00000]">
                                                                    ₹{product.price.toLocaleString()}
                                                                </p>
                                                            );
                                                        })()}
                                                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                                                            {!showPriceAndAddToCart && product.requiresKyc
                                                                ? "KYC required"
                                                                : product.type === "digital"
                                                                ? "Digital"
                                                                : product.inStock
                                                                    ? "In Stock"
                                                                    : "Out of Stock"}
                                                        </p>
                                                    </div>
                                                    {!showPriceAndAddToCart ? (
                                                        <Link
                                                            href="/kyc/product"
                                                            className="shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 bg-amber-500 text-white text-[10px] sm:text-xs rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
                                                        >
                                                            Update KYC
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAddToCart(product)}
                                                            disabled={
                                                                product.isComingSoon ||
                                                                (product.type === "physical" && !product.inStock)
                                                            }
                                                            className="shrink-0 px-2 py-1.5 sm:px-3 sm:py-2 bg-[#B00000] text-white text-[10px] sm:text-xs rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {product.isComingSoon ? "Soon" : "Add"}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                        {/* Pagination */}
                        {!loading && pagination && pagination.totalPages > 1 && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}

                    </div>{/* end main content */}
                </div>{/* end flex row */}
            </div>{/* end max-w container */}

        </div>
    );
}
