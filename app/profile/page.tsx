"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, User, Mail, Calendar, Monitor, Save, X, FileCheck, ExternalLink, Camera, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api/client";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageCropper } from "@/components/ui/ImageCropper";

function formatDate(dateString?: string) {
    if (!dateString) return "Never";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString();
}

type KYCStatus = {
    student_kyc_status: "verified" | "pending" | "rejected" | null;
    business_kyc_status: "verified" | "pending" | "rejected" | null;
};

export default function ProfilePage() {
    const {
        isAuth,
        user,
        loading: authLoading,
        updateUser,
        refreshProfile,
    } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [kycStatus, setKycStatus] = useState<KYCStatus>({
        student_kyc_status: null,
        business_kyc_status: null,
    });

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });

    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const [isDeletingPicture, setIsDeletingPicture] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch KYC status
    const fetchKYCStatus = async () => {
        try {
            // Fetch student KYC status
            const studentKycResponse = await apiClient.get("/kyc/status");
            const studentKycData = studentKycResponse.data;

            // Fetch business KYC status
            const businessKycResponse = await apiClient.get("/product-kyc/status");
            const businessKycData = businessKycResponse.data;

            setKycStatus({
                student_kyc_status: studentKycData?.status || null,
                business_kyc_status: businessKycData?.status || null,
            });
        } catch (error) {
            // Silently fail - user might not have submitted KYC yet
            console.log("KYC status fetch error (expected if not submitted):", error);
        }
    };

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
            // Fetch KYC status
            fetchKYCStatus();
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

    const handleProfilePictureClick = () => {
        fileInputRef.current?.click();
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file");
            return;
        }

        // Validate file size (max 10MB before cropping)
        if (file.size > 10 * 1024 * 1024) {
            setError("Image size should be less than 10MB");
            return;
        }

        // Read file and show cropper
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        try {
            setShowCropper(false);
            setIsUploadingPicture(true);
            setError(null);
            setSuccess(null);

            const formData = new FormData();
            formData.append("profile_picture", croppedImageBlob, "profile-picture.jpg");
            formData.append("type", "images");

            const response = await apiClient.post("/users/profile/picture", formData);

            if (response.data.success) {
                await refreshProfile();
                setSuccess("Profile picture updated successfully");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to upload profile picture");
        } finally {
            setIsUploadingPicture(false);
            setSelectedImage(null);
        }
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setSelectedImage(null);
    };

    const handleDeleteProfilePicture = async () => {
        if (!confirm("Are you sure you want to delete your profile picture?")) {
            return;
        }

        try {
            setIsDeletingPicture(true);
            setError(null);
            setSuccess(null);

            const response = await apiClient.delete("/users/profile/picture");

            if (response.data.success) {
                await refreshProfile();
                setSuccess("Profile picture deleted successfully");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete profile picture");
        } finally {
            setIsDeletingPicture(false);
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
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                    {/* Profile Picture */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">
                            Profile Picture
                        </h2>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                    {user?.profile_picture ? (
                                        <Image
                                            src={user.profile_picture}
                                            alt="Profile"
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {isUploadingPicture && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePictureChange}
                                    className="hidden"
                                />
                                <button
                                    onClick={handleProfilePictureClick}
                                    disabled={isUploadingPicture || isDeletingPicture}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#B00000] text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    <Camera className="w-4 h-4" />
                                    {user?.profile_picture ? "Change Picture" : "Upload Picture"}
                                </button>
                                {user?.profile_picture && (
                                    <button
                                        onClick={handleDeleteProfilePicture}
                                        disabled={isUploadingPicture || isDeletingPicture}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        {isDeletingPicture ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Remove Picture
                                            </>
                                        )}
                                    </button>
                                )}
                                <p className="text-xs text-gray-500">
                                    Upload any image and crop it to a perfect square (max 10MB)
                                </p>
                            </div>
                        </div>
                    </div>

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
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">
                                        User Type
                                    </span>
                                </div>
                                {user?.user_type ? (
                                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                                        {user.user_type.replace('_', ' ')}
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-500 italic">
                                        Not set
                                    </span>
                                )}
                            </div>

                            {/* KYC Details Button - Show only if verified */}
                            {user?.user_type === "student" && kycStatus.student_kyc_status === "verified" && (
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Student KYC
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => router.push("/kyc")}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            Verified
                                        </span>
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {user?.user_type === "business_owner" && kycStatus.business_kyc_status === "verified" && (
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="w-5 h-5 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Business KYC
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => router.push("/kyc/product")}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            Verified
                                        </span>
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

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

            {/* Image Cropper Modal */}
            {showCropper && selectedImage && (
                <ImageCropper
                    imageSrc={selectedImage}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    aspectRatio={1} // Square aspect ratio for profile pictures
                />
            )}
        </div>
    );
}
