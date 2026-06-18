"use client";

import React from "react";
import Link from "next/link";
import { Eye, ShieldCheck, ShoppingCart } from "lucide-react";
import type { UserDashboardData } from "@/lib/api/types";

export type ProductType = "physical" | "digital";

export type ShopProduct = {
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
    isFeatured?: boolean;
    createdAt?: string;
    weight?: number;
    volumetric_weight?: number;
    extra_shipping_charge?: number;
    origin_city?: string | null;
    origin_state?: string | null;
    origin_pincode?: string | null;
    digitalFile?: {
        format?: "zip" | "rar";
        filename?: string;
    };
    quantity_pricing?: Array<{
        min_qty: number;
        max_qty: number | null;
        price_per_item: number;
        courier_charge?: number;
    }>;
};

export function getValidOfferPrice(product: ShopProduct): number | null {
    if (
        typeof product.offerPrice === "number" &&
        product.offerPrice > 0 &&
        product.offerPrice < product.price
    ) {
        return product.offerPrice;
    }
    return null;
}

interface ProductCardProps {
    product: ShopProduct;
    user: { user_type?: string | null } | null;
    userKycStatus: UserDashboardData["kyc_status"] | null;
    onAddToCart: (product: ShopProduct) => void;
    tall?: boolean;
}

export default function ProductCard({
    product,
    user,
    userKycStatus,
    onAddToCart,
    tall = false,
}: ProductCardProps) {
    const offerPrice = getValidOfferPrice(product);
    const discountPercent = offerPrice
        ? Math.round(((product.price - offerPrice) / product.price) * 100)
        : null;

    const isOutOfStock =
        product.type === "physical" && !product.inStock && !product.isComingSoon;

    const showPriceAndAddToCart =
        !product.requiresKyc ||
        (user?.user_type === "business_owner" && userKycStatus?.status === "verified");
    const canShowPrice = showPriceAndAddToCart || product.showPriceBeforeKyc;

    const deliveryLabel =
        product.type === "digital" ? "Digital Download" : "Physical Shipping";

    return (
        <article
            className={`group flex flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] ${
                isOutOfStock ? "opacity-70" : ""
            }`}
        >
            {/* Image */}
            <div className="relative">
                <Link
                    href={`/shop/${product.slug}`}
                    className={`relative block overflow-hidden rounded-t-2xl ${
                        tall ? "aspect-[3/4]" : "aspect-square sm:aspect-video"
                    }`}
                    aria-label={`View ${product.name}`}
                >
                    <div className="absolute inset-0 bg-[#F8F9FC]">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
                        )}
                        {/* Quick view overlay */}
                        <span
                            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/20"
                            aria-hidden="true"
                        >
                            <span className="inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#0D0D14] opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                Quick View
                            </span>
                        </span>
                    </div>
                </Link>

                {/* Out of stock badge */}
                {isOutOfStock && (
                    <span className="absolute left-3 top-3 rounded-md bg-brand-red px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Out of Stock
                    </span>
                )}
                {product.isComingSoon && (
                    <span className="absolute left-3 top-3 rounded-md bg-brand-gray px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Coming Soon
                    </span>
                )}

                {/* Sale badge */}
                {discountPercent !== null && discountPercent > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-brand-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        {discountPercent}% OFF
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-4">
                <Link href={`/shop/${product.slug}`}>
                    <h3 className="mb-2 line-clamp-2 min-h-10 text-[15px] font-semibold leading-snug text-[#0D0D14] hover:text-brand-red">
                        {product.name}
                    </h3>
                </Link>

                {/* Type badges */}
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                    <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                            product.type === "digital"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                        {product.type === "digital" ? "Digital" : "Physical"}
                    </span>
                    {(product.requiresKyc || product.requiresKycMultiple) && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                            {product.requiresKyc ? "KYC" : "Bulk KYC"}
                        </span>
                    )}
                </div>

                <div className="mt-auto">
                    {/* KYC wall */}
                    {!canShowPrice ? (
                        <div className="mb-3 flex items-center gap-1.5 text-amber-700">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <p className="text-xs font-medium">KYC verification required</p>
                        </div>
                    ) : (
                        <>
                            {/* Price row */}
                            <div className="mb-2 flex items-baseline gap-2">
                                {offerPrice ? (
                                    <>
                                        <span className="text-lg font-bold text-brand-red">
                                            ₹{offerPrice.toLocaleString()}
                                        </span>
                                        <span className="text-[13px] text-brand-gray line-through">
                                            ₹{product.price.toLocaleString()}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-lg font-bold text-brand-red">
                                        ₹{product.price.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* Stock + delivery */}
                            <div className="mb-3 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-xs text-brand-gray">
                                    <span
                                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                                            isOutOfStock ? "bg-brand-red" : "bg-brand-green"
                                        }`}
                                        aria-hidden="true"
                                    />
                                    {isOutOfStock ? "Out of stock" : "In stock"}
                                </span>
                                <span className="text-[11px] text-brand-gray">{deliveryLabel}</span>
                            </div>
                        </>
                    )}

                    {/* CTA */}
                    {!canShowPrice ? (
                        <Link
                            href="/kyc/product"
                            className="flex h-11 w-full items-center justify-center rounded-xl bg-amber-500 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                            aria-label={`Complete KYC to view ${product.name}`}
                        >
                            Update KYC
                        </Link>
                    ) : product.is_contact_only ? (
                        <a
                            href="https://wa.me/918714388741"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-red text-sm font-semibold text-white transition-colors hover:bg-[#8B0000]"
                            aria-label={`Order ${product.name} via WhatsApp`}
                        >
                            Order via WhatsApp
                        </a>
                    ) : !showPriceAndAddToCart ? (
                        <Link
                            href="/kyc/product"
                            className="flex h-11 w-full items-center justify-center rounded-xl bg-amber-500 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                            aria-label={`Complete KYC to purchase ${product.name}`}
                        >
                            Update KYC
                        </Link>
                    ) : isOutOfStock ? (
                        <button
                            type="button"
                            disabled
                            className="flex h-11 w-full items-center justify-center rounded-xl border border-[#E5E7EB] text-sm font-semibold text-brand-gray transition-colors hover:border-brand-red hover:text-brand-red"
                            aria-label={`Get notified when ${product.name} is back in stock`}
                        >
                            Notify Me
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onAddToCart(product)}
                            disabled={product.isComingSoon}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-red text-sm font-semibold text-white transition-colors hover:bg-[#8B0000] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Add ${product.name} to cart`}
                        >
                            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                            {product.isComingSoon ? "Coming Soon" : "Add to Cart"}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
