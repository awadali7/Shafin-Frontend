"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    Play,
    ArrowRight,
    Loader2,
    AlertCircle,
    Clock,
    CheckCircle2,
    Target,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api/client";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";

interface EnrolledCourse {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    cover_image: string | null;
    access_start: string;
    access_end: string;
    access_active: boolean;
    has_valid_access: boolean;
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function getDaysRemaining(accessEnd: string): number {
    const end = new Date(accessEnd);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
}

export default function MyLearningPage() {
    const router = useRouter();
    const { isAuth, user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            return;
        }

        if (isAuth) {
            fetchEnrolledCourses();
            setIsLoginDrawerOpen(false);
            setIsRegisterDrawerOpen(false);
        }
    }, [isAuth, authLoading]);

    const fetchEnrolledCourses = async () => {
        if (!isAuth) return;

        setLoading(true);
        setError(null);

        try {
            const response = await apiClient.get<EnrolledCourse[]>(
                "/users/courses"
            );

            if (response.success && response.data) {
                const enrolledCourses = response.data;
                setCourses(enrolledCourses);
            } else {
                setError("Failed to load enrolled courses");
            }
        } catch (err: any) {
            setError(err.message || "Failed to load enrolled courses");
        } finally {
            setLoading(false);
        }
    };


    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    if (!isAuth) {
        return (
            <>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            My Learning
                        </h1>
                        <p className="text-gray-600">
                            Please sign in to view your enrolled courses
                        </p>
                    </div>
                </div>
                <LoginDrawer
                    isOpen={isLoginDrawerOpen}
                    onClose={() => setIsLoginDrawerOpen(false)}
                    onSwitchToRegister={() => {
                        setIsLoginDrawerOpen(false);
                        setIsRegisterDrawerOpen(true);
                    }}
                />
                <RegisterDrawer
                    isOpen={isRegisterDrawerOpen}
                    onClose={() => setIsRegisterDrawerOpen(false)}
                    onSwitchToLogin={() => {
                        setIsRegisterDrawerOpen(false);
                        setIsLoginDrawerOpen(true);
                    }}
                />
            </>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                    <Target className="w-8 h-8 mr-3 text-[#B00000]" />
                    My Learning
                </h1>
                <p className="text-sm text-slate-600 mt-2">
                    View and access your enrolled courses
                </p>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Courses List */}
            {courses.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                        No courses enrolled yet
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Start your learning journey by enrolling in a course
                    </p>
                    <Link
                        href="/courses"
                        className="inline-flex items-center px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors"
                    >
                        Browse Courses
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const daysRemaining = getDaysRemaining(course.access_end);
                        const hasValidAccess = course.has_valid_access;

                        return (
                            <div
                                key={course.id}
                                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {/* Course Cover Image */}
                                <Link href={`/courses/${course.slug}`}>
                                    <div className="relative h-48 bg-gray-200">
                                        {course.cover_image ? (
                                            <Image
                                                src={course.cover_image}
                                                alt={course.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpen className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}

                                        {/* Access Status Badge */}
                                        {!hasValidAccess && (
                                            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                Expired
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Course Content */}
                                <div className="p-5">
                                    {/* Course Title */}
                                    <Link href={`/courses/${course.slug}`}>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-4 line-clamp-2 hover:text-[#B00000] transition-colors">
                                            {course.name}
                                        </h3>
                                    </Link>

                                    {/* Access Info */}
                                    <div className="space-y-2 mb-4 text-sm">
                                        {hasValidAccess && daysRemaining > 0 && (
                                            <div className="flex items-center text-gray-600">
                                                <Clock className="w-4 h-4 mr-2 shrink-0" />
                                                <span>
                                                    {daysRemaining} day
                                                    {daysRemaining !== 1
                                                        ? "s"
                                                        : ""}{" "}
                                                    remaining
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-gray-600">
                                            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0 text-green-500" />
                                            <span>
                                                Access until{" "}
                                                {formatDate(course.access_end)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Link
                                        href={`/courses/${course.slug}`}
                                        className="flex items-center justify-center w-full px-4 py-2.5 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors"
                                    >
                                        <Play className="w-5 h-5 mr-2" />
                                        Start Learning
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

