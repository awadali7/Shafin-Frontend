"use client";

import React, { useEffect, useState, useMemo } from "react";
import { CheckCircle, Loader2, Eye, Package, Download, MapPin, Phone, Mail, ChevronDown, ChevronUp, Printer, FileText, Truck, Calendar, Save, ExternalLink, Search } from "lucide-react";
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

export const OrdersTab: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [savingTracking, setSavingTracking] = useState(false);
    const [itemImagesMap, setItemImagesMap] = useState<Record<string, { name: string; image: string | null }[]>>({});
    const [trackingForm, setTrackingForm] = useState({
        tracking_number: "",
        tracking_url: "",
        estimated_delivery_date: "",
    });
    const [search, setSearch] = useState("");

    // Batch print state
    const todayStr = new Date().toISOString().split('T')[0];
    const [labelFromDate, setLabelFromDate] = useState(todayStr);
    const [labelToDate, setLabelToDate] = useState(todayStr);
    const [printingLabels, setPrintingLabels] = useState(false);

    const filteredOrders = useMemo(() => {
        if (!search.trim()) return orders;
        const q = search.trim().toLowerCase();
        return orders.filter(
            (o: any) =>
                (o.id || "").toLowerCase().includes(q) ||
                `${o.shipping_first_name || ""} ${o.shipping_last_name || ""}`.toLowerCase().includes(q) ||
                (o.user_email || o.email || "").toLowerCase().includes(q)
        );
    }, [orders, search]);

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
        fetchOrders();
    }, []);

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
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            setOrderDetails(null);
            setTrackingForm({ tracking_number: "", tracking_url: "", estimated_delivery_date: "" });
            return;
        }

        try {
            setLoadingDetails(true);
            const resp = await ordersApi.adminGetById(orderId);
            setOrderDetails(resp.data);
            setExpandedOrderId(orderId);

            // Cache item images for this order
            const items = resp.data?.items || [];
            setItemImagesMap(prev => ({
                ...prev,
                [orderId]: items.map((item: any) => ({
                    name: item.product_name,
                    image: item.cover_image || null,
                }))
            }));

            const order = resp.data?.order;
            setTrackingForm({
                tracking_number: order?.tracking_number || "",
                tracking_url: order?.tracking_url || "",
                estimated_delivery_date: order?.estimated_delivery_date
                    ? new Date(order.estimated_delivery_date).toISOString().split('T')[0]
                    : "",
            });
        } catch (e: any) {
            alert(e?.message || "Failed to load order details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const saveTrackingInfo = async (orderId: string) => {
        try {
            setSavingTracking(true);

            const payload: any = {
                tracking_number: trackingForm.tracking_number || null,
                tracking_url: trackingForm.tracking_url || null,
                estimated_delivery_date: trackingForm.estimated_delivery_date || null,
            };

            if (trackingForm.tracking_number && !orderDetails?.order?.shipped_at) {
                payload.shipped_at = new Date().toISOString();
            }

            await ordersApi.adminUpdateTracking(orderId, payload);
            toast.success("Tracking information updated successfully!");
            await viewOrderDetails(orderId);
            await fetchOrders();
        } catch (e: any) {
            console.error("Error updating tracking:", e);
            toast.error(e?.message || "Failed to update tracking information");
        } finally {
            setSavingTracking(false);
        }
    };

    const downloadInvoice = async (order: AdminOrderSummary) => {
        try {
            toast.loading("Generating invoice...");
            const orderNum = orders.length - orders.findIndex(o => o.id === order.id);

            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF();

            const details = orderDetails?.order;
            const items = orderDetails?.items || [];

            let yPosition = 20;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            const contentWidth = pageWidth - 2 * margin;

            const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false, align: 'left' | 'center' | 'right' = 'left') => {
                pdf.setFontSize(fontSize);
                pdf.setFont("helvetica", isBold ? "bold" : "normal");
                pdf.text(text, x, y, { align });
            };

            addText("DIASTOOLS", margin, yPosition, 24, true);
            yPosition += 8;
            addText("Pezhakkppilly P.O, Muvattupezha, Kerala - 686673", margin, yPosition, 9);
            yPosition += 5;
            addText("Phone: +91-8714388741 | Email: contact@diagtools.in", margin, yPosition, 9);
            yPosition += 3;
            pdf.setDrawColor(180, 0, 0);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;

            addText("TAX INVOICE", pageWidth / 2, yPosition, 18, true, 'center');
            yPosition += 10;

            const leftCol = margin;
            const rightCol = pageWidth / 2 + 10;

            addText(`Invoice No: INV-${orderNum}`, leftCol, yPosition, 10, true);
            addText(`Order ID: #${orderNum}`, rightCol, yPosition, 10, true);
            yPosition += 6;

            addText(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, leftCol, yPosition, 9);
            addText(`Status: ${order.status.toUpperCase()}`, rightCol, yPosition, 9);
            yPosition += 10;

            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin, yPosition, contentWidth, 35);
            yPosition += 6;
            addText("BILL TO:", margin + 5, yPosition, 10, true);
            yPosition += 6;
            addText(`${details?.first_name || order.first_name} ${details?.last_name || order.last_name}`, margin + 5, yPosition, 10);
            yPosition += 5;
            if (details?.address) { addText(details.address, margin + 5, yPosition, 9); yPosition += 5; }
            if (details?.city) { addText(`${details.city}, ${details.state || ''} - ${details.pincode || ''}`, margin + 5, yPosition, 9); yPosition += 5; }
            if (details?.phone) { addText(`Phone: ${details.phone}`, margin + 5, yPosition, 9); yPosition += 5; }
            if (details?.email || order.user_email) { addText(`Email: ${details?.email || order.user_email}`, margin + 5, yPosition, 9); }
            yPosition += 15;

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

            items.forEach((item: any) => {
                if (yPosition > 250) { pdf.addPage(); yPosition = 20; }
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

            if (details?.tracking_number || details?.estimated_delivery_date) {
                addText("Shipping Information:", margin, yPosition, 10, true);
                yPosition += 6;
                if (details.tracking_number) { addText(`Tracking Number: ${details.tracking_number}`, margin, yPosition, 9); yPosition += 5; }
                if (details.estimated_delivery_date) { addText(`Estimated Delivery: ${new Date(details.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, yPosition, 9); yPosition += 5; }
                if (details.shipped_at) { addText(`Shipped On: ${new Date(details.shipped_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, yPosition, 9); }
                yPosition += 10;
            }

            yPosition = 280;
            pdf.setFontSize(8);
            pdf.setTextColor(128);
            pdf.text("Thank you for your business!", pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 4;
            pdf.text("This is a computer-generated invoice.", pageWidth / 2, yPosition, { align: 'center' });

            pdf.save(`Invoice_${orderNum}_${Date.now()}.pdf`);
            toast.dismiss();
            toast.success("Invoice downloaded successfully!");
        } catch (error) {
            console.error("Error generating invoice:", error);
            toast.dismiss();
            toast.error("Failed to generate invoice");
        }
    };

    const printShippingLabel = (order: AdminOrderSummary) => {
        const details = orderDetails?.order;
        const orderNum = orders.length - orders.findIndex(o => o.id === order.id);
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
                <title>Shipping Label - Order #${orderNum}</title>
                <style>
                    @media print { @page { size: A5 landscape; margin: 5mm; } body { margin: 0; padding: 0; } .no-print { display: none; } }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Arial', sans-serif; color: #000; background: white; }
                    .shipping-label { max-width: 100%; margin: 0 auto; border: 2px solid #000; padding: 10px; page-break-inside: avoid; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
                    .logo-section { flex: 1; }
                    .company-info { font-size: 7px; color: #000; line-height: 1.3; }
                    .order-info { text-align: right; }
                    .order-number { font-size: 14px; font-weight: bold; color: #000; margin-bottom: 2px; }
                    .order-date { font-size: 8px; color: #000; }
                    .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
                    .address-box { border: 2px solid #000; padding: 6px; min-height: 70px; }
                    .address-title { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #000; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px solid #000; }
                    .address-content { font-size: 8px; line-height: 1.3; }
                    .address-name { font-size: 9px; font-weight: bold; margin-bottom: 3px; }
                    .footer { margin-top: 8px; padding-top: 6px; border-top: 1px solid #000; font-size: 6px; color: #000; text-align: center; }
                    .barcode-text { font-family: 'Courier New', monospace; font-size: 10px; font-weight: bold; letter-spacing: 1px; color: #000; }
                    .print-button { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #000; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; }
                </style>
            </head>
            <body>
                <button class="print-button no-print" onclick="window.print()">🖨️ Print Label</button>
                <div class="shipping-label">
                    <div class="header">
                        <div class="logo-section">
                            <img src="/images/logo/header-logo.png" alt="DIAGTOOLS" style="height: 18px; width: auto; margin-bottom: 3px; filter: grayscale(100%);">
                            <div class="company-info">Pezhakkppilly P.O, Muvattupezha, Kerala - 686673<br>Phone: +91-8714388741 | Email: contact@diagtools.in</div>
                        </div>
                        <div class="order-info">
                            <div class="order-number">Order #${orderNum}</div>
                            <div class="order-date">${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 6px; align-items: center; margin: 6px 0; padding: 6px; background: #f0f0f0; border: 1px dashed #000;">
                        <div>
                            <div class="barcode-text">${order.id.toUpperCase()}</div>
                            ${details?.tracking_number ? `<div style="font-size: 8px; margin-top: 3px;"><strong>Tracking:</strong> ${details.tracking_number}</div>` : ''}
                            ${details?.estimated_delivery_date ? `<div style="font-size: 7px; margin-top: 2px;">Est. Delivery: ${new Date(details.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>` : ''}
                        </div>
                        <div style="text-align: center;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(order.id)}" alt="QR Code" style="width: 50px; height: 50px; border: 1px solid #000; padding: 2px; background: white;">
                            <div style="font-size: 6px; margin-top: 2px;">Scan to Track</div>
                        </div>
                    </div>
                    <div class="addresses">
                        <div class="address-box">
                            <div class="address-title">📦 Ship To</div>
                            <div class="address-content">
                                <div class="address-name">${details?.first_name || order.first_name} ${details?.last_name || order.last_name}</div>
                                ${details?.address || 'N/A'}<br>
                                ${details?.city || 'N/A'}, ${details?.state || 'N/A'} - ${details?.pincode || 'N/A'}<br><br>
                                📞 ${details?.phone || 'N/A'}<br>
                                ✉️ ${details?.email || order.user_email}
                            </div>
                        </div>
                        <div class="address-box">
                            <div class="address-title">📤 Ship From</div>
                            <div class="address-content">
                                <div class="address-name">DIAGTOOLS</div>
                                Pezhakkppilly P.O<br>Muvattupezha, Kerala - 686673<br><br>
                                📞 +91-8714388741<br>
                                ✉️ contact@diagtools.in
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <p><strong>Handling Instructions:</strong> Handle with care. Automotive diagnostic equipment.</p>
                        <p style="margin-top: 4px;">Contact: +91-8714388741 | contact@diagtools.in</p>
                        <p style="margin-top: 4px;">Printed: ${new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // ─── Batch Print Shipping Labels ─────────────────────────────────────────
    const chunkArray = <T,>(arr: T[], size: number): T[][] => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };

    const printBatchShippingLabels = async () => {
        const from = new Date(labelFromDate); from.setHours(0, 0, 0, 0);
        const to = new Date(labelToDate); to.setHours(23, 59, 59, 999);

        const targetOrders = orders.filter((o) => {
            const d = new Date(o.created_at);
            return d >= from && d <= to && Number((o as any).physical_items) > 0;
        });

        if (targetOrders.length === 0) {
            alert('No physical orders found for the selected date range.');
            return;
        }

        setPrintingLabels(true);
        try {
            const detailsArr = await Promise.all(
                targetOrders.map((o) => ordersApi.adminGetById(o.id).then((r) => r.data).catch(() => null))
            );

            const printWindow = window.open('', '_blank');
            if (!printWindow) { alert('Please allow popups to print shipping labels.'); return; }

            const buildLabel = (order: AdminOrderSummary, details: any, isSecond: boolean) => {
                const d = details?.order || {};
                const name = `${d.first_name || order.first_name || ''} ${d.last_name || order.last_name || ''}`.trim();
                const cityLine = [d.city, d.state && `${d.state}${d.pincode ? ' - ' + d.pincode : ''}`].filter(Boolean).join(', ');
                return `
                <div class="label${isSecond ? ' second' : ''}">
                    <div class="label-inner">
                        <div class="lbl-header">
                            <div>
                                <div class="co-name">DIAGTOOLS</div>
                                <div class="co-sub">Pezhakkppilly P.O, Muvattupezha, Kerala - 686673</div>
                                <div class="co-sub">+91-8714388741 &bull; contact@diagtools.in</div>
                            </div>
                            <div class="order-meta">
                                <div class="ord-num">#${order.id.slice(0, 8).toUpperCase()}</div>
                                <div class="ord-date">${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                ${d.tracking_number ? `<div class="trk">TRK: ${d.tracking_number}</div>` : ''}
                            </div>
                        </div>
                        <div class="addrs">
                            <div class="addr-box">
                                <div class="addr-title">&#128230; SHIP TO</div>
                                <div class="addr-name">${name || 'N/A'}</div>
                                ${d.address ? `<div>${d.address}</div>` : ''}
                                ${cityLine ? `<div>${cityLine}</div>` : ''}
                                ${d.phone ? `<div>&#128222; ${d.phone}</div>` : ''}
                                <div>&#9993; ${d.email || order.user_email || ''}</div>
                            </div>
                            <div class="addr-box">
                                <div class="addr-title">&#128228; SHIP FROM</div>
                                <div class="addr-name">DIAGTOOLS</div>
                                <div>Pezhakkppilly P.O</div>
                                <div>Muvattupezha, Kerala - 686673</div>
                                <div>&#128222; +91-8714388741</div>
                                <div>&#9993; contact@diagtools.in</div>
                            </div>
                        </div>
                        ${d.estimated_delivery_date ? `<div class="eta">&#128338; Est. Delivery: ${new Date(d.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>` : ''}
                        <div class="lbl-footer">Handle with care &bull; Automotive diagnostic equipment</div>
                    </div>
                </div>`;
            };

            const pages = chunkArray(detailsArr, 2).map((chunk, pi) => {
                const label1 = buildLabel(targetOrders[pi * 2], chunk[0], false);
                const label2 = chunk[1]
                    ? buildLabel(targetOrders[pi * 2 + 1], chunk[1], true)
                    : `<div class="label second blank"><div style="color:#ccc;font-size:11pt;text-align:center;padding-top:30mm;">— cut here / blank —</div></div>`;
                return `<div class="page">${label1}${label2}</div>`;
            }).join('');

            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Shipping Labels ${labelFromDate} to ${labelToDate}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;background:#fff;}
  .page{width:210mm;height:297mm;display:flex;flex-direction:column;overflow:hidden;page-break-after:always;}
  .label{width:210mm;height:148.5mm;position:relative;}
  .second{border-top:2px dashed #aaa;}
  .label-inner{padding:7mm 10mm 5mm;height:100%;display:flex;flex-direction:column;gap:3mm;}
  .lbl-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:3mm;}
  .co-name{font-size:15pt;font-weight:bold;color:#B00000;}
  .co-sub{font-size:7pt;color:#444;line-height:1.5;}
  .order-meta{text-align:right;}
  .ord-num{font-size:13pt;font-weight:bold;font-family:'Courier New',monospace;}
  .ord-date{font-size:7.5pt;color:#555;}
  .trk{font-size:7pt;color:#333;margin-top:2px;}
  .addrs{display:grid;grid-template-columns:1fr 1fr;gap:4mm;flex:1;}
  .addr-box{border:1.5px solid #000;padding:3mm;font-size:8pt;line-height:1.6;}
  .addr-title{font-size:6.5pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #bbb;margin-bottom:2mm;padding-bottom:1mm;letter-spacing:.5px;}
  .addr-name{font-size:10pt;font-weight:bold;margin-bottom:1mm;}
  .eta{font-size:8pt;color:#333;text-align:center;}
  .lbl-footer{font-size:7pt;color:#777;text-align:center;border-top:1px solid #eee;padding-top:2mm;}
  .no-print{position:fixed;top:14px;right:14px;z-index:999;}
  .pbtn{padding:10px 22px;background:#B00000;color:#fff;border:none;border-radius:6px;font-size:15px;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);}
  @media print{@page{size:A4 portrait;margin:0;}body{margin:0;}.no-print{display:none;}.page{page-break-after:always;}}
</style>
</head><body>
<div class="no-print"><button class="pbtn" onclick="window.print()">🖨 Print All (${detailsArr.length} labels)</button></div>
${pages}
</body></html>`;

            printWindow.document.write(html);
            printWindow.document.close();
        } finally {
            setPrintingLabels(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                {/* Title row */}
                <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Orders Management</h2>
                        <p className="text-sm text-gray-500">View and manage customer orders</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search orders, customer…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent w-56"
                            />
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-slate-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Batch print shipping labels toolbar */}
                <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-gray-100">
                    <Printer className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Print Shipping Labels:</span>
                    <div className="flex items-center gap-2 text-sm">
                        <label className="text-gray-500 text-xs whitespace-nowrap">From</label>
                        <input
                            type="date"
                            value={labelFromDate}
                            onChange={(e) => setLabelFromDate(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <label className="text-gray-500 text-xs whitespace-nowrap">To</label>
                        <input
                            type="date"
                            value={labelToDate}
                            onChange={(e) => setLabelToDate(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={printBatchShippingLabels}
                        disabled={printingLabels}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#B00000] text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-60 whitespace-nowrap"
                    >
                        {printingLabels ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</>
                        ) : (
                            <><Printer className="w-4 h-4" /> Print Shipping Labels (2 per A4)</>
                        )}
                    </button>
                    <span className="text-xs text-gray-400">Only physical orders • Cut A4 in half to get 2 labels</span>
                </div>
            </div>


            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 uppercase font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{orders.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-green-700 uppercase font-medium">Paid</p>
                    <p className="text-2xl font-bold text-green-800 mt-1">{orders.filter((o) => o.status === "paid").length}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-xs text-yellow-700 uppercase font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-800 mt-1">{orders.filter((o) => o.status === "pending").length}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-blue-700 uppercase font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">
                        ₹{orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order & Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                    <p className="mt-2">Loading orders...</p>
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                    <p>No orders yet</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <React.Fragment key={order.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-mono font-medium text-slate-900">#{orders.length - orders.findIndex(o => o.id === order.id)}</div>
                                            {/* Stacked item images */}
                                            {itemImagesMap[order.id] && itemImagesMap[order.id].length > 0 ? (
                                                <div className="flex items-center mt-2">
                                                    <div className="flex -space-x-2">
                                                        {itemImagesMap[order.id].slice(0, 3).map((item, i) => (
                                                            item.image ? (
                                                                <img
                                                                    key={i}
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    title={item.name}
                                                                    className="h-8 w-8 rounded-full object-cover border-2 border-white ring-1 ring-gray-200"
                                                                />
                                                            ) : (
                                                                <div
                                                                    key={i}
                                                                    title={item.name}
                                                                    className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-200 flex items-center justify-center text-xs text-gray-400 font-medium"
                                                                >
                                                                    {item.name[0]}
                                                                </div>
                                                            )
                                                        ))}
                                                        {itemImagesMap[order.id].length > 3 && (
                                                            <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white ring-1 ring-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                                                +{itemImagesMap[order.id].length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="ml-2 text-xs text-gray-500">{itemImagesMap[order.id].length} item{itemImagesMap[order.id].length !== 1 ? 's' : ''}</span>
                                                </div>
                                            ) : order.item_names ? (
                                                <div className="text-xs text-gray-700 mt-1 max-w-xs">
                                                    <span className="font-medium">Items: </span>
                                                    {order.item_names.length > 60 ? `${order.item_names.substring(0, 60)}...` : order.item_names}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400 mt-1">No items</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">{order.first_name} {order.last_name}</div>
                                            <div className="text-xs text-gray-500">{order.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusPill status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-[#B00000]">₹{Number(order.total).toFixed(2)}</div>
                                            <div className="text-xs text-gray-500">Subtotal: ₹{Number(order.subtotal).toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                    <Package className="w-3 h-3" /> {Number(order.physical_items)} Physical
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                                    <Download className="w-3 h-3" /> {Number(order.digital_items)} Digital
                                                </span>
                                            </div>
                                            {Number(order.physical_items) > 0 && order.tracking_number && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium" title={`Tracking: ${order.tracking_number}`}>
                                                        <Truck className="w-3 h-3" /> Tracked
                                                    </span>
                                                </div>
                                            )}
                                            {Number(order.physical_items) > 0 && order.estimated_delivery_date && (
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    ETA: {new Date(order.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(order.created_at)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => viewOrderDetails(order.id)}
                                                    disabled={loadingDetails && expandedOrderId !== order.id}
                                                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
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
                                                        <CheckCircle className="w-4 h-4" /> Paid
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => markPaid(order.id)}
                                                        disabled={markingId === order.id}
                                                        className="inline-flex items-center gap-2 px-3 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-60"
                                                    >
                                                        {markingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                        Mark Paid
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Order Details */}
                                    {expandedOrderId === order.id && orderDetails && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                                {/* Action Buttons */}
                                                <div className="mb-4 flex justify-end gap-3">
                                                    <button
                                                        onClick={() => downloadInvoice(order)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                                    >
                                                        <FileText className="w-4 h-4" /> Download Invoice (A4)
                                                    </button>
                                                    {Number(order.physical_items) > 0 && (
                                                        <button
                                                            onClick={() => printShippingLabel(order)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                                                        >
                                                            <Printer className="w-4 h-4" /> Print Shipping Label (A5)
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Tracking Section */}
                                                {Number(order.physical_items) > 0 && (
                                                    <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
                                                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                            <Truck className="w-4 h-4" /> Shipping & Tracking Information
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Tracking Number</label>
                                                                <input
                                                                    type="text"
                                                                    value={trackingForm.tracking_number}
                                                                    onChange={(e) => setTrackingForm({ ...trackingForm, tracking_number: e.target.value })}
                                                                    placeholder="Enter tracking number"
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={trackingForm.estimated_delivery_date}
                                                                    onChange={(e) => setTrackingForm({ ...trackingForm, estimated_delivery_date: e.target.value })}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mb-4">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Tracking Link (Optional)</label>
                                                            <input
                                                                type="url"
                                                                value={trackingForm.tracking_url}
                                                                onChange={(e) => setTrackingForm({ ...trackingForm, tracking_url: e.target.value })}
                                                                placeholder="https://tracking.courierwebsite.com/track?id=..."
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">Add external courier tracking URL for easy access</p>
                                                            {orderDetails?.order?.tracking_url && (
                                                                <a href={orderDetails.order.tracking_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline">
                                                                    <ExternalLink className="w-3 h-3" /> View Current Tracking Link
                                                                </a>
                                                            )}
                                                        </div>
                                                        {(orderDetails.order?.shipped_at || orderDetails.order?.delivered_at) && (
                                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                                                <div className="text-xs font-medium text-gray-700 mb-2">Shipment Status:</div>
                                                                <div className="space-y-2">
                                                                    {orderDetails.order?.shipped_at && (
                                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                            <Truck className="w-3 h-3 text-blue-600" />
                                                                            <span>Shipped on {new Date(orderDetails.order.shipped_at).toLocaleString('en-IN')}</span>
                                                                        </div>
                                                                    )}
                                                                    {orderDetails.order?.delivered_at && (
                                                                        <div className="flex items-center gap-2 text-xs text-green-600">
                                                                            <CheckCircle className="w-3 h-3" />
                                                                            <span>Delivered on {new Date(orderDetails.order.delivered_at).toLocaleString('en-IN')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => saveTrackingInfo(order.id)}
                                                            disabled={savingTracking}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-60 font-medium"
                                                        >
                                                            {savingTracking ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Tracking Info</>}
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Order Items */}
                                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                            <Package className="w-4 h-4" /> Order Items
                                                        </h3>
                                                        <div className="space-y-2">
                                                            {orderDetails.items && orderDetails.items.map((item: any) => (
                                                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                                                                    {/* Thumbnail */}
                                                                    {item.cover_image ? (
                                                                        <img
                                                                            src={item.cover_image}
                                                                            alt={item.product_name}
                                                                            className="h-12 w-12 rounded-lg object-cover border border-gray-200 shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-12 w-12 rounded-lg bg-gray-200 border border-gray-200 flex items-center justify-center shrink-0 text-sm font-bold text-gray-400">
                                                                            {item.product_name?.[0] || "?"}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-medium text-slate-900 truncate">{item.product_name}</div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${item.product_type === 'physical' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                                                {item.product_type === 'physical' ? <Package className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                                                                                {item.product_type}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right ml-2 shrink-0">
                                                                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                                                                        <div className="text-sm font-semibold text-[#B00000]">₹{Number(item.unit_price).toFixed(2)}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Shipping & Payment */}
                                                    <div className="space-y-4">
                                                        {Number(order.physical_items) > 0 && (
                                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4" /> Shipping Address
                                                                </h3>
                                                                <div className="space-y-2 text-sm text-gray-700">
                                                                    <p className="font-medium">{orderDetails.order?.first_name} {orderDetails.order?.last_name}</p>
                                                                    {orderDetails.order?.address && <p>{orderDetails.order.address}</p>}
                                                                    {orderDetails.order?.city && (
                                                                        <p>{orderDetails.order.city}{orderDetails.order.state && `, ${orderDetails.order.state}`}{orderDetails.order.pincode && ` - ${orderDetails.order.pincode}`}</p>
                                                                    )}
                                                                    {orderDetails.order?.phone && (
                                                                        <p className="flex items-center gap-2 text-gray-600"><Phone className="w-3 h-3" /> {orderDetails.order.phone}</p>
                                                                    )}
                                                                    {orderDetails.order?.email && (
                                                                        <p className="flex items-center gap-2 text-gray-600"><Mail className="w-3 h-3" /> {orderDetails.order.email}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Payment Details</h3>
                                                            <div className="space-y-2 text-sm">
                                                                {orderDetails.order?.payment_provider && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Provider:</span>
                                                                        <span className="font-medium text-slate-900 capitalize">{orderDetails.order.payment_provider}</span>
                                                                    </div>
                                                                )}
                                                                {orderDetails.order?.payment_reference && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Reference:</span>
                                                                        <span className="font-mono text-xs text-slate-900">{orderDetails.order.payment_reference}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                                                    <span className="text-gray-600">Subtotal:</span>
                                                                    <span className="font-medium text-slate-900">₹{Number(orderDetails.order?.subtotal || 0).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex justify-between font-semibold text-base">
                                                                    <span className="text-slate-900">Total:</span>
                                                                    <span className="text-[#B00000]">₹{Number(orderDetails.order?.total || 0).toFixed(2)}</span>
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
    );
};
