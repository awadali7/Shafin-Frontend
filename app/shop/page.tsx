"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Download,
    Package,
    Search,
    Truck,
    X,
    Grid3x3,
    List,
    ArrowUpDown,
    ShieldCheck,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { productsApi, PaginationInfo } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";
import MultiLevelCategoryMenu from "@/components/shop/MultiLevelCategoryMenu";
import Pagination from "@/components/ui/Pagination";

type ProductType = "physical" | "digital";
type DigitalFileFormat = "zip" | "rar";

type ShopProduct = {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    category: string;
    categories?: string[];
    type: ProductType;
    inStock?: boolean; // physical only
    isComingSoon?: boolean;
    is_contact_only?: boolean;
    requiresKyc?: boolean;
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

export default function ShopPage() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>(
        []
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortBy, setSortBy] = useState<
        "name" | "price-asc" | "price-desc"
    >("name");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const itemsPerPage = 20;
    const { addToCart, setIsOpen } = useCart();

    const normalizedQuery = debouncedSearch.trim().toLowerCase();

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
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || "Failed to load products");
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [debouncedSearch, selectedCategoryPath, currentPage, itemsPerPage]);

    const filteredProducts = useMemo(() => {
        // Backend now handles category filtering, we only need to sort client-side
        const sorted = [...products];

        sorted.sort((a, b) => {
            switch (sortBy) {
                case "price-asc":
                    return a.price - b.price;
                case "price-desc":
                    return b.price - a.price;
                case "name":
                default:
                    return a.name.localeCompare(b.name);
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
            quantity_pricing: product.quantity_pricing,
        });

        // Open cart drawer after adding item
        setIsOpen(true);
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* All Controls in One Line */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    {/* Category Filter */}
                    <MultiLevelCategoryMenu
                        products={products}
                        onFilterChange={setSelectedCategoryPath}
                    />

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 border border-gray-300 rounded p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded ${viewMode === "grid"
                                ? "bg-[#B00000] text-white"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded ${viewMode === "list"
                                ? "bg-[#B00000] text-white"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#B00000] focus:ring-1 focus:ring-[#B00000]"
                    >
                        <option value="name">Name (A-Z)</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                    </select>

                    {/* Search Bar - Moved to Right */}
                    <div className="relative ml-auto min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="search"
                            placeholder="Search products…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#B00000] focus:ring-1 focus:ring-[#B00000]"
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

                    {/* Product Count */}
                    {pagination && (
                        <div className="text-sm text-gray-600">
                            {filteredProducts.length} of {pagination.total}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Products Grid/List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="border border-gray-200 rounded overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="border border-gray-200 rounded p-12 text-center">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No products found</p>
                        {(searchQuery || selectedCategoryPath.length > 0) && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategoryPath([]);
                                }}
                                className="text-sm text-[#B00000] hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div
                        className={
                            viewMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                : "flex flex-col gap-4"
                        }
                    >
                        {filteredProducts.map((product) => (
                            <article
                                key={product.id}
                                className={`border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow group ${viewMode === "list" ? "flex" : ""
                                    }`}
                            >
                                {/* Product Image */}
                                <Link
                                    href={`/shop/${product.slug}`}
                                    className={viewMode === "list" ? "w-48 shrink-0" : ""}
                                >
                                    <div
                                        className={`bg-gray-100 ${viewMode === "list" ? "h-full" : "h-48 w-full"
                                            }`}
                                    >
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </Link>

                                {/* Product Info */}
                                <div
                                    className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col" : ""
                                        }`}
                                >
                                    {/* Product Title */}
                                    <Link href={`/shop/${product.slug}`}>
                                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-[#B00000]">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    {/* Badges */}
                                    <div className="mb-3 flex items-center gap-2 flex-wrap text-xs">
                                        {product.isComingSoon && (
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                                Coming Soon
                                            </span>
                                        )}
                                        {product.requiresKyc && (
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                                                KYC
                                            </span>
                                        )}
                                        <span
                                            className={`px-2 py-1 rounded ${product.type === "digital"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-green-100 text-green-700"
                                                }`}
                                        >
                                            {product.type === "digital" ? "Digital" : "Physical"}
                                        </span>
                                    </div>

                                    {/* Price and Action Button */}
                                    <div
                                        className={`flex items-center justify-between pt-3 border-t border-gray-200 ${viewMode === "list" ? "mt-auto" : ""
                                            }`}
                                    >
                                        {product.is_contact_only ? (
                                            // Contact Only Product
                                            <>
                                                <div>
                                                    <p className="text-lg font-bold text-[#B00000]">
                                                        ₹{product.price.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {product.type === "digital" ? "Digital" : "Physical"}
                                                    </p>
                                                </div>
                                                <a
                                                    href="https://wa.me/919037313107"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                                >
                                                    WhatsApp
                                                </a>
                                            </>
                                        ) : (
                                            // Normal Product
                                            <>
                                                <div>
                                                    <p className="text-lg font-bold text-[#B00000]">
                                                        ₹{product.price.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {product.type === "digital"
                                                            ? "Digital"
                                                            : product.inStock
                                                                ? "In Stock"
                                                                : "Out of Stock"}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={
                                                        product.isComingSoon ||
                                                        (product.type === "physical" && !product.inStock)
                                                    }
                                                    className="px-4 py-2 bg-[#B00000] text-white text-sm rounded hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {product.isComingSoon ? "Soon" : "Add to Cart"}
                                                </button>
                                            </>
                                        )}
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
            </div>
        </div>
    );
}
