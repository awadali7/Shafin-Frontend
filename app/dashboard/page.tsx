"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    BookOpen,
    Play,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Users,
    Video,
    Bell,
    Loader2,
    ExternalLink,
    Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";
import { adminApi } from "@/lib/api/admin";
import type { UserDashboardData, AdminDashboardData } from "@/lib/api/types";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuth } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userDashboard, setUserDashboard] =
        useState<UserDashboardData | null>(null);
    const [adminDashboard, setAdminDashboard] =
        useState<AdminDashboardData | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "performance">(
        "overview"
    );
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            return;
        }

        if (isAuth && user) {
            fetchDashboard();
            setIsLoginDrawerOpen(false);
            setIsRegisterDrawerOpen(false);
        }
    }, [isAuth, user, authLoading]);

    const fetchDashboard = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            if (user.role === "admin") {
                const response = await adminApi.getAdminDashboard();
                if (response.success && response.data) {
                    setAdminDashboard(response.data);
                } else {
                    setError("Failed to load admin dashboard");
                }
            } else {
                const response = await authApi.getUserDashboard();
                if (response.success && response.data) {
                    setUserDashboard(response.data);
                } else {
                    setError("Failed to load dashboard");
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60)
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
        return date.toLocaleDateString();
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    // Show login drawer if not authenticated
    if (!isAuth) {
        return (
            <>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Welcome to Diag Wheels
                        </h1>
                        <p className="text-gray-600">
                            Please sign in to continue
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

    if (error) {
        return (
            <div className="p-4 lg:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Admin Dashboard
    if (user?.role === "admin" && adminDashboard) {
        return (
            <div className="p-4 lg:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Business overview and performance metrics
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="mb-4 border-b border-gray-200">
                        <div className="flex space-x-6">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview"
                                    ? "border-[#B00000] text-[#B00000]"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Business Overview
                            </button>
                            <button
                                onClick={() => setActiveTab("performance")}
                                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "performance"
                                    ? "border-[#B00000] text-[#B00000]"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Performance
                            </button>
                        </div>
                    </div>

                    {/* Business Overview Tab */}
                    {activeTab === "overview" && (
                        <>
                            {/* Statistics Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Users
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {
                                                    adminDashboard
                                                        .business_overview
                                                        .statistics.total_users
                                                }
                                            </p>
                                        </div>
                                        <Users className="w-8 h-8 text-blue-500 opacity-60" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Courses
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {
                                                    adminDashboard
                                                        .business_overview
                                                        .statistics
                                                        .total_courses
                                                }
                                            </p>
                                        </div>
                                        <BookOpen className="w-8 h-8 text-green-500 opacity-60" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Pending
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {
                                                    adminDashboard
                                                        .business_overview
                                                        .statistics
                                                        .pending_requests
                                                }
                                            </p>
                                        </div>
                                        <AlertCircle className="w-8 h-8 text-yellow-500 opacity-60" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Active
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {
                                                    adminDashboard
                                                        .business_overview
                                                        .statistics
                                                        .active_access
                                                }
                                            </p>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-purple-500 opacity-60" />
                                    </div>
                                </div>
                            </div>

                            {/* Recent Requests */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                                    Recent Requests
                                </h2>
                                <div className="space-y-2">
                                    {adminDashboard.business_overview
                                        .recent_requests.length > 0 ? (
                                        adminDashboard.business_overview.recent_requests
                                            .slice(0, 5)
                                            .map((request) => (
                                                <div
                                                    key={request.id}
                                                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">
                                                            {request.first_name}{" "}
                                                            {request.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {
                                                                request.course_name
                                                            }
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`ml-2 px-2 py-0.5 rounded text-xs font-medium shrink-0 ${request.status ===
                                                            "pending"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : request.status ===
                                                                "approved"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                            }`}
                                                    >
                                                        {request.status}
                                                    </span>
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-xs text-gray-500 text-center py-3">
                                            No recent requests
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Admin Performance Tab */}
                    {activeTab === "performance" && (
                        <>
                            {/* Performance Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Courses
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {
                                                    adminDashboard
                                                        .admin_performance
                                                        .courses_accessed
                                                }
                                            </p>
                                        </div>
                                        <BookOpen className="w-8 h-8 text-blue-500 opacity-60" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Watched
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {
                                                    adminDashboard
                                                        .admin_performance
                                                        .videos_watched
                                                }
                                            </p>
                                        </div>
                                        <Video className="w-8 h-8 text-green-500 opacity-60" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Completion
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {
                                                    adminDashboard
                                                        .admin_performance
                                                        .completion_percentage
                                                }
                                                %
                                            </p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-purple-500 opacity-60" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">
                                                Total Videos
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {
                                                    adminDashboard
                                                        .admin_performance
                                                        .total_available_videos
                                                }
                                            </p>
                                        </div>
                                        <Video className="w-8 h-8 text-orange-500 opacity-60" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notifications & Current Video - Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {/* Notifications */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                                <Bell className="w-4 h-4 mr-1.5" />
                                Notifications
                            </h2>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {adminDashboard.notifications.length > 0 ? (
                                    adminDashboard.notifications
                                        .slice(0, 5)
                                        .map((notif, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start py-2 px-3 bg-gray-50 rounded text-sm"
                                            >
                                                <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-900 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {formatDate(
                                                            notif.created_at ||
                                                            notif.expires_at ||
                                                            ""
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-xs text-gray-500 text-center py-3">
                                        No notifications
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Currently Watching Video */}
                        {adminDashboard.current_video && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                                    <Play className="w-4 h-4 mr-1.5" />
                                    Currently Watching
                                </h2>
                                <div className="bg-gray-50 rounded p-3">
                                    <p className="text-sm font-medium text-slate-900 mb-1 line-clamp-1">
                                        {adminDashboard.current_video.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {
                                            adminDashboard.current_video
                                                .course_name
                                        }
                                    </p>
                                    <Link
                                        href={`/courses/${adminDashboard.current_video.course_slug}`}
                                        className="text-xs text-[#B00000] hover:underline flex items-center"
                                    >
                                        Continue{" "}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Latest Videos */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h2 className="text-sm font-semibold text-slate-900 mb-3">
                            Latest Videos
                        </h2>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {adminDashboard.latest_videos.length > 0 ? (
                                adminDashboard.latest_videos
                                    .slice(0, 5)
                                    .map((video) => (
                                        <Link
                                            key={video.id}
                                            href={`/courses/${video.course_slug}`}
                                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors text-sm"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">
                                                    {video.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {video.course_name}
                                                </p>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                                        </Link>
                                    ))
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-3">
                                    No videos available
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // User Dashboard
    if (userDashboard) {
        return (
            <div className="p-4 lg:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                            Welcome back, {user?.first_name}! 👋
                        </h1>
                        <p className="text-sm text-slate-600 mt-1">
                            Continue your learning journey
                        </p>
                    </div>

                    {/* Complete Profile Section (For Guests/New Users) */}
                    {!user?.user_type && (
                        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                Complete Your Profile
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link
                                    href="/kyc"
                                    className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors group"
                                >
                                    <div className="p-3 bg-blue-100 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">
                                            I am a Student
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Verify your student status to access courses
                                        </p>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-blue-400 ml-auto group-hover:text-blue-600" />
                                </Link>

                                <Link
                                    href="/kyc/product"
                                    className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors group"
                                >
                                    <div className="p-3 bg-purple-100 rounded-full mr-4 group-hover:bg-purple-200 transition-colors">
                                        <Briefcase className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">
                                            I am a Business Owner
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Verify your business to access B2B features
                                        </p>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-purple-400 ml-auto group-hover:text-purple-600" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Student Status & Business Upgrade (For Students) */}
                    {user?.user_type === "student" && (
                        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                Account Status
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Student Verified Status */}
                                <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
                                    <div className="p-3 bg-green-100 rounded-full mr-4">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">
                                            Student Account Verified
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            You have full access to student features
                                        </p>
                                    </div>
                                </div>

                                {/* Business Upgrade Option */}
                                <Link
                                    href="/kyc/product"
                                    className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors group"
                                >
                                    <div className="p-3 bg-purple-100 rounded-full mr-4 group-hover:bg-purple-200 transition-colors">
                                        <Briefcase className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">
                                            Upgrade to Business
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Verify your business for B2B features
                                        </p>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-purple-400 ml-auto group-hover:text-purple-600" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Courses
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {
                                            userDashboard.performance
                                                .total_courses
                                        }
                                    </p>
                                </div>
                                <BookOpen className="w-8 h-8 text-blue-500 opacity-60" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Watched
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {
                                            userDashboard.performance
                                                .watched_videos
                                        }
                                    </p>
                                </div>
                                <Video className="w-8 h-8 text-green-500 opacity-60" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Completion
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {
                                            userDashboard.performance
                                                .completion_percentage
                                        }
                                        %
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-purple-500 opacity-60" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Total Videos
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {userDashboard.performance.total_videos}
                                    </p>
                                </div>
                                <Video className="w-8 h-8 text-orange-500 opacity-60" />
                            </div>
                        </div>
                    </div>

                    {/* Currently Watching & Notifications - Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {/* Currently Watching Video */}
                        {userDashboard.current_video && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                                    <Play className="w-4 h-4 mr-1.5" />
                                    Continue Watching
                                </h2>
                                <div className="bg-gray-50 rounded p-3">
                                    <p className="text-sm font-medium text-slate-900 mb-1 line-clamp-1">
                                        {userDashboard.current_video.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {
                                            userDashboard.current_video
                                                .course_name
                                        }
                                    </p>
                                    <Link
                                        href={`/courses/${userDashboard.current_video.course_slug}`}
                                        className="inline-flex items-center px-3 py-1.5 bg-[#B00000] text-white text-xs rounded hover:bg-red-800 transition-colors"
                                    >
                                        Continue{" "}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Notifications */}
                        {userDashboard.notifications.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                                    <Bell className="w-4 h-4 mr-1.5" />
                                    Notifications
                                </h2>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {userDashboard.notifications
                                        .slice(0, 4)
                                        .map((notif) => (
                                            <div
                                                key={notif.id}
                                                className="py-2 px-3 bg-gray-50 rounded text-sm"
                                            >
                                                <p className="text-xs font-medium text-slate-900 line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formatDate(
                                                        notif.created_at
                                                    )}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* My Courses */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                        <h2 className="text-sm font-semibold text-slate-900 mb-3">
                            My Courses
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {userDashboard.courses.length > 0 ? (
                                userDashboard.courses.map((course) => (
                                    <Link
                                        key={course.id}
                                        href={`/courses/${course.slug}`}
                                        className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                    >
                                        <h3 className="text-sm font-medium text-slate-900 mb-2 line-clamp-1">
                                            {course.name}
                                        </h3>
                                        <div className="mb-2">
                                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                                <span>Progress</span>
                                                <span className="font-semibold">
                                                    {course.progress.percentage}
                                                    %
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-[#B00000] h-1.5 rounded-full transition-all"
                                                    style={{
                                                        width: `${course.progress.percentage}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {course.progress.watched} /{" "}
                                            {course.progress.total} videos
                                        </p>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 col-span-full text-center py-3">
                                    No courses enrolled.{" "}
                                    <Link
                                        href="/courses"
                                        className="text-[#B00000] hover:underline"
                                    >
                                        Browse courses
                                    </Link>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Latest Videos */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h2 className="text-sm font-semibold text-slate-900 mb-3">
                            Latest Videos
                        </h2>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {userDashboard.latest_videos.length > 0 ? (
                                userDashboard.latest_videos
                                    .slice(0, 5)
                                    .map((video) => (
                                        <Link
                                            key={video.id}
                                            href={`/courses/${video.course_slug}`}
                                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors text-sm"
                                        >
                                            <div className="flex items-center flex-1 min-w-0">
                                                {video.is_watched && (
                                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900 truncate">
                                                        {video.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {video.course_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                                        </Link>
                                    ))
                            ) : (
                                <p className="text-xs text-gray-500 text-center py-3">
                                    No videos available
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
