"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Eye, ArrowLeft, Package, Download, MapPin, Phone, Mail, ChevronDown, ChevronUp, Printer, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi } from "@/lib/api/orders";
import type { AdminOrderSummary } from "@/lib/api/types";
import { toast } from "sonner";

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

    const downloadInvoice = async (order: AdminOrderSummary) => {
        try {
            toast.loading("Generating invoice...");
            
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF();
            
            const details = orderDetails?.order;
            const items = orderDetails?.items || [];
            
            let yPosition = 20;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            const contentWidth = pageWidth - 2 * margin;
            
            // Helper to add text
            const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
                pdf.setFontSize(fontSize);
                pdf.setFont("helvetica", isBold ? "bold" : "normal");
                pdf.text(text, x, y, { align });
            };
            
            // Header with logo and company info
            addText("DIASTOOLS", margin, yPosition, 24, true);
            yPosition += 8;
            addText("Pezhakkppilly P.O, Muvattupezha, Kerala - 686673", margin, yPosition, 9);
            yPosition += 5;
            addText("Phone: +91-8714388741 | Email: contact@diagtools.in", margin, yPosition, 9);
            yPosition += 3;
            pdf.setDrawColor(180, 0, 0);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;
            
            // Invoice title and details
            addText("TAX INVOICE", pageWidth / 2, yPosition, 18, true, 'center');
            yPosition += 10;
            
            // Invoice details (left) and Order details (right)
            const leftCol = margin;
            const rightCol = pageWidth / 2 + 10;
            
            addText(`Invoice No: INV-${order.id.slice(0, 8)}`, leftCol, yPosition, 10, true);
            addText(`Order ID: #${order.id.slice(0, 8)}`, rightCol, yPosition, 10, true);
            yPosition += 6;
            
            addText(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, leftCol, yPosition, 9);
            addText(`Status: ${order.status.toUpperCase()}`, rightCol, yPosition, 9);
            yPosition += 10;
            
            // Bill To section
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin, yPosition, contentWidth, 35);
            yPosition += 6;
            addText("BILL TO:", margin + 5, yPosition, 10, true);
            yPosition += 6;
            addText(`${details?.first_name || order.first_name} ${details?.last_name || order.last_name}`, margin + 5, yPosition, 10);
            yPosition += 5;
            if (details?.address) {
                addText(details.address, margin + 5, yPosition, 9);
                yPosition += 5;
            }
            if (details?.city) {
                addText(`${details.city}, ${details.state || ''} - ${details.pincode || ''}`, margin + 5, yPosition, 9);
                yPosition += 5;
            }
            if (details?.phone) {
                addText(`Phone: ${details.phone}`, margin + 5, yPosition, 9);
                yPosition += 5;
            }
            if (details?.email || order.user_email) {
                addText(`Email: ${details?.email || order.user_email}`, margin + 5, yPosition, 9);
            }
            yPosition += 15;
            
            // Items table header
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, yPosition, contentWidth, 8, 'F');
            pdf.setDrawColor(0, 0, 0);
            pdf.rect(margin, yPosition, contentWidth, 8);
            yPosition += 6;
            
            addText("Item", margin + 2, yPosition, 9, true);
            addText("Type", margin + 90, yPosition, 9, true);
            addText("Qty", margin + 120, yPosition, 9, true);
            addText("Price", margin + 140, yPosition, 9, true);
            addText("Total", pageWidth - margin - 2, yPosition, 9, true, 'right');
            yPosition += 4;
            
            // Items
            items.forEach((item: any) => {
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
                
                pdf.setDrawColor(200, 200, 200);
                pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 5;
                
                addText(item.product_name, margin + 2, yPosition, 9);
                addText(item.product_type, margin + 90, yPosition, 9);
                addText(String(item.quantity), margin + 120, yPosition, 9);
                addText(`₹${Number(item.unit_price).toFixed(2)}`, margin + 140, yPosition, 9);
                addText(`₹${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}`, pageWidth - margin - 2, yPosition, 9, false, 'right');
                yPosition += 2;
            });
            
            yPosition += 5;
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;
            
            // Totals
            const totalsX = pageWidth - margin - 50;
            addText("Subtotal:", totalsX, yPosition, 10);
            addText(`₹${Number(order.subtotal).toFixed(2)}`, pageWidth - margin - 2, yPosition, 10, false, 'right');
            yPosition += 6;
            
            if (Number(order.shipping_cost) > 0) {
                addText("Shipping:", totalsX, yPosition, 10);
                addText(`₹${Number(order.shipping_cost).toFixed(2)}`, pageWidth - margin - 2, yPosition, 10, false, 'right');
                yPosition += 6;
            }
            
            pdf.setDrawColor(0, 0, 0);
            pdf.line(totalsX, yPosition, pageWidth - margin, yPosition);
            yPosition += 6;
            
            addText("Total:", totalsX, yPosition, 12, true);
            addText(`₹${Number(order.total).toFixed(2)}`, pageWidth - margin - 2, yPosition, 12, true, 'right');
            yPosition += 15;
            
            // Payment info
            if (details?.payment_provider) {
                addText("Payment Information:", margin, yPosition, 10, true);
                yPosition += 6;
                addText(`Method: ${details.payment_provider}`, margin, yPosition, 9);
                yPosition += 5;
                if (details.payment_reference) {
                    addText(`Reference: ${details.payment_reference}`, margin, yPosition, 9);
                }
                yPosition += 10;
            }
            
            // Footer
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            yPosition = 280;
            pdf.setFontSize(8);
            pdf.setTextColor(128);
            pdf.text("Thank you for your business!", pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 4;
            pdf.text("This is a computer-generated invoice.", pageWidth / 2, yPosition, { align: 'center' });
            
            // Save PDF
            pdf.save(`Invoice_${order.id.slice(0, 8)}_${Date.now()}.pdf`);
            
            toast.dismiss();
            toast.success("Invoice downloaded successfully!");
        } catch (error) {
            console.error("Error generating invoice:", error);
            toast.dismiss();
            toast.error("Failed to generate invoice");
        }
    };

    const printShippingLabel = (order: AdminOrderSummary) => {
        // Find the order details
        const details = orderDetails?.order;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print shipping labels');
            return;
        }
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Shipping Label - Order #${order.id.slice(0, 8)}</title>
                <style>
                    @media print {
                        @page {
                            size: A5 landscape;
                            margin: 5mm;
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
                        padding: 10px;
                        page-break-inside: avoid;
                    }
                    
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 6px;
                        margin-bottom: 8px;
                    }
                    
                    .logo-section {
                        flex: 1;
                    }
                    
                    .logo {
                        font-size: 20px;
                        font-weight: bold;
                        color: #B00000;
                        margin-bottom: 3px;
                    }
                    
                    .logo-section img {
                        max-width: 100px;
                        height: auto;
                        display: block;
                        filter: grayscale(100%);
                    }
                    
                    .company-info {
                        font-size: 7px;
                        color: #000;
                        line-height: 1.3;
                    }
                    
                    .order-info {
                        text-align: right;
                    }
                    
                    .order-number {
                        font-size: 14px;
                        font-weight: bold;
                        color: #000;
                        margin-bottom: 2px;
                    }
                    
                    .order-date {
                        font-size: 8px;
                        color: #000;
                    }
                    
                    .addresses {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        margin-bottom: 8px;
                    }
                    
                    .address-box {
                        border: 2px solid #000;
                        padding: 6px;
                        min-height: 70px;
                    }
                    
                    .address-title {
                        font-size: 8px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #000;
                        margin-bottom: 4px;
                        padding-bottom: 3px;
                        border-bottom: 1px solid #000;
                    }
                    
                    .address-content {
                        font-size: 8px;
                        line-height: 1.3;
                    }
                    
                    .address-name {
                        font-size: 9px;
                        font-weight: bold;
                        margin-bottom: 3px;
                    }
                    
                    
                    .footer {
                        margin-top: 8px;
                        padding-top: 6px;
                        border-top: 1px solid #000;
                        font-size: 6px;
                        color: #000;
                        text-align: center;
                    }
                    
                    .barcode {
                        text-align: left;
                    }
                    
                    .barcode-text {
                        font-family: 'Courier New', monospace;
                        font-size: 10px;
                        font-weight: bold;
                        letter-spacing: 1px;
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
                            <img src="/images/logo/header-logo.png" alt="DIAGTOOLS" style="height: 18px; width: auto; margin-bottom: 3px; filter: grayscale(100%);">
                            <div class="company-info">
                                Pezhakkppilly P.O, Muvattupezha, Kerala - 686673<br>
                                Phone: +91-8714388741 | Email: contact@diagtools.in
                            </div>
                        </div>
                        <div class="order-info">
                            <div class="order-number">Order #${order.id.slice(0, 8)}</div>
                            <div class="order-date">${new Date(order.created_at).toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}</div>
                        </div>
                    </div>
                    
                    <!-- Barcode & QR Code -->
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 6px; align-items: center; margin: 6px 0; padding: 6px; background: #f0f0f0; border: 1px dashed #000;">
                        <div class="barcode">
                            <div class="barcode-text">${order.id.toUpperCase()}</div>
                        </div>
                        <div style="text-align: center;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(order.id)}" alt="QR Code" style="width: 50px; height: 50px; border: 1px solid #000; padding: 2px; background: white;">
                            <div style="font-size: 6px; margin-top: 2px; color: #000;">Scan to Track</div>
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
                    
                    
                    <!-- Footer -->
                    <div class="footer">
                        <p><strong>Handling Instructions:</strong> Handle with care. Automotive diagnostic equipment.</p>
                        <p style="margin-top: 4px;">Contact: +91-8714388741 | contact@diagtools.in</p>
                        <p style="margin-top: 4px;">Printed: ${new Date().toLocaleDateString('en-IN')}</p>
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
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                        Order & Items
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
                                        Type
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
                                                    {order.item_names ? (
                                                        <div className="text-xs text-gray-700 mt-1 max-w-xs">
                                                            <span className="font-medium">Items: </span>
                                                            {order.item_names.length > 60 
                                                                ? `${order.item_names.substring(0, 60)}...` 
                                                                : order.item_names}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            No items
                                                        </div>
                                                    )}
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
                                                        {/* Action Buttons */}
                                                        <div className="mb-4 flex justify-end gap-3">
                                                            <button
                                                                onClick={() => downloadInvoice(order)}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                                Download Invoice (A4)
                                                            </button>
                                                            {Number(order.physical_items) > 0 && (
                                                                <button
                                                                    onClick={() => printShippingLabel(order)}
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                    Print Shipping Label (A5)
                                                                </button>
                                                            )}
                                                        </div>
                                                        
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

