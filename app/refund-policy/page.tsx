import React from "react";
import { Truck, Ban, AlertCircle } from "lucide-react";

export default function RefundPolicy() {
    const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[#B00000] to-red-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                        REFUND & DELIVERY POLICY
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-100 max-w-3xl mx-auto">
                        DiagTools
                    </p>
                    <p className="text-gray-200 mt-4">
                        Last Updated: {currentDate}
                    </p>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-slate-700 leading-relaxed mb-8">
                            This policy details our procedures regarding digital and physical product orders, including delivery timelines and refund eligibility.
                        </p>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 1 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                1. DIGITAL PRODUCTS & COURSES
                            </h2>
                            <div className="text-slate-700 leading-relaxed space-y-4">
                                <p>
                                    All sales of digital products, software activations, and online courses are final. Due to the nature of digital content, we do not offer refunds once access has been granted or the product has been activated.
                                </p>
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex gap-4">
                                    <AlertCircle className="w-6 h-6 text-[#B00000] shrink-0" />
                                    <p className="text-sm text-[#B00000]">
                                        Please ensure your hardware is compatible before purchasing any digital tools or software activations.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 2 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                2. PHYSICAL PRODUCTS & HARDWARE
                            </h2>
                            <div className="text-slate-700 leading-relaxed space-y-4">
                                <p>
                                    For physical diagnostic tools and hardware, returns are only accepted in the following cases:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Manufacturing defects reported within 48 hours of delivery.</li>
                                    <li>Wrong item received (must be in original, unopened packaging).</li>
                                </ul>
                                <p>
                                    Refunds for physical items will be processed within 7-10 business days after the returned item passes our technical inspection and is found to be in original condition.
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 3 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                3. DELIVERY INFORMATION & TIMELINES
                            </h2>
                            <div className="text-slate-700 leading-relaxed">
                                <p className="mb-4">
                                    We strive to ship all physical orders within 24-48 hours of payment confirmation.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="font-bold text-slate-900">Within Kerala</p>
                                        <p className="text-sm">2–3 business days</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="font-bold text-slate-900">Outside Kerala</p>
                                        <p className="text-sm">3–10 business days</p>
                                    </div>
                                </div>
                                <p className="text-sm italic">
                                    * Delivery times may vary based on the courier service and your specific location.
                                </p>
                                <p className="mt-4 font-semibold text-slate-900">
                                    Special Courier Requests: For any specific courier service requests, please contact our support team within 12 hours of placing your order.
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 4 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                4. CANCELLATION POLICY
                            </h2>
                            <p className="text-slate-700 leading-relaxed">
                                Orders for physical products can be cancelled before they are dispatched. Once an item has been handed over to the courier or a digital product has been activated/accessed, cancellation is not possible.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
