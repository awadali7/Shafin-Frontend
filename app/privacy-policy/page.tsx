import React from "react";
import { Mail, Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPolicy() {
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
                        PRIVACY POLICY
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
                            At DiagTools, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or use our services.
                        </p>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 1 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                1. INFORMATION WE COLLECT
                            </h2>
                            <div className="text-slate-700 leading-relaxed space-y-4">
                                <p>
                                    As you interact with DiagTools, we collect information to provide better services to all our users. The types of information we collect include:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><span className="font-semibold text-slate-900">Personal Information:</span> Name, email address, phone number, and billing information when you create an account or make a purchase.</li>
                                    <li><span className="font-semibold text-slate-900">Usage Data:</span> Information about how you use our website, including your IP address, browser type, and pages visited.</li>
                                    <li><span className="font-semibold text-slate-900">Professional Details:</span> Professional background or workshop information if provided during registration or KYC.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 2 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                2. HOW WE USE INFORMATION
                            </h2>
                            <div className="text-slate-700 leading-relaxed space-y-4">
                                <p>
                                    We use the information we collect for the following purposes:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>To provide, maintain, and improve our services and products.</li>
                                    <li>To process transactions and send related information, including confirmations and invoices.</li>
                                    <li>To provide technical support and respond to your comments or questions.</li>
                                    <li>To send you technical notices, updates, security alerts, and administrative messages.</li>
                                    <li>To communicate with you about products, services, offers, and events.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 3 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                3. DATA SECURITY
                            </h2>
                            <p className="text-slate-700 leading-relaxed">
                                We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems, and are required to keep the information confidential.
                            </p>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 4 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                4. COOKIES
                            </h2>
                            <p className="text-slate-700 leading-relaxed">
                                We use cookies to understand and save your preferences for future visits and compile aggregate data about site traffic and site interaction so that we can offer better site experiences and tools in the future.
                            </p>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 5 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                5. CONTACT US
                            </h2>
                            <p className="text-slate-700 leading-relaxed mb-6">
                                If there are any questions regarding this privacy policy, you may contact our support team:
                            </p>
                            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Mail className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                                    <span className="text-slate-700">support@diagtools.net</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
