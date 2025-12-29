"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Loader2,
    Settings,
    Shield,
    Monitor,
    Lock,
    Clock,
    MapPin,
    Info,
    ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";
import type { Session } from "@/lib/api/types";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";

function formatDate(dateString?: string) {
    if (!dateString) return "Never";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString();
}

function formatRelativeTime(dateString: string) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60)
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString();
}

export default function SettingsPage() {
    const { isAuth, user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            return;
        }
        if (isAuth && user) {
            fetchSessions();
        }
    }, [authLoading, isAuth, user]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await authApi.getActiveSessions();
            if (response.success && response.data) {
                setSessions(response.data.sessions || []);
            } else {
                setError("Failed to load sessions");
            }
        } catch (err: any) {
            setError(err?.message || "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    if (!isAuth) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Settings
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Password & Security */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-5 h-5 text-[#B00000]" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Password & Security
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lock className="w-4 h-4 text-gray-500" />
                                        <h3 className="text-sm font-medium text-gray-900">
                                            Change Password
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        To change your password, please use the
                                        "Forgot Password" option on the login
                                        page. A password reset link will be sent
                                        to your email address.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-blue-900 font-medium mb-1">
                                        Security Tip
                                    </p>
                                    <p className="text-sm text-blue-800">
                                        Use a strong, unique password and don't
                                        share it with anyone. Regularly review
                                        your active sessions below to ensure your
                                        account security.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <Monitor className="w-5 h-5 text-[#B00000]" />
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Active Sessions
                                </h2>
                            </div>
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                {sessions.length} session
                                {sessions.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="text-center py-8">
                                <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">
                                    No active sessions found
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`p-4 rounded-lg border ${
                                            session.isCurrent
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-gray-50 border-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Monitor className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {session.deviceInfo.deviceType ===
                                                        "desktop"
                                                            ? "Desktop"
                                                            : session.deviceInfo.deviceType ===
                                                              "mobile"
                                                            ? "Mobile"
                                                            : session.deviceInfo.deviceType ===
                                                              "tablet"
                                                            ? "Tablet"
                                                            : "Unknown Device"}
                                                    </span>
                                                    {session.isCurrent && (
                                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                                            Current Session
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 text-sm text-gray-600 ml-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            Browser:
                                                        </span>
                                                        <span>
                                                            {
                                                                session
                                                                    .deviceInfo
                                                                    .browser
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            OS:
                                                        </span>
                                                        <span>
                                                            {session.deviceInfo.os}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="font-medium">
                                                            IP Address:
                                                        </span>
                                                        <span>
                                                            {session.ipAddress}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        <span className="font-medium">
                                                            Last Activity:
                                                        </span>
                                                        <span>
                                                            {formatRelativeTime(
                                                                session.lastActivity
                                                            )}
                                                        </span>
                                                        <span className="text-gray-400">
                                                            ({formatDate(session.lastActivity)})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            Session Started:
                                                        </span>
                                                        <span>
                                                            {formatDate(
                                                                session.createdAt
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                Sessions automatically expire after 30 days of
                                inactivity. If you notice any suspicious activity,
                                please change your password immediately.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Account Management */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Settings className="w-5 h-5 text-[#B00000]" />
                            <h2 className="text-lg font-semibold text-slate-900">
                                Account Management
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <Link
                                href="/profile"
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-gray-200 group-hover:border-[#B00000] transition-colors">
                                        <Settings className="w-4 h-4 text-gray-600 group-hover:text-[#B00000] transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">
                                            Edit Profile
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Update your personal information
                                        </p>
                                    </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#B00000] transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

