"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ForgotPasswordDrawer from "./ForgotPasswordDrawer";
import {
    getAndClearRedirectPath,
    setRedirectPath,
    shouldPreserveRedirect,
} from "@/lib/utils/redirect";

interface LoginDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToRegister?: () => void;
    preventRedirect?: boolean; // Prevent redirect after login
}

export default function LoginDrawer({
    isOpen,
    onClose,
    onSwitchToRegister,
    preventRedirect = false,
}: LoginDrawerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { login, isAuth } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isForgotPasswordDrawerOpen, setIsForgotPasswordDrawerOpen] =
        useState(false);

    // Preserve current path when drawer opens
    React.useEffect(() => {
        if (isOpen && pathname && shouldPreserveRedirect(pathname)) {
            setRedirectPath(pathname);
        }
    }, [isOpen, pathname]);

    // Close drawer if user is authenticated
    React.useEffect(() => {
        if (isAuth && isOpen) {
            onClose();
            if (!preventRedirect) {
                // Use redirect path or default to current page or home
                const redirectPath = getAndClearRedirectPath();
                if (redirectPath) {
                    router.push(redirectPath);
                } else if (pathname && shouldPreserveRedirect(pathname)) {
                    // Stay on current page if it's a valid page
                    router.refresh();
                } else {
                    router.push("/");
                }
            }
        }
    }, [isAuth, isOpen, onClose, router, preventRedirect, pathname]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await login(formData);
            onClose();
            if (!preventRedirect) {
                // Use redirect path or default to current page or dashboard
                const redirectPath = getAndClearRedirectPath();
                if (redirectPath) {
                    router.push(redirectPath);
                } else if (pathname && shouldPreserveRedirect(pathname)) {
                    // Stay on current page if it's a valid page
                    router.refresh();
                } else {
                    router.push("/dashboard");
                }
            }
        } catch (err: any) {
            setError(
                err.message || "Login failed. Please check your credentials."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out ${
                    isOpen
                        ? "translate-x-0 opacity-100"
                        : "translate-x-full opacity-0 pointer-events-none"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-2xl font-bold text-slate-900">
                                Sign In
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Close drawer"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <p className="text-sm text-slate-600 mb-8">
                            Sign in to your account to continue learning
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div>
                                <label
                                    htmlFor="drawer-email"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="drawer-email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent transition-all"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label
                                    htmlFor="drawer-password"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="drawer-password"
                                        name="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent transition-all"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot Password */}
                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPasswordDrawerOpen(true);
                                    }}
                                    className="text-sm text-[#B00000] hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 px-6 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <span>Sign In</span>
                                )}
                            </button>
                        </form>

                        {/* New User Section */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="text-sm text-slate-600 text-center mb-4">
                                New to DIAGTOOLS?
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    if (onSwitchToRegister) {
                                        // Small delay to allow drawer close animation
                                        setTimeout(() => {
                                            onSwitchToRegister();
                                        }, 100);
                                    }
                                }}
                                className="w-full py-3 px-6 bg-slate-100 text-slate-900 rounded-lg font-medium hover:bg-slate-200 transition-all duration-300 text-center"
                            >
                                Create an account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Drawer */}
            <ForgotPasswordDrawer
                isOpen={isForgotPasswordDrawerOpen}
                onClose={() => setIsForgotPasswordDrawerOpen(false)}
                onSwitchToLogin={() => {
                    setIsForgotPasswordDrawerOpen(false);
                }}
            />
        </>
    );
}
