"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Package, Tag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { productsApi } from "@/lib/api/products";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, UserDashboardData } from "@/lib/api/types";
import ProductCard, { getValidOfferPrice, type ShopProduct } from "@/components/shop/ProductCard";

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

export default function ShopOffersPage() {
    const { user, isAuth } = useAuth();
    const [userKycStatus, setUserKycStatus] = useState<UserDashboardData["kyc_status"] | null>(null);
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToCart, setIsOpen } = useCart();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const all: ShopProduct[] = [];
                let page = 1;
                let totalPages = 1;
                while (page <= totalPages) {
                    const resp = await productsApi.list({ page, limit: 100 });
                    if (!mounted) return;
                    const list = Array.isArray(resp.data) ? resp.data : [];
                    all.push(...list.map(mapApiProductToShopProduct));
                    totalPages = resp.pagination?.totalPages || 1;
                    page += 1;
                }

                if (!mounted) return;
                setProducts(all.filter((p) => getValidOfferPrice(p) !== null));
            } catch (e: unknown) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : "Failed to load offers");
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

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

    const sortedProducts = useMemo(() => {
        return [...products].sort((a, b) => {
            const discountA = ((getValidOfferPrice(a) ?? a.price) / a.price);
            const discountB = ((getValidOfferPrice(b) ?? b.price) / b.price);
            return discountA - discountB; // biggest discount (smallest ratio) first
        });
    }, [products]);

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

    return (
        <div className="min-h-screen bg-white">
            {/* ── Header ── */}
            <header className="relative overflow-hidden bg-brand-dark-2 py-6 sm:py-7">
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at 15% 50%, rgba(176,0,0,0.35) 0%, transparent 55%)",
                    }}
                    aria-hidden="true"
                />
                <div className="relative mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:px-6 lg:px-8">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-white/50">
                        <Link href="/" className="transition-colors hover:text-white/80">
                            Home
                        </Link>
                        <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        <Link href="/shop" className="transition-colors hover:text-white/80">
                            Shop
                        </Link>
                        <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        <span className="font-medium text-white/80">Offers</span>
                    </nav>
                    <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight tracking-tight text-white sm:text-[32px]">
                        <Tag className="h-6 w-6 text-brand-gold" aria-hidden="true" />
                        Current Offers
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">
                        Best prices on diagnostic equipment, while stocks last
                    </p>
                </div>
            </header>

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
                ) : sortedProducts.length === 0 ? (
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-6 py-16 text-center">
                        <Package className="mx-auto h-14 w-14 text-brand-red/30" aria-hidden="true" />
                        <p className="mt-4 text-lg font-semibold text-[#0D0D14]">No offers right now</p>
                        <p className="mt-1 text-sm text-brand-gray">
                            Check back soon, or browse the full shop in the meantime.
                        </p>
                        <Link
                            href="/shop"
                            className="mt-4 inline-flex items-center justify-center rounded-full border border-brand-red px-5 py-2 text-sm font-semibold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
                        >
                            Browse Shop
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="mb-5 text-sm text-brand-gray">
                            {sortedProducts.length} product{sortedProducts.length === 1 ? "" : "s"} on offer
                        </p>
                        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                            {sortedProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    user={user}
                                    userKycStatus={userKycStatus}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
