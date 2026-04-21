"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Briefcase, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [selectedType, setSelectedType] = useState<"student" | "business" | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    // Check if user already has KYC status
    useEffect(() => {
        if (!loading && user) {
            // If user already has student KYC verified, redirect to courses
            if (user.kyc_status === "verified") {
                router.push("/courses");
                return;
            }

            // If user already has business KYC verified, redirect to shop
            if (user.product_kyc_status === "verified") {
                router.push("/shop");
                return;
            }

            // If user has pending student KYC, redirect to dashboard
            if (user.kyc_status === "pending") {
                router.push("/dashboard");
                return;
            }

            // If user has pending business KYC, redirect to dashboard
            if (user.product_kyc_status === "pending") {
                router.push("/dashboard");
                return;
            }
        }
    }, [user, loading, router]);

    const handleContinue = () => {
        if (!selectedType) return;

        if (selectedType === "student") {
            router.push("/kyc?redirect=/courses");
        } else if (selectedType === "business") {
            router.push("/kyc/product?redirect=/shop");
        }
    };

    const handleSkip = () => {
        router.push("/dashboard");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#B00000] to-red-800 text-white p-8 relative">
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Skip"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                        Welcome to DiagTools! 🎉
                    </h1>
                    <p className="text-xl text-gray-100">
                        Let's personalize your experience
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 sm:p-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                        What brings you here today?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Student Option */}
                        <button
                            onClick={() => setSelectedType("student")}
                            className={`group relative p-8 rounded-xl border-2 transition-all duration-300 ${
                                selectedType === "student"
                                    ? "border-[#B00000] bg-red-50 shadow-lg scale-105"
                                    : "border-gray-200 hover:border-[#B00000] hover:shadow-md"
                            }`}
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div
                                    className={`p-6 rounded-full transition-colors ${
                                        selectedType === "student"
                                            ? "bg-[#B00000] text-white"
                                            : "bg-gray-100 text-gray-600 group-hover:bg-[#B00000] group-hover:text-white"
                                    }`}
                                >
                                    <GraduationCap className="w-12 h-12" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                        I'm a Student
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        I want to learn automotive diagnostics and access training courses
                                    </p>
                                </div>
                            </div>
                            {selectedType === "student" && (
                                <div className="absolute top-4 right-4 bg-[#B00000] text-white rounded-full p-1">
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* Business Owner Option */}
                        <button
                            onClick={() => setSelectedType("business")}
                            className={`group relative p-8 rounded-xl border-2 transition-all duration-300 ${
                                selectedType === "business"
                                    ? "border-[#B00000] bg-red-50 shadow-lg scale-105"
                                    : "border-gray-200 hover:border-[#B00000] hover:shadow-md"
                            }`}
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div
                                    className={`p-6 rounded-full transition-colors ${
                                        selectedType === "business"
                                            ? "bg-[#B00000] text-white"
                                            : "bg-gray-100 text-gray-600 group-hover:bg-[#B00000] group-hover:text-white"
                                    }`}
                                >
                                    <Briefcase className="w-12 h-12" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                        I'm a Business Owner
                                    </h3>
                                    <p className="text-sm text-slate-600">
                                        I want to purchase diagnostic tools and products for my business
                                    </p>
                                </div>
                            </div>
                            {selectedType === "business" && (
                                <div className="absolute top-4 right-4 bg-[#B00000] text-white rounded-full p-1">
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleContinue}
                            disabled={!selectedType}
                            className={`flex-1 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
                                selectedType
                                    ? "bg-[#B00000] text-white hover:bg-red-800 shadow-lg hover:shadow-xl"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            Continue with Verification
                        </button>
                        <button
                            onClick={handleSkip}
                            className="px-8 py-4 border-2 border-gray-300 rounded-lg font-semibold text-lg text-slate-700 hover:bg-gray-50 transition-colors"
                        >
                            Skip for Now
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Why do we ask?</strong> This helps us verify your identity and provide you with the right access to courses or products.
                            You can always change this later from your settings.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

