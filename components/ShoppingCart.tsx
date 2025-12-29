"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "@/contexts/CartContext";

export default function ShoppingCart() {
    const {
        items,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        isOpen,
        setIsOpen,
    } = useCart();

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
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Shopping Cart
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6">
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
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg"
                                >
                                    {item.image && (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-slate-900 mb-1 line-clamp-2">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {item.type === "physical"
                                                ? "Physical Product"
                                                : item.type === "digital"
                                                ? "Digital Product"
                                                : "Course"}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-[#B00000]">
                                                ₹{item.price.toFixed(2)}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm w-8 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-gray-400 hover:text-red-600 shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-200 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-slate-900">
                                Total:
                            </span>
                            <span className="text-xl font-bold text-[#B00000]">
                                ₹{getTotalPrice().toFixed(2)}
                            </span>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={() => setIsOpen(false)}
                            className="block w-full px-4 py-3 bg-[#B00000] text-white rounded-lg text-center font-medium hover:bg-red-800 transition-colors"
                        >
                            Proceed to Checkout
                        </Link>
                        <Link
                            href="/shop"
                            onClick={() => setIsOpen(false)}
                            className="block w-full px-4 py-3 border border-gray-300 text-slate-900 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors"
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
