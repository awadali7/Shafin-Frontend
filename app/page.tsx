"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Syne } from "next/font/google";
import { motion, useInView } from "motion/react";
import {
    ArrowRight,
    BookOpen,
    Car,
    CheckCircle2,
    Cog,
    GraduationCap,
    Play,
    Quote,
    Radio,
    ShoppingBag,
    Star,
    Wrench,
} from "lucide-react";
import RegisterDrawer from "@/components/RegisterDrawer";
import LoginDrawer from "@/components/LoginDrawer";
import { coursesApi } from "@/lib/api/courses";
import { productsApi } from "@/lib/api/products";
import { settingsApi, type PublicSettings } from "@/lib/api/settings";
import type { Course, Product } from "@/lib/api/types";

// Display font for the landing page only — the rest of the site keeps Bricolage Grotesque
const syne = Syne({
    subsets: ["latin"],
    weight: ["700", "800"],
    display: "swap",
});

const HERO_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 100}%`,
    delay: `${(i % 6) * 0.9}s`,
}));

const TRUST_PARTNERS = [
    { src: "/images/1.png", alt: "DiagTools brand partner logo 1" },
    { src: "/images/2.png", alt: "DiagTools brand partner logo 2" },
    { src: "/images/3.png", alt: "DiagTools brand partner logo 3" },
];

const WHY_DIAGTOOLS = [
    {
        Icon: Wrench,
        title: "Industry-Specialized Expertise",
        description:
            "Focused exclusively on automotive diagnostics, programming, and electronic systems.",
    },
    {
        Icon: Cog,
        title: "Professional-Grade Products",
        description:
            "Reliable diagnostic tools, programmers, and workshop solutions trusted by professionals.",
    },
    {
        Icon: GraduationCap,
        title: "Expert-Led Technical Training",
        description:
            "Practical online training designed for real-world diagnostic and repair challenges.",
    },
    {
        Icon: BookOpen,
        title: "Tools & Training in One Platform",
        description:
            "A complete solution combining product sales with skill development.",
    },
    {
        Icon: Car,
        title: "Workshop-Focused Solutions",
        description:
            "Designed to improve efficiency, accuracy, and confidence in modern vehicle repair.",
    },
    {
        Icon: Radio,
        title: "Ongoing Support & Knowledge",
        description:
            "Continuous technical guidance and updated learning resources.",
    },
];

const TESTIMONIALS = [
    {
        name: "Rahul Menon",
        role: "Workshop Owner, Kerala",
        initials: "RM",
        quote: "The ECM diagnostics course completely changed how I troubleshoot vehicles at my workshop — practical, in Malayalam, and easy to follow.",
    },
    {
        name: "Suresh Kumar",
        role: "Senior Technician, Tamil Nadu",
        initials: "SK",
        quote: "I finally understood key programming step by step. The instructors explain everything in a way that makes sense on the shop floor.",
    },
    {
        name: "Anil Varghese",
        role: "ECM Specialist, Kochi",
        initials: "AV",
        quote: "DiagTools gave me the confidence to take on advanced repair jobs I used to send elsewhere. Worth every rupee.",
    },
];

const CIRCUIT_PATTERN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1'%3E%3Cpath d='M0 40h80M40 0v80'/%3E%3Ccircle cx='40' cy='40' r='3' fill='%23ffffff' stroke='none'/%3E%3C/g%3E%3C/svg%3E\")";

function getYouTubeThumbnail(url?: string): string | null {
    if (!url) return null;
    const match = url.match(
        /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
    );
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
}

function useCountUp(end: number, active: boolean, duration = 1800) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!active) return;
        let raf = 0;
        const start = performance.now();
        const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setValue(Math.round(end * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [active, end, duration]);
    return value;
}

function StatCounter({
    value,
    suffix,
    label,
}: {
    value: number;
    suffix: string;
    label: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    const count = useCountUp(value, inView);
    return (
        <div ref={ref} className="px-6 py-6 text-center">
            <div
                className={`${syne.className} text-4xl leading-none font-bold text-white lg:text-[56px]`}
            >
                {count.toLocaleString("en-IN")}
                {suffix}
            </div>
            <div className="mt-3 text-xs font-semibold tracking-[0.5px] text-white/75 uppercase sm:text-sm">
                {label}
            </div>
        </div>
    );
}

function Avatar({ label, className = "" }: { label: string; className?: string }) {
    return (
        <div
            className={`flex items-center justify-center rounded-full bg-linear-to-br from-[#C41E3A] to-[#8B0000] font-semibold text-white ${className}`}
            aria-hidden="true"
        >
            {label}
        </div>
    );
}

function HeroVideoCard({ videoUrl }: { videoUrl?: string }) {
    const [playing, setPlaying] = useState(false);
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const thumbnail = getYouTubeThumbnail(videoUrl);
    // Not every video has a maxresdefault thumbnail — hqdefault always exists
    const thumbnailSrc =
        thumbnailFailed && thumbnail ? thumbnail.replace("maxresdefault", "hqdefault") : thumbnail;

    if (playing && videoUrl) {
        return (
            <div className="aspect-video w-full overflow-hidden rounded-xl">
                <iframe
                    src={`${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1`}
                    title="DiagTools Automotive Diagnostic Training Video"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => videoUrl && setPlaying(true)}
            disabled={!videoUrl}
            aria-label="Play DiagTools introduction video"
            className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-[#1a1a22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4D6D] disabled:cursor-default"
        >
            {thumbnailSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={thumbnailSrc}
                    alt="DiagTools training video preview thumbnail"
                    loading="lazy"
                    onError={() => setThumbnailFailed(true)}
                    onLoad={(e) => {
                        // YouTube serves a 120x90 gray placeholder (with a 200/404) when no maxres thumbnail exists
                        if (e.currentTarget.naturalWidth <= 120) setThumbnailFailed(true);
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 text-sm text-white/50">
                    Loading preview...
                </div>
            )}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-all duration-500 group-hover:bg-black/25 group-hover:backdrop-blur-none" />
            <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#C41E3A] shadow-[0_0_40px_rgba(196,30,58,0.5)] transition-transform duration-300 group-hover:scale-110">
                    <Play className="ml-1 h-8 w-8 fill-white text-white" />
                </span>
            </span>
        </button>
    );
}

export default function LandingPage() {
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [settings, setSettings] = useState<PublicSettings>({});
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);

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

    // Fetch public settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsApi.getPublic();
                if (response.success && response.data) {
                    setSettings(response.data);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const featuredCourses = courses.slice(0, 3);
    const featuredProducts = products.slice(0, 4);

    // Structured Data for SEO
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "DiagTools",
        description:
            "India's leading provider of advanced automotive diagnostic tools, key programming solutions, and specialized online training",
        url: process.env.NEXT_PUBLIC_API_URL || "https://diagtools.com",
        logo: `${process.env.NEXT_PUBLIC_API_URL || "https://diagtools.com"
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
            "https://www.facebook.com/share/182iG6zhSp/",
            "https://www.instagram.com/diagtools.in?igsh=dWx3MmpkOGs4aHQ=",
            "https://youtube.com/@diagwheels?si=Ji913duMc8Bg63VX",
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
                urlTemplate: `${process.env.NEXT_PUBLIC_API_URL || "https://diagtools.com"
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
                {/* 1. Hero — dark cinematic */}
                <section
                    className="relative flex min-h-[100vh] items-center overflow-hidden bg-[#0A0A0F] py-20 lg:py-0"
                    aria-label="Hero section"
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(ellipse at 20% 50%, rgba(139,0,0,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(196,30,58,0.2) 0%, transparent 40%), #0A0A0F",
                        }}
                        aria-hidden="true"
                    />
                    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                        {HERO_PARTICLES.map((p, i) => (
                            <span
                                key={i}
                                className="landing-particle"
                                style={{ left: p.left, top: p.top, animationDelay: p.delay }}
                            />
                        ))}
                    </div>

                    <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[55fr_45fr] lg:gap-16">
                            {/* Left column */}
                            <div>
                                <motion.span
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#C41E3A]/40 bg-[#C41E3A]/10 px-4 py-2 text-xs font-semibold tracking-[0.5px] text-white/90 uppercase"
                                >
                                    🇮🇳 India&rsquo;s #1 Automotive Platform
                                </motion.span>

                                <h1
                                    className={`${syne.className} mt-6 text-4xl leading-[1.1] font-bold tracking-[-1.5px] text-white sm:text-5xl lg:text-[64px] lg:leading-[72px] lg:tracking-[-2px]`}
                                >
                                    {settings.hero_title || "Master Automotive Diagnostics"}
                                    <br />
                                    <span className="bg-linear-to-r from-[#C41E3A] to-[#F59E0B] bg-clip-text text-transparent">
                                        Like a Pro
                                    </span>
                                </h1>

                                <p className="mt-6 max-w-xl text-lg leading-7 text-gray-400">
                                    {settings.hero_description ||
                                        "India's leading e-learning platform for advanced automotive diagnostics, key programming, ECM repairing, and specialized training in multiple Indian languages."}
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    {["Malayalam", "English", "Hindi & Tamil"].map((lang) => (
                                        <span
                                            key={lang}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-300"
                                        >
                                            <CheckCircle2 className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                                            {lang}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => setIsRegisterDrawerOpen(true)}
                                        className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#C41E3A] to-[#8B0000] px-5 text-base font-semibold text-white shadow-[0_4px_24px_rgba(196,30,58,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(196,30,58,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4D6D]"
                                    >
                                        Start Learning Free
                                        <ArrowRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    <Link
                                        href="/courses"
                                        className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-white/30 px-5 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                    >
                                        <Play className="h-4 w-4 fill-white" aria-hidden="true" />
                                        Watch Demo
                                    </Link>
                                </div>

                                <div className="mt-10 flex items-center gap-4">
                                    <div className="flex -space-x-3" aria-hidden="true">
                                        {["RM", "SK", "AV", "PJ", "NT"].map((label, i) => (
                                            <Avatar
                                                key={i}
                                                label={label}
                                                className="h-10 w-10 text-xs ring-2 ring-[#0A0A0F]"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        <span className="font-semibold text-white">2,500+</span>{" "}
                                        mechanics enrolled
                                    </p>
                                </div>
                            </div>

                            {/* Right column */}
                            <div>
                                <div className="relative rounded-2xl border border-white/5 bg-[#111118] p-3 shadow-[0_0_40px_rgba(196,30,58,0.3)] sm:p-4">
                                    <HeroVideoCard videoUrl={settings.hero_video_url} />
                                </div>
                                <div className="mt-6 grid grid-cols-3 gap-3">
                                    {[
                                        ["9+", "Courses"],
                                        ["95%", "Completion"],
                                        ["50+", "Experts"],
                                    ].map(([value, label]) => (
                                        <div
                                            key={label}
                                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center"
                                        >
                                            <p className="text-lg font-bold text-white">{value}</p>
                                            <p className="mt-1 text-xs text-gray-400">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Trust bar / logo strip */}
                <section className="bg-[#F8F9FC] py-[60px]" aria-label="Trusted by automotive professionals">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-center text-xs font-semibold tracking-[0.5px] text-gray-500 uppercase">
                            Trusted by automotive professionals across India
                        </p>
                        <div className="mt-10 overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                            <div className="landing-marquee flex w-max items-center gap-20">
                                {[...TRUST_PARTNERS, ...TRUST_PARTNERS].map((partner, i) => (
                                    <div
                                        key={i}
                                        className="relative h-16 w-32 shrink-0 grayscale transition-all duration-300 hover:grayscale-0"
                                    >
                                        <Image
                                            src={partner.src}
                                            alt={partner.alt}
                                            fill
                                            className="object-contain"
                                            sizes="128px"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Why Choose DiagTools — feature grid */}
                <section className="bg-white py-24" aria-label="Why choose DiagTools">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <span className="inline-flex items-center rounded-full bg-[#C41E3A]/10 px-4 py-1.5 text-xs font-semibold tracking-[0.5px] text-[#C41E3A] uppercase">
                                Why DiagTools
                            </span>
                            <h2
                                className={`${syne.className} mt-4 text-3xl font-bold tracking-[-1.5px] text-[#0D0D14] sm:text-4xl lg:text-[48px] lg:leading-14`}
                            >
                                Everything You Need to Master Automotive Tech
                            </h2>
                            <p className="mt-4 text-lg text-[#6B7280]">
                                A complete ecosystem combining world-class diagnostic tools with
                                specialized technical education.
                            </p>
                        </div>
                        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {WHY_DIAGTOOLS.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.08 }}
                                    className="group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(196,30,58,0.15)]"
                                >
                                    <span className="absolute top-0 left-0 h-0.5 w-0 bg-[#C41E3A] transition-all duration-300 group-hover:w-10" />
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C41E3A]/10 text-[#C41E3A]">
                                        <feature.Icon className="h-6 w-6" aria-hidden="true" />
                                    </span>
                                    <h3 className="mt-6 text-2xl leading-[32px] font-semibold text-[#0D0D14]">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-3 text-base leading-relaxed text-[#6B7280]">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. Featured Courses — dark grid */}
                <section className="bg-[#0A0A0F] py-24" aria-label="Featured courses">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <span className="inline-flex items-center rounded-full bg-[#F59E0B]/15 px-4 py-1.5 text-xs font-semibold tracking-[0.5px] text-[#F59E0B] uppercase">
                                Featured Courses
                            </span>
                            <h2
                                className={`${syne.className} mt-4 text-3xl font-bold tracking-[-1.5px] text-white sm:text-4xl lg:text-[48px] lg:leading-14`}
                            >
                                Master the Latest Diagnostic Techniques
                            </h2>
                            <p className="mt-4 text-lg text-gray-400">
                                Practical, instructor-led courses built for real workshop
                                challenges.
                            </p>
                        </div>

                        {loadingCourses ? (
                            <p className="py-16 text-center text-gray-500">
                                Loading featured courses...
                            </p>
                        ) : featuredCourses.length === 0 ? (
                            <p className="py-16 text-center text-gray-500">
                                No featured courses available at the moment.
                            </p>
                        ) : (
                            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {featuredCourses.map((course, index) => (
                                    <motion.div
                                        key={course.slug}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={`/courses/${course.slug}`}
                                            className="group block h-full overflow-hidden rounded-2xl border border-white/5 bg-[#111118] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(196,30,58,0.25)]"
                                        >
                                            <div className="relative aspect-video w-full overflow-hidden">
                                                <Image
                                                    src={course.cover_image || "/images/placeholder-course.png"}
                                                    alt={`${course.name} - ${course.description || "Automotive diagnostic training course"}`}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                                                {typeof course.video_count === "number" && course.video_count > 0 && (
                                                    <span className="absolute top-4 right-4 rounded-full bg-[#F59E0B] px-3 py-1 text-xs font-semibold tracking-[0.5px] text-[#0A0A0F] uppercase">
                                                        {course.video_count} {course.video_count === 1 ? "Lesson" : "Lessons"}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-[#FF4D6D]">
                                                    {course.name}
                                                </h3>
                                                <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                                                    {course.description ||
                                                        "Explore this course to enhance your automotive diagnostic skills."}
                                                </p>
                                                <div className="mt-5 flex items-center justify-between">
                                                    <span className="text-lg font-bold text-white">
                                                        {course.price > 0 ? `₹${course.price.toLocaleString("en-IN")}` : "Free"}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#C41E3A] px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-[#8B0000]">
                                                        Enroll
                                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {!loadingCourses && courses.length > 0 && (
                            <div className="mt-12 text-center">
                                <Link
                                    href="/courses"
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#C41E3A]/50 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C41E3A]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4D6D]"
                                >
                                    View All Courses
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* 5. Featured Products — e-commerce grid */}
                <section className="bg-[#F8F9FC] py-24" aria-label="Featured products">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <span className="inline-flex items-center rounded-full bg-[#C41E3A]/10 px-4 py-1.5 text-xs font-semibold tracking-[0.5px] text-[#C41E3A] uppercase">
                                Shop
                            </span>
                            <h2
                                className={`${syne.className} mt-4 text-3xl font-bold tracking-[-1.5px] text-[#0D0D14] sm:text-4xl lg:text-[48px] lg:leading-14`}
                            >
                                Professional Diagnostic Equipment
                            </h2>
                            <p className="mt-4 text-lg text-[#6B7280]">
                                Explore our collection of digital and physical products for
                                automotive professionals.
                            </p>
                        </div>

                        {loadingProducts ? (
                            <p className="py-16 text-center text-gray-500">
                                Loading featured products...
                            </p>
                        ) : featuredProducts.length === 0 ? (
                            <p className="py-16 text-center text-gray-500">
                                No featured products available at the moment.
                            </p>
                        ) : (
                            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {featuredProducts.map((product, index) => {
                                    const effectivePrice = product.offer_price ?? product.price;
                                    const hasDiscount =
                                        typeof product.offer_price === "number" &&
                                        product.offer_price < product.price;
                                    return (
                                        <motion.div
                                            key={product.slug}
                                            initial={{ opacity: 0, y: 24 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.08 }}
                                        >
                                            <Link
                                                href={`/shop/${product.slug}`}
                                                className="group block h-full overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)]"
                                            >
                                                <div className="relative aspect-square w-full overflow-hidden bg-[#F8F9FC]">
                                                    <Image
                                                        src={product.cover_image || "/images/placeholder-product.png"}
                                                        alt={`${product.name} - ${product.description || "Automotive diagnostic equipment"}`}
                                                        fill
                                                        className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                                                        sizes="(max-width: 768px) 100vw, 25vw"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="p-5">
                                                    {product.category && (
                                                        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium tracking-[0.5px] text-gray-500 uppercase">
                                                            {product.category}
                                                        </span>
                                                    )}
                                                    <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-base font-semibold text-[#0D0D14]">
                                                        {product.name}
                                                    </h3>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="text-lg font-bold text-[#C41E3A]">
                                                            ₹{effectivePrice?.toLocaleString("en-IN") || "0"}
                                                        </span>
                                                        {hasDiscount && (
                                                            <span className="text-sm text-gray-400 line-through">
                                                                ₹{product.price.toLocaleString("en-IN")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C41E3A] py-3 text-sm font-semibold text-white transition-colors group-hover:bg-[#8B0000]">
                                                        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                                                        View Product
                                                    </span>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {!loadingProducts && products.length > 0 && (
                            <div className="mt-12 text-center">
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#C41E3A]/40 px-6 py-3 text-sm font-semibold text-[#C41E3A] transition-colors hover:bg-[#C41E3A]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C41E3A]"
                                >
                                    Browse All Products
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* 6. Stats counter */}
                <section
                    className="relative overflow-hidden bg-linear-to-br from-[#8B0000] to-[#C41E3A] py-20"
                    aria-label="Platform statistics"
                >
                    <div
                        className="absolute inset-0 opacity-5"
                        style={{ backgroundImage: CIRCUIT_PATTERN, backgroundRepeat: "repeat" }}
                        aria-hidden="true"
                    />
                    <div className="relative mx-auto grid max-w-6xl grid-cols-2 divide-y divide-white/20 px-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-y-0 lg:px-8">
                        <StatCounter value={9} suffix="+" label="Expert Courses" />
                        <StatCounter value={2500} suffix="+" label="Students Enrolled" />
                        <StatCounter value={95} suffix="%" label="Completion Rate" />
                        <StatCounter value={50} suffix="+" label="Certified Experts" />
                    </div>
                </section>

                {/* 7. Testimonials */}
                <section className="bg-[#F8F9FC] py-24" aria-label="Student reviews">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <span className="inline-flex items-center rounded-full bg-[#C41E3A]/10 px-4 py-1.5 text-xs font-semibold tracking-[0.5px] text-[#C41E3A] uppercase">
                                Student Reviews
                            </span>
                            <h2
                                className={`${syne.className} mt-4 text-3xl font-bold tracking-[-1.5px] text-[#0D0D14] sm:text-4xl lg:text-[48px] lg:leading-14`}
                            >
                                Hear From Our Students
                            </h2>
                        </div>
                        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {TESTIMONIALS.map((testimonial, index) => (
                                <motion.figure
                                    key={testimonial.name}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
                                >
                                    <div className="flex items-center gap-1 text-[#F59E0B]" aria-label="5 out of 5 stars">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                                        ))}
                                    </div>
                                    <Quote className="mt-4 h-6 w-6 text-[#C41E3A]/30" aria-hidden="true" />
                                    <blockquote className="mt-2 text-base leading-relaxed text-gray-700 italic">
                                        &ldquo;{testimonial.quote}&rdquo;
                                    </blockquote>
                                    <figcaption className="mt-6 flex items-center gap-3">
                                        <Avatar label={testimonial.initials} className="h-11 w-11 text-sm" />
                                        <div>
                                            <p className="text-sm font-semibold text-[#0D0D14]">{testimonial.name}</p>
                                            <p className="text-xs text-gray-500">{testimonial.role}</p>
                                        </div>
                                    </figcaption>
                                </motion.figure>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 8. CTA */}
                <section className="relative overflow-hidden bg-[#0A0A0F] py-24" aria-label="Call to action">
                    <div
                        className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C41E3A]/30 blur-[100px]"
                        aria-hidden="true"
                    />
                    <div className="relative mx-auto max-w-[640px] px-4 text-center sm:px-6">
                        <h2
                            className={`${syne.className} text-3xl font-bold tracking-[-1.5px] text-white sm:text-4xl lg:text-[48px] lg:leading-14`}
                        >
                            Ready to Become a Diagnostics Expert?
                        </h2>
                        <p className="mt-4 text-lg text-gray-400">
                            Join thousands of mechanics and workshop owners mastering modern
                            automotive technology with DiagTools.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setIsRegisterDrawerOpen(true)}
                                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#C41E3A] to-[#8B0000] px-6 text-base font-semibold text-white shadow-[0_4px_24px_rgba(196,30,58,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(196,30,58,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4D6D]"
                            >
                                Join Free Today
                                <ArrowRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <Link
                                href="/courses"
                                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-white/30 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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

            <style jsx>{`
                .landing-particle {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.5);
                    animation: landing-twinkle 6s ease-in-out infinite;
                }
                @keyframes landing-twinkle {
                    0%,
                    100% {
                        opacity: 0.05;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.25;
                        transform: scale(1.6);
                    }
                }
                .landing-marquee {
                    animation: landing-marquee 32s linear infinite;
                }
                .landing-marquee:hover {
                    animation-play-state: paused;
                }
                @keyframes landing-marquee {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .landing-particle,
                    .landing-marquee {
                        animation: none;
                    }
                }
            `}</style>
        </>
    );
}
