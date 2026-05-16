"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Package,
    Search,
    X,
    ShieldCheck,
    SlidersHorizontal,
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
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
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
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex gap-6">

                    {/* ── Filters sidebar — desktop only ── */}
                    <aside className="hidden sm:block w-52 shrink-0">
                        <div className="sticky top-20 rounded-lg border border-gray-200 bg-white p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
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
                        <div className="mb-3 sm:mb-5 flex items-center gap-2">

                            {/* Mobile filter + sort button */}
                            <button
                                onClick={() => setMobileFilterOpen(true)}
                                className="sm:hidden flex items-center gap-1.5 h-10 px-3 bg-gray-50 border border-gray-200 rounded-full shrink-0 hover:border-[#B00000] transition-colors"
                            >
                                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">Filter</span>
                                {(selectedCategoryPath.length > 0 || sortBy !== "name") && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 bg-[#B00000] text-white text-[10px] rounded-full font-bold">
                                        {selectedCategoryPath.length + (sortBy !== "name" ? 1 : 0)}
                                    </span>
                                )}
                            </button>

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

                            {/* Sort — desktop only */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="hidden sm:block h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-[#B00000] focus:ring-1 focus:ring-[#B00000] transition-colors shrink-0"
                            >
                                <option value="name">A – Z</option>
                                <option value="price-asc">Price ↑</option>
                                <option value="price-desc">Price ↓</option>
                            </select>

                            {/* Count — desktop only */}
                            {pagination && (
                                <span className="text-sm text-gray-500 shrink-0 whitespace-nowrap hidden sm:inline">
                                    {filteredProducts.length} of {pagination.total}
                                </span>
                            )}
                        </div>

                        {/* Mobile active filter/sort chips */}
                        {(selectedCategoryPath.length > 0 || sortBy !== "name") && (
                            <div className="sm:hidden flex flex-wrap gap-1.5 mb-3">
                                {sortBy !== "name" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs text-[#B00000] font-medium">
                                        {sortBy === "price-asc" ? "Price ↑" : "Price ↓"}
                                        <button type="button" onClick={() => setSortBy("name")} aria-label="Remove sort">
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                )}
                                {selectedCategoryPath.map((item, i) => (
                                    <span
                                        key={`${item}-${i}`}
                                        className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs text-[#B00000] font-medium"
                                    >
                                        {item}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategoryPath(selectedCategoryPath.slice(0, i))}
                                            aria-label={`Remove ${item} filter`}
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

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
                                        <div className="aspect-4/3 bg-gray-200" />
                                        <div className="p-3 space-y-2.5">
                                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                            <div className="h-8 bg-gray-200 rounded-lg w-full mt-2" />
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
                                <Link href={`/shop/${product.slug}`} className="block overflow-hidden relative">
                                    <div className="bg-gray-50 aspect-4/3 w-full">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    {product.isComingSoon && (
                                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-orange-500 text-white rounded text-[10px] font-semibold leading-none">
                                            Soon
                                        </span>
                                    )}
                                    {!product.inStock && product.type === "physical" && !product.isComingSoon && (
                                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-gray-700 text-white rounded text-[10px] font-semibold leading-none">
                                            Out of Stock
                                        </span>
                                    )}
                                </Link>

                                {/* Product Info */}
                                <div className="p-3 sm:p-4 flex flex-col flex-1">
                                    {/* Product Title */}
                                    <Link href={`/shop/${product.slug}`}>
                                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-[#B00000] leading-snug min-h-10">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    {/* Badges */}
                                    <div className="mb-2 flex items-center gap-1 flex-wrap">
                                        {(product.requiresKyc || product.requiresKycMultiple) && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                                                {product.requiresKyc ? "KYC" : "Bulk KYC"}
                                            </span>
                                        )}
                                        <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${product.type === "digital"
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
                                            const offerPrice = getValidOfferPrice(product);

                                            /* ── KYC wall: price hidden ── */
                                            if (!canShowPrice) {
                                                return (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                            <p className="text-xs text-amber-700 font-medium">KYC Required</p>
                                                        </div>
                                                        <Link
                                                            href="/kyc/product"
                                                            className="w-full text-center py-2.5 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors"
                                                        >
                                                            Update KYC
                                                        </Link>
                                                    </div>
                                                );
                                            }

                                            /* ── Price display (shared) ── */
                                            const priceBlock = canShowPrice ? (
                                                offerPrice ? (
                                                    <div className="mb-2">
                                                        <p className="text-sm font-bold text-[#B00000] leading-none">
                                                            ₹{offerPrice.toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 line-through mt-0.5">
                                                            ₹{product.price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-[#B00000] mb-2">
                                                        ₹{product.price.toLocaleString()}
                                                    </p>
                                                )
                                            ) : null;

                                            /* ── Contact-only ── */
                                            if (product.is_contact_only) {
                                                return (
                                                    <div>
                                                        {priceBlock}
                                                        <a
                                                            href="https://wa.me/918714388741"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition-colors"
                                                        >
                                                            WhatsApp
                                                        </a>
                                                    </div>
                                                );
                                            }

                                            /* ── Normal product ── */
                                            const stockLabel = product.type === "digital"
                                                ? "Digital download"
                                                : product.inStock ? "In Stock" : "Out of Stock";

                                            return (
                                                <div>
                                                    {priceBlock}
                                                    <p className="text-[10px] text-gray-500 mb-2">{stockLabel}</p>
                                                    {!showPriceAndAddToCart ? (
                                                        <Link
                                                            href="/kyc/product"
                                                            className="w-full block text-center py-2.5 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 transition-colors"
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
                                                            className="w-full py-2.5 bg-[#B00000] text-white text-xs font-semibold rounded-xl hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {product.isComingSoon ? "Coming Soon" : product.type === "physical" && !product.inStock ? "Out of Stock" : "Add to Cart"}
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

            {/* Mobile filter + sort drawer */}
            {mobileFilterOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                        onClick={() => setMobileFilterOpen(false)}
                    />
                    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-900">Filter & Sort</h2>
                            <button
                                onClick={() => setMobileFilterOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5">
                            {/* Sort section */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort by</p>
                                <div className="flex gap-2">
                                    {(["name", "price-asc", "price-desc"] as SortOption[]).map((opt) => {
                                        const labels: Record<SortOption, string> = { name: "A – Z", "price-asc": "Price: Low → High", "price-desc": "Price: High → Low" };
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => setSortBy(opt)}
                                                className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-colors ${sortBy === opt ? "bg-[#B00000] text-white border-[#B00000]" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"}`}
                                            >
                                                {labels[opt]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Category section */}
                            <div>
                                <MultiLevelCategoryMenu
                                    products={categoryProducts.length > 0 ? categoryProducts : products}
                                    selectedPath={selectedCategoryPath}
                                    onFilterChange={setSelectedCategoryPath}
                                />
                            </div>
                        </div>

                        {/* Footer actions */}
                        <div className="px-4 pt-3 pb-safe border-t border-gray-100 flex gap-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                            {(selectedCategoryPath.length > 0 || sortBy !== "name") && (
                                <button
                                    onClick={() => { setSelectedCategoryPath([]); setSortBy("name"); }}
                                    className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={() => setMobileFilterOpen(false)}
                                className="flex-1 py-3 bg-[#B00000] text-white rounded-xl text-sm font-semibold hover:bg-red-800 transition-colors"
                            >
                                Show Results {pagination ? `(${pagination.total})` : ""}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
