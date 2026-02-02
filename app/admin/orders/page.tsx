"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Eye, ArrowLeft, Package, Download, MapPin, Phone, Mail, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi } from "@/lib/api/orders";
import type { AdminOrderSummary } from "@/lib/api/types";

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
            : status === "cancelled"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-gray-50 text-gray-700 border-gray-200";
    return (
        <span
            className={`inline-flex px-2 py-1 text-xs font-medium border rounded-full ${styles}`}
        >
            {status.toUpperCase()}
        </span>
    );
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuth } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Authentication check
    useEffect(() => {
        if (!authLoading) {
            if (!isAuth || user?.role !== "admin") {
                router.push("/login");
            }
        }
    }, [authLoading, isAuth, user, router]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const resp = await ordersApi.adminAll();
            setOrders(Array.isArray(resp.data) ? resp.data : []);
        } catch (e: any) {
            setError(e?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuth && user?.role === "admin") {
            fetchOrders();
        }
    }, [isAuth, user]);

    const markPaid = async (id: string) => {
        if (
            !confirm(
                "Mark this order as PAID? This will unlock digital downloads and reduce stock for physical items."
            )
        ) {
            return;
        }
        try {
            setMarkingId(id);
            await ordersApi.adminMarkPaid(id, {
                payment_provider: "manual",
                payment_reference: `admin-${Date.now()}`,
            });
            await fetchOrders();
        } catch (e: any) {
            alert(e?.message || "Failed to mark paid");
        } finally {
            setMarkingId(null);
        }
    };

    const viewOrderDetails = async (orderId: string) => {
        // Toggle - if already expanded, collapse it
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            setOrderDetails(null);
            return;
        }
        
        try {
            setLoadingDetails(true);
            const resp = await ordersApi.adminGetById(orderId);
            setOrderDetails(resp.data);
            setExpandedOrderId(orderId);
        } catch (e: any) {
            alert(e?.message || "Failed to load order details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const printShippingLabel = (order: AdminOrderSummary) => {
        // Find the order details
        const details = orderDetails?.order;
        const items = orderDetails?.items || [];
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print shipping labels');
            return;
        }

        const physicalItems = items.filter((item: any) => item.product_type === 'physical');
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Shipping Label - Order #${order.id.slice(0, 8)}</title>
                <style>
                    @media print {
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Arial', sans-serif;
                        color: #000;
                        background: white;
                    }
                    
                    .shipping-label {
                        max-width: 100%;
                        margin: 0 auto;
                        border: 2px solid #000;
                        padding: 15px;
                        page-break-inside: avoid;
                    }
                    
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                        margin-bottom: 15px;
                    }
                    
                    .logo-section {
                        flex: 1;
                    }
                    
                    .logo {
                        font-size: 32px;
                        font-weight: bold;
                        color: #B00000;
                        margin-bottom: 5px;
                    }
                    
                    .logo-section img {
                        max-width: 150px;
                        height: auto;
                        display: block;
                        filter: grayscale(100%);
                    }
                    
                    .company-info {
                        font-size: 10px;
                        color: #000;
                        line-height: 1.4;
                    }
                    
                    .order-info {
                        text-align: right;
                    }
                    
                    .order-number {
                        font-size: 18px;
                        font-weight: bold;
                        color: #000;
                        margin-bottom: 3px;
                    }
                    
                    .order-date {
                        font-size: 10px;
                        color: #000;
                    }
                    
                    .addresses {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 15px;
                    }
                    
                    .address-box {
                        border: 2px solid #000;
                        padding: 12px;
                        min-height: 120px;
                    }
                    
                    .address-title {
                        font-size: 11px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #000;
                        margin-bottom: 8px;
                        padding-bottom: 6px;
                        border-bottom: 1px solid #000;
                    }
                    
                    .address-content {
                        font-size: 11px;
                        line-height: 1.5;
                    }
                    
                    .address-name {
                        font-size: 13px;
                        font-weight: bold;
                        margin-bottom: 6px;
                    }
                    
                    .items-section {
                        margin-bottom: 15px;
                    }
                    
                    .section-title {
                        font-size: 11px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #000;
                        margin-bottom: 8px;
                        padding-bottom: 6px;
                        border-bottom: 2px solid #000;
                    }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 10px;
                    }
                    
                    .items-table th {
                        background: #e5e5e5;
                        padding: 8px;
                        text-align: left;
                        font-size: 10px;
                        font-weight: bold;
                        border: 1px solid #000;
                    }
                    
                    .items-table td {
                        padding: 8px;
                        font-size: 11px;
                        border: 1px solid #000;
                    }
                    
                    .footer {
                        margin-top: 15px;
                        padding-top: 10px;
                        border-top: 1px solid #000;
                        font-size: 9px;
                        color: #000;
                        text-align: center;
                    }
                    
                    .barcode {
                        text-align: left;
                    }
                    
                    .barcode-text {
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        color: #000;
                    }
                    
                    .print-button {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 12px 24px;
                        background: #000;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    
                    .print-button:hover {
                        background: #333;
                    }
                </style>
            </head>
            <body>
                <button class="print-button no-print" onclick="window.print()">🖨️ Print Label</button>
                
                <div class="shipping-label">
                    <!-- Header -->
                    <div class="header">
                        <div class="logo-section">
                            <img src="/images/logo/header-logo.png" alt="DIAGTOOLS" style="height: 30px; width: auto; margin-bottom: 5px; filter: grayscale(100%);">
                            <div class="company-info">
                                Pezhakkppilly P.O, Muvattupezha, Kerala - 686673<br>
                                Phone: +91-8714388741 | Email: contact@diagtools.in
                            </div>
                        </div>
                        <div class="order-info">
                            <div class="order-number">Order #${order.id.slice(0, 8)}</div>
                            <div class="order-date">${new Date(order.created_at).toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</div>
                        </div>
                    </div>
                    
                    <!-- Barcode & QR Code -->
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; margin: 10px 0; padding: 10px; background: #f0f0f0; border: 1px dashed #000;">
                        <div class="barcode">
                            <div class="barcode-text">${order.id.toUpperCase()}</div>
                        </div>
                        <div style="text-align: center;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(order.id)}" alt="QR Code" style="width: 80px; height: 80px; border: 1px solid #000; padding: 3px; background: white;">
                            <div style="font-size: 8px; margin-top: 3px; color: #000;">Scan to Track</div>
                        </div>
                    </div>
                    
                    <!-- Addresses -->
                    <div class="addresses">
                        <!-- Ship To -->
                        <div class="address-box">
                            <div class="address-title">📦 Ship To</div>
                            <div class="address-content">
                                <div class="address-name">${details?.first_name || order.first_name} ${details?.last_name || order.last_name}</div>
                                ${details?.address || 'N/A'}<br>
                                ${details?.city || 'N/A'}, ${details?.state || 'N/A'} - ${details?.pincode || 'N/A'}<br>
                                <br>
                                📞 ${details?.phone || 'N/A'}<br>
                                ✉️ ${details?.email || order.user_email}
                            </div>
                        </div>
                        
                        <!-- Ship From -->
                        <div class="address-box">
                            <div class="address-title">📤 Ship From</div>
                            <div class="address-content">
                                <div class="address-name">DIAGTOOLS</div>
                                Pezhakkppilly P.O<br>
                                Muvattupezha, Kerala - 686673<br>
                                <br>
                                📞 +91-8714388741<br>
                                ✉️ contact@diagtools.in
                            </div>
                        </div>
                    </div>
                    
                    <!-- Items -->
                    <div class="items-section">
                        <div class="section-title">📋 Package Contents (Physical Items Only)</div>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th style="width: 50%">Product Name</th>
                                    <th style="width: 15%; text-align: center">Quantity</th>
                                    <th style="width: 20%; text-align: right">Unit Price</th>
                                    <th style="width: 15%; text-align: right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${physicalItems.map((item: any) => `
                                    <tr>
                                        <td><strong>${item.product_name}</strong></td>
                                        <td style="text-align: center">${item.quantity}</td>
                                        <td style="text-align: right">₹${Number(item.unit_price).toFixed(2)}</td>
                                        <td style="text-align: right">₹${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                ${physicalItems.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #000;">No physical items in this order</td></tr>' : ''}
                            </tbody>
                        </table>
                        
                        <div style="text-align: right; font-size: 12px; font-weight: bold; margin-top: 8px; color: #000;">
                            Total Items: ${physicalItems.reduce((sum: number, item: any) => sum + Number(item.quantity), 0)} | 
                            Order Total: ₹${Number(order.total).toFixed(2)}
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="footer">
                        <p><strong>Handling Instructions:</strong> Handle with care. This package contains automotive diagnostic equipment and training materials.</p>
                        <p style="margin-top: 10px;">For any queries, contact: +91-8714388741 | contact@diagtools.in</p>
                        <p style="margin-top: 10px; font-size: 10px;">This is a computer-generated shipping label. Printed on ${new Date().toLocaleString('en-IN')}</p>
                    </div>
                </div>
                
                <script>
                    // Auto-print on load (optional)
                    // window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    if (authLoading || (isAuth && user?.role !== "admin")) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push("/admin")}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Orders Management
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    View and manage customer orders
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-900 hover:bg-gray-50 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-600 uppercase font-medium">
                                Total Orders
                            </p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {orders.length}
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-xs text-green-700 uppercase font-medium">
                                Paid
                            </p>
                            <p className="text-2xl font-bold text-green-800 mt-1">
                                {orders.filter((o) => o.status === "paid").length}
                            </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4">
                            <p className="text-xs text-yellow-700 uppercase font-medium">
                                Pending
                            </p>
                            <p className="text-2xl font-bold text-yellow-800 mt-1">
                                {orders.filter((o) => o.status === "pending").length}
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-xs text-blue-700 uppercase font-medium">
                                Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-blue-800 mt-1">
                                ₹
                                {orders
                                    .filter((o) => o.status === "paid")
                                    .reduce((sum, o) => sum + Number(o.total), 0)
                                    .toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border-b border-red-200">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Orders Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                            <p className="mt-2">Loading orders...</p>
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                            <p>No orders yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <React.Fragment key={order.id}>
                                            <tr className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-mono font-medium text-slate-900">
                                                        #{order.id.slice(0, 8)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {order.id}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {order.first_name} {order.last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {order.user_email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusPill status={order.status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-[#B00000]">
                                                        ₹{Number(order.total).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Subtotal: ₹{Number(order.subtotal).toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                                <Package className="w-3 h-3" />
                                                                {Number(order.physical_items)} Physical
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                                                <Download className="w-3 h-3" />
                                                                {Number(order.digital_items)} Digital
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => viewOrderDetails(order.id)}
                                                            disabled={loadingDetails && expandedOrderId !== order.id}
                                                            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
                                                            title="View details"
                                                        >
                                                            {loadingDetails && expandedOrderId === order.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : expandedOrderId === order.id ? (
                                                                <ChevronUp className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4" />
                                                            )}
                                                            {expandedOrderId === order.id ? "Hide" : "View"}
                                                        </button>
                                                        {order.status === "paid" ? (
                                                            <span className="inline-flex items-center gap-2 px-3 py-2 text-green-700 bg-green-50 rounded-lg">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Paid
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => markPaid(order.id)}
                                                                disabled={markingId === order.id}
                                                                className="inline-flex items-center gap-2 px-3 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-60"
                                                            >
                                                                {markingId === order.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle className="w-4 h-4" />
                                                                )}
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            {/* Expanded Order Details Row */}
                                            {expandedOrderId === order.id && orderDetails && (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                                        {/* Print Button for Physical Items */}
                                                        {Number(order.physical_items) > 0 && (
                                                            <div className="mb-4 flex justify-end">
                                                                <button
                                                                    onClick={() => printShippingLabel(order)}
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                    Print Shipping Label
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                            {/* Left Column - Order Items */}
                                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                                    <Package className="w-4 h-4" />
                                                                    Order Items
                                                                </h3>
                                                                <div className="space-y-2">
                                                                    {orderDetails.items && orderDetails.items.map((item: any) => (
                                                                        <div
                                                                            key={item.id}
                                                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <div className="text-sm font-medium text-slate-900">
                                                                                    {item.product_name}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                                                                                        item.product_type === 'physical' 
                                                                                            ? 'bg-blue-100 text-blue-700' 
                                                                                            : 'bg-purple-100 text-purple-700'
                                                                                    }`}>
                                                                                        {item.product_type === 'physical' ? (
                                                                                            <Package className="w-3 h-3" />
                                                                                        ) : (
                                                                                            <Download className="w-3 h-3" />
                                                                                        )}
                                                                                        {item.product_type}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right ml-4">
                                                                                <div className="text-sm text-gray-600">
                                                                                    Qty: {item.quantity}
                                                                                </div>
                                                                                <div className="text-sm font-semibold text-[#B00000]">
                                                                                    ₹{Number(item.unit_price).toFixed(2)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Right Column - Shipping & Payment Info */}
                                                            <div className="space-y-4">
                                                                {/* Shipping Information */}
                                                                {Number(order.physical_items) > 0 && (
                                                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                                            <MapPin className="w-4 h-4" />
                                                                            Shipping Address
                                                                        </h3>
                                                                        <div className="space-y-2 text-sm text-gray-700">
                                                                            <p className="font-medium">
                                                                                {orderDetails.order?.first_name} {orderDetails.order?.last_name}
                                                                            </p>
                                                                            {orderDetails.order?.address && (
                                                                                <p>{orderDetails.order.address}</p>
                                                                            )}
                                                                            {orderDetails.order?.city && (
                                                                                <p>
                                                                                    {orderDetails.order.city}
                                                                                    {orderDetails.order.state && `, ${orderDetails.order.state}`}
                                                                                    {orderDetails.order.pincode && ` - ${orderDetails.order.pincode}`}
                                                                                </p>
                                                                            )}
                                                                            {orderDetails.order?.phone && (
                                                                                <p className="flex items-center gap-2 text-gray-600">
                                                                                    <Phone className="w-3 h-3" />
                                                                                    {orderDetails.order.phone}
                                                                                </p>
                                                                            )}
                                                                            {orderDetails.order?.email && (
                                                                                <p className="flex items-center gap-2 text-gray-600">
                                                                                    <Mail className="w-3 h-3" />
                                                                                    {orderDetails.order.email}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Payment Information */}
                                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                                                                        Payment Details
                                                                    </h3>
                                                                    <div className="space-y-2 text-sm">
                                                                        {orderDetails.order?.payment_provider && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Provider:</span>
                                                                                <span className="font-medium text-slate-900 capitalize">
                                                                                    {orderDetails.order.payment_provider}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {orderDetails.order?.payment_reference && (
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600">Reference:</span>
                                                                                <span className="font-mono text-xs text-slate-900">
                                                                                    {orderDetails.order.payment_reference}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                                                            <span className="text-gray-600">Subtotal:</span>
                                                                            <span className="font-medium text-slate-900">
                                                                                ₹{Number(orderDetails.order?.subtotal || 0).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between font-semibold text-base">
                                                                            <span className="text-slate-900">Total:</span>
                                                                            <span className="text-[#B00000]">
                                                                                ₹{Number(orderDetails.order?.total || 0).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

