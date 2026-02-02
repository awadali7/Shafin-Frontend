"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Building2, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function ChooseUserTypeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectPath = searchParams.get("redirect") || "/dashboard";
    // @ts-ignore - user_type exists but might not be in type definition
    const currentUserType = user?.user_type;

    // If user not authenticated, redirect to login
    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
    }, [user, router]);

    const handleSelectType = async (userType: "student" | "business_owner") => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/terms/user-type`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                    },
                    body: JSON.stringify({ user_type: userType }),
                }
            );

            const data = await response.json();

            if (data.success) {
                // Refresh user profile to get updated user_type
                await refreshProfile();

                // Redirect based on type
                if (userType === "student") {
                    router.push("/kyc?redirect=" + encodeURIComponent(redirectPath));
                } else {
                    router.push("/kyc/product?redirect=" + encodeURIComponent(redirectPath));
                }
            } else {
                setError(data.message || "Failed to set user type");
            }
        } catch (err: any) {
            setError(err.message || "Failed to set user type");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.push(redirectPath);
    };

    if (!user) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4" style={{ height: 'calc(100vh - 64px)' }}>
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">
                        {currentUserType ? "Update Your Account Type" : "Welcome to Our Platform! 👋"}
                    </h1>
                    <p className="text-lg text-slate-600">
                        {currentUserType 
                            ? `You can change your selection before completing KYC verification.`
                            : "To provide you with the best experience, please tell us which describes you best:"
                        }
                    </p>
                    {currentUserType && (
                        <div className="mt-4 inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                                Current type: <strong className="capitalize">{currentUserType.replace('_', ' ')}</strong>
                            </p>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Options */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Student Option */}
                    <button
                        onClick={() => handleSelectType("student")}
                        disabled={loading}
                        className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            currentUserType === "student" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-transparent hover:border-blue-500"
                        }`}
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                <GraduationCap className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    🎓 I'm a Student
                                </h3>
                                <p className="text-slate-600">
                                    I want to learn and purchase courses
                                </p>
                            </div>

                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </button>

                    {/* Business Owner Option */}
                    <button
                        onClick={() => handleSelectType("business_owner")}
                        disabled={loading}
                        className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            currentUserType === "business_owner" 
                                ? "border-green-500 bg-green-50" 
                                : "border-transparent hover:border-green-500"
                        }`}
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
                                <Building2 className="w-10 h-10 text-green-600 group-hover:text-white transition-colors" />
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    🏢 I'm a Business Owner
                                </h3>
                                <p className="text-slate-600">
                                    I want to purchase products in bulk
                                </p>
                            </div>

                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Skip Option */}
                <div className="text-center">
                    <button
                        onClick={handleSkip}
                        disabled={loading}
                        className="text-slate-600 hover:text-slate-900 font-medium transition-colors disabled:opacity-50 underline"
                    >
                        {currentUserType 
                            ? "← Go Back" 
                            : "⏭️ Skip for now (you can choose later)"
                        }
                    </button>
                </div>

                {/* Loading Indicator */}
                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#B00000]" />
                            <p className="text-slate-700 font-medium">
                                Setting up your account...
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function ChooseUserTypePage() {
    return (
        <Suspense
            fallback={
                <div className="bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4" style={{ height: 'calc(100vh - 64px)' }}>
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#B00000]" />
                        <p className="text-slate-700 font-medium">Loading...</p>
                    </div>
                </div>
            }
        >
            <ChooseUserTypeContent />
        </Suspense>
    );
}
