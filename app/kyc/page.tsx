"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Plus, Download } from "lucide-react";
import { kycApi } from "@/lib/api/kyc";
import { termsApi } from "@/lib/api/terms";
import { useAuth } from "@/contexts/AuthContext";
import type { KYCVerification } from "@/lib/api/types";
import { toast } from "sonner";

function KYCContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshProfile } = useAuth();
    const redirectPath = searchParams.get("redirect");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [kycData, setKycData] = useState<KYCVerification | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Form fields
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        address: "",
        contact_number: "",
        whatsapp_number: "",
    });

    // File states
    const [idProofFiles, setIdProofFiles] = useState<File[]>([]);
    const [idProofPreviews, setIdProofPreviews] = useState<Array<{ file: File | null; preview: string }>>([]);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

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

                    // Set preview URLs if files exist (handle both single URL and array)
                    if (response.data.id_proof_url) {
                        const baseUrl =
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:5001";
                        // Remove /api from baseUrl if present, as file URLs are relative to root
                        const cleanBaseUrl = baseUrl.replace(/\/api$/, "");
                        const idProofUrls = Array.isArray(response.data.id_proof_url) 
                            ? response.data.id_proof_url 
                            : [response.data.id_proof_url];
                        setIdProofPreviews(
                            idProofUrls.map((url: string) => ({
                                file: null,
                                preview: `${cleanBaseUrl}${url}`
                            }))
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
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "application/pdf",
            ];

            // Validate all files
            for (const file of files) {
                if (!allowedTypes.includes(file.type)) {
                    toast.error(
                        "Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed."
                    );
                    return;
                }

                if (file.size > 10 * 1024 * 1024) {
                    toast.error("File size must be less than 10MB per file");
                    return;
                }
            }

            // Add new files to existing ones
            const newFiles = [...idProofFiles, ...files];
            setIdProofFiles(newFiles);

            // Create previews for images
            files.forEach((file) => {
                if (file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setIdProofPreviews((prev) => [
                            ...prev,
                            { file, preview: reader.result as string },
                        ]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    // For PDFs, just add file without preview
                    setIdProofPreviews((prev) => [
                        ...prev,
                        { file, preview: "" },
                    ]);
                }
            });
        }
        // Reset input to allow selecting same files again
        e.target.value = "";
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
                toast.error("Profile photo must be an image (JPEG, PNG, or WebP)");
                return;
            }

            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size must be less than 10MB");
                return;
            }

            setProfilePhotoFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeIdProof = (index: number) => {
        setIdProofFiles((prev) => prev.filter((_, i) => i !== index));
        setIdProofPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const removeProfilePhoto = () => {
        setProfilePhotoFile(null);
        setProfilePhotoPreview(null);
    };

    // Download KYC details as PDF
    const handleDownloadKYC = async () => {
        if (!kycData) {
            toast.error("No KYC data available to download");
            return;
        }

        try {
            toast.loading("Generating PDF...");
            
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF();
            
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
            const cleanBaseUrl = baseUrl.replace(/\/api$/, "");
            
            let yPosition = 20;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            const contentWidth = pageWidth - 2 * margin;
            
            // Helper function to add text with word wrap
            const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
                pdf.setFontSize(fontSize);
                pdf.setFont("helvetica", isBold ? "bold" : "normal");
                const lines = pdf.splitTextToSize(text, contentWidth);
                lines.forEach((line: string) => {
                    if (yPosition > 270) {
                        pdf.addPage();
                        yPosition = 20;
                    }
                    pdf.text(line, margin, yPosition);
                    yPosition += fontSize * 0.5;
                });
                yPosition += 3;
            };
            
            // Helper function to add image
            const addImage = async (imageUrl: string, label: string) => {
                try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    
                    return new Promise<void>((resolve) => {
                        reader.onloadend = () => {
                            const base64data = reader.result as string;
                            
                            if (yPosition > 200) {
                                pdf.addPage();
                                yPosition = 20;
                            }
                            
                            addText(label, 10, true);
                            
                            try {
                                const imgWidth = 80;
                                const imgHeight = 60;
                                pdf.addImage(base64data, "JPEG", margin, yPosition, imgWidth, imgHeight);
                                yPosition += imgHeight + 10;
                            } catch (err) {
                                console.error("Error adding image:", err);
                                addText(`[Image: ${label}]`, 9);
                            }
                            
                            resolve();
                        };
                        reader.readAsDataURL(blob);
                    });
                } catch (err) {
                    console.error("Error fetching image:", err);
                    addText(`[${label} - Unable to load image]`, 9);
                }
            };
            
            // Title
            addText("STUDENT KYC VERIFICATION DETAILS", 16, true);
            yPosition += 5;
            
            // User Information Section
            addText("User Information", 12, true);
            addText(`User Email: ${user?.email || "N/A"}`);
            addText(`Status: ${kycData.status.toUpperCase()}`);
            addText(`Submitted: ${new Date(kycData.created_at || "").toLocaleString()}`);
            yPosition += 5;
            
            // Personal Information Section
            addText("Personal Information", 12, true);
            addText(`First Name: ${kycData.first_name}`);
            addText(`Last Name: ${kycData.last_name}`);
            addText(`Address: ${kycData.address}`);
            addText(`Contact Number: ${kycData.contact_number}`);
            addText(`WhatsApp Number: ${kycData.whatsapp_number}`);
            yPosition += 5;
            
            // Documents Section
            addText("Documents", 12, true);
            
            // Add ID Proof Image
            if (kycData.id_proof_url) {
                const idProofUrls = Array.isArray(kycData.id_proof_url) 
                    ? kycData.id_proof_url 
                    : [kycData.id_proof_url];
                    
                for (let i = 0; i < idProofUrls.length; i++) {
                    const url = idProofUrls[i];
                    if (!url.endsWith('.pdf')) {
                        await addImage(`${cleanBaseUrl}${url}`, `ID Proof ${i + 1}`);
                    } else {
                        addText(`ID Proof ${i + 1}: ${cleanBaseUrl}${url}`);
                    }
                }
            }
            
            // Add Profile Photo
            if (kycData.profile_photo_url) {
                await addImage(`${cleanBaseUrl}${kycData.profile_photo_url}`, "Profile Photo");
            }
            
            // Business Information (if applicable)
            if ((kycData as any).business_id) {
                yPosition += 5;
                addText("Business Information", 12, true);
                addText(`Business ID: ${(kycData as any).business_id}`);
                if ((kycData as any).business_location_link) {
                    addText(`Business Location: ${(kycData as any).business_location_link}`);
                }
                addText(`Upgraded To Business: ${(kycData as any).upgraded_to_business ? "Yes" : "No"}`);
                
                if ((kycData as any).business_proof_url) {
                    await addImage(`${cleanBaseUrl}${(kycData as any).business_proof_url}`, "Business Proof");
                }
            }
            
            // Rejection Information (if rejected)
            if (kycData.status === "rejected" && kycData.rejection_reason) {
                yPosition += 5;
                addText("Rejection Information", 12, true);
                addText(`Rejection Reason: ${kycData.rejection_reason}`);
            }
            
            // Verification Information (if verified)
            if (kycData.status === "verified" && kycData.verified_at) {
                yPosition += 5;
                addText("Verification Information", 12, true);
                addText(`Verified At: ${new Date(kycData.verified_at).toLocaleString()}`);
            }
            
            // Footer
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            yPosition += 10;
            pdf.setFontSize(8);
            pdf.setTextColor(128);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
            
            // Save PDF
            pdf.save(`Student_KYC_${kycData.first_name}_${kycData.last_name}_${Date.now()}.pdf`);
            
            toast.dismiss();
            toast.success("KYC details downloaded as PDF successfully!");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.dismiss();
            toast.error("Failed to generate PDF. Please try again.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);

        // Validation
        if (
            !formData.first_name ||
            !formData.last_name ||
            !formData.address ||
            !formData.contact_number ||
            !formData.whatsapp_number
        ) {
            toast.error("All fields are required");
            return;
        }

        // Check if files are provided (either new files or existing KYC)
        if (idProofFiles.length === 0 && !kycData?.id_proof_url) {
            toast.error("At least one ID proof image is required");
            return;
        }

        if (!profilePhotoFile && !kycData?.profile_photo_url) {
            toast.error("Profile photo is required");
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

            // Append all ID proof files
            idProofFiles.forEach((file) => {
                formDataToSend.append("id_proof", file);
            });
            if (profilePhotoFile) {
                formDataToSend.append("profile_photo", profilePhotoFile);
            }

            const response = await kycApi.submit(formDataToSend);

            if (response.success) {
                setSuccess(true);
                setKycData(response.data || null);

                // Refresh user profile to get updated user_type
                await refreshProfile();

                // Refresh KYC data
                const kycResponse = await kycApi.getMyKYC();
                if (kycResponse.success && kycResponse.data) {
                    setKycData(kycResponse.data);
                }

                // Show success message
                toast.success("Student KYC submitted successfully! Please review the terms and conditions.");

                // Show terms and conditions modal
                setShowTermsModal(true);
            } else {
                toast.error(
                    response.message ||
                        "Failed to submit KYC. Please try again."
                );
            }
        } catch (err: any) {
            toast.error(
                err.message ||
                    "Failed to submit KYC. Please check your connection and try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleTermsAccept = async () => {
        if (!termsAccepted) return;

        try {
            setSubmitting(true);
            // Call API to accept course terms
            const response = await termsApi.acceptCourseTerms();

            if (response.success) {
                setShowTermsModal(false);
                toast.success("Course terms accepted successfully!");
                // Refresh user profile to get updated course_terms_accepted_at
                await refreshProfile();
                // Redirect after accepting terms
                router.push(redirectPath || "/dashboard");
            } else {
                toast.error(response.message || "Failed to accept terms. Please try again.");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to accept terms. Please try again.");
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center">
                        Student KYC Verification
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Complete your KYC verification to access course features
                    </p>
                </div>
                {kycData && (
                    <button
                        onClick={handleDownloadKYC}
                        className="flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Download KYC Details"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-medium">Download KYC</span>
                    </button>
                )}
            </div>

            {/* Step Indicator */}
            <div className="mb-4">
                <div className="flex items-center justify-center">
                    {/* Step 1 */}
                    <div className="flex items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            kycData && kycData.status === "verified"
                                ? "border-green-500 bg-green-500 text-white"
                                : !kycData || kycData.status === "rejected" 
                                ? "border-[#B00000] bg-[#B00000] text-white" 
                                : "border-yellow-500 bg-yellow-500 text-white"
                        }`}>
                            {kycData && kycData.status === "verified" ? "✓" : "1"}
                        </div>
                        <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">
                                Submit KYC
                            </div>
                            {kycData && kycData.status === "pending" && (
                                <div className="text-xs text-yellow-600">Under Review</div>
                            )}
                        </div>
                    </div>

                    {/* Connector */}
                    <div className={`w-32 h-1 mx-4 ${
                        kycData && kycData.status === "verified" ? "bg-green-500" : "bg-gray-300"
                    }`}></div>

                    {/* Step 2 */}
                    <div className="flex items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            kycData && kycData.status === "verified" && user.course_terms_accepted_at
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-gray-300 bg-white text-gray-400"
                        }`}>
                            {kycData && kycData.status === "verified" && user.course_terms_accepted_at ? "✓" : "2"}
                        </div>
                        <div className="ml-3 text-sm font-medium text-slate-900">
                            Accept Terms
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Banner */}
                    {kycData && (
                        <div
                            className={`mb-4 p-3 rounded-lg ${
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
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <p className="text-sm text-green-800">
                                    KYC information submitted successfully! Your
                                    request is pending admin review.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* KYC Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* First Name */}
                                <div>
                                    <label
                                        htmlFor="first_name"
                                        className="block text-sm font-medium text-slate-700 mb-1"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                        disabled={
                                            kycData?.status === "verified"
                                        }
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label
                                        htmlFor="last_name"
                                        className="block text-sm font-medium text-slate-700 mb-1"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                        disabled={
                                            kycData?.status === "verified"
                                        }
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="mt-4">
                                <label
                                    htmlFor="address"
                                    className="block text-sm font-medium text-slate-700 mb-1"
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
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                    disabled={kycData?.status === "verified"}
                                />
                            </div>

                            {/* Contact Number and WhatsApp Number */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {/* Contact Number */}
                                <div>
                                    <label
                                        htmlFor="contact_number"
                                        className="block text-sm font-medium text-slate-700 mb-1"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                        disabled={kycData?.status === "verified"}
                                    />
                                </div>

                                {/* WhatsApp Number */}
                                <div>
                                    <label
                                        htmlFor="whatsapp_number"
                                        className="block text-sm font-medium text-slate-700 mb-1"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                        disabled={kycData?.status === "verified"}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Document Upload Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">
                                Document Upload
                            </h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* ID Proof Upload */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                        ID Proof Documents <span className="text-red-500">*</span>
                                    </h3>
                                    <p className="text-xs text-slate-600 mb-3">
                                        Upload ID proof (Aadhaar, PAN, Passport, etc.) in JPEG, PNG, WebP, or PDF (Max 10MB per file)
                                    </p>

                                    {idProofPreviews.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                {idProofPreviews.map((previewItem, index) => (
                                                    <div key={index} className="relative">
                                                        {previewItem.file?.type.startsWith("image/") ||
                                                        (previewItem.preview &&
                                                            !previewItem.preview.includes(".pdf")) ? (
                                                            <img
                                                                src={previewItem.preview}
                                                                alt={`ID Proof ${index + 1}`}
                                                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-32 p-4 border border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                                                                <p className="text-center text-xs text-slate-600">
                                                                    PDF File
                                                                </p>
                                                                <p className="text-center text-xs text-slate-500 mt-1 truncate max-w-full px-2">
                                                                    {previewItem.file?.name}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {kycData?.status !== "verified" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeIdProof(index)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {kycData?.status !== "verified" && (
                                                <label
                                                    htmlFor="id_proof_add"
                                                    className="flex items-center justify-center px-3 py-2 bg-white border-2 border-dashed border-[#B00000] rounded-lg cursor-pointer hover:bg-[#B00000] hover:text-white transition-all duration-200 group text-xs"
                                                >
                                                    <Plus className="w-4 h-4 mr-1 text-[#B00000] group-hover:text-white transition-colors" />
                                                    <span className="font-semibold text-[#B00000] group-hover:text-white transition-colors">
                                                        Add More
                                                    </span>
                                                    <input
                                                        id="id_proof_add"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                                        onChange={handleIdProofChange}
                                                        multiple
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="id_proof"
                                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                                kycData?.status === "verified"
                                                    ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                                                    : "border-gray-300 hover:border-[#B00000] hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex flex-col items-center justify-center py-3">
                                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                                <p className="mb-1 text-xs text-gray-500">
                                                    <span className="font-semibold">
                                                        Click to upload
                                                    </span>
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
                                                multiple
                                                disabled={
                                                    kycData?.status === "verified"
                                                }
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Profile Photo Upload */}
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                                        Profile Photo <span className="text-red-500">*</span>
                                    </h3>
                                    <p className="text-xs text-slate-600 mb-3">
                                        Upload your profile photo in JPEG, PNG, or WebP (Max 10MB)
                                    </p>

                                    {profilePhotoPreview ? (
                                        <div className="relative inline-block w-full">
                                            <img
                                                src={profilePhotoPreview}
                                                alt="Profile Photo Preview"
                                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                            />
                                            {kycData?.status !== "verified" && (
                                                <button
                                                    type="button"
                                                    onClick={removeProfilePhoto}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="profile_photo"
                                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                                kycData?.status === "verified"
                                                    ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                                                    : "border-gray-300 hover:border-[#B00000] hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex flex-col items-center justify-center py-3">
                                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                                <p className="mb-1 text-xs text-gray-500">
                                                    <span className="font-semibold">
                                                        Click to upload
                                                    </span>
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
                            </div>
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

            {/* Terms and Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop - non-clickable */}
                    <div className="fixed inset-0 bg-black/50 transition-opacity duration-300"></div>

                    {/* Modal */}
                    <div className="relative min-h-screen flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] my-8 flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    Terms and Conditions
                                </h2>
                                <button
                                    onClick={() => {}}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-not-allowed opacity-50"
                                    disabled
                                    aria-label="Close modal"
                                    title="Please accept terms to continue"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Section 1: Account Usage */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        1. Account Usage
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        1.1 Each user account is strictly for personal use only.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        1.2 Sharing of username, password, login access, videos, files, or study materials is strictly prohibited.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        1.3 The system monitors multiple logins. If repeated unauthorized/multiple logins are detected:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm text-slate-700">
                                        <li>The account will be automatically blocked,</li>
                                        <li>Access will be permanently terminated,</li>
                                        <li>No refund will be provided under any circumstances.</li>
                                    </ul>
                                </div>

                                {/* Section 2: Misuse of Knowledge */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        2. Misuse of Knowledge
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        2.1 The training provided includes topics related to vehicle security systems, ECU programming, odometer calibration, keys, immobilizer systems, etc.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        2.2 Students must not misuse the knowledge for illegal activities, including but not limited to:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm text-slate-700">
                                        <li>Vehicle theft / bypassing security without authorization</li>
                                        <li>Illegal odometer correction</li>
                                        <li>Any activity against the laws of the Government of India</li>
                                    </ul>
                                    <p className="text-sm text-slate-700 mt-2">
                                        2.3 The student is solely responsible for how the knowledge is used. The training provider and website hold no responsibility for misuse.
                                    </p>
                                </div>

                                {/* Section 3: Educational Purpose */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        3. Educational Purpose
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        3.1 The training is provided for educational purposes only.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        3.2 Some demonstrations/theories may be simplified for easy learning.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        3.3 Students are expected to learn, research, and gain in-depth knowledge on their own before doing any real-life work on vehicles.
                                    </p>
                                </div>

                                {/* Section 4: Copyright & Intellectual Property */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        4. Copyright & Intellectual Property
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        4.1 All videos, course materials, lecture notes, downloads, and documents belong to the website and training provider.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        4.2 Recording, screen-capture, broadcasting, reselling, uploading, sharing, or distributing course content is strictly prohibited.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        4.3 Legal action may be taken for copyright violation.
                                    </p>
                                </div>

                                {/* Section 5: Refund & Cancellation */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        5. Refund & Cancellation
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        5.1 Once payment is made and access is granted, no refunds will be issued.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        5.2 Refund is not applicable for account termination caused by rule violations.
                                    </p>
                                </div>

                                {/* Section 6: Liability */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        6. Liability
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        6.1 The student is responsible for safe handling of automotive electronics equipment.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        6.2 The training provider is not liable for any damage to vehicle, tools, property, or injury caused by improper application of knowledge.
                                    </p>
                                </div>

                                {/* Section 7: Account Termination */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        7. Account Termination
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        The training provider reserves the right to terminate access without refund if:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm text-slate-700">
                                        <li>Rules are violated</li>
                                        <li>Misuse or illegal activity is suspected</li>
                                        <li>System detects repeated unauthorized logins or content sharing</li>
                                    </ul>
                                </div>

                                {/* Section 8: Agreement Confirmation */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        8. Agreement Confirmation
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        By creating an account or purchasing a course, the student confirms that they:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm text-slate-700">
                                        <li>Have read and understood this Agreement</li>
                                        <li>Agree to comply with all rules</li>
                                        <li>Accept responsibility for any misuse of knowledge</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Footer - Sticky */}
                            <div className="p-6 border-t border-gray-200 bg-white sticky bottom-0">
                                {/* Agreement Checkbox */}
                                <label className="flex items-start space-x-3 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-1 w-5 h-5 text-[#B00000] border-gray-300 rounded focus:ring-[#B00000] focus:ring-2"
                                    />
                                    <span className="text-sm text-slate-700">
                                        I have read and understood the Terms and Conditions. I agree to comply with all rules and accept responsibility for any misuse of knowledge.
                                    </span>
                                </label>

                                {/* Accept Button */}
                                <button
                                    onClick={handleTermsAccept}
                                    disabled={!termsAccepted || submitting}
                                    className="w-full px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <span>Accept and Continue</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
