"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import type { Order } from "@/lib/api/types";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";
import { toast } from "sonner";

// Razorpay types
interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    handler: (response: RazorpaySuccessResponse) => void;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, string>;
    theme?: { color?: string };
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpayInstance {
    open: () => void;
}

async function loadRazorpayScript(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if ((window as any).Razorpay) return true;
    return await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

function formatDate(dateString: string) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString();
}

function StatusPill({ status }: { status: string }) {
    const styles =
        status === "paid"
            ? "bg-green-50 text-green-700 border-green-200"
            : status === "pending"
            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
            : "bg-gray-50 text-gray-700 border-gray-200";
    return (
        <span
            className={`inline-flex px-2 py-1 text-xs font-medium border rounded-full ${styles}`}
        >
            {status.toUpperCase()}
        </span>
    );
}

export default function OrdersPage() {
    const { isAuth, user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

    const toggleOrderExpansion = (orderId: string) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const getBackendBaseUrl = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
        return apiUrl.replace(/\/api\/?$/, "");
    };

    const BACKEND_BASE_URL = getBackendBaseUrl();

    const handleContinuePayment = async (orderId: string, orderTotal: number) => {
        try {
            setProcessingOrderId(orderId);
            toast.loading("Loading payment gateway...");

            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.dismiss();
                toast.error("Failed to load payment gateway. Please try again.");
                setProcessingOrderId(null);
                return;
            }

            // Create Razorpay order
            const paymentResp = await paymentsApi.createRazorpayOrder({
                order_id: orderId,
            });

            toast.dismiss();

            if (!paymentResp.success || !paymentResp.data) {
                toast.error(paymentResp.message || "Failed to initiate payment");
                setProcessingOrderId(null);
                return;
            }

            const { key_id, razorpay_order_id, amount, currency, internal_order_id } = paymentResp.data;

            // Open Razorpay checkout
            const options: RazorpayOptions = {
                key: key_id,
                amount,
                currency,
                name: "Diastools",
                description: `Order #${orderId.slice(0, 8)}`,
                order_id: razorpay_order_id,
                handler: async (response: RazorpaySuccessResponse) => {
                    try {
                        toast.loading("Verifying payment...");
                        const verifyResp = await paymentsApi.verifyRazorpayPayment({
                            internal_order_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        toast.dismiss();

                        if (verifyResp.success) {
                            toast.success("Payment successful!");
                            // Refresh orders
                            const resp = await ordersApi.myOrders();
                            setOrders(Array.isArray(resp.data) ? resp.data : []);
                        } else {
                            toast.error(verifyResp.message || "Payment verification failed");
                        }
                    } catch (err: any) {
                        toast.dismiss();
                        toast.error(err.message || "Payment verification failed");
                    } finally {
                        setProcessingOrderId(null);
                    }
                },
                prefill: {
                    name: user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "",
                    email: user?.email || "",
                },
                theme: {
                    color: "#B00000",
                },
                modal: {
                    ondismiss: () => {
                        toast.dismiss();
                        toast.info("Payment cancelled");
                        setProcessingOrderId(null);
                    },
                },
            };

            if ((window as any).Razorpay) {
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "Failed to process payment");
            setProcessingOrderId(null);
        }
    };

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            return;
        }
        if (isAuth && user) {
            (async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const resp = await ordersApi.myOrders();
                    setOrders(Array.isArray(resp.data) ? resp.data : []);
                } catch (e: any) {
                    setError(e?.message || "Failed to load orders");
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [authLoading, isAuth, user]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    if (!isAuth) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            My Orders
                        </h1>
                        <p className="text-gray-600">
                            Please sign in to continue
                        </p>
                    </div>
                </div>
                <LoginDrawer
                    isOpen={isLoginDrawerOpen}
                    onClose={() => setIsLoginDrawerOpen(false)}
                    onSwitchToRegister={() => {
                        setIsLoginDrawerOpen(false);
                        setIsRegisterDrawerOpen(true);
                    }}
                />
                <RegisterDrawer
                    isOpen={isRegisterDrawerOpen}
                    onClose={() => setIsRegisterDrawerOpen(false)}
                    onSwitchToLogin={() => {
                        setIsRegisterDrawerOpen(false);
                        setIsLoginDrawerOpen(true);
                    }}
                />
            </>
        );
    }

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
                <Link
                    href="/downloads"
                    className="px-4 py-2 bg-[#B00000] text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors"
                >
                    My Downloads
                </Link>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                    <Link
                        href="/shop"
                        className="inline-flex mt-4 text-[#B00000] hover:underline text-sm font-medium"
                    >
                        Go to Shop
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const isExpanded = expandedOrders.has(order.id);
                        const itemCount = order.items?.length || 0;
                        
                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                            >
                                {/* Order Header */}
                                <div className="p-4 md:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    #{order.id.slice(0, 8)}
                                                </h3>
                                                <StatusPill status={order.status} />
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(order.created_at)}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">Total</p>
                                                <p className="text-xl font-bold text-[#B00000]">
                                                    ₹{Number(order.total).toFixed(2)}
                                                </p>
                                            </div>
                                            
                                            {order.status === "pending" && Number(order.total) > 0 && (
                                                <button
                                                    onClick={() => handleContinuePayment(order.id, Number(order.total))}
                                                    disabled={processingOrderId === order.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {processingOrderId === order.id ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span className="text-sm font-medium">Processing...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Continue Payment</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            
                                            {itemCount > 0 && (
                                                <button
                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    aria-label={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-600" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-600" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items - Expandable */}
                                {isExpanded && order.items && order.items.length > 0 && (
                                    <div className="border-t border-gray-200 bg-gray-50">
                                        <div className="p-4 md:p-6">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                                Order Items ({itemCount})
                                            </h4>
                                            <div className="space-y-3">
                                                {order.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="bg-white rounded-lg p-3 flex items-center gap-4"
                                                    >
                                                        {/* Product Image */}
                                                        <Link
                                                            href={`/shop/${item.product_slug}`}
                                                            className="flex-shrink-0"
                                                        >
                                                            {item.cover_image ? (
                                                                <img
                                                                    src={`${BACKEND_BASE_URL}${item.cover_image}`}
                                                                    alt={item.product_name}
                                                                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-gray-200"
                                                                />
                                                            ) : (
                                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                    <Package className="w-8 h-8 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </Link>

                                                        {/* Product Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <Link
                                                                href={`/shop/${item.product_slug}`}
                                                                className="text-sm font-medium text-slate-900 hover:text-[#B00000] transition-colors line-clamp-2"
                                                            >
                                                                {item.product_name}
                                                            </Link>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                                <span>Qty: {item.quantity}</span>
                                                                <span>•</span>
                                                                <span>₹{Number(item.unit_price).toFixed(2)} each</span>
                                                                <span>•</span>
                                                                <span className="capitalize">{item.product_type}</span>
                                                            </div>
                                                        </div>

                                                        {/* Item Total */}
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                ₹{(Number(item.unit_price) * item.quantity).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
