"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { kycApi } from "@/lib/api/kyc";
import { useAuth } from "@/contexts/AuthContext";
import type { KYCVerification } from "@/lib/api/types";

function KYCContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const redirectPath = searchParams.get("redirect");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [kycData, setKycData] = useState<KYCVerification | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form fields
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        address: "",
        contact_number: "",
        whatsapp_number: "",
    });

    // File states
    const [idProofFile, setIdProofFile] = useState<File | null>(null);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [idProofPreview, setIdProofPreview] = useState<string | null>(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<
        string | null
    >(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    // Fetch existing KYC data
    useEffect(() => {
        const fetchKYC = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const response = await kycApi.getMyKYC();

                if (response.success && response.data) {
                    setKycData(response.data);
                    setFormData({
                        first_name: response.data.first_name || "",
                        last_name: response.data.last_name || "",
                        address: response.data.address || "",
                        contact_number: response.data.contact_number || "",
                        whatsapp_number: response.data.whatsapp_number || "",
                    });

                    // Set preview URLs if files exist
                    if (response.data.id_proof_url) {
                        const baseUrl =
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:5001";
                        // Remove /api from baseUrl if present, as file URLs are relative to root
                        const cleanBaseUrl = baseUrl.replace(/\/api$/, "");
                        setIdProofPreview(
                            `${cleanBaseUrl}${response.data.id_proof_url}`
                        );
                    }
                    if (response.data.profile_photo_url) {
                        const baseUrl =
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:5001";
                        // Remove /api from baseUrl if present, as file URLs are relative to root
                        const cleanBaseUrl = baseUrl.replace(/\/api$/, "");
                        setProfilePhotoPreview(
                            `${cleanBaseUrl}${response.data.profile_photo_url}`
                        );
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch KYC:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchKYC();
    }, [user]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "application/pdf",
            ];
            if (!allowedTypes.includes(file.type)) {
                setError(
                    "Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed."
                );
                return;
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                return;
            }

            setIdProofFile(file);
            setError(null);

            // Create preview for images
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setIdProofPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setIdProofPreview(null);
            }
        }
    };

    const handleProfilePhotoChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type (only images for profile photo)
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
            ];
            if (!allowedTypes.includes(file.type)) {
                setError("Profile photo must be an image (JPEG, PNG, or WebP)");
                return;
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                return;
            }

            setProfilePhotoFile(file);
            setError(null);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeIdProof = () => {
        setIdProofFile(null);
        setIdProofPreview(null);
    };

    const removeProfilePhoto = () => {
        setProfilePhotoFile(null);
        setProfilePhotoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validation
        if (
            !formData.first_name ||
            !formData.last_name ||
            !formData.address ||
            !formData.contact_number ||
            !formData.whatsapp_number
        ) {
            setError("All fields are required");
            return;
        }

        // Check if files are provided (either new files or existing KYC)
        if (!idProofFile && !kycData?.id_proof_url) {
            setError("ID proof is required");
            return;
        }

        if (!profilePhotoFile && !kycData?.profile_photo_url) {
            setError("Profile photo is required");
            return;
        }

        setSubmitting(true);

        try {
            // Create FormData
            const formDataToSend = new FormData();
            formDataToSend.append("first_name", formData.first_name);
            formDataToSend.append("last_name", formData.last_name);
            formDataToSend.append("address", formData.address);
            formDataToSend.append("contact_number", formData.contact_number);
            formDataToSend.append("whatsapp_number", formData.whatsapp_number);

            if (idProofFile) {
                formDataToSend.append("id_proof", idProofFile);
            }
            if (profilePhotoFile) {
                formDataToSend.append("profile_photo", profilePhotoFile);
            }

            const response = await kycApi.submit(formDataToSend);

            if (response.success) {
                setSuccess(true);
                setKycData(response.data || null);
                // Refresh KYC data
                const kycResponse = await kycApi.getMyKYC();
                if (kycResponse.success && kycResponse.data) {
                    setKycData(kycResponse.data);
                }

                // Redirect after successful submission if redirect path is provided
                if (redirectPath) {
                    setTimeout(() => {
                        router.push(redirectPath);
                    }, 2000);
                }
            } else {
                setError(
                    response.message ||
                        "Failed to submit KYC. Please try again."
                );
            }
        } catch (err: any) {
            setError(
                err.message ||
                    "Failed to submit KYC. Please check your connection and try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-[#B00000] to-red-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                        KYC Verification
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-100 max-w-3xl mx-auto">
                        Complete your KYC verification to request course access
                    </p>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Status Banner */}
                    {kycData && (
                        <div
                            className={`mb-8 p-4 rounded-lg ${
                                kycData.status === "verified"
                                    ? "bg-green-50 border border-green-200"
                                    : kycData.status === "rejected"
                                    ? "bg-red-50 border border-red-200"
                                    : "bg-yellow-50 border border-yellow-200"
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                {kycData.status === "verified" ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                                ) : kycData.status === "rejected" ? (
                                    <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                                ) : (
                                    <Loader2 className="w-6 h-6 text-yellow-600 mt-0.5 animate-spin" />
                                )}
                                <div className="flex-1">
                                    <h3
                                        className={`font-semibold ${
                                            kycData.status === "verified"
                                                ? "text-green-800"
                                                : kycData.status === "rejected"
                                                ? "text-red-800"
                                                : "text-yellow-800"
                                        }`}
                                    >
                                        Status: {kycData.status.toUpperCase()}
                                    </h3>
                                    {kycData.status === "verified" && (
                                        <p className="text-green-700 text-sm mt-1">
                                            Your KYC has been verified. You can
                                            now request course access.
                                        </p>
                                    )}
                                    {kycData.status === "rejected" &&
                                        kycData.rejection_reason && (
                                            <p className="text-red-700 text-sm mt-1">
                                                <strong>Reason:</strong>{" "}
                                                {kycData.rejection_reason}
                                            </p>
                                        )}
                                    {kycData.status === "pending" && (
                                        <p className="text-yellow-700 text-sm mt-1">
                                            Your KYC is under review. Please
                                            wait for admin approval.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                <p className="text-green-800">
                                    KYC information submitted successfully! Your
                                    request is pending admin review.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                                <p className="text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* KYC Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div>
                                    <label
                                        htmlFor="first_name"
                                        className="block text-sm font-medium text-slate-700 mb-2"
                                    >
                                        First Name{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                        disabled={
                                            kycData?.status === "verified"
                                        }
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label
                                        htmlFor="last_name"
                                        className="block text-sm font-medium text-slate-700 mb-2"
                                    >
                                        Last Name{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                        disabled={
                                            kycData?.status === "verified"
                                        }
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="mt-6">
                                <label
                                    htmlFor="address"
                                    className="block text-sm font-medium text-slate-700 mb-2"
                                >
                                    Address{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                    disabled={kycData?.status === "verified"}
                                />
                            </div>

                            {/* Contact Number */}
                            <div className="mt-6">
                                <label
                                    htmlFor="contact_number"
                                    className="block text-sm font-medium text-slate-700 mb-2"
                                >
                                    Contact Number{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="contact_number"
                                    name="contact_number"
                                    value={formData.contact_number}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="+91 1234567890"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                    disabled={kycData?.status === "verified"}
                                />
                            </div>

                            {/* WhatsApp Number */}
                            <div className="mt-6">
                                <label
                                    htmlFor="whatsapp_number"
                                    className="block text-sm font-medium text-slate-700 mb-2"
                                >
                                    WhatsApp Number{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="whatsapp_number"
                                    name="whatsapp_number"
                                    value={formData.whatsapp_number}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="+91 1234567890"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                    disabled={kycData?.status === "verified"}
                                />
                            </div>
                        </div>

                        {/* ID Proof Upload */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                ID Proof
                            </h2>
                            <p className="text-sm text-slate-600 mb-4">
                                Upload a valid ID proof (Aadhaar, PAN, Passport,
                                etc.) in JPEG, PNG, WebP, or PDF format (Max
                                10MB)
                            </p>

                            {idProofPreview ? (
                                <div className="relative">
                                    {idProofFile?.type.startsWith("image/") ||
                                    (idProofPreview &&
                                        !idProofPreview.includes(".pdf")) ? (
                                        <img
                                            src={idProofPreview}
                                            alt="ID Proof Preview"
                                            className="w-full max-w-md h-auto rounded-lg border border-gray-300"
                                        />
                                    ) : (
                                        <div className="w-full max-w-md p-8 border border-gray-300 rounded-lg bg-gray-50">
                                            <p className="text-center text-slate-600">
                                                PDF File Selected
                                            </p>
                                            <p className="text-center text-sm text-slate-500 mt-2">
                                                {idProofFile?.name}
                                            </p>
                                        </div>
                                    )}
                                    {kycData?.status !== "verified" && (
                                        <button
                                            type="button"
                                            onClick={removeIdProof}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <label
                                    htmlFor="id_proof"
                                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                        kycData?.status === "verified"
                                            ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                                            : "border-gray-300 hover:border-[#B00000] hover:bg-gray-50"
                                    }`}
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500">
                                            <span className="font-semibold">
                                                Click to upload
                                            </span>{" "}
                                            or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            JPEG, PNG, WebP, or PDF (MAX. 10MB)
                                        </p>
                                    </div>
                                    <input
                                        id="id_proof"
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                        onChange={handleIdProofChange}
                                        disabled={
                                            kycData?.status === "verified"
                                        }
                                    />
                                </label>
                            )}
                        </div>

                        {/* Profile Photo Upload */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                                Profile Photo
                            </h2>
                            <p className="text-sm text-slate-600 mb-4">
                                Upload your profile photo in JPEG, PNG, or WebP
                                format (Max 10MB)
                            </p>

                            {profilePhotoPreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={profilePhotoPreview}
                                        alt="Profile Photo Preview"
                                        className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                                    />
                                    {kycData?.status !== "verified" && (
                                        <button
                                            type="button"
                                            onClick={removeProfilePhoto}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <label
                                    htmlFor="profile_photo"
                                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                        kycData?.status === "verified"
                                            ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                                            : "border-gray-300 hover:border-[#B00000] hover:bg-gray-50"
                                    }`}
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500">
                                            <span className="font-semibold">
                                                Click to upload
                                            </span>{" "}
                                            or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            JPEG, PNG, or WebP (MAX. 10MB)
                                        </p>
                                    </div>
                                    <input
                                        id="profile_photo"
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleProfilePhotoChange}
                                        disabled={
                                            kycData?.status === "verified"
                                        }
                                    />
                                </label>
                            )}
                        </div>

                        {/* Submit Button */}
                        {kycData?.status !== "verified" && (
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-3 border border-gray-300 rounded-lg text-slate-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-3 bg-[#B00000] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <span>
                                            {kycData
                                                ? "Update KYC"
                                                : "Submit KYC"}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}

                        {kycData?.status === "verified" && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => router.push("/courses")}
                                    className="px-6 py-3 bg-[#B00000] text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Browse Courses
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </section>
        </div>
    );
}

export default function KYCPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
                </div>
            }
        >
            <KYCContent />
        </Suspense>
    );
}
