"use client";

import React from "react";
import type { UserDashboardData } from "@/lib/api/types";
import ProductCard, { type ShopProduct } from "./ProductCard";

interface FeaturedStripProps {
    products: ShopProduct[];
    user: { user_type?: string | null } | null;
    userKycStatus: UserDashboardData["kyc_status"] | null;
    onAddToCart: (product: ShopProduct) => void;
}

export default function FeaturedStrip({ products, user, userKycStatus, onAddToCart }: FeaturedStripProps) {
    if (products.length === 0) return null;

    return (
        <section aria-label="Featured products" className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <h2 className="mb-4 text-lg font-bold text-[#0D0D14]">
                    <span aria-hidden="true">⚡</span> Top Picks for You
                </h2>
                <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {products.slice(0, 5).map((product) => (
                        <div key={product.id} className="w-64 shrink-0 sm:w-72">
                            <ProductCard
                                product={product}
                                user={user}
                                userKycStatus={userKycStatus}
                                onAddToCart={onAddToCart}
                                tall
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
