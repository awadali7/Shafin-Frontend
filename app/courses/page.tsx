"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 mb-1 sm:mb-2">
                        All Courses
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600">
                        Explore our comprehensive automotive technology courses
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-600">
                                    {error}
                                </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {courses.length > 0 ? (
                            courses.map((course) => {
                                return (
                                    <Link
                                        key={course.slug}
                                        href={`/courses/${course.slug}`}
                                        className={`
                                    flex flex-col rounded-xl overflow-hidden transition-all duration-300
                                    bg-white
                                    text-gray-700
                                    hover:shadow-xl hover:scale-[1.02]
                                    hover:text-[#B00000]
                                `}
                                    >
                                        {/* Cover Image */}
                                        <div className="relative h-48 w-full overflow-hidden bg-[#B00000]">
                                            {course.cover_image ? (
                                                <img
                                                    src={course.cover_image}
                                                    alt={course.name}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            ) : null}
                                            <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-all duration-300"></div>
                                        </div>

                                        {/* Course Content */}
                                        <div className="flex flex-col items-start space-y-4 px-4 py-6">
                                            <div className="text-left w-full">
                                                <h3 className="text-lg font-medium mb-2">
                                                    {course.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {course.description ||
                                                        `Master the latest techniques and technologies in ${course.name.toLowerCase()}.`}
                                                </p>
                                            </div>
                                            <div className="w-full mt-4 space-y-3">
                                                <div className="flex items-center justify-between px-4">
                                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                        <BookOpen className="w-4 h-4" />
                                                        <span>
                                                            {course.video_count ||
                                                                course.videos
                                                                    ?.length ||
                                                                0}{" "}
                                                            Lessons
                                                        </span>
                                                    </div>
                                                    <div className="text-lg font-bold text-[#B00000]">
                                                        ₹
                                                        {(typeof course.price ===
                                                        "number"
                                                            ? course.price
                                                            : parseFloat(
                                                                  String(
                                                                      course.price ||
                                                                          "0"
                                                                  )
                                                              )
                                                        ).toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center px-4">
                                                    <div className="flex items-center space-x-1 px-4 py-2 bg-[#B00000] text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-all duration-300 w-full justify-center">
                                                        <span>Start</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-20">
                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-600 mb-2">
                                    No courses available
                                </p>
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
