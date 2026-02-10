"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { coursesApi } from "@/lib/api/courses";
import type { Course } from "@/lib/api/types";

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
        } catch (err: any) {
            setError(err.message || "Failed to fetch courses");
            console.error("Error fetching courses:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    All Courses
                </h1>
                <p className="text-slate-600">
                    Explore our comprehensive automotive technology courses
                </p>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 8 }).map((_, idx) => (
                        <div key={idx} className="border border-gray-200 rounded overflow-hidden animate-pulse">
                            <div className="h-48 bg-gray-200" />
                            <div className="p-4 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <div>
                            <p className="text-sm text-red-600">{error}</p>
                            <button
                                onClick={fetchCourses}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Courses Grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {courses.length > 0 ? (
                        courses.map((course) => {
                            return (
                                <article
                                    key={course.slug}
                                    className="border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow group"
                                >
                                    {/* Course Image */}
                                    <Link href={`/courses/${course.slug}`}>
                                        <div className="bg-gray-100 h-48 w-full">
                                            <img
                                                src={course.cover_image || "/images/placeholder-course.png"}
                                                alt={course.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </Link>

                                    {/* Course Info */}
                                    <div className="p-4">
                                        {/* Course Title */}
                                        <Link href={`/courses/${course.slug}`}>
                                            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-[#B00000]">
                                                {course.name}
                                            </h3>
                                        </Link>

                                        {/* Lessons Badge */}
                                        <div className="mb-3 flex items-center gap-2 flex-wrap text-xs">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                {course.video_count || course.videos?.length || 0} Lessons
                                            </span>
                                        </div>

                                        {/* Price and Action */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                            <div>
                                                <p className="text-lg font-bold text-[#B00000]">
                                                    ₹{(typeof course.price === "number"
                                                        ? course.price
                                                        : parseFloat(String(course.price || "0"))
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                            <Link
                                                href={`/courses/${course.slug}`}
                                                className="px-4 py-2 bg-[#B00000] text-white text-sm rounded hover:bg-red-800 transition-colors"
                                            >
                                                View Course
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="col-span-full border border-gray-200 rounded p-12 text-center">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No courses available</p>
                            <p className="text-sm text-gray-500">
                                Check back later for new courses
                            </p>
                        </div>
                    )}
                </div>
            )}
            </div>
        </div>
    );
}
