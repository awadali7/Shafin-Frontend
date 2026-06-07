"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Syne } from "next/font/google";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, AlertCircle } from "lucide-react";
import { coursesApi } from "@/lib/api/courses";
import type { Course } from "@/lib/api/types";

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

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await coursesApi.getAll();
            if (response.success && response.data) {
                setCourses(response.data);
            } else {
                setError("Failed to load courses");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch courses");
            console.error("Error fetching courses:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero — dark cinematic */}
            <section
                className="relative flex min-h-[42vh] items-center overflow-hidden bg-[#0A0A0F] py-20"
                aria-label="Courses hero"
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
                            className="courses-particle"
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
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        All Courses
                    </motion.span>
                    <h1
                        className={`${syne.className} mt-6 text-4xl leading-[1.1] font-bold tracking-[-1.5px] text-white sm:text-5xl lg:text-[56px] lg:leading-16 lg:tracking-[-2px]`}
                    >
                        Master the Latest
                        <br />
                        <span className="bg-linear-to-r from-[#C41E3A] to-[#F59E0B] bg-clip-text text-transparent">
                            Diagnostic Techniques
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-gray-400">
                        Explore our comprehensive library of practical, instructor-led
                        automotive technology courses — built for real workshop challenges.
                    </p>
                </div>
            </section>

            {/* Courses Grid */}
            <section className="bg-white py-20 lg:py-24" aria-label="Course listing">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Loading State */}
                    {loading && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white animate-pulse"
                                >
                                    <div className="aspect-video w-full bg-[#F8F9FC]" />
                                    <div className="space-y-3 p-5">
                                        <div className="h-4 w-3/4 rounded bg-[#F8F9FC]" />
                                        <div className="h-4 w-1/2 rounded bg-[#F8F9FC]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="mb-10 rounded-2xl border border-[#C41E3A]/20 bg-[#C41E3A]/5 p-6">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0 text-[#C41E3A]" aria-hidden="true" />
                                <div>
                                    <p className="text-sm text-[#C41E3A]">{error}</p>
                                    <button
                                        onClick={fetchCourses}
                                        className="mt-2 text-sm font-semibold text-[#C41E3A] underline underline-offset-2 hover:text-[#8B0000]"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Courses */}
                    {!loading && !error && (
                        <>
                            {courses.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {courses.map((course, index) => {
                                        const price =
                                            typeof course.price === "number"
                                                ? course.price
                                                : parseFloat(String(course.price || "0"));
                                        const lessonCount = course.video_count || course.videos?.length || 0;

                                        return (
                                            <motion.div
                                                key={course.slug}
                                                initial={{ opacity: 0, y: 24 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.5, delay: (index % 6) * 0.08 }}
                                            >
                                                <Link
                                                    href={`/courses/${course.slug}`}
                                                    className="group block h-full overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(196,30,58,0.15)]"
                                                >
                                                    <div className="relative aspect-video w-full overflow-hidden bg-[#F8F9FC]">
                                                        <Image
                                                            src={course.cover_image || "/images/placeholder-course.png"}
                                                            alt={`${course.name} - ${course.description || "Automotive diagnostic training course"}`}
                                                            fill
                                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                            sizes="(max-width: 768px) 100vw, 33vw"
                                                            loading="lazy"
                                                        />
                                                        {lessonCount > 0 && (
                                                            <span className="absolute top-4 right-4 rounded-full bg-[#F59E0B] px-3 py-1 text-xs font-semibold tracking-[0.5px] text-[#0A0A0F] uppercase">
                                                                {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="p-5">
                                                        <h3 className="line-clamp-2 text-lg font-semibold text-[#0D0D14] transition-colors group-hover:text-[#C41E3A]">
                                                            {course.name}
                                                        </h3>
                                                        <p className="mt-2 line-clamp-2 text-sm text-[#6B7280]">
                                                            {course.description ||
                                                                "Explore this course to enhance your automotive diagnostic skills."}
                                                        </p>
                                                        <div className="mt-5 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
                                                            <span className="text-lg font-bold text-[#C41E3A]">
                                                                {price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Free"}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#C41E3A] px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-[#8B0000]">
                                                                View Course
                                                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F9FC] p-16 text-center">
                                    <BookOpen className="mx-auto h-14 w-14 text-[#C41E3A]/40" aria-hidden="true" />
                                    <p className="mt-4 text-lg font-semibold text-[#0D0D14]">
                                        No courses available
                                    </p>
                                    <p className="mt-2 text-sm text-[#6B7280]">
                                        Check back later for new courses.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <style jsx>{`
                .courses-particle {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.5);
                    animation: courses-twinkle 6s ease-in-out infinite;
                }
                @keyframes courses-twinkle {
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
                @media (prefers-reduced-motion: reduce) {
                    .courses-particle {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
