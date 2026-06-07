"use client";

import React from "react";
import Image from "next/image";
import { Syne } from "next/font/google";
import { motion } from "motion/react";
import {
    Award,
    BookOpen,
    Gauge,
    GraduationCap,
    KeyRound,
    ScanLine,
    Settings2,
    Users,
    Wrench,
} from "lucide-react";

// Display font for this page only — the rest of the site keeps Bricolage Grotesque
const syne = Syne({
    subsets: ["latin"],
    weight: ["700", "800"],
    display: "swap",
});

const HERO_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 41) % 100}%`,
    top: `${(i * 59) % 100}%`,
    delay: `${(i % 6) * 0.9}s`,
}));

const ABOUT_PARAGRAPHS = [
    "DiagTools is India's leading provider of advanced automotive diagnostic tools, key programming solutions, and specialized online training. We offer a complete range of services and products, including scanning and vehicle diagnosis, ECM repairing and programming, key and immobilizer (IMMO) programming, and meter repairing, calibration, and programming.",
    "Our mission is to empower technicians, workshops, and automotive professionals with high-quality tools and practical, industry-focused training that meets the demands of modern vehicles. To ensure accessibility for learners across India, DiagTools provides training and support in multiple languages such as Malayalam, English, Tamil, and Hindi, delivered entirely through our flexible and user-friendly online platform.",
    "Backed by expert trainers with real-world experience, we combine technical excellence, reliable support, and multilingual learning to help technicians upgrade their skills, improve accuracy, and confidently tackle complex automotive electronic systems. With DiagTools, customers receive not just tools, but the knowledge and support needed to succeed in today's evolving automotive landscape.",
];

const SERVICES = [
    { Icon: ScanLine, title: "Scanning and Vehicle Diagnosis" },
    { Icon: Settings2, title: "ECM Repairing and Programming" },
    { Icon: KeyRound, title: "Key and Immobilizer (IMMO) Programming" },
    { Icon: Gauge, title: "Meter Repairing, Calibration, and Programming" },
    { Icon: Wrench, title: "Advanced Diagnostic Tools" },
    { Icon: GraduationCap, title: "Specialized Online Training" },
];

const WHY_VALUES = [
    {
        Icon: GraduationCap,
        title: "Expert Trainers",
        description: "Backed by expert trainers with real-world experience.",
    },
    {
        Icon: Users,
        title: "Multilingual Support",
        description: "Training in Malayalam, English, Tamil, and Hindi.",
    },
    {
        Icon: Award,
        title: "Technical Excellence",
        description: "High-quality tools and industry-focused training.",
    },
    {
        Icon: BookOpen,
        title: "Online Platform",
        description: "Flexible and user-friendly online learning platform.",
    },
];

const TRUST_PARTNERS = [
    { src: "/images/1.png", alt: "DiagTools brand partner logo 1" },
    { src: "/images/2.png", alt: "DiagTools brand partner logo 2" },
    { src: "/images/3.png", alt: "DiagTools brand partner logo 3" },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero — dark cinematic */}
            <section
                className="relative flex min-h-[60vh] items-center overflow-hidden bg-[#0A0A0F] py-24"
                aria-label="About DiagTools hero"
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
                            className="about-particle"
                            style={{ left: p.left, top: p.top, animationDelay: p.delay }}
                        />
                    ))}
                </div>

                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <motion.span
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 rounded-full border border-[#C41E3A]/40 bg-[#C41E3A]/10 px-4 py-2 text-xs font-semibold tracking-[0.5px] text-white/90 uppercase"
                    >
                        🇮🇳 About DiagTools
                    </motion.span>
                    <h1
                        className={`${syne.className} mt-6 text-4xl leading-[1.1] font-bold tracking-[-1.5px] text-white sm:text-5xl lg:text-[64px] lg:leading-[72px] lg:tracking-[-2px]`}
                    >
                        India&rsquo;s Leading Automotive
                        <br />
                        <span className="bg-linear-to-r from-[#C41E3A] to-[#F59E0B] bg-clip-text text-transparent">
                            Diagnostic Platform
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-gray-400">
                        Advanced diagnostic tools, key programming solutions, and
                        specialized training — built for India&rsquo;s automotive
                        professionals.
                    </p>
                </div>
            </section>

            {/* Our Story */}
            <section className="bg-white py-20 lg:py-32" aria-label="Our story">
                <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex items-center rounded-full bg-[#C41E3A]/10 px-4 py-1.5 text-xs font-semibold tracking-[0.5px] text-[#C41E3A] uppercase">
                            Our Story
                        </span>
                    </div>
                    <div className="mx-auto mt-10 max-w-4xl space-y-8">
                        {ABOUT_PARAGRAPHS.map((paragraph, index) => (
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="text-lg leading-relaxed text-[#6B7280] sm:text-xl"
                            >
                                {paragraph}
                            </motion.p>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services & Products */}
            <section className="bg-[#F8F9FC] py-20 lg:py-32" aria-label="Our services and products">
                <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex items-center rounded-full bg-[#C41E3A]/10 px-4 py-1.5 text-xs font-semibold tracking-[0.5px] text-[#C41E3A] uppercase">
                            What We Offer
                        </span>
                        <h2
                            className={`${syne.className} mt-4 text-3xl font-bold tracking-[-1.5px] text-[#0D0D14] sm:text-4xl lg:text-[48px] lg:leading-14`}
                        >
                            Our Services & Products
                        </h2>
                    </div>
                    <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {SERVICES.map((service, index) => (
                            <motion.div
                                key={service.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.08 }}
                                className="group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(196,30,58,0.15)]"
                            >
                                <span className="absolute top-0 left-0 h-0.5 w-0 bg-[#C41E3A] transition-all duration-300 group-hover:w-10" />
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C41E3A]/10 text-[#C41E3A]">
                                    <service.Icon className="h-6 w-6" aria-hidden="true" />
                                </span>
                                <h3 className="mt-6 text-xl leading-7 font-semibold text-[#0D0D14]">
                                    {service.title}
                                </h3>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose DiagTools */}
            <section className="bg-white py-20 lg:py-32" aria-label="Why choose DiagTools">
                <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex items-center rounded-full bg-[#F59E0B]/15 px-4 py-1.5 text-xs font-semibold tracking-[0.5px] text-[#F59E0B] uppercase">
                            Why DiagTools
                        </span>
                        <h2
                            className={`${syne.className} mt-4 text-3xl font-bold tracking-[-1.5px] text-[#0D0D14] sm:text-4xl lg:text-[48px] lg:leading-14`}
                        >
                            What Sets Us Apart
                        </h2>
                    </div>
                    <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {WHY_VALUES.map((value, index) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.08 }}
                                className="group rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(196,30,58,0.15)]"
                            >
                                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#C41E3A] to-[#8B0000] shadow-[0_4px_24px_rgba(196,30,58,0.3)] transition-transform duration-300 group-hover:scale-110">
                                    <value.Icon className="h-8 w-8 text-white" aria-hidden="true" />
                                </span>
                                <h3 className="mt-6 text-lg font-semibold text-[#0D0D14]">{value.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Brand Partners — logo marquee */}
            <section className="bg-[#F8F9FC] py-[60px]" aria-label="Trusted by automotive brands">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-xs font-semibold tracking-[0.5px] text-gray-500 uppercase">
                        Trusted by leading automotive brands worldwide
                    </p>
                    <div className="mt-10 overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                        <div className="about-marquee flex w-max items-center gap-20">
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

            <style jsx>{`
                .about-particle {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.5);
                    animation: about-twinkle 6s ease-in-out infinite;
                }
                @keyframes about-twinkle {
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
                .about-marquee {
                    animation: about-marquee 32s linear infinite;
                }
                .about-marquee:hover {
                    animation-play-state: paused;
                }
                @keyframes about-marquee {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .about-particle,
                    .about-marquee {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
