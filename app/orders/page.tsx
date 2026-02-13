"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package, ChevronDown, CreditCard, Truck, Calendar, ExternalLink, CheckCircle, Clock, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import type { Order } from "@/lib/api/types";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";
import { toast } from "sonner";
import { Badge, NotificationBanner, TimelineStep, SummaryRow, OrderItemCard } from "@/components/orders";

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

function formatShortDate(dateString: string) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// StatusPill replaced by Badge component

function hasPhysicalItems(order: Order): boolean {
    return order.items?.some(item => item.product_type === 'physical') || false;
}

function hasDigitalItems(order: Order): boolean {
    return order.items?.some(item => item.product_type === 'digital') || false;
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
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Quick Access Notifications */}
            {orders.length > 0 && (
                <>
                    {/* Digital Products Ready */}
                    {orders.some(o => o.status === 'paid' && hasDigitalItems(o)) && (
                        <NotificationBanner
                            variant="purple"
                            icon={Download}
                            title="Digital Products Available"
                            description="Your digital products are ready to download"
                            action={
                                <Link
                                    href="/downloads"
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
                                >
                                    View Downloads
                                </Link>
                            }
                        />
                    )}
                    
                    {/* Tracked Shipments */}
                    {orders.some(o => o.status === 'paid' && hasPhysicalItems(o) && o.tracking_number && !o.delivered_at) && (
                        <NotificationBanner
                            variant="blue"
                            icon={Truck}
                            title={`${orders.filter(o => o.status === 'paid' && hasPhysicalItems(o) && o.tracking_number && !o.delivered_at).length} Shipment(s) In Transit`}
                            description="Track your orders to see estimated delivery times"
                        />
                    )}
                </>
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
                                                className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
                                            >
                                {/* Order Header */}
                                <div className="p-4 md:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    #{order.id.slice(0, 8)}
                                                </h3>
                                                <Badge variant={order.status as any}>
                                                    {order.status.toUpperCase()}
                                                </Badge>
                                                
                                                {/* Quick Indicators */}
                                                {order.status === 'paid' && hasPhysicalItems(order) && order.tracking_number && (
                                                    <Badge variant="tracked" icon={Truck}>
                                                        Tracked
                                                    </Badge>
                                                )}
                                                {order.status === 'paid' && hasDigitalItems(order) && (
                                                    <Badge variant="ready" icon={Download}>
                                                        Ready
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(order.created_at)}
                                            </p>
                                            
                                            {/* Quick Info - Estimated Delivery */}
                                            {order.status === 'paid' && order.estimated_delivery_date && !isExpanded && (
                                                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    ETA: {formatShortDate(order.estimated_delivery_date)}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 justify-end md:justify-start">
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
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm font-medium"
                                                >
                                                    {processingOrderId === order.id ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Processing...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="w-4 h-4" />
                                                            <span>Continue Payment</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            
                                            {itemCount > 0 && (
                                                <button
                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 flex-shrink-0"
                                                    aria-label={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    <ChevronDown 
                                                        className={`w-5 h-5 text-gray-600 transition-transform duration-300 ease-in-out ${
                                                            isExpanded ? 'rotate-180' : 'rotate-0'
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Information - Priority 2 - Only show when expanded */}
                                {order.status === 'paid' && hasPhysicalItems(order) && (order.tracking_number || order.estimated_delivery_date) && (
                                    <div 
                                        className={`border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-300 ease-in-out overflow-hidden ${
                                            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <div className="p-4 md:p-6">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <Truck className="w-5 h-5 text-blue-600" />
                                                Shipment Tracking
                                            </h4>
                                            
                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                {/* Tracking Number & Link */}
                                                {order.tracking_number && (
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-600 mb-1">Tracking Number</p>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <p className="text-base font-semibold text-slate-900 font-mono">
                                                                {order.tracking_number}
                                                            </p>
                                                            {order.tracking_url && (
                                                                <a
                                                                    href={order.tracking_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                    Track Your Order
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Estimated Delivery */}
                                                {order.estimated_delivery_date && (
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-green-600" />
                                                            <p className="text-xs text-gray-600">Estimated Delivery</p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-900 mt-1 ml-6">
                                                            {formatShortDate(order.estimated_delivery_date)}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {/* Shipment Timeline */}
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <p className="text-xs font-medium text-gray-700 mb-3">Shipment Progress</p>
                                                    <div className="space-y-3">
                                                        <TimelineStep
                                                            icon={CheckCircle}
                                                            status="complete"
                                                            title="Order Placed"
                                                            description={formatDate(order.created_at)}
                                                        />
                                                        
                                                        {order.status === 'paid' && (
                                                            <TimelineStep
                                                                icon={CheckCircle}
                                                                status="complete"
                                                                title="Payment Confirmed"
                                                                description="Order is being processed"
                                                            />
                                                        )}
                                                        
                                                        {order.shipped_at ? (
                                                            <TimelineStep
                                                                icon={CheckCircle}
                                                                status="complete"
                                                                title="Shipped"
                                                                description={formatDate(order.shipped_at)}
                                                            />
                                                        ) : (
                                                            <TimelineStep
                                                                icon={Clock}
                                                                status="pending"
                                                                title="Preparing to Ship"
                                                                description="Your order is being prepared"
                                                            />
                                                        )}
                                                        
                                                        {order.delivered_at ? (
                                                            <TimelineStep
                                                                icon={CheckCircle}
                                                                status="complete"
                                                                title="✨ Delivered"
                                                                description={formatDate(order.delivered_at)}
                                                            />
                                                        ) : order.shipped_at ? (
                                                            <TimelineStep
                                                                icon={Truck}
                                                                status="active"
                                                                title="In Transit"
                                                                description={
                                                                    order.estimated_delivery_date 
                                                                        ? `Expected: ${formatShortDate(order.estimated_delivery_date)}`
                                                                        : 'On the way to you'
                                                                }
                                                                animated
                                                            />
                                                        ) : (
                                                            <TimelineStep
                                                                icon={Clock}
                                                                status="pending"
                                                                title="Delivery Pending"
                                                                description="Will be shipped soon"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Order Items - Priority 4 - Enhanced with Downloads */}
                                {order.items && order.items.length > 0 && (
                                    <div 
                                        className={`border-t border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden ${
                                            isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <div className="p-4 md:p-6">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                                Order Items ({itemCount})
                                            </h4>
                                            <div className="space-y-3">
                                                {order.items.map((item) => (
                                                    <OrderItemCard
                                                        key={item.id}
                                                        productId={item.product_id}
                                                        productSlug={item.product_slug}
                                                        productName={item.product_name}
                                                        coverImage={item.cover_image}
                                                        quantity={item.quantity}
                                                        unitPrice={Number(item.unit_price)}
                                                        productType={item.product_type}
                                                        isPaid={order.status === 'paid'}
                                                        backendBaseUrl={BACKEND_BASE_URL}
                                                    />
                                                ))}
                                            </div>
                                            
                                            {/* Order Summary */}
                                            <div className="mt-4 pt-4 border-t border-gray-200 bg-white rounded-lg p-4">
                                                <div className="space-y-2">
                                                    <SummaryRow
                                                        label="Subtotal"
                                                        value={`₹${Number(order.subtotal).toFixed(2)}`}
                                                    />
                                                    <SummaryRow
                                                        label="Shipping"
                                                        value={Number(order.shipping_cost) > 0 
                                                            ? `₹${Number(order.shipping_cost).toFixed(2)}`
                                                            : 'Free'}
                                                    />
                                                    <SummaryRow
                                                        variant="total"
                                                        label="Total"
                                                        value={`₹${Number(order.total).toFixed(2)}`}
                                                    />
                                                </div>
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
