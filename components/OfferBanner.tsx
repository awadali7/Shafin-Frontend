"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function OfferBanner() {
    return (
        <div
            className="fixed inset-x-0 top-14 z-40 flex h-11 items-center justify-center overflow-hidden border-b border-black/10 bg-gradient-to-r from-[#6E0000] via-brand-red to-[#6E0000] px-3 shadow-[0_2px_10px_rgba(0,0,0,0.25)] lg:top-[72px]"
            role="region"
            aria-label="Current product offers"
        >
            {/* Animated diagonal "wind" sheen */}
            <div
                className="animate-banner-shine pointer-events-none absolute inset-0 opacity-25"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(115deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 26px)",
                }}
                aria-hidden="true"
            />

            <div className="relative flex w-full max-w-7xl items-center justify-center gap-2.5 sm:gap-4">
                {/* Waving flag — pole + fluttering pennant cut with clip-path */}
                <span className="relative flex h-6 w-5 shrink-0 items-start" aria-hidden="true">
                    <span className="absolute left-0 top-0 h-6 w-[2px] rounded-full bg-white/85" />
                    <span
                        className="absolute left-[2px] top-0 h-4 w-5 origin-left animate-flag-wave bg-gradient-to-br from-brand-gold to-[#E08E00] shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                        style={{
                            clipPath: "polygon(0 0, 100% 18%, 78% 50%, 100% 82%, 0 100%)",
                        }}
                    />
                </span>

                <p className="truncate text-xs font-bold tracking-wide text-white sm:text-sm">
                    🔥 <span className="hidden sm:inline">Exclusive Offers Live — </span>
                    Save big on top diagnostic tools
                </p>

                <Link
                    href="/shop/offers"
                    className="group inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-brand-gold to-[#FFD66B] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#5A2E00] shadow-sm transition-all hover:shadow-md hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-red sm:px-4 sm:py-1.5 sm:text-xs"
                >
                    Shop Offers
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}
