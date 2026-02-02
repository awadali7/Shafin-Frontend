"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, MapPin, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";
import BusinessUpgradeModal from "@/components/BusinessUpgradeModal";
import ProductTermsModal from "@/components/ProductTermsModal";
import { setRedirectPath, shouldPreserveRedirect } from "@/lib/utils/redirect";

type RazorpaySuccessResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayOptions = {
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
};

type RazorpayInstance = {
    open: () => void;
    on?: (event: string, cb: (response?: any) => void) => void;
};
type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
    interface Window {
        Razorpay?: RazorpayCtor;
    }
}

async function loadRazorpayScript(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (window.Razorpay) return true;
    return await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, getTotalPrice, clearCart } = useCart();
    const { isAuth, user } = useAuth();
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [showBusinessUpgradeModal, setShowBusinessUpgradeModal] =
        useState(false);
    const [showProductTermsModal, setShowProductTermsModal] = useState(false);

    const [formData, setFormData] = useState({
        firstName: user?.first_name || "",
        lastName: user?.last_name || "",
        email: user?.email || "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        paymentMethod: "card",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const hasPhysicalItems = items.some((item) => item.type === "physical");
    const hasDigitalItems = items.some(
        (item) => item.type === "digital" || item.type === "course"
    );

    // Calculate courier charges and items subtotal separately (must be before early return)
    const { itemsSubtotal, courierCharges } = useMemo(() => {
        let itemsTotal = 0;
        let courierTotal = 0;

        items.forEach(item => {
            if (item.quantity_pricing && item.quantity_pricing.length > 0) {
                const tier = item.quantity_pricing.find(t => {
                    const minQty = t.min_qty || 1;
                    const maxQty = t.max_qty || Infinity;
                    return item.quantity >= minQty && item.quantity <= maxQty;
                });

                if (tier) {
                    itemsTotal += tier.price_per_item * item.quantity;
                    courierTotal += tier.courier_charge || 0;
                } else {
                    itemsTotal += item.price * item.quantity;
                }
            } else {
                itemsTotal += item.price * item.quantity;
            }
        });

        return { itemsSubtotal: itemsTotal, courierCharges: courierTotal };
    }, [items]);

    const subtotal = itemsSubtotal + courierCharges;
    const total = subtotal; // No additional charges

    // If cart no longer contains physical items, force a valid payment method
    useEffect(() => {
        if (!hasPhysicalItems && formData.paymentMethod === "cod") {
            setFormData((prev) => ({ ...prev, paymentMethod: "card" }));
            setErrors((prev) => {
                const next = { ...prev };
                delete next.paymentMethod;
                return next;
            });
        }
    }, [hasPhysicalItems, formData.paymentMethod]);

    // Check if cart is empty
    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Your cart is empty
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Add some products to your cart to continue
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email address";
        }
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        }
        if (hasPhysicalItems) {
            if (!formData.address.trim()) {
                newErrors.address = "Address is required";
            }
            if (!formData.city.trim()) {
                newErrors.city = "City is required";
            }
            if (!formData.state.trim()) {
                newErrors.state = "State is required";
            }
            if (!formData.pincode.trim()) {
                newErrors.pincode = "Pincode is required";
            }
        }

        if (!hasPhysicalItems && formData.paymentMethod === "cod") {
            newErrors.paymentMethod =
                "Cash on delivery is available for physical products only";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuth) {
            // Preserve checkout path for redirect after login
            if (shouldPreserveRedirect("/checkout")) {
                setRedirectPath("/checkout");
            }
            setIsLoginDrawerOpen(true);
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsProcessingPayment(true);
        try {
            const payload = {
                items: items.map((i) => ({
                    product_id: i.id,
                    quantity: i.quantity,
                })),
                customer: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    ...(hasPhysicalItems
                        ? {
                              address: formData.address,
                              city: formData.city,
                              state: formData.state,
                              pincode: formData.pincode,
                          }
                        : {}),
                },
            };

            const resp = await ordersApi.create(payload);
            const orderId = (resp as any)?.data?.id as string | undefined;
            if (!orderId) throw new Error("Failed to create order");

            // For card/upi payments, open Razorpay
            // COD is handled separately (not integrated yet)
            if (formData.paymentMethod === "cod") {
                // For COD, just create the order without payment
                clearCart();
                alert(
                    "Order placed successfully! You will pay on delivery. Order ID: " +
                        orderId
                );
                router.push("/orders");
                setIsProcessingPayment(false);
                return;
            }

            // Load Razorpay SDK
            const ok = await loadRazorpayScript();
            if (!ok || !window.Razorpay) {
                setIsProcessingPayment(false);
                throw new Error(
                    "Razorpay payment gateway failed to load. Please refresh and try again."
                );
            }

            // Create Razorpay order
            const rp = await paymentsApi.createRazorpayOrder({
                order_id: orderId,
            });
            if (!rp.data) {
                setIsProcessingPayment(false);
                throw new Error(
                    "Failed to initialize payment. Please try again."
                );
            }

            const options: RazorpayOptions = {
                key: rp.data.key_id,
                amount: rp.data.amount,
                currency: rp.data.currency,
                name: "DiagTools",
                description: "Order Payment",
                order_id: rp.data.razorpay_order_id,
                handler: async (response) => {
                    try {
                        setIsProcessingPayment(true);
                        // Verify payment with backend
                        await paymentsApi.verifyRazorpayPayment({
                            internal_order_id: orderId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        // Payment verified successfully
                        clearCart();
                        setIsProcessingPayment(false);
                        
                        // Redirect based on product type
                        if (hasPhysicalItems && !hasDigitalItems) {
                            // Only physical products -> My Orders
                            router.push("/orders");
                        } else if (hasDigitalItems && !hasPhysicalItems) {
                            // Only digital products -> My Downloads
                        router.push("/downloads");
                        } else {
                            // Mixed order -> My Orders (shows all orders)
                            router.push("/orders");
                        }
                    } catch (e: any) {
                        setIsProcessingPayment(false);
                        const errorMsg =
                            e?.response?.data?.message ||
                            e?.message ||
                            "Payment verification failed";
                        alert(`Payment verification failed: ${errorMsg}`);
                        router.push("/orders");
                    }
                },
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    contact: formData.phone,
                },
                notes: { internal_order_id: orderId },
                theme: { color: "#B00000" },
            };

            const rzp = new window.Razorpay({
                ...options,
                modal: {
                    ondismiss: () => {
                        // User closed the payment modal without completing payment
                        // Order remains in 'pending' status, user can retry later
                        setIsProcessingPayment(false);
                    },
                },
            });

            // Handle payment failure
            rzp.on?.("payment.failed", (response: any) => {
                setIsProcessingPayment(false);
                const errorMsg =
                    response?.error?.description ||
                    response?.error?.reason ||
                    "Payment failed";
                alert(
                    `Payment failed: ${errorMsg}. You can retry from your Orders page.`
                );
                router.push("/orders");
            });

            // Open Razorpay payment modal
            rzp.open();
            setIsProcessingPayment(false); // Modal opened, user can interact
        } catch (err: any) {
            setIsProcessingPayment(false);

            // Check for Product KYC requirement errors
            const errorResponse = err?.response?.data || err?.data || err || {};

            // Check for business upgrade requirement (Student trying to buy KYC product)
            if (errorResponse.requires_business_upgrade) {
                setShowBusinessUpgradeModal(true);
                return;
            }

            // Check for business KYC requirement
            if (
                errorResponse.requires_business_kyc ||
                errorResponse.requires_product_kyc
            ) {
                // Redirect to Business KYC page with redirect path
                alert(
                    errorResponse.message ||
                        "Business KYC verification is required to complete this purchase."
                );
                router.push(`/kyc/product?redirect=/checkout`);
                return;
            }

            // Check for product terms requirement
            if (errorResponse.requires_product_terms_acceptance) {
                setShowProductTermsModal(true);
                return;
            }

            // Check for single quantity requirement
            if (errorResponse.single_quantity_required) {
                alert(
                    errorResponse.message ||
                        "Students can only purchase a single quantity of KYC-required products."
                );
                return;
            }

            alert(err?.message || "Checkout failed");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <Link
                href="/shop"
                className="inline-flex items-center text-gray-600 hover:text-[#B00000] mb-6 transition-colors text-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shop
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer / Shipping Details */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <MapPin className="w-5 h-5 text-[#B00000]" />
                            <h2 className="text-xl font-semibold text-slate-900">
                                {hasPhysicalItems
                                    ? "Shipping Address"
                                    : "Contact Details"}
                            </h2>
                        </div>
                        {hasDigitalItems && !hasPhysicalItems && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    No shipping needed — digital products and
                                    courses will be available after purchase.
                                </p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                            errors.firstName
                                                ? "border-red-300"
                                                : "border-gray-300"
                                        }`}
                                    />
                                    {errors.firstName && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.firstName}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                            errors.lastName
                                                ? "border-red-300"
                                                : "border-gray-300"
                                        }`}
                                    />
                                    {errors.lastName && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {errors.lastName}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                        errors.email
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                        errors.phone
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                />
                                {errors.phone && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                            {hasPhysicalItems && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address *
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                                errors.address
                                                    ? "border-red-300"
                                                    : "border-gray-300"
                                            }`}
                                        />
                                        {errors.address && (
                                            <p className="text-xs text-red-600 mt-1">
                                                {errors.address}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                City *
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                                    errors.city
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                            />
                                            {errors.city && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    {errors.city}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                State *
                                            </label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                                    errors.state
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                            />
                                            {errors.state && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    {errors.state}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Pincode *
                                            </label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                value={formData.pincode}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                                    errors.pincode
                                                        ? "border-red-300"
                                                        : "border-gray-300"
                                                }`}
                                            />
                                            {errors.pincode && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    {errors.pincode}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Payment Method */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center space-x-2 mb-4">
                                    <CreditCard className="w-5 h-5 text-[#B00000]" />
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Payment Method
                                    </h2>
                                </div>
                                {errors.paymentMethod && (
                                    <p className="text-xs text-red-600 mb-2">
                                        {errors.paymentMethod}
                                    </p>
                                )}
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            checked={
                                                formData.paymentMethod ===
                                                "card"
                                            }
                                            onChange={handleInputChange}
                                            className="text-[#B00000] focus:ring-[#B00000]"
                                        />
                                        <span className="text-gray-700">
                                            Credit/Debit Card
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="upi"
                                            checked={
                                                formData.paymentMethod === "upi"
                                            }
                                            onChange={handleInputChange}
                                            className="text-[#B00000] focus:ring-[#B00000]"
                                        />
                                        <span className="text-gray-700">
                                            UPI
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={
                                                formData.paymentMethod === "cod"
                                            }
                                            onChange={handleInputChange}
                                            disabled={!hasPhysicalItems}
                                            className="text-[#B00000] focus:ring-[#B00000]"
                                        />
                                        <span className="text-gray-700">
                                            Cash on Delivery (Physical products
                                            only)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessingPayment}
                                className="w-full px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessingPayment
                                    ? "Processing..."
                                    : "Place Order"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">
                            Order Summary
                        </h2>
                        <div className="space-y-3 mb-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start space-x-3 pb-3 border-b border-gray-100"
                                >
                                    {item.image && (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 line-clamp-2">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Qty: {item.quantity}
                                        </p>
                                        <p className="text-sm font-semibold text-[#B00000] mt-1">
                                            ₹
                                            {(() => {
                                                // Apply tiered pricing if available
                                                if (
                                                    item.quantity_pricing &&
                                                    item.quantity_pricing
                                                        .length > 0
                                                ) {
                                                    const tier =
                                                        item.quantity_pricing.find(
                                                            (t) => {
                                                                const minQty =
                                                                    t.min_qty ||
                                                                    1;
                                                                const maxQty =
                                                                    t.max_qty ||
                                                                    Infinity;
                                                                return (
                                                                    item.quantity >=
                                                                        minQty &&
                                                                    item.quantity <=
                                                                        maxQty
                                                                );
                                                            }
                                                        );

                                                    if (tier) {
                                                        const courierCharge = tier.courier_charge || 0;
                                                        return (
                                                            (tier.price_per_item *
                                                            item.quantity) + courierCharge
                                                        ).toFixed(2);
                                                    }
                                                }

                                                // Fallback to base price
                                                return (
                                                    item.price * item.quantity
                                                ).toFixed(2);
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Items Subtotal</span>
                                <span className="text-slate-900">
                                    ₹{itemsSubtotal.toFixed(2)}
                                </span>
                            </div>
                            {courierCharges > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Courier Charges</span>
                                    <span className="text-slate-900">
                                        ₹{courierCharges.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-gray-200">
                                <span className="text-slate-900">Total</span>
                                <span className="text-[#B00000]">
                                    ₹{total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Drawer */}
            <LoginDrawer
                isOpen={isLoginDrawerOpen}
                onClose={() => setIsLoginDrawerOpen(false)}
                onSwitchToRegister={() => {
                    setIsLoginDrawerOpen(false);
                    setIsRegisterDrawerOpen(true);
                }}
            />

            {/* Register Drawer */}
            <RegisterDrawer
                isOpen={isRegisterDrawerOpen}
                onClose={() => setIsRegisterDrawerOpen(false)}
                onSwitchToLogin={() => {
                    setIsRegisterDrawerOpen(false);
                    setIsLoginDrawerOpen(true);
                }}
            />

            {/* Business Upgrade Modal */}
            <BusinessUpgradeModal
                isOpen={showBusinessUpgradeModal}
                onClose={() => setShowBusinessUpgradeModal(false)}
                onSuccess={() => {
                    setShowBusinessUpgradeModal(false);
                    // Retry checkout after upgrade
                    const form = document.querySelector("form");
                    if (form) {
                        form.dispatchEvent(
                            new Event("submit", {
                                cancelable: true,
                                bubbles: true,
                            })
                        );
                    }
                }}
            />

            {/* Product Terms Modal */}
            <ProductTermsModal
                isOpen={showProductTermsModal}
                onClose={() => setShowProductTermsModal(false)}
                onAccept={() => {
                    setShowProductTermsModal(false);
                    // Retry checkout after terms acceptance
                    const form = document.querySelector("form");
                    if (form) {
                        form.dispatchEvent(
                            new Event("submit", {
                                cancelable: true,
                                bubbles: true,
                            })
                        );
                    }
                }}
            />
        </div>
    );
}
