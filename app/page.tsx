"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import RegisterDrawer from "@/components/RegisterDrawer";
import LoginDrawer from "@/components/LoginDrawer";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { motion } from "motion/react";
import { coursesApi } from "@/lib/api/courses";
import { productsApi } from "@/lib/api/products";
import type { Course, Product } from "@/lib/api/types";

export default function LandingPage() {
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [cardsPerView, setCardsPerView] = useState(3);
    const [productSlide, setProductSlide] = useState(0);
    const [isProductTransitioning, setIsProductTransitioning] = useState(true);

    // Update cards per view based on screen size
    useEffect(() => {
        const updateCardsPerView = () => {
            if (window.innerWidth < 768) {
                setCardsPerView(1); // Mobile
            } else if (window.innerWidth < 1024) {
                setCardsPerView(2); // Tablet
            } else {
                setCardsPerView(3); // Desktop
            }
        };

        updateCardsPerView();
        window.addEventListener("resize", updateCardsPerView);
        return () => window.removeEventListener("resize", updateCardsPerView);
    }, []);

    // Fetch featured courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await coursesApi.getFeatured();
                if (response.success && response.data) {
                    setCourses(response.data);
                }
            } catch (error) {
                console.error("Error fetching featured courses:", error);
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, []);

    // Fetch featured products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await productsApi.getFeatured();
                if (response.success && response.data) {
                    setProducts(response.data);
                }
            } catch (error) {
                console.error("Error fetching featured products:", error);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    // Start from the middle set for infinite scrolling
    const [currentSlide, setCurrentSlide] = useState(courses.length);
    const [isTransitioning, setIsTransitioning] = useState(true);

    // Initialize product slider
    useEffect(() => {
        if (products.length > 0) {
            setProductSlide(products.length);
        }
    }, [products]);

    // Auto-play slider
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => prev + 1);
        }, 3500); // Change slide every 3.5 seconds

        return () => clearInterval(timer);
    }, []);

    // Auto-play product slider
    useEffect(() => {
        if (products.length === 0) return;
        
        const timer = setInterval(() => {
            setProductSlide((prev) => prev + 1);
        }, 4000); // Change slide every 4 seconds

        return () => clearInterval(timer);
    }, [products.length]);

    // Handle infinite loop reset
    useEffect(() => {
        if (currentSlide >= courses.length * 2) {
            setTimeout(() => {
                setIsTransitioning(false);
                setCurrentSlide(courses.length);
                setTimeout(() => setIsTransitioning(true), 50);
            }, 500);
        } else if (currentSlide < courses.length) {
            setTimeout(() => {
                setIsTransitioning(false);
                setCurrentSlide(courses.length * 2 - 1);
                setTimeout(() => setIsTransitioning(true), 50);
            }, 500);
        }
    }, [currentSlide, courses.length]);

    // Handle infinite loop reset for products
    useEffect(() => {
        if (products.length === 0) return;
        
        if (productSlide >= products.length * 2) {
            setTimeout(() => {
                setIsProductTransitioning(false);
                setProductSlide(products.length);
                setTimeout(() => setIsProductTransitioning(true), 50);
            }, 500);
        } else if (productSlide < products.length) {
            setTimeout(() => {
                setIsProductTransitioning(false);
                setProductSlide(products.length * 2 - 1);
                setTimeout(() => setIsProductTransitioning(true), 50);
            }, 500);
        }
    }, [productSlide, products.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => prev + 1);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => prev - 1);
    };

    const nextProductSlide = () => {
        setProductSlide((prev) => prev + 1);
    };

    const prevProductSlide = () => {
        setProductSlide((prev) => prev - 1);
    };

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
                    className="relative bg-linear-to-br from-[#B00000] via-red-700 to-red-900 text-white py-20 lg:py-32"
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
                <section className="py-16 lg:py-24 bg-gray-50">
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
                <section className="py-12 md:py-16 lg:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 md:mb-4">
                                Featured Courses
                            </h2>
                            <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto px-4">
                                Master the latest automotive technologies and
                                diagnostic techniques
                            </p>
                        </div>

                        {/* Slider Container */}
                        {loadingCourses ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">
                                    Loading featured courses...
                                </p>
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">
                                    No featured courses available at the moment.
                                </p>
                            </div>
                        ) : (
                            <div className="relative px-4 md:px-8 lg:px-12">
                                <div className="overflow-hidden">
                                    <motion.div
                                        className="flex gap-4 md:gap-6"
                                        animate={{
                                            x: `calc(${-currentSlide} * (${
                                                100 / cardsPerView
                                            }% + ${
                                                cardsPerView === 1
                                                    ? 16
                                                    : cardsPerView === 2
                                                    ? 12
                                                    : 8
                                            }px))`,
                                        }}
                                        transition={
                                            isTransitioning
                                                ? {
                                                      type: "spring",
                                                      stiffness: 300,
                                                      damping: 30,
                                                  }
                                                : { duration: 0 }
                                        }
                                    >
                                        {/* Render cards three times for infinite effect */}
                                        {[
                                            ...courses,
                                            ...courses,
                                            ...courses,
                                        ].map((course, index) => (
                                            <motion.div
                                                key={`${index}-${course.slug}`}
                                                className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0"
                                                whileHover={{ y: -8 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Link
                                                    href={`/courses/${course.slug}`}
                                                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group block h-full"
                                                >
                                                    <div className="h-40 md:h-48 w-full overflow-hidden relative">
                                                        <Image
                                                            src={
                                                                course.cover_image ||
                                                                "/images/placeholder-course.png"
                                                            }
                                                            alt={`${
                                                                course.name
                                                            } - ${
                                                                course.description ||
                                                                ""
                                                            }`}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                            sizes="(max-width: 768px) 100vw, 33vw"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="p-4 md:p-6">
                                                        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 group-hover:text-[#B00000] transition-colors">
                                                            {course.name}
                                                        </h3>
                                                        <p className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-2">
                                                            {course.description ||
                                                                "Explore this course to enhance your automotive diagnostic skills"}
                                                        </p>
                                                        <div className="flex items-center text-[#B00000] text-xs md:text-sm font-medium">
                                                            Learn More
                                                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </div>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={prevSlide}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 md:p-3 shadow-lg hover:bg-gray-50 hover:shadow-xl transition-all duration-200 z-10 group"
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-900 group-hover:text-[#B00000] transition-colors" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 md:p-3 shadow-lg hover:bg-gray-50 hover:shadow-xl transition-all duration-200 z-10 group"
                                    aria-label="Next slide"
                                >
                                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-900 group-hover:text-[#B00000] transition-colors" />
                                </button>

                                {/* Dots Indicator */}
                                <div className="flex justify-center gap-1.5 md:gap-2 mt-6 md:mt-8 px-4">
                                    {courses.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setCurrentSlide(index)
                                            }
                                            className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                                                index ===
                                                currentSlide % courses.length
                                                    ? "w-6 md:w-8 bg-[#B00000]"
                                                    : "w-1.5 md:w-2 bg-gray-300 hover:bg-gray-400"
                                            }`}
                                            aria-label={`Go to slide ${
                                                index + 1
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!loadingCourses && courses.length > 0 && (
                            <div className="text-center mt-10 px-4">
                                <Link
                                    href="/courses"
                                    className="inline-flex items-center px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors text-sm md:text-base"
                                >
                                    View All Courses
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Featured Products Section */}
                <section className="py-20 lg:py-32 bg-linear-to-b from-white to-gray-50/50">
                    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                        <div className="text-center mb-16 lg:mb-20">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
                                Featured Products
                            </h2>
                            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                                Explore our collection of digital and physical
                                products for automotive professionals
                            </p>
                        </div>

                        {/* Slider Container */}
                        {loadingProducts ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">
                                    Loading featured products...
                                </p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">
                                    No featured products available at the
                                    moment.
                                </p>
                            </div>
                        ) : (
                            <div className="relative px-8 md:px-12 lg:px-16">
                                <div className="overflow-hidden rounded-2xl">
                                    <motion.div
                                        className="flex gap-4 md:gap-6"
                                        animate={{
                                            x: `calc(${-productSlide} * (${
                                                100 / cardsPerView
                                            }% + ${
                                                cardsPerView === 1
                                                    ? 16
                                                    : cardsPerView === 2
                                                    ? 12
                                                    : 8
                                            }px))`,
                                        }}
                                        transition={
                                            isProductTransitioning
                                                ? {
                                                      type: "spring",
                                                      stiffness: 300,
                                                      damping: 30,
                                                  }
                                                : { duration: 0 }
                                        }
                                    >
                                        {/* Render cards three times for infinite effect */}
                                        {[
                                            ...products,
                                            ...products,
                                            ...products,
                                        ].map((product, index) => (
                                            <motion.div
                                                key={`${index}-${product.slug}`}
                                                className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0"
                                                whileHover={{ y: -8 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Link
                                                    href={`/shop/${product.slug}`}
                                                    className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group block h-full"
                                                >
                                                    {/* Image with Badge */}
                                                    <div className="h-64 w-full overflow-hidden relative bg-gray-50">
                                                        <Image
                                                            src={
                                                                product.cover_image ||
                                                                "/images/placeholder-product.png"
                                                            }
                                                            alt={`${product.name} - ${
                                                                product.description ||
                                                                ""
                                                            }`}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                            sizes="(max-width: 768px) 100vw, 33vw"
                                                            loading="lazy"
                                                        />
                                                        <div className="absolute top-4 right-4 bg-[#B00000] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                                            Premium
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="p-7">
                                                        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 group-hover:text-[#B00000] transition-colors line-clamp-2 min-h-14">
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 mb-6 line-clamp-2 min-h-10 leading-relaxed">
                                                            {product.description ||
                                                                "Professional diagnostic tool for automotive technicians"}
                                                        </p>

                                                        {/* Price and CTA */}
                                                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1.5">
                                                                    Starting from
                                                                </p>
                                                                <p className="text-2xl font-bold text-[#B00000]">
                                                                    ₹{product.price?.toLocaleString() || "0"}
                                                                </p>
                                                            </div>
                                                            <motion.div
                                                                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#B00000] text-white group-hover:bg-red-800 transition-colors shadow-lg"
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.95 }}
                                                            >
                                                                <ArrowRight className="w-5 h-5" />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </div>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={prevProductSlide}
                                    className="absolute -left-4 lg:left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 lg:p-4 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 z-10 group border border-gray-100"
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-slate-700 group-hover:text-[#B00000] transition-colors" />
                                </button>
                                <button
                                    onClick={nextProductSlide}
                                    className="absolute -right-4 lg:right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 lg:p-4 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 z-10 group border border-gray-100"
                                    aria-label="Next slide"
                                >
                                    <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-slate-700 group-hover:text-[#B00000] transition-colors" />
                                </button>

                                {/* Dots Indicator */}
                                <div className="flex justify-center gap-1.5 md:gap-2 mt-6 md:mt-8 px-4">
                                    {products.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setProductSlide(products.length + index)}
                                            className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                                                index === productSlide % products.length
                                                    ? "w-6 md:w-8 bg-[#B00000]"
                                                    : "w-1.5 md:w-2 bg-gray-300 hover:bg-gray-400"
                                            }`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!loadingProducts && products.length > 0 && (
                            <div className="text-center mt-12 lg:mt-16">
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#B00000] text-white rounded-xl font-semibold hover:bg-red-800 hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
                                >
                                    Browse All Products
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        )}
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
                                    <div className="absolute inset-0 bg-linear-to-br from-gray-50 to-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <Image
                                        src={partner.src}
                                        alt={partner.alt}
                                        fill
                                        className="object-contain grayscale hover:grayscale-0 transition-all duration-300 p-6 md:p-8"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 lg:py-24 bg-linear-to-r from-[#B00000] via-[#8B0000] to-[#B00000] text-white relative overflow-hidden">
                    {/* Premium overlay effect */}
                    <div className="absolute inset-0 bg-black/10"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
                <section className="py-16 lg:py-24 bg-gray-50">
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
