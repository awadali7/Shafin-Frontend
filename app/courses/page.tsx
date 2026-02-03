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
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="bg-white rounded-lg shadow border border-gray-200 p-12">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
                    </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length > 0 ? (
                        courses.map((course) => {
                            const description =
                                course.description ||
                                `Master the latest techniques and technologies in ${course.name.toLowerCase()}.`;
                            const isDescriptionLong = description.length > 100;

                            return (
                                <Link
                                    key={course.slug}
                                    href={`/courses/${course.slug}`}
                                    className="group flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                >
                                    {/* Cover Image */}
                                    <div className="relative h-40 w-full overflow-hidden bg-[#B00000]">
                                        {course.cover_image ? (
                                            <img
                                                src={course.cover_image}
                                                alt={course.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : null}
                                    </div>

                                    {/* Course Content */}
                                    <div className="flex flex-col grow p-5">
                                        {/* Title */}
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 min-h-14">
                                            {course.name}
                                        </h3>

                                        {/* Description with Tooltip */}
                                        <div className="relative mb-4 grow">
                                            <p
                                                className={`text-sm text-gray-600 line-clamp-2 ${
                                                    isDescriptionLong
                                                        ? "cursor-help"
                                                        : ""
                                                }`}
                                                title={
                                                    isDescriptionLong
                                                        ? description
                                                        : undefined
                                                }
                                            >
                                                {description}
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                                                    <BookOpen className="w-3.5 h-3.5" />
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
                                            <div className="w-full bg-[#B00000] text-white text-sm font-medium py-2.5 rounded-lg text-center group-hover:bg-red-800 transition-colors">
                                                View Course
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="col-span-full bg-white rounded-lg shadow border border-gray-200 p-12">
                            <div className="text-center">
                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-600 mb-2">
                                    No courses available
                                </p>
                                <p className="text-sm text-gray-500">
                                    Check back later for new courses
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
