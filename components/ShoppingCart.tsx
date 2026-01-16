"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/contexts/CartContext";

// Helper to calculate price with tiered discount
function calculateItemPrice(item: CartItem): {
    finalPrice: number;
    regularPrice: number;
    savings: number;
    appliedTier: { min_qty: number; max_qty: number | null; price_per_item: number } | null;
} {
    const regularPrice = item.price * item.quantity;
    
    if (!item.quantity_pricing || item.quantity_pricing.length === 0) {
        return {
            finalPrice: regularPrice,
            regularPrice,
            savings: 0,
            appliedTier: null,
        };
    }
    
    // Find tier that matches this quantity range
    const tier = item.quantity_pricing.find(t => {
        const minQty = t.min_qty || 1;
        const maxQty = t.max_qty || Infinity;
        return item.quantity >= minQty && item.quantity <= maxQty;
    });
    
    if (tier) {
        const finalPrice = tier.price_per_item * item.quantity;
        return {
            finalPrice,
            regularPrice,
            savings: regularPrice - finalPrice,
            appliedTier: tier,
        };
    }
    
    return {
        finalPrice: regularPrice,
        regularPrice,
        savings: 0,
        appliedTier: null,
    };
}

// Helper to find next tier message
function getNextTierMessage(item: CartItem): string | null {
    if (!item.quantity_pricing || item.quantity_pricing.length === 0) return null;
    
    // Find the next tier above current quantity
    const nextTier = item.quantity_pricing
        .filter(t => (t.min_qty || 1) > item.quantity)
        .sort((a, b) => (a.min_qty || 1) - (b.min_qty || 1))[0];
    
    if (!nextTier) return null;
    
    const itemsNeeded = (nextTier.min_qty || 1) - item.quantity;
    const currentPricePerItem = item.quantity_pricing.find(t => {
        const minQty = t.min_qty || 1;
        const maxQty = t.max_qty || Infinity;
        return item.quantity >= minQty && item.quantity <= maxQty;
    })?.price_per_item || item.price;
    
    const savingsPerItem = currentPricePerItem - nextTier.price_per_item;
    
    return `Buy ${itemsNeeded} more to get ₹${nextTier.price_per_item.toLocaleString('en-IN')}/item (save ₹${savingsPerItem.toLocaleString('en-IN')}/item!)`;
}

export default function ShoppingCart() {
    const {
        items,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        isOpen,
        setIsOpen,
    } = useCart();

    // Calculate total with bulk discounts
    const { subtotal, totalSavings, finalTotal } = useMemo(() => {
        let subtotal = 0;
        let totalSavings = 0;
        
        items.forEach(item => {
            const { finalPrice, savings } = calculateItemPrice(item);
            subtotal += finalPrice;
            totalSavings += savings;
        });
        
        return {
            subtotal,
            totalSavings,
            finalTotal: subtotal,
        };
    }, [items]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Cart Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 200,
                        }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
                    >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Cart
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-gray-600 mb-2">
                                Your cart is empty
                            </p>
                            <Link
                                href="/shop"
                                onClick={() => setIsOpen(false)}
                                className="text-[#B00000] hover:underline"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => {
                                const priceInfo = calculateItemPrice(item);
                                const nextTierMsg = getNextTierMessage(item);
                                
                                return (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                                >
                                    {item.image && (
                                        <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-medium text-slate-900 mb-0.5 line-clamp-2">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {item.type === "physical"
                                                ? "Physical"
                                                : item.type === "digital"
                                                ? "Digital"
                                                : "Course"}
                                        </p>
                                        
                                        {/* Price Display with Discount */}
                                        <div className="mb-1.5">
                                            {priceInfo.appliedTier ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-gray-400 line-through">
                                                        ₹{priceInfo.regularPrice.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-xs font-bold text-green-700">
                                                        ₹{priceInfo.finalPrice.toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-xs text-green-600">
                                                        (-₹{priceInfo.savings.toLocaleString('en-IN')})
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-xs font-semibold text-[#B00000]">
                                                    ₹{item.price.toFixed(2)} × {item.quantity} = ₹{priceInfo.finalPrice.toLocaleString('en-IN')}
                                                </p>
                                            )}
                                        </div>
                                        
                                        {/* Next Tier Message - Compact */}
                                        {nextTierMsg && (
                                            <div className="mb-1.5 text-xs bg-yellow-50 px-2 py-1 rounded text-yellow-700">
                                                {nextTierMsg}
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        item.quantity - 1
                                                    )
                                                }
                                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-xs w-6 text-center font-medium">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    updateQuantity(
                                                        item.id,
                                                        item.quantity + 1
                                                    )
                                                }
                                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-sm"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-gray-400 hover:text-red-600 shrink-0 self-start"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-200 p-4 space-y-3">
                        <div className="space-y-1.5">
                            {totalSavings > 0 && (
                                <div className="flex items-center justify-between text-xs bg-green-50 px-2 py-1.5 rounded">
                                    <span className="text-green-700">Bulk Discount:</span>
                                    <span className="text-green-700 font-bold">
                                        -₹{totalSavings.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <span className="text-base font-semibold text-slate-900">
                                    Total:
                                </span>
                                <span className="text-lg font-bold text-[#B00000]">
                                    ₹{finalTotal.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                        
                        <Link
                            href="/checkout"
                            onClick={() => setIsOpen(false)}
                            className="block w-full px-4 py-2.5 bg-[#B00000] text-white rounded-lg text-center text-sm font-medium hover:bg-red-800 transition-colors"
                        >
                            Checkout
                        </Link>
                        <Link
                            href="/shop"
                            onClick={() => setIsOpen(false)}
                            className="block w-full px-4 py-2 border border-gray-300 text-slate-900 rounded-lg text-center text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
