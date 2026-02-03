"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Bell,
    CheckCheck,
    Check,
    ArrowLeft,
    Loader2,
    Filter,
    X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/lib/api/notifications";
import type { Notification } from "@/lib/api/notifications";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";

type FilterType = "all" | "unread" | "read";

export default function NotificationsPage() {
    const router = useRouter();
    const { isAuth, user, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>("all");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
    const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
    const [isLastPage, setIsLastPage] = useState(false);

    const limit = 20;

    // Reset to page 1 when filter changes, then fetch
    useEffect(() => {
        if (isAuth && page !== 1) {
            setPage(1);
            return; // Let the page change trigger the fetch
        }
    }, [filter, isAuth]);

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            return;
        }

        if (isAuth) {
            fetchNotifications();
            setIsLoginDrawerOpen(false);
            setIsRegisterDrawerOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuth, authLoading, page]);

    const fetchNotifications = async () => {
        if (!isAuth) return;

        setLoading(true);
        setError(null);

        try {
            const offset = (page - 1) * limit;
            const response = await notificationsApi.getMyNotifications(
                limit,
                offset
            );

            if (response.success && response.data) {
                // Store all fetched notifications (no client-side filtering for pagination)
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unread_count || 0);
                // Determine if this is the last page
                const fetchedCount = response.data.notifications.length;
                setIsLastPage(fetchedCount < limit);
                setTotal((page - 1) * limit + fetchedCount);
            } else {
                setError("Failed to load notifications");
            }
        } catch (err: any) {
            setError(err.message || "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        setMarkingAsRead(id);
        try {
            await notificationsApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === id
                        ? {
                              ...notif,
                              is_read: true,
                              read_at: new Date().toISOString(),
                          }
                        : notif
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        } finally {
            setMarkingAsRead(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        setMarkingAllAsRead(true);
        try {
            await notificationsApi.markAllAsRead();
            setNotifications((prev) =>
                prev.map((notif) => ({
                    ...notif,
                    is_read: true,
                    read_at: new Date().toISOString(),
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        } finally {
            setMarkingAllAsRead(false);
        }
    };

    const getNotificationUrl = (notification: Notification): string => {
        if (notification.data?.course_id) {
            return `/courses/${notification.data.course_slug || ""}`;
        }
        if (notification.type === "announcement") {
            return "/dashboard";
        }
        return "/dashboard";
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);

        if (minutes < 1) return "Just now";
        if (minutes < 60)
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
        if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
        if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
        return date.toLocaleDateString();
    };

    // Apply client-side filtering for unread/read (since API returns all)
    const filteredNotifications =
        filter === "all"
            ? notifications
            : filter === "unread"
            ? notifications.filter((n) => !n.is_read)
            : notifications.filter((n) => n.is_read);

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
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Notifications
                        </h1>
                        <p className="text-gray-600">
                            Please sign in to view your notifications
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
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-gray-600 hover:text-[#B00000] mb-4 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Notifications
                        </h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-600">
                                {unreadCount} unread notification
                                {unreadCount !== 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={markingAllAsRead}
                            className="flex items-center space-x-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {markingAllAsRead ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Marking...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCheck className="w-4 h-4" />
                                    <span>Mark All as Read</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-1">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            filter === "all"
                                ? "bg-[#B00000] text-white"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter("unread")}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors relative ${
                            filter === "unread"
                                ? "bg-[#B00000] text-white"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        Unread
                        {unreadCount > 0 && filter !== "unread" && (
                            <span className="ml-2 px-1.5 py-0.5 bg-[#B00000] text-white text-xs rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter("read")}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            filter === "read"
                                ? "bg-[#B00000] text-white"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        Read
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Notifications List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium mb-1">
                            No notifications
                        </p>
                        <p className="text-sm text-gray-500">
                            {filter === "all"
                                ? "You don't have any notifications yet."
                                : filter === "unread"
                                ? "You don't have any unread notifications."
                                : "You don't have any read notifications."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredNotifications.map((notification) => {
                            const notificationUrl = getNotificationUrl(
                                notification
                            );
                            return (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${
                                        !notification.is_read
                                            ? "bg-blue-50/50"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={notificationUrl}
                                                onClick={() => {
                                                    if (!notification.is_read) {
                                                        handleMarkAsRead(
                                                            notification.id
                                                        );
                                                    }
                                                }}
                                                className="block"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h3
                                                                className={`text-base font-semibold ${
                                                                    !notification.is_read
                                                                        ? "text-slate-900"
                                                                        : "text-gray-700"
                                                                }`}
                                                            >
                                                                {
                                                                    notification.title
                                                                }
                                                            </h3>
                                                            {!notification.is_read && (
                                                                <span className="w-2 h-2 bg-[#B00000] rounded-full shrink-0"></span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-2">
                                                            {
                                                                notification.message
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            {formatDate(
                                                                notification.created_at
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                        {!notification.is_read && (
                                            <button
                                                onClick={() =>
                                                    handleMarkAsRead(
                                                        notification.id
                                                    )
                                                }
                                                disabled={
                                                    markingAsRead ===
                                                    notification.id
                                                }
                                                className="shrink-0 p-2 text-gray-400 hover:text-[#B00000] hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                                                title="Mark as read"
                                            >
                                                {markingAsRead ===
                                                notification.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {(page > 1 || !isLastPage) && (
                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page}
                        {notifications.length > 0 &&
                            ` (${notifications.length} notification${notifications.length !== 1 ? "s" : ""})`}
                    </span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={isLastPage || loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Login Drawer */}
            <LoginDrawer
                isOpen={isLoginDrawerOpen}
                onClose={() => setIsLoginDrawerOpen(false)}
                onSwitchToRegister={() => {
                    setIsLoginDrawerOpen(false);
                    setIsRegisterDrawerOpen(true);
                }}
            />

            {/* Register Drawer */}
            <RegisterDrawer
                isOpen={isRegisterDrawerOpen}
                onClose={() => setIsRegisterDrawerOpen(false)}
                onSwitchToLogin={() => {
                    setIsRegisterDrawerOpen(false);
                    setIsLoginDrawerOpen(true);
                }}
            />
        </div>
    );
}

