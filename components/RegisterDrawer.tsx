"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
    getAndClearRedirectPath,
    setRedirectPath,
    shouldPreserveRedirect,
} from "@/lib/utils/redirect";

interface RegisterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin?: () => void;
    preventRedirect?: boolean; // Prevent redirect after registration
}

export default function RegisterDrawer({
    isOpen,
    onClose,
    onSwitchToLogin,
    preventRedirect = false,
}: RegisterDrawerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { register, isAuth } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        first_name: "",
        last_name: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{
        [key: string]: string;
    }>({});

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
        }
    }, [isAuth, isOpen, onClose, router, preventRedirect, pathname]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError(null);
        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};

        if (!formData.first_name.trim()) {
            errors.first_name = "First name is required";
        } else if (formData.first_name.trim().length < 2) {
            errors.first_name = "First name must be at least 2 characters";
        }

        if (!formData.last_name.trim()) {
            errors.last_name = "Last name is required";
        } else if (formData.last_name.trim().length < 2) {
            errors.last_name = "Last name must be at least 2 characters";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            errors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            errors.password = "Password is required";
        } else if (formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setValidationErrors({});

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
            });
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
            // Handle validation errors from backend
            if (err?.data?.errors && Array.isArray(err.data.errors)) {
                const fieldErrors: { [key: string]: string } = {};
                let generalError = null;

                err.data.errors.forEach((error: any) => {
                    if (error.path) {
                        // Map backend field names to form field names
                        const fieldName = error.path;
                        fieldErrors[fieldName] = error.msg || error.message;
                    } else {
                        generalError = error.msg || error.message;
                    }
                });

                setValidationErrors(fieldErrors);
                // Only show general error if there are no field-specific errors
                setError(
                    Object.keys(fieldErrors).length === 0
                        ? generalError ||
                              err.data.message ||
                              "Validation failed. Please check the form."
                        : null
                );
            } else {
                // Handle general errors
                setError(
                    err.message ||
                        err.data?.message ||
                        "Registration failed. Please try again."
                );
            }
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
                className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out overflow-y-auto ${
                    isOpen
                        ? "translate-x-0 opacity-100"
                        : "translate-x-full opacity-0 pointer-events-none"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-2xl font-bold text-slate-900">
                                Create Account
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
                            Sign up to get started with your learning journey
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Register Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name Fields Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* First Name */}
                                <div>
                                    <label
                                        htmlFor="drawer-first-name"
                                        className="block text-sm font-medium text-slate-900 mb-2"
                                    >
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            id="drawer-first-name"
                                            name="first_name"
                                            type="text"
                                            required
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className={`block w-full pl-9 pr-3 py-2.5 border rounded-lg bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                                validationErrors.first_name
                                                    ? "border-red-300 focus:ring-red-500"
                                                    : "border-gray-300 focus:ring-[#B00000] focus:border-transparent"
                                            }`}
                                            placeholder="John"
                                        />
                                    </div>
                                    {validationErrors.first_name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {validationErrors.first_name}
                                        </p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label
                                        htmlFor="drawer-last-name"
                                        className="block text-sm font-medium text-slate-900 mb-2"
                                    >
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input
                                            id="drawer-last-name"
                                            name="last_name"
                                            type="text"
                                            required
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className={`block w-full pl-9 pr-3 py-2.5 border rounded-lg bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                                validationErrors.last_name
                                                    ? "border-red-300 focus:ring-red-500"
                                                    : "border-gray-300 focus:ring-[#B00000] focus:border-transparent"
                                            }`}
                                            placeholder="Doe"
                                        />
                                    </div>
                                    {validationErrors.last_name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {validationErrors.last_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label
                                    htmlFor="drawer-register-email"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="drawer-register-email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`block w-full pl-12 pr-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                            validationErrors.email
                                                ? "border-red-300 focus:ring-red-500"
                                                : "border-gray-300 focus:ring-[#B00000] focus:border-transparent"
                                        }`}
                                        placeholder="Enter your email"
                                    />
                                </div>
                                {validationErrors.email && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {validationErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label
                                    htmlFor="drawer-register-password"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="drawer-register-password"
                                        name="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`block w-full pl-12 pr-12 py-3 border rounded-lg bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                            validationErrors.password
                                                ? "border-red-300 focus:ring-red-500"
                                                : "border-gray-300 focus:ring-[#B00000] focus:border-transparent"
                                        }`}
                                        placeholder="Create a password"
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
                                {validationErrors.password && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {validationErrors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label
                                    htmlFor="drawer-confirm-password"
                                    className="block text-sm font-medium text-slate-900 mb-2"
                                >
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="drawer-confirm-password"
                                        name="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`block w-full pl-12 pr-12 py-3 border rounded-lg bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                            validationErrors.confirmPassword
                                                ? "border-red-300 focus:ring-red-500"
                                                : "border-gray-300 focus:ring-[#B00000] focus:border-transparent"
                                        }`}
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                                {validationErrors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {validationErrors.confirmPassword}
                                    </p>
                                )}
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
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <span>Create Account</span>
                                )}
                            </button>
                        </form>

                        {/* Existing User Section */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="text-sm text-slate-600 text-center mb-4">
                                Already have an account?
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    if (onSwitchToLogin) {
                                        // Small delay to allow drawer close animation
                                        setTimeout(() => {
                                            onSwitchToLogin();
                                        }, 100);
                                    }
                                }}
                                className="w-full py-3 px-6 bg-slate-100 text-slate-900 rounded-lg font-medium hover:bg-slate-200 transition-all duration-300 text-center"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
