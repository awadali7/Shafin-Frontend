"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import type { Notification } from "@/lib/api/notifications";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function NotificationBell() {
    const { isAuth } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuth) return;

        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, [isAuth]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const fetchNotifications = async () => {
        if (!isAuth) return;

        try {
            const response = await notificationsApi.getMyNotifications(10, 0);
            if (response.success && response.data) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unread_count);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
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
        }
    };

    const handleMarkAllAsRead = async () => {
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

    if (!isAuth) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-700 hover:text-[#B00000] transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-[#B00000] text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Notifications
                        </h3>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-[#B00000] hover:underline"
                                    title="Mark all as read"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {notifications.map((notification) => (
                                    <Link
                                        key={notification.id}
                                        href={getNotificationUrl(notification)}
                                        onClick={() => {
                                            if (!notification.is_read) {
                                                handleMarkAsRead(
                                                    notification.id
                                                );
                                            }
                                            setIsOpen(false);
                                        }}
                                        className={`block p-4 hover:bg-gray-50 transition-colors ${
                                            !notification.is_read
                                                ? "bg-blue-50"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p
                                                        className={`text-sm font-medium ${
                                                            !notification.is_read
                                                                ? "text-slate-900"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                    {!notification.is_read && (
                                                        <span className="w-2 h-2 bg-[#B00000] rounded-full shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(
                                                        notification.created_at
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                            <Link
                                href="/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-[#B00000] hover:underline font-medium"
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
