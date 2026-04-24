"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package, ChevronDown, CreditCard, Truck, Calendar, ExternalLink, CheckCircle, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import type { Order } from "@/lib/api/types";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";
import { toast } from "sonner";
import { Badge, NotificationBanner, SummaryRow, OrderItemCard } from "@/components/orders";

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

function getEstimatedDeliveryDate(order: Order): string | null {
    if (!hasPhysicalItems(order)) return null;
    if (order.status === 'delivered' || order.delivered_at) return null; // Already delivered
    if (order.estimated_delivery_date) return order.estimated_delivery_date;

    // Default estimate: 7 days from order placement
    const date = new Date(order.created_at);
    date.setDate(date.getDate() + 7);
    return date.toISOString();
}

function getDisplayOrderNumber(order: Order): string {
    return String(order.order_number || order.id.slice(0, 8));
}

function formatCurrency(value: number | string) {
    return `Rs. ${Number(value || 0).toFixed(2)}`;
}

async function loadImageAsDataUrl(src: string): Promise<string> {
    return await new Promise((resolve, reject) => {
        const image = new window.Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const context = canvas.getContext("2d");
            if (!context) {
                reject(new Error("Failed to create canvas context"));
                return;
            }

            context.drawImage(image, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        image.onerror = () => reject(new Error("Failed to load logo image"));
        image.src = src;
    });
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
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

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

    const handleDownloadInvoice = async (order: Order) => {
        try {
            setDownloadingInvoiceId(order.id);

            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 14;
            const contentWidth = pageWidth - margin * 2;
            const statusText = order.status.toUpperCase();
            const items = order.items || [];
            const logoUrl = `${window.location.origin}/images/logo/header-logo.png`;
            let y = margin;

            const ensureSpace = (requiredHeight: number) => {
                if (y + requiredHeight <= pageHeight - margin) return;
                pdf.addPage();
                y = margin;
            };

            const drawText = (
                text: string,
                x: number,
                currentY: number,
                options?: {
                    width?: number;
                    size?: number;
                    bold?: boolean;
                    color?: [number, number, number];
                    align?: "left" | "center" | "right";
                    lineHeight?: number;
                }
            ) => {
                const width = options?.width || contentWidth;
                const size = options?.size || 10;
                const lineHeight = options?.lineHeight || 5;

                pdf.setFont("helvetica", options?.bold ? "bold" : "normal");
                pdf.setFontSize(size);
                pdf.setTextColor(...(options?.color || [28, 28, 28]));

                const lines = pdf.splitTextToSize(text, width);
                pdf.text(lines, x, currentY, { align: options?.align || "left" });
                return currentY + lines.length * lineHeight;
            };

            const drawLabelValue = (label: string, value: string, x: number, topY: number, width: number) => {
                let nextY = drawText(label, x, topY, {
                    width,
                    size: 8,
                    bold: true,
                    color: [107, 114, 128],
                    lineHeight: 4,
                });
                nextY = drawText(value, x, nextY + 1, {
                    width,
                    size: 11,
                    bold: true,
                    color: [17, 24, 39],
                    lineHeight: 5,
                });
                return nextY;
            };

            const drawSectionTitle = (title: string) => {
                ensureSpace(10);
                y += 4;
                y = drawText(title, margin, y, {
                    size: 10,
                    bold: true,
                    color: [31, 41, 55],
                });
                y += 4;
            };

            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, pageHeight, "F");

            try {
                const logoDataUrl = await loadImageAsDataUrl(logoUrl);
                pdf.addImage(logoDataUrl, "PNG", margin, y, 34, 12);
            } catch (logoError) {
                console.error("Failed to load invoice logo", logoError);
                drawText("DIASTOOLS", margin, y + 7, {
                    width: 40,
                    size: 14,
                    bold: true,
                    color: [17, 24, 39],
                });
            }

            drawText("Invoice", pageWidth - margin, y + 5, {
                width: 60,
                size: 18,
                bold: true,
                color: [17, 24, 39],
                align: "right",
            });
            drawText(`Order ${getDisplayOrderNumber(order)}`, pageWidth - margin, y + 11, {
                width: 60,
                size: 9,
                color: [100, 116, 139],
                align: "right",
            });
            y += 20;

            pdf.setDrawColor(229, 231, 235);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 8;

            const metaY = y;
            const colWidth = contentWidth / 3;
            drawLabelValue("Invoice No", getDisplayOrderNumber(order), margin, metaY, colWidth - 4);
            drawLabelValue("Date", formatShortDate(order.created_at), margin + colWidth, metaY, colWidth - 4);
            drawLabelValue("Status", statusText, margin + colWidth * 2, metaY, colWidth - 4);
            y += 18;

            drawSectionTitle("Order Items");
            ensureSpace(16);
            pdf.setDrawColor(229, 231, 235);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 7;
            drawText("Item", margin, y, { size: 8, bold: true, color: [107, 114, 128] });
            drawText("Qty", margin + 124, y, { size: 8, bold: true, color: [107, 114, 128], align: "right", width: 10 });
            drawText("Price", margin + 148, y, { size: 8, bold: true, color: [107, 114, 128], align: "right", width: 16 });
            drawText("Total", pageWidth - margin, y, { size: 8, bold: true, color: [107, 114, 128], align: "right", width: 20 });
            y += 5;
            pdf.line(margin, y, pageWidth - margin, y);
            y += 5;

            items.forEach((item) => {
                const rowHeight = 14;
                ensureSpace(rowHeight + 4);
                const itemTotal = Number(item.unit_price) * Number(item.quantity);
                const itemNameY = drawText(item.product_name, margin + 4, y + 5, {
                    width: 100,
                    size: 10,
                    bold: true,
                    color: [15, 23, 42],
                    lineHeight: 4.5,
                });
                drawText(item.product_type === "digital" ? "Digital" : "Physical", margin + 4, itemNameY, {
                    width: 100,
                    size: 8,
                    color: [100, 116, 139],
                });
                drawText(String(item.quantity), margin + 126, y + 8, {
                    width: 12,
                    size: 9,
                    bold: true,
                    color: [31, 41, 55],
                    align: "right",
                });
                drawText(formatCurrency(item.unit_price), margin + 154, y + 8, {
                    width: 24,
                    size: 9,
                    color: [31, 41, 55],
                    align: "right",
                });
                drawText(formatCurrency(itemTotal), pageWidth - margin - 4, y + 8, {
                    width: 24,
                    size: 9,
                    bold: true,
                    color: [17, 24, 39],
                    align: "right",
                });
                y += rowHeight;
                pdf.setDrawColor(243, 244, 246);
                pdf.line(margin, y, pageWidth - margin, y);
                y += 3;
            });

            drawSectionTitle("Payment Summary");
            ensureSpace(26);
            const summaryBoxWidth = 72;
            const summaryBoxX = pageWidth - margin - summaryBoxWidth;
            drawText("Subtotal", summaryBoxX + 4, y + 5, { size: 9, color: [71, 85, 105] });
            drawText(formatCurrency(order.subtotal), summaryBoxX + summaryBoxWidth - 4, y + 7, {
                size: 9,
                color: [15, 23, 42],
                align: "right",
                width: 30,
            });
            drawText("Shipping", summaryBoxX + 4, y + 12, { size: 9, color: [71, 85, 105] });
            drawText(Number(order.shipping_cost) > 0 ? formatCurrency(order.shipping_cost) : "Free", summaryBoxX + summaryBoxWidth - 4, y + 14, {
                size: 9,
                color: [15, 23, 42],
                align: "right",
                width: 30,
            });
            pdf.setDrawColor(203, 213, 225);
            pdf.line(summaryBoxX + 4, y + 17, summaryBoxX + summaryBoxWidth - 4, y + 17);
            drawText("Total", summaryBoxX + 4, y + 24, { size: 10, bold: true, color: [17, 24, 39] });
            drawText(formatCurrency(order.total), summaryBoxX + summaryBoxWidth - 4, y + 24, {
                size: 10,
                bold: true,
                color: [17, 24, 39],
                align: "right",
                width: 30,
            });
            y += 30;

            if (order.tracking_number || order.estimated_delivery_date || order.tracking_url || order.delivered_at) {
                drawSectionTitle("Delivery Details");
                ensureSpace(16);
                const details: string[] = [];
                if (order.tracking_number) details.push(`Tracking: ${order.tracking_number}`);
                if (order.estimated_delivery_date) details.push(`Estimated Delivery: ${formatShortDate(order.estimated_delivery_date)}`);
                if (order.tracking_url) details.push("Tracking link available online");
                if (order.delivered_at) details.push(`Delivered: ${formatShortDate(order.delivered_at)}`);

                let detailsY = y + 7;
                details.forEach((detail) => {
                    detailsY = drawText(detail, margin + 5, detailsY, {
                        width: contentWidth - 10,
                        size: 9,
                        color: [51, 65, 85],
                    });
                });
                y = detailsY + 2;
            }

            ensureSpace(20);
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);
            drawText("Thank you for your order.", margin, pageHeight - 15, {
                size: 9,
                color: [107, 114, 128],
            });
            drawText(`Generated on ${new Date().toLocaleString()}`, pageWidth - margin, pageHeight - 15, {
                size: 8,
                color: [100, 116, 139],
                align: "right",
                width: 70,
            });

            pdf.save(`invoice-${getDisplayOrderNumber(order)}.pdf`);
        } catch (error) {
            console.error("Invoice download failed", error);
            toast.error("Failed to download invoice");
        } finally {
            setDownloadingInvoiceId(null);
        }
    };

    const handleContinuePayment = async (orderId: string) => {
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
                    {orders.some(o => (o.status === 'paid' || o.status === 'shipped' || o.status === 'dispatched') && hasPhysicalItems(o) && o.tracking_number && !o.delivered_at) && (
                        <NotificationBanner
                            variant="blue"
                            icon={Truck}
                            title={`${orders.filter(o => (o.status === 'paid' || o.status === 'shipped' || o.status === 'dispatched') && hasPhysicalItems(o) && o.tracking_number && !o.delivered_at).length} Shipment(s) In Transit`}
                            description="Track your orders to see estimated delivery times"
                        />
                    )}

                    {/* Recently Delivered */}
                    {orders.some(o => o.status === 'delivered' || o.delivered_at) && (
                        <NotificationBanner
                            variant="success"
                            icon={CheckCircle}
                            title={`${orders.filter(o => o.status === 'delivered' || o.delivered_at).length} Order(s) Delivered`}
                            description="Your packages have successfully arrived"
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
                        const estimatedDate = getEstimatedDeliveryDate(order);

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
                                                    #{getDisplayOrderNumber(order)}
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
                                            {['paid', 'processing', 'shipped', 'dispatched'].includes(order.status) && estimatedDate && !isExpanded && (
                                                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    ETA: {formatShortDate(estimatedDate)}
                                                </p>
                                            )}
                                            {order.status === 'delivered' && !isExpanded && order.delivered_at && (
                                                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Delivered on {formatShortDate(order.delivered_at)}
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
                                                    onClick={() => handleContinuePayment(order.id)}
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
                                                        className={`w-5 h-5 text-gray-600 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'
                                                            }`}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Information - Priority 2 - Only show when expanded */}
                                {['paid', 'processing', 'shipped', 'dispatched', 'delivered'].includes(order.status) && hasPhysicalItems(order) && (order.tracking_number || estimatedDate || order.delivered_at) && (
                                    <div
                                        className={`border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                                            }`}
                                    >
                                        <div className="p-4 md:p-6">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <Truck className="w-5 h-5 text-blue-600" />
                                                Shipment Tracking
                                            </h4>

                                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                                <div className="mb-6">
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Tracking Number</p>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <p className="text-lg font-bold text-slate-900 font-mono">
                                                            {order.tracking_number || "Awaiting Pickup"}
                                                        </p>
                                                        {order.tracking_url && (
                                                            <a
                                                                href={order.tracking_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" /> Track Package
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Estimated Delivery Banner */}
                                                {estimatedDate && (
                                                    <div className="mb-6 flex items-center gap-3 p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                                                        <div className="p-2 bg-blue-500 rounded-lg">
                                                            <Calendar className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold opacity-80">Estimated Delivery</p>
                                                            <p className="text-base font-bold">{formatShortDate(estimatedDate)}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {order.delivered_at && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                                        <p className="text-sm font-medium text-green-700">
                                                            Delivered on {formatShortDate(order.delivered_at)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Order Items - Priority 4 - Enhanced with Downloads */}
                                {order.items && order.items.length > 0 && (
                                    <div
                                        className={`border-t border-gray-200 bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
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

                                                <button
                                                    onClick={() => handleDownloadInvoice(order)}
                                                    disabled={downloadingInvoiceId === order.id}
                                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                >
                                                    {downloadingInvoiceId === order.id ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>Preparing Invoice...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-4 h-4" />
                                                            <span>Download Invoice</span>
                                                        </>
                                                    )}
                                                </button>
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
