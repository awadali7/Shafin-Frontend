"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import Image from "next/image";
import RegisterDrawer from "@/components/RegisterDrawer";
import LoginDrawer from "@/components/LoginDrawer";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";

export default function LandingPage() {
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);

    // Structured Data for SEO
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "DiagTools",
        description:
            "India's leading provider of advanced automotive diagnostic tools, key programming solutions, and specialized online training",
        url: process.env.NEXT_PUBLIC_API_URL || "https://diagtools.com",
        logo: `${
            process.env.NEXT_PUBLIC_API_URL || "https://diagtools.com"
        }/images/logo/header-logo.png`,
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91-8714388741",
            contactType: "Customer Service",
            areaServed: "IN",
            availableLanguage: ["en", "hi", "ta", "ml"],
        },
        address: {
            "@type": "PostalAddress",
            addressLocality: "Muvattupezha",
            addressRegion: "Kerala",
            postalCode: "686673",
            addressCountry: "IN",
        },
        sameAs: [
            // Add your social media URLs here
            // "https://www.facebook.com/diagtools",
            // "https://www.instagram.com/diagtools",
            // "https://www.youtube.com/@diagtools",
        ],
    };

    const courseSchema = {
        "@context": "https://schema.org",
        "@type": "Course",
        name: "Automotive Diagnostic Training",
        description:
            "Comprehensive online training in automotive diagnostics, ECM repairing, key programming, IMMO programming, and meter calibration",
        provider: {
            "@type": "Organization",
            name: "DiagTools",
        },
        educationalLevel: "Professional",
        inLanguage: ["en", "hi", "ta", "ml"],
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "DiagTools",
        url: process.env.NEXT_PUBLIC_API_URL || "https://diagtools.com",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${
                    process.env.NEXT_PUBLIC_API_URL || "https://diagtools.com"
                }/courses?search={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };

    return (
        <>
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(courseSchema),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema),
                }}
            />

            <main className="min-h-screen">
                {/* Hero Section */}
                <section
                    className="relative bg-gradient-to-br from-[#B00000] via-red-700 to-red-900 text-white py-20 lg:py-32"
                    aria-label="Hero section"
                >
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight flex flex-wrap items-center gap-2">
                                    <span>
                                        Master Automotive Technology with
                                    </span>
                                    <ContainerTextFlip
                                        words={[
                                            "DiagTools",
                                            "Expert Training",
                                            "Advanced Tools",
                                            "Innovation",
                                        ]}
                                        interval={3000}
                                        className="text-3xl sm:text-4xl lg:text-5xl [background:linear-gradient(to_bottom,#ffffff,#f3f4f6)] shadow-[inset_0_-1px_#ffffff,inset_0_0_0_1px_#ffffff,0_4px_8px_rgba(0,0,0,0.3)] text-[#B00000] dark:text-[#B00000]"
                                        textClassName="text-[#B00000] font-bold"
                                        animationDuration={700}
                                    />
                                </h1>
                                <p className="text-xl sm:text-2xl mb-8 text-gray-100">
                                    India's leading e-learning platform for
                                    advanced automotive diagnostics, key
                                    programming, ECM repairing, and specialized
                                    training. Learn in multiple languages
                                    including Malayalam, English, Tamil, and
                                    Hindi.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() =>
                                            setIsRegisterDrawerOpen(true)
                                        }
                                        className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#B00000] rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Join Now
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </button>
                                    <Link
                                        href="/courses"
                                        className="inline-flex items-center justify-center px-6 py-3 bg-transparent border border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
                                    >
                                        <Play className="mr-2 w-4 h-4" />
                                        Explore Courses
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden lg:block">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white/20 rounded-3xl blur-3xl"></div>
                                    <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 overflow-hidden">
                                        <div className="aspect-video rounded-xl overflow-hidden relative">
                                            <iframe
                                                width="560"
                                                height="315"
                                                src="https://www.youtube.com/embed/IIBU1v3Ae0E?si=_3Ifnu-vi2K5xSyq"
                                                title="DiagTools Automotive Diagnostic Training Video"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                referrerPolicy="strict-origin-when-cross-origin"
                                                allowFullScreen
                                                className="w-full h-full rounded-xl"
                                                aria-label="DiagTools training video introduction"
                                            ></iframe>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 lg:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">
                                Why Choose DiagTools?
                            </h2>
                            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                                Learn from industry experts with hands-on
                                training in automotive diagnostics, ECM
                                repairing, key programming, and IMMO
                                programming. Multilingual support available.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop",
                                    title: "Expert Courses",
                                    description:
                                        "Comprehensive courses covering ADAS, EV systems, diagnostics, and more",
                                },
                                {
                                    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop",
                                    title: "Learn from Experts",
                                    description:
                                        "Taught by certified automotive professionals with years of experience",
                                },
                                {
                                    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop",
                                    title: "Certification",
                                    description:
                                        "Earn certificates upon completion to boost your career",
                                },
                                {
                                    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop",
                                    title: "Video Tutorials",
                                    description:
                                        "Watch detailed video demonstrations and hands-on training",
                                },
                            ].map((feature, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-200"
                                >
                                    <div className="h-40 w-full overflow-hidden relative">
                                        <Image
                                            src={feature.image}
                                            alt={`${feature.title} - ${feature.description}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-slate-600">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Courses Preview Section */}
                <section className="py-16 lg:py-24 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                                Featured Courses
                            </h2>
                            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                                Master the latest automotive technologies and
                                diagnostic techniques
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    title: "ADAS Calibration",
                                    description:
                                        "Advanced Driver Assistance Systems calibration and repair",
                                    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop",
                                },
                                {
                                    title: "EV Charger Installation",
                                    description:
                                        "Electric vehicle charging station installation and diagnostics",
                                    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop&auto=format",
                                },
                                {
                                    title: "Diagnostic Tools",
                                    description:
                                        "Modern diagnostic equipment and software training",
                                    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop",
                                },
                            ].map((course, index) => (
                                <Link
                                    key={index}
                                    href="/courses"
                                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                                >
                                    <div className="h-40 w-full overflow-hidden relative">
                                        <Image
                                            src={course.image}
                                            alt={`${course.title} - ${course.description}`}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#B00000] transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {course.description}
                                        </p>
                                        <div className="flex items-center text-[#B00000] text-sm font-medium">
                                            Learn More
                                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="text-center mt-10">
                            <Link
                                href="/courses"
                                className="inline-flex items-center px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors"
                            >
                                View All Courses
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 lg:py-24 bg-[#B00000] text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                            {[
                                { value: "9+", label: "Expert Courses" },
                                { value: "2.5K+", label: "Students Enrolled" },
                                { value: "95%", label: "Completion Rate" },
                                { value: "50+", label: "Certified Experts" },
                            ].map((stat, index) => (
                                <div key={index}>
                                    <div className="text-3xl lg:text-4xl font-bold mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-gray-100">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 lg:py-24 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Ready to Start Learning?
                        </h2>
                        <p className="text-lg text-slate-600 mb-8">
                            Join thousands of professionals mastering automotive
                            technology today
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => setIsRegisterDrawerOpen(true)}
                                className="inline-flex items-center justify-center px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors"
                            >
                                Join Now - It's Free
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </button>
                            <Link
                                href="/courses"
                                className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-slate-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                Browse Courses
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Register Drawer */}
                <RegisterDrawer
                    isOpen={isRegisterDrawerOpen}
                    onClose={() => setIsRegisterDrawerOpen(false)}
                    onSwitchToLogin={() => {
                        setIsRegisterDrawerOpen(false);
                        setIsLoginDrawerOpen(true);
                    }}
                />

                {/* Login Drawer */}
                <LoginDrawer
                    isOpen={isLoginDrawerOpen}
                    onClose={() => setIsLoginDrawerOpen(false)}
                    onSwitchToRegister={() => {
                        setIsLoginDrawerOpen(false);
                        setIsRegisterDrawerOpen(true);
                    }}
                />
            </main>
        </>
    );
}
