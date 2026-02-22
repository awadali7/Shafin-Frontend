import React from "react";
import { Phone, Mail, MessageSquare, Clock, MapPin } from "lucide-react";

export default function AdmissionTeam() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[#B00000] to-red-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                        ADMISSION TEAM
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-100 max-w-3xl mx-auto">
                        Get in touch with our experts for course guidance and support.
                    </p>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-slate-700 leading-relaxed mb-8">
                            Have questions about our technical training programs or diagnostic tools? Our dedicated admission team is here to help you choose the right path for your professional growth.
                        </p>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 1 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                1. DIRECT CONTACT CHANNELS
                            </h2>
                            <div className="bg-slate-50 rounded-xl p-8 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0 mt-1">
                                        <Phone className="w-6 h-6 text-[#B00000]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Direct Call</h3>
                                        <p className="text-slate-600 mb-2">Speak with our admission counselor for personalized guidance.</p>
                                        <a href="tel:+918714388741" className="text-[#B00000] font-bold text-xl hover:underline">8714388741</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0 mt-1">
                                        <MessageSquare className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">WhatsApp Support</h3>
                                        <p className="text-slate-600 mb-2">Instant messaging for quick queries and registration help.</p>
                                        <a href="https://wa.me/918714388741" target="_blank" rel="noopener noreferrer" className="text-green-600 font-bold text-xl hover:underline">Chat on WhatsApp</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200 shrink-0 mt-1">
                                        <Mail className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Email Inquiry</h3>
                                        <p className="text-slate-600 mb-2">For detailed inquiries and institutional partnerships.</p>
                                        <a href="mailto:support@diagtools.net" className="text-blue-600 font-bold text-xl hover:underline">support@diagtools.net</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 2 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                2. WORKING HOURS
                            </h2>
                            <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200 max-w-md">
                                <Clock className="w-6 h-6 text-slate-500 mt-1" />
                                <div>
                                    <p className="font-bold text-slate-900">Monday - Saturday</p>
                                    <p className="text-slate-700 text-lg">9:00 AM - 6:00 PM IST</p>
                                    <p className="text-slate-500 text-sm mt-2">Closed on Sundays and National Holidays</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-8 mb-8"></div>

                        {/* Section 3 */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                3. CAMPUS LOCATION
                            </h2>
                            <div className="flex items-start gap-4">
                                <MapPin className="w-6 h-6 text-[#B00000] mt-1 shrink-0" />
                                <div className="text-slate-700 text-lg">
                                    <p className="font-bold text-slate-900 mb-2">DiagTools Hub</p>
                                    <p>Pan Square, Pezhakapilly,</p>
                                    <p>Muvattupuzha, Ernkulam, Kerala</p>
                                    <p>Pin: 686673</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
