"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Package, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { productsApi, PaginationInfo } from "@/lib/api/products";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, UserDashboardData } from "@/lib/api/types";
import ProductCard, { getValidOfferPrice, type ShopProduct } from "@/components/shop/ProductCard";
import CascadingCategoryFilter from "@/components/shop/CascadingCategoryFilter";
import FilterBar, {
    PRICE_RANGES,
    type SortOption,
    type TypeFilter,
} from "@/components/shop/FilterBar";
import FeaturedStrip from "@/components/shop/FeaturedStrip";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop";

const ITEMS_PER_PAGE = 20;

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
        isFeatured: p.is_featured || false,
        createdAt: p.created_at,
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

function isOutOfStock(p: ShopProduct): boolean {
    return p.type === "physical" && !p.inStock && !p.isComingSoon;
}

/** Subtle automotive grid/circuit pattern used in the shop header background */
function HeaderPattern() {
    return (
        <svg
            className="absolute inset-0 h-full w-full opacity-[0.07]"
            aria-hidden="true"
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                <pattern id="shop-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                </pattern>
                <pattern id="shop-circuit" width="160" height="160" patternUnits="userSpaceOnUse">
                    <path
                        d="M0 80 H50 V30 H110 V80 H160 M80 0 V50 H130 V160"
                        fill="none"
                        stroke="#F5A623"
                        strokeWidth="1.5"
                    />
                    <circle cx="50" cy="30" r="3" fill="#F5A623" />
                    <circle cx="110" cy="80" r="3" fill="#D0021B" />
                    <circle cx="130" cy="50" r="3" fill="#F5A623" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#shop-grid)" />
            <rect width="100%" height="100%" fill="url(#shop-circuit)" />
        </svg>
    );
}

export default function ShopPage() {
    const { user, isAuth } = useAuth();
    const [userKycStatus, setUserKycStatus] = useState<UserDashboardData["kyc_status"] | null>(null);
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [categoryProducts, setCategoryProducts] = useState<ShopProduct[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hierarchical category drill-down path (e.g. ["Vehicle", "Motorcycle", "Yezdi"])
    const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([]);
    // Bumped on "Clear All" so CascadingCategoryFilter (which owns its selection internally)
    // remounts and resets its dropdowns back to empty in sync with selectedCategoryPath.
    const [categoryFilterResetKey, setCategoryFilterResetKey] = useState(0);

    // Filter bar state
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [priceRangeId, setPriceRangeId] = useState("any");
    const [sortBy, setSortBy] = useState<SortOption>("name");

    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const { addToCart, setIsOpen } = useCart();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset to page 1 when server-side filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedCategoryPath]);

    // Fetch products with pagination — accumulates pages for "Load More"
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (currentPage === 1) {
                    setLoading(true);
                } else {
                    setLoadingMore(true);
                }
                setError(null);

                const resp = await productsApi.list({
                    q: debouncedSearch || undefined,
                    categoryPath: selectedCategoryPath.length > 0 ? selectedCategoryPath : undefined,
                    page: currentPage,
                    limit: ITEMS_PER_PAGE,
                });

                if (!mounted) return;
                const list = Array.isArray(resp.data) ? resp.data.map(mapApiProductToShopProduct) : [];
                setProducts((prev) => (currentPage === 1 ? list : [...prev, ...list]));
                setPagination(resp.pagination || null);

                if (currentPage === 1) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            } catch (e: unknown) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : "Failed to load products");
            } finally {
                if (!mounted) return;
                setLoading(false);
                setLoadingMore(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [debouncedSearch, selectedCategoryPath, currentPage]);

    // Fetch a stable product catalog to build the category chip list
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const allProducts: ShopProduct[] = [];
                let page = 1;
                let totalPages = 1;

                while (page <= totalPages) {
                    const resp = await productsApi.list({ page, limit: 100 });
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

    // Fetch featured products for the "Top Picks" strip
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const resp = await productsApi.getFeatured();
                if (!mounted) return;
                const list = Array.isArray(resp.data) ? resp.data : [];
                setFeaturedProducts(list.map(mapApiProductToShopProduct));
            } catch (e) {
                if (!mounted) return;
                console.error("Failed to load featured products:", e);
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

    const priceRange = PRICE_RANGES.find((r) => r.id === priceRangeId) ?? PRICE_RANGES[0];

    // Client-side filter (type/stock/price), sort, and "out-of-stock to the end" ordering
    const filteredProducts = useMemo(() => {
        let list = products.filter((p) => {
            if (typeFilter !== "all" && p.type !== typeFilter) return false;
            if (inStockOnly && isOutOfStock(p)) return false;
            if (priceRange.min != null || priceRange.max != null) {
                const effectivePrice = getValidOfferPrice(p) ?? p.price;
                if (priceRange.min != null && effectivePrice < priceRange.min) return false;
                if (priceRange.max != null && effectivePrice > priceRange.max) return false;
            }
            return true;
        });

        list = [...list].sort((a, b) => {
            switch (sortBy) {
                case "price-asc":
                    return (getValidOfferPrice(a) ?? a.price) - (getValidOfferPrice(b) ?? b.price);
                case "price-desc":
                    return (getValidOfferPrice(b) ?? b.price) - (getValidOfferPrice(a) ?? a.price);
                case "newest":
                    return (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0);
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        // Push out-of-stock products to the end (stable partition)
        const inStockList = list.filter((p) => !isOutOfStock(p));
        const outOfStockList = list.filter(isOutOfStock);
        return [...inStockList, ...outOfStockList];
    }, [products, typeFilter, inStockOnly, priceRange, sortBy]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        selectedCategoryPath.length > 0 ||
        typeFilter !== "all" ||
        inStockOnly ||
        priceRangeId !== "any" ||
        sortBy !== "name";

    const handleClearAll = () => {
        setSearchQuery("");
        setSelectedCategoryPath([]);
        setCategoryFilterResetKey((k) => k + 1);
        setTypeFilter("all");
        setInStockOnly(false);
        setPriceRangeId("any");
        setSortBy("name");
    };

    const handleAddToCart = (product: ShopProduct) => {
        const isPhysicalInStock = product.type !== "physical" ? true : !!product.inStock;
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

        setIsOpen(true);
    };

    const handleLoadMore = () => {
        if (!pagination || currentPage >= pagination.totalPages) return;
        setCurrentPage((p) => p + 1);
        // Smooth scroll toward the newly appended batch
        requestAnimationFrame(() => {
            window.scrollBy({ top: 480, behavior: "smooth" });
        });
    };

    const canLoadMore = !!pagination && currentPage < pagination.totalPages;

    return (
        <div className="min-h-screen bg-white">
            {/* ── Compact functional header ── */}
            <header className="relative overflow-hidden bg-brand-dark-2 py-6 sm:max-h-[180px] sm:py-7" aria-label="Shop header">
                <HeaderPattern />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at 15% 50%, rgba(176,0,0,0.35) 0%, transparent 55%)",
                    }}
                    aria-hidden="true"
                />
                <div className="relative mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-8">
                    <div>
                        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-white/50">
                            <Link href="/" className="transition-colors hover:text-white/80">
                                Home
                            </Link>
                            <ChevronRight className="h-3 w-3" aria-hidden="true" />
                            <span className="font-medium text-white/80">Shop</span>
                        </nav>
                        <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-[32px]">
                            Professional Diagnostic Equipment
                        </h1>
                    </div>

                    <div className="flex flex-row flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                        {pagination && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                                <Package className="h-3.5 w-3.5 text-brand-gold" aria-hidden="true" />
                                {pagination.total.toLocaleString()} Products
                            </span>
                        )}
                        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-gold">
                            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                            India&rsquo;s #1 Automotive Diagnostic Store
                        </p>
                    </div>
                </div>
            </header>

            {/* ── Cascading category filter ── */}
            <div className="border-b border-[#E5E7EB] bg-white px-4 sm:px-6 lg:px-8 py-3">
                <CascadingCategoryFilter
                    key={categoryFilterResetKey}
                    products={categoryProducts.length > 0 ? categoryProducts : products}
                    onFilterChange={setSelectedCategoryPath}
                />
            </div>

            {/* ── Filter & sort bar ── */}
            <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                inStockOnly={inStockOnly}
                onInStockChange={setInStockOnly}
                priceRangeId={priceRangeId}
                onPriceRangeChange={setPriceRangeId}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearAll={handleClearAll}
            />

            {/* ── Featured strip ── */}
            {!debouncedSearch && selectedCategoryPath.length === 0 && (
                <FeaturedStrip
                    products={featuredProducts}
                    user={user}
                    userKycStatus={userKycStatus}
                    onAddToCart={handleAddToCart}
                />
            )}

            {/* ── Main grid ── */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {error && (
                    <div className="mb-5 rounded-xl border border-brand-red/20 bg-brand-red/5 p-4 text-sm text-brand-red">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 xl:grid-cols-4 [@media(min-width:768px)_and_(max-width:1024px)]:grid-cols-3">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="overflow-hidden rounded-2xl border border-[#E5E7EB]">
                                <div className="aspect-video animate-shimmer bg-[linear-gradient(90deg,#F3F4F6_0%,#E5E7EB_50%,#F3F4F6_100%)] bg-size-[400px_100%]" />
                                <div className="space-y-2.5 p-4">
                                    <div className="h-3 w-3/4 animate-shimmer rounded bg-[linear-gradient(90deg,#F3F4F6_0%,#E5E7EB_50%,#F3F4F6_100%)] bg-size-[400px_100%]" />
                                    <div className="h-3 w-1/2 animate-shimmer rounded bg-[linear-gradient(90deg,#F3F4F6_0%,#E5E7EB_50%,#F3F4F6_100%)] bg-size-[400px_100%]" />
                                    <div className="h-11 w-full animate-shimmer rounded-xl bg-[linear-gradient(90deg,#F3F4F6_0%,#E5E7EB_50%,#F3F4F6_100%)] bg-size-[400px_100%]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-6 py-16 text-center">
                        <Package className="mx-auto h-14 w-14 text-brand-red/30" aria-hidden="true" />
                        <p className="mt-4 text-lg font-semibold text-[#0D0D14]">No results found</p>
                        <p className="mt-1 text-sm text-brand-gray">
                            Try adjusting your search or filters to find what you&rsquo;re looking for.
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="mt-4 inline-flex items-center justify-center rounded-full border border-brand-red px-5 py-2 text-sm font-semibold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    user={user}
                                    userKycStatus={userKycStatus}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>

                        {/* Showing X of Y + Load more */}
                        <div className="mt-8 flex flex-col items-center gap-3">
                            {pagination && (
                                <p className="text-sm text-brand-gray">
                                    Showing {filteredProducts.length} of {pagination.total} products
                                </p>
                            )}
                            {canLoadMore && (
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="inline-flex items-center gap-2 rounded-full border border-brand-red px-6 py-2.5 text-sm font-semibold text-brand-red transition-colors hover:bg-brand-red hover:text-white disabled:cursor-wait disabled:opacity-60"
                                >
                                    {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                                    {loadingMore ? "Loading…" : "Load More Products"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
