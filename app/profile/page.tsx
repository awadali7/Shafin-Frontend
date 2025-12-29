"use client";

import React, { useEffect, useState } from "react";
import { Loader2, User, Mail, Calendar, Monitor, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";

function formatDate(dateString?: string) {
    if (!dateString) return "Never";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString();
}

export default function ProfilePage() {
    const {
        isAuth,
        user,
        loading: authLoading,
        updateUser,
        refreshProfile,
    } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            return;
        }
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
            });
        }
    }, [authLoading, isAuth, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
        setSuccess(null);
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
            });
        }
        setIsEditing(false);
        setError(null);
        setSuccess(null);
    };

    const handleSave = async () => {
        if (!user) return;

        setError(null);
        setSuccess(null);

        // Validation
        if (!formData.first_name.trim()) {
            setError("First name is required");
            return;
        }
        if (!formData.last_name.trim()) {
            setError("Last name is required");
            return;
        }
        if (!formData.email.trim()) {
            setError("Email is required");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError("Please enter a valid email address");
            return;
        }

        try {
            setIsSaving(true);
            await updateUser(formData);
            await refreshProfile();
            setSuccess("Profile updated successfully");
            setIsEditing(false);
        } catch (err: any) {
            setError(err?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
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
                            Profile
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
                <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-[#B00000] text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">{success}</p>
                </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Profile Information */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label
                                    htmlFor="first_name"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    First Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        disabled={isSaving}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">
                                            {user?.first_name || "Not set"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="last_name"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Last Name
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        disabled={isSaving}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">
                                            {user?.last_name || "Not set"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Email Address
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        disabled={isSaving}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">
                                            {user?.email || "Not set"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors disabled:opacity-60"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Account Information */}
                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">
                            Account Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Role
                                    </span>
                                </div>
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {user?.role === "admin" ? "Admin" : "User"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Account Created
                                    </span>
                                </div>
                                <span className="text-sm text-gray-900">
                                    {formatDate(user?.created_at)}
                                </span>
                            </div>

                            {user?.last_login_at && (
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Last Login
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-900">
                                        {formatDate(user.last_login_at)}
                                    </span>
                                </div>
                            )}

                            {user?.last_login_device && (
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Last Login Device
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-900">
                                        {user.last_login_device.deviceType} •{" "}
                                        {user.last_login_device.browser} •{" "}
                                        {user.last_login_device.os}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
