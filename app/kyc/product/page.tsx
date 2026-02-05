"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Plus,
    Download,
} from "lucide-react";
import { productKycApi } from "@/lib/api/product-kyc";
import { termsApi } from "@/lib/api/terms";
import { useAuth } from "@/contexts/AuthContext";
import type { ProductKYCVerification } from "@/lib/api/types";
import { toast } from "sonner";

function ProductKYCContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshProfile } = useAuth();
    const redirectPath = searchParams.get("redirect");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [kycData, setKycData] = useState<ProductKYCVerification | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Form fields
    const [formData, setFormData] = useState({
        full_name: "",
        address: "",
        contact_number: "",
        whatsapp_number: "",
    });

    // File states
    const [idProofFiles, setIdProofFiles] = useState<File[]>([]);
    const [idProofPreviews, setIdProofPreviews] = useState<
        Array<{ file: File | null; preview: string }>
    >([]);
    const [businessProofFiles, setBusinessProofFiles] = useState<File[]>([]);
    const [businessProofPreviews, setBusinessProofPreviews] = useState<
        Array<{ file: File | null; preview: string }>
    >([]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    // Fetch existing Product KYC data
    useEffect(() => {
        const fetchProductKYC = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const response = await productKycApi.getMyProductKYC();

                if (response.success && response.data) {
                    setKycData(response.data);
                    setFormData({
                        full_name: response.data.full_name || "",
                        address: response.data.address || "",
                        contact_number: response.data.contact_number || "",
                        whatsapp_number: response.data.whatsapp_number || "",
                    });

                    // Set preview URLs if files exist
                    if (
                        response.data.id_proofs &&
                        response.data.id_proofs.length > 0
                    ) {
                        const baseUrl =
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:5001";
                        const cleanBaseUrl = baseUrl.replace(/\/api$/, "");
                        setIdProofPreviews(
                            response.data.id_proofs.map((url: string) => ({
                                file: null,
                                preview: `${cleanBaseUrl}${url}`,
                            }))
                        );
                    }

                    if (
                        response.data.business_proofs &&
                        response.data.business_proofs.length > 0
                    ) {
                        const baseUrl =
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:5001";
                        const cleanBaseUrl = baseUrl.replace(/\/api$/, "");
                        setBusinessProofPreviews(
                            response.data.business_proofs.map(
                                (url: string) => ({
                                    file: null,
                                    preview: `${cleanBaseUrl}${url}`,
                                })
                            )
                        );
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch Product KYC:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProductKYC();
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

            const newFiles = [...idProofFiles, ...files];
            setIdProofFiles(newFiles);

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
                    setIdProofPreviews((prev) => [
                        ...prev,
                        { file, preview: "" },
                    ]);
                }
            });
        }
        e.target.value = "";
    };

    const handleBusinessProofChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
                "application/pdf",
            ];

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

            const newFiles = [...businessProofFiles, ...files];
            setBusinessProofFiles(newFiles);

            files.forEach((file) => {
                if (file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setBusinessProofPreviews((prev) => [
                            ...prev,
                            { file, preview: reader.result as string },
                        ]);
                    };
                    reader.readAsDataURL(file);
                } else {
                    setBusinessProofPreviews((prev) => [
                        ...prev,
                        { file, preview: "" },
                    ]);
                }
            });
        }
        e.target.value = "";
    };

    const removeIdProof = (index: number) => {
        setIdProofFiles((prev) => prev.filter((_, i) => i !== index));
        setIdProofPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const removeBusinessProof = (index: number) => {
        setBusinessProofFiles((prev) => prev.filter((_, i) => i !== index));
        setBusinessProofPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // Download Product KYC details as PDF
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
            addText("BUSINESS/PRODUCT KYC VERIFICATION DETAILS", 16, true);
            yPosition += 5;
            
            // User Information Section
            addText("User Information", 12, true);
            addText(`User Email: ${user?.email || "N/A"}`);
            addText(`Status: ${kycData.status.toUpperCase()}`);
            addText(`Submitted: ${new Date(kycData.created_at || "").toLocaleString()}`);
            yPosition += 5;
            
            // Personal Information Section
            addText("Personal Information", 12, true);
            addText(`Full Name: ${kycData.full_name}`);
            addText(`Address: ${kycData.address}`);
            addText(`Contact Number: ${kycData.contact_number}`);
            addText(`WhatsApp Number: ${kycData.whatsapp_number}`);
            yPosition += 5;
            
            // ID Proof Documents Section
            addText(`ID Proof Documents (${kycData.id_proofs?.length || 0})`, 12, true);
            if (kycData.id_proofs && kycData.id_proofs.length > 0) {
                for (let i = 0; i < kycData.id_proofs.length; i++) {
                    const url = kycData.id_proofs[i];
                    if (!url.endsWith('.pdf')) {
                        await addImage(`${cleanBaseUrl}${url}`, `ID Proof Document ${i + 1}`);
                    } else {
                        addText(`ID Proof Document ${i + 1}: ${cleanBaseUrl}${url}`);
                    }
                }
            } else {
                addText("No ID proof documents uploaded");
            }
            yPosition += 5;
            
            // Business Proof Documents Section
            addText(`Business Proof Documents (${kycData.business_proofs?.length || 0})`, 12, true);
            if (kycData.business_proofs && kycData.business_proofs.length > 0) {
                for (let i = 0; i < kycData.business_proofs.length; i++) {
                    const url = kycData.business_proofs[i];
                    if (!url.endsWith('.pdf')) {
                        await addImage(`${cleanBaseUrl}${url}`, `Business Proof Document ${i + 1}`);
                    } else {
                        addText(`Business Proof Document ${i + 1}: ${cleanBaseUrl}${url}`);
                    }
                }
            } else {
                addText("No business proof documents uploaded");
            }
            yPosition += 5;
            
            // Rejection Information (if rejected)
            if (kycData.status === "rejected" && kycData.rejection_reason) {
                addText("Rejection Information", 12, true);
                addText(`Rejection Reason: ${kycData.rejection_reason}`);
                yPosition += 5;
            }
            
            // Verification Information (if verified)
            if (kycData.status === "verified" && kycData.verified_at) {
                addText("Verification Information", 12, true);
                addText(`Verified At: ${new Date(kycData.verified_at).toLocaleString()}`);
                yPosition += 5;
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
            pdf.save(`Business_KYC_${kycData.full_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
            
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
            !formData.full_name ||
            !formData.address ||
            !formData.contact_number ||
            !formData.whatsapp_number
        ) {
            toast.error("All fields are required");
            return;
        }

        // Check if files are provided (either new files or existing KYC)
        if (
            idProofFiles.length < 2 &&
            (!kycData?.id_proofs || kycData.id_proofs.length < 2)
        ) {
            toast.error("At least 2 ID proof documents are required");
            return;
        }

        // Check if business proof is provided (REQUIRED)
        if (
            businessProofFiles.length < 1 &&
            (!kycData?.business_proofs || kycData.business_proofs.length < 1)
        ) {
            toast.error("At least 1 Business proof document is required");
            return;
        }

        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("full_name", formData.full_name);
            formDataToSend.append("address", formData.address);
            formDataToSend.append("contact_number", formData.contact_number);
            formDataToSend.append("whatsapp_number", formData.whatsapp_number);

            idProofFiles.forEach((file) => {
                formDataToSend.append("id_proofs", file);
            });

            businessProofFiles.forEach((file) => {
                formDataToSend.append("business_proofs", file);
            });

            const response = await productKycApi.submit(formDataToSend);

            if (response.success) {
                setSuccess(true);
                setKycData(response.data || null);

                // Refresh user profile to get updated user_type
                await refreshProfile();

                // Refresh KYC data
                const kycResponse = await productKycApi.getMyProductKYC();
                if (kycResponse.success && kycResponse.data) {
                    setKycData(kycResponse.data);
                }

                // Show success message
                toast.success(
                    "Business KYC submitted successfully! Please review the terms and conditions."
                );

                // Show product terms and conditions modal
                setShowTermsModal(true);
            } else {
                toast.error(
                    response.message ||
                        "Failed to submit Product KYC. Please try again."
                );
            }
        } catch (err: any) {
            toast.error(
                err.message ||
                    "Failed to submit Product KYC. Please check your connection and try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleTermsAccept = async () => {
        if (!termsAccepted) return;

        try {
            setSubmitting(true);
            // Call API to accept product terms
            const response = await termsApi.acceptProductTerms();

            if (response.success) {
                setShowTermsModal(false);
                toast.success("Product terms accepted successfully!");
                // Refresh user profile to get updated product_terms_accepted_at
                await refreshProfile();
                // Redirect after accepting terms
                router.push(redirectPath || "/shop");
            } else {
                toast.error(
                    response.message ||
                        "Failed to accept terms. Please try again."
                );
            }
        } catch (err: any) {
            toast.error(
                err.message || "Failed to accept terms. Please try again."
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
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        Business KYC Verification
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Complete your Business KYC verification to purchase products
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
            <div className="mb-6">
                <div className="flex items-center justify-center">
                    {/* Step 1 */}
                    <div className="flex items-center">
                        <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                                kycData && kycData.status === "verified"
                                    ? "border-green-500 bg-green-500 text-white"
                                    : !kycData || kycData.status === "rejected"
                                    ? "border-[#B00000] bg-[#B00000] text-white"
                                    : "border-yellow-500 bg-yellow-500 text-white"
                            }`}
                        >
                            {kycData && kycData.status === "verified"
                                ? "✓"
                                : "1"}
                        </div>
                        <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">
                                Submit KYC
                            </div>
                            {kycData && kycData.status === "pending" && (
                                <div className="text-xs text-yellow-600">
                                    Under Review
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Connector */}
                    <div
                        className={`w-32 h-1 mx-4 ${
                            kycData && kycData.status === "verified"
                                ? "bg-green-500"
                                : "bg-gray-300"
                        }`}
                    ></div>

                    {/* Step 2 */}
                    <div className="flex items-center">
                        <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                                kycData &&
                                kycData.status === "verified" &&
                                user.product_terms_accepted_at
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-gray-300 bg-white text-gray-400"
                            }`}
                        >
                            {kycData &&
                            kycData.status === "verified" &&
                            user.product_terms_accepted_at
                                ? "✓"
                                : "2"}
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
                    className={`mb-6 p-3 rounded-lg ${
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
                                <div className="flex items-center justify-between">
                                    <p className="text-green-700 text-sm mt-1">
                                        Your Product KYC has been verified. You
                                        can now purchase products that require
                                        KYC.
                                    </p>
                                    {redirectPath && (
                                        <button
                                            onClick={() =>
                                                router.push(redirectPath)
                                            }
                                            className="ml-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                                        >
                                            Return to Checkout →
                                        </button>
                                    )}
                                </div>
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
                                    Your Product KYC is under review. Please
                                    wait for admin approval.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <p className="text-green-800">
                                Product KYC information submitted successfully!
                                Your request is pending admin review.
                            </p>
                        </div>
                        {redirectPath && (
                            <button
                                onClick={() => router.push(redirectPath)}
                                className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                            >
                                Return to Checkout →
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {/* KYC Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                        Personal Information
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Full Name */}
                        <div>
                            <label
                                htmlFor="full_name"
                                className="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Full Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="full_name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent outline-none"
                                disabled={kycData?.status === "verified"}
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label
                                htmlFor="address"
                                className="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Address <span className="text-red-500">*</span>
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

                        {/* Contact Numbers - Side by Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Contact Number */}
                            <div>
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
                            <div>
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
                    </div>
                </div>

                {/* Document Upload - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ID Proof Upload */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            ID Proof Documents <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-xs text-slate-600 mb-3">
                            Upload at least 2 ID proof documents (Aadhaar, PAN, Passport, Voter ID, etc.)
                        </p>

                    {idProofPreviews.length > 0 ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {idProofPreviews.map((previewItem, index) => (
                                    <div key={index} className="relative">
                                        {previewItem.file?.type.startsWith(
                                            "image/"
                                        ) ||
                                        (previewItem.preview &&
                                            !previewItem.preview.includes(
                                                ".pdf"
                                            )                                        ) ? (
                                            <img
                                                src={previewItem.preview}
                                                alt={`ID Proof ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                            />
                                        ) : (
                                            <div className="w-full h-32 p-4 border border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                                                <p className="text-center text-slate-600">
                                                    PDF File
                                                </p>
                                                <p className="text-center text-sm text-slate-500 mt-2">
                                                    {previewItem.file?.name}
                                                </p>
                                            </div>
                                        )}
                                        {kycData?.status !== "verified" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeIdProof(index)
                                                }
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {kycData?.status !== "verified" && (
                                <div className="flex justify-center">
                                    <label
                                        htmlFor="id_proofs_add"
                                        className="flex items-center justify-center px-6 py-3 bg-white border-2 border-dashed border-[#B00000] rounded-lg cursor-pointer hover:bg-[#B00000] hover:text-white transition-all duration-200 group"
                                    >
                                        <Plus className="w-5 h-5 mr-2 text-[#B00000] group-hover:text-white transition-colors" />
                                        <span className="text-sm font-semibold text-[#B00000] group-hover:text-white transition-colors">
                                            Add More ID Proof Documents
                                        </span>
                                        <input
                                            id="id_proofs_add"
                                            type="file"
                                            className="hidden"
                                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                            onChange={handleIdProofChange}
                                            multiple
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    ) : (
                        <label
                            htmlFor="id_proofs"
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                kycData?.status === "verified"
                                    ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                                    : "border-gray-300 hover:border-[#B00000] hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center py-3">
                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                <p className="mb-1 text-sm text-gray-500">
                                    <span className="font-semibold">
                                        Click to upload
                                    </span>{" "}
                                    or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    Min 2 files - JPEG, PNG, WebP, PDF (10MB max)
                                </p>
                            </div>
                            <input
                                id="id_proofs"
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                onChange={handleIdProofChange}
                                multiple
                                disabled={kycData?.status === "verified"}
                            />
                        </label>
                    )}
                    </div>

                    {/* Business Proof Upload - REQUIRED */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Business Proof Documents <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-xs text-slate-600 mb-3">
                            Upload business proof documents (GST, Shop license, Company registration, etc.)
                        </p>

                    {businessProofPreviews.length > 0 ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {businessProofPreviews.map(
                                    (previewItem, index) => (
                                        <div key={index} className="relative">
                                            {previewItem.file?.type.startsWith(
                                                "image/"
                                            ) ||
                                            (previewItem.preview &&
                                                !previewItem.preview.includes(
                                                    ".pdf"
                                                )                                            ) ? (
                                                <img
                                                    src={previewItem.preview}
                                                    alt={`Business Proof ${
                                                        index + 1
                                                    }`}
                                                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                                />
                                            ) : (
                                                <div className="w-full h-32 p-4 border border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                                                    <p className="text-center text-slate-600">
                                                        PDF File
                                                    </p>
                                                    <p className="text-center text-sm text-slate-500 mt-2">
                                                        {previewItem.file?.name}
                                                    </p>
                                                </div>
                                            )}
                                            {kycData?.status !== "verified" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeBusinessProof(
                                                            index
                                                        )
                                                    }
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>
                            {kycData?.status !== "verified" && (
                                <div className="flex justify-center">
                                    <label
                                        htmlFor="business_proofs_add"
                                        className="flex items-center justify-center px-6 py-3 bg-white border-2 border-dashed border-[#B00000] rounded-lg cursor-pointer hover:bg-[#B00000] hover:text-white transition-all duration-200 group"
                                    >
                                        <Plus className="w-5 h-5 mr-2 text-[#B00000] group-hover:text-white transition-colors" />
                                        <span className="text-sm font-semibold text-[#B00000] group-hover:text-white transition-colors">
                                            Add More Business Documents
                                        </span>
                                        <input
                                            id="business_proofs_add"
                                            type="file"
                                            className="hidden"
                                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                            onChange={handleBusinessProofChange}
                                            multiple
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    ) : (
                        <label
                            htmlFor="business_proofs"
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                kycData?.status === "verified"
                                    ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                                    : "border-gray-300 hover:border-[#B00000] hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center py-3">
                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                <p className="mb-1 text-sm text-gray-500">
                                    <span className="font-semibold">
                                        Click to upload
                                    </span>{" "}
                                    or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    Min 1 file - JPEG, PNG, WebP, PDF (10MB max)
                                </p>
                            </div>
                            <input
                                id="business_proofs"
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                                onChange={handleBusinessProofChange}
                                multiple
                                disabled={kycData?.status === "verified"}
                            />
                        </label>
                    )}
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
                                        ? "Update Product KYC"
                                        : "Submit Product KYC"}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {kycData?.status === "verified" && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => router.push("/shop")}
                            className="px-6 py-3 bg-[#B00000] text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Browse Products
                        </button>
                    </div>
                )}
            </form>

            {/* Product Terms and Conditions Modal */}
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
                                    Product Terms and Conditions
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
                                {/* Section 1: Product Purchase Terms */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        1. Product Purchase and Usage
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        1.1 Products purchased are for
                                        legitimate business use only.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        1.2 All diagnostic tools and equipment
                                        must be used in accordance with local
                                        laws and regulations.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        1.3 The buyer is responsible for
                                        ensuring they have the necessary
                                        licenses and permissions to operate
                                        diagnostic equipment.
                                    </p>
                                </div>

                                {/* Section 2: KYC Verification */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        2. KYC Verification
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        2.1 All provided KYC information must be
                                        accurate and truthful.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        2.2 Providing false or misleading
                                        information may result in order
                                        cancellation and account termination.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        2.3 The company reserves the right to
                                        verify any information provided.
                                    </p>
                                </div>

                                {/* Section 3: Product Usage Restrictions */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        3. Product Usage Restrictions
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        3.1 Products must not be used for
                                        illegal activities, including but not
                                        limited to:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm text-slate-700">
                                        <li>
                                            Vehicle theft or unauthorized access
                                            to vehicle systems
                                        </li>
                                        <li>
                                            Fraudulent odometer manipulation
                                        </li>
                                        <li>
                                            Bypassing vehicle security systems
                                            without proper authorization
                                        </li>
                                        <li>
                                            Any activity that violates the laws
                                            of India
                                        </li>
                                    </ul>
                                    <p className="text-sm text-slate-700 mt-2">
                                        3.2 The buyer accepts full
                                        responsibility for how the products are
                                        used.
                                    </p>
                                </div>

                                {/* Section 4: Warranty and Returns */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        4. Warranty and Returns
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        4.1 Product warranty terms are specified
                                        on the product page and packaging.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        4.2 Returns are subject to our return
                                        policy as stated on the website.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        4.3 Warranty does not cover misuse,
                                        unauthorized modifications, or damage
                                        from improper use.
                                    </p>
                                </div>

                                {/* Section 5: Bulk Orders */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        5. Bulk Orders
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        5.1 Business accounts are eligible for
                                        bulk purchases.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        5.2 Bulk orders may have different
                                        delivery timelines than single-unit
                                        purchases.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        5.3 Special pricing for bulk orders is
                                        at the discretion of the company.
                                    </p>
                                </div>

                                {/* Section 6: Liability */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        6. Liability
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        6.1 The buyer is responsible for safe
                                        handling and operation of all purchased
                                        equipment.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        6.2 The company is not liable for any
                                        damage, injury, or loss resulting from
                                        misuse of products.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        6.3 The buyer indemnifies the company
                                        against any claims arising from their
                                        use of the products.
                                    </p>
                                </div>

                                {/* Section 7: Compliance */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        7. Legal Compliance
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        7.1 The buyer confirms they will use all
                                        products in compliance with applicable
                                        laws.
                                    </p>
                                    <p className="text-sm text-slate-700 mb-2">
                                        7.2 The buyer acknowledges that
                                        automotive diagnostic equipment is
                                        regulated in many jurisdictions.
                                    </p>
                                    <p className="text-sm text-slate-700">
                                        7.3 The company reserves the right to
                                        report suspected illegal activity to
                                        authorities.
                                    </p>
                                </div>

                                {/* Section 8: Agreement Confirmation */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                                        8. Agreement Confirmation
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        By purchasing products, the buyer
                                        confirms that they:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm text-slate-700">
                                        <li>
                                            Have read and understood these
                                            Product Terms & Conditions
                                        </li>
                                        <li>
                                            Agree to use products for legitimate
                                            business purposes only
                                        </li>
                                        <li>
                                            Accept full responsibility for
                                            product usage and compliance
                                        </li>
                                        <li>
                                            Will not engage in illegal
                                            activities using purchased products
                                        </li>
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
                                        onChange={(e) =>
                                            setTermsAccepted(e.target.checked)
                                        }
                                        className="mt-1 w-5 h-5 text-[#B00000] border-gray-300 rounded focus:ring-[#B00000] focus:ring-2"
                                    />
                                    <span className="text-sm text-slate-700">
                                        I have read and understood the Product
                                        Terms and Conditions. I agree to use all
                                        products for legitimate business
                                        purposes only and comply with all
                                        applicable laws and regulations.
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

export default function ProductKYCPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
                </div>
            }
        >
            <ProductKYCContent />
        </Suspense>
    );
}
