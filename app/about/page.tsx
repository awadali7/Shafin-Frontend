import React from "react";
import Image from "next/image";
import { GraduationCap, Users, Award, BookOpen } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative text-white py-24 lg:py-32 overflow-hidden bg-gray-900">
                <div 
                    className="absolute inset-0 z-0 mix-blend-overlay opacity-60"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                ></div>
                <div className="absolute inset-0 bg-linear-to-br from-[#B00000]/95 via-red-800/90 to-red-950/95 z-0"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)] z-0"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                        ABOUT US
                    </h1>
                    <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                        India's Leading Provider of Advanced Automotive
                        Diagnostic Solutions
                    </p>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="max-w-4xl mx-auto">
                        <div className="prose prose-lg max-w-none space-y-8">
                            <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">
                                DiagTools is India's leading provider of
                                advanced automotive diagnostic tools, key
                                programming solutions, and specialized online
                                training. We offer a complete range of services
                                and products, including scanning and vehicle
                                diagnosis, ECM repairing and programming, key
                                and immobilizer (IMMO) programming, and meter
                                repairing, calibration, and programming.
                            </p>
                            <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">
                                Our mission is to empower technicians,
                                workshops, and automotive professionals with
                                high-quality tools and practical,
                                industry-focused training that meets the demands
                                of modern vehicles. To ensure accessibility for
                                learners across India, DiagTools provides
                                training and support in multiple languages such
                                as Malayalam, English, Tamil, and Hindi,
                                delivered entirely through our flexible and
                                user-friendly online platform.
                            </p>
                            <p className="text-lg sm:text-xl text-slate-700 leading-relaxed">
                                Backed by expert trainers with real-world
                                experience, we combine technical excellence,
                                reliable support, and multilingual learning to
                                help technicians upgrade their skills, improve
                                accuracy, and confidently tackle complex
                                automotive electronic systems. With DiagTools,
                                customers receive not just tools, but the
                                knowledge and support needed to succeed in
                                today's evolving automotive landscape.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 lg:py-32 bg-gradient-to-b from-white to-gray-50/50">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center mb-16 lg:mb-20">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Our Services & Products
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {[
                            "Scanning and Vehicle Diagnosis",
                            "ECM Repairing and Programming",
                            "Key and Immobilizer (IMMO) Programming",
                            "Meter Repairing, Calibration, and Programming",
                            "Advanced Diagnostic Tools",
                            "Specialized Online Training",
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl p-7 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#B00000] rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-white text-base font-bold">
                                            ✓
                                        </span>
                                    </div>
                                    <span className="text-slate-800 font-semibold text-base">
                                        {item}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50/50 to-white">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center mb-16 lg:mb-20">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Why Choose DiagTools
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                        {[
                            {
                                icon: GraduationCap,
                                title: "Expert Trainers",
                                description:
                                    "Backed by expert trainers with real-world experience",
                            },
                            {
                                icon: Users,
                                title: "Multilingual Support",
                                description:
                                    "Training in Malayalam, English, Tamil, and Hindi",
                            },
                            {
                                icon: Award,
                                title: "Technical Excellence",
                                description:
                                    "High-quality tools and industry-focused training",
                            },
                            {
                                icon: BookOpen,
                                title: "Online Platform",
                                description:
                                    "Flexible and user-friendly online learning platform",
                            },
                        ].map((value, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-[#B00000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                    <value.icon className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    {value.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Brand Partners Section */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                            Our Brand Partners
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            Trusted by leading automotive brands worldwide
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-center">
                        {[
                            { src: "/images/1.png", alt: "Partner 1" },
                            { src: "/images/2.png", alt: "Partner 2" },
                            { src: "/images/3.png", alt: "Partner 3" },
                        ].map((partner, index) => (
                            <div
                                key={index}
                                className="relative w-full h-48 md:h-56 lg:h-64 flex items-center justify-center group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Image
                                    src={partner.src}
                                    alt={partner.alt}
                                    fill
                                    className="object-contain grayscale hover:grayscale-0 transition-all duration-300 p-2 md:p-4"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
