"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    Users,
    BookOpen,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    UserCheck,
    UserX,
    Loader2,
    Plus,
    Edit2,
    Trash2,
    X,
    Save,
    ChevronDown,
    ChevronUp,
    Play,
    Monitor,
    Smartphone,
    Tablet,
    Globe,
    Calendar,
} from "lucide-react";

// Dynamically import markdown editor to avoid SSR issues
const MDEditor = dynamic(
    () => import("@uiw/react-md-editor").then((mod) => mod.default),
    { ssr: false }
);
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api/admin";
import { requestsApi } from "@/lib/api/requests";
import { coursesApi } from "@/lib/api/courses";
import { blogsApi } from "@/lib/api/blogs";
import { uploadsApi } from "@/lib/api/uploads";
import { kycApi } from "@/lib/api/kyc";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { RequestsTab } from "@/components/admin/RequestsTab";
import { CoursesTab } from "@/components/admin/CoursesTab";
import { BlogsTab } from "@/components/admin/BlogsTab";
import { KYCTab } from "@/components/admin/KYCTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { KYCModal } from "@/components/admin/KYCModal";
import { GrantAccessModal } from "@/components/admin/GrantAccessModal";
import { formatDate, generateSlug } from "@/components/admin/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type {
    DashboardStats,
    User,
    CourseRequest,
    Course,
    Video,
    BlogPost,
    KYCVerification,
} from "@/lib/api/types";

export default function AdminPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuth } = useAuth();

    const [activeTab, setActiveTab] = useState<
        | "dashboard"
        | "users"
        | "requests"
        | "courses"
        | "blogs"
        | "kyc"
        | "products"
        | "orders"
    >("dashboard");
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [requests, setRequests] = useState<CourseRequest[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [kycApplications, setKycApplications] = useState<KYCVerification[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // User modal states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userFormData, setUserFormData] = useState({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "user" as "user" | "admin",
    });
    const [isSubmittingUser, setIsSubmittingUser] = useState(false);
    const [userFormSuccess, setUserFormSuccess] = useState<string | null>(null);

    // Delete confirmation modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Login details modal states
    const [isLoginDetailsModalOpen, setIsLoginDetailsModalOpen] =
        useState(false);
    const [loginDetails, setLoginDetails] = useState<{
        user: User;
        sessions: any[];
        active_sessions_count: number;
        total_sessions_count: number;
    } | null>(null);
    const [loadingLoginDetails, setLoadingLoginDetails] = useState(false);

    // Course modal states
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [courseFormData, setCourseFormData] = useState({
        name: "",
        slug: "",
        description: "",
        price: 0,
        cover_image: null as File | null,
    });
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
        null
    );
    const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
    const [courseFormSuccess, setCourseFormSuccess] = useState<string | null>(
        null
    );

    // Blog modal states
    const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
    const [blogFormData, setBlogFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        cover_image: "",
        is_published: false,
    });
    const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);
    const [blogFormSuccess, setBlogFormSuccess] = useState<string | null>(null);
    const [blogDeleteModal, setBlogDeleteModal] = useState<{
        isOpen: boolean;
        blog: BlogPost | null;
    }>({ isOpen: false, blog: null });
    const [isDeletingBlog, setIsDeletingBlog] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingDocument, setUploadingDocument] = useState(false);

    // Course delete confirmation modal states
    const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] =
        useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
    const [isDeletingCourse, setIsDeletingCourse] = useState(false);
    const [deleteCourseSuccess, setDeleteCourseSuccess] = useState<
        string | null
    >(null);
    const [deleteCourseError, setDeleteCourseError] = useState<string | null>(
        null
    );

    // Video management modal states
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [videoFormData, setVideoFormData] = useState({
        title: "",
        video_url: "",
        description: "",
        order_index: 0,
        pdfs: [] as { name: string; url: string }[],
        markdown: "",
    });
    const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
    const [videoFormSuccess, setVideoFormSuccess] = useState<string | null>(
        null
    );

    // Video delete confirmation modal states
    const [isDeleteVideoModalOpen, setIsDeleteVideoModalOpen] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
    const [isDeletingVideo, setIsDeletingVideo] = useState(false);
    const [deleteVideoSuccess, setDeleteVideoSuccess] = useState<string | null>(
        null
    );
    const [deleteVideoError, setDeleteVideoError] = useState<string | null>(
        null
    );

    // Expanded course videos state
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(
        null
    );
    const [courseVideosMap, setCourseVideosMap] = useState<{
        [key: string]: Video[];
    }>({});
    const [loadingCourseVideos, setLoadingCourseVideos] = useState<
        string | null
    >(null);

    // KYC modal states
    const [isKycModalOpen, setIsKycModalOpen] = useState(false);
    const [selectedKyc, setSelectedKyc] = useState<KYCVerification | null>(
        null
    );
    const [isProcessingKyc, setIsProcessingKyc] = useState(false);
    const [kycAction, setKycAction] = useState<"verify" | "reject" | null>(
        null
    );
    const [rejectionReason, setRejectionReason] = useState("");
    const [kycSuccess, setKycSuccess] = useState<string | null>(null);
    const [kycError, setKycError] = useState<string | null>(null);

    // Check admin access
    useEffect(() => {
        if (!authLoading) {
            if (!isAuth || user?.role !== "admin") {
                router.push("/");
                return;
            }
            fetchData();
        }
    }, [authLoading, isAuth, user, router]);

    const fetchData = async () => {
        // Products/Orders tabs manage their own fetching to keep this page stable
        if (activeTab === "products" || activeTab === "orders") {
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (activeTab === "dashboard") {
                const statsResponse = await adminApi.getDashboardStats();
                if (statsResponse.success && statsResponse.data) {
                    setStats(statsResponse.data);
                }
            } else if (activeTab === "users") {
                const usersResponse = await adminApi.getAllUsers(1, 50);
                if (usersResponse.success && usersResponse.data) {
                    // Backend returns { users: [], pagination: {} }
                    const usersData = usersResponse.data;
                    if (usersData.users && Array.isArray(usersData.users)) {
                        setUsers(usersData.users);
                    } else if (Array.isArray(usersData as any)) {
                        // Fallback: if it's already an array
                        setUsers(usersData as any);
                    }
                }
            } else if (activeTab === "requests") {
                const requestsResponse = await adminApi.getAllRequests(1, 50);
                if (requestsResponse.success && requestsResponse.data) {
                    // Backend returns { requests: [], pagination: {} }
                    const requestsData = requestsResponse.data;
                    if (
                        requestsData.requests &&
                        Array.isArray(requestsData.requests)
                    ) {
                        setRequests(requestsData.requests);
                    } else if (Array.isArray(requestsData as any)) {
                        // Fallback: if it's already an array
                        setRequests(requestsData as any);
                    }
                }
            } else if (activeTab === "courses") {
                const coursesResponse = await coursesApi.getAll();
                if (coursesResponse.success && coursesResponse.data) {
                    setCourses(
                        Array.isArray(coursesResponse.data)
                            ? coursesResponse.data
                            : []
                    );
                }
            } else if (activeTab === "blogs") {
                const blogsResponse = await blogsApi.getAllAdmin();
                if (blogsResponse.success && blogsResponse.data) {
                    setBlogPosts(
                        Array.isArray(blogsResponse.data.data)
                            ? blogsResponse.data.data
                            : []
                    );
                }
            } else if (activeTab === "kyc") {
                const kycResponse = await kycApi.getAll({ page: 1, limit: 50 });
                if (kycResponse.success && kycResponse.data) {
                    const kycData = kycResponse.data;
                    if (
                        kycData.kyc_verifications &&
                        Array.isArray(kycData.kyc_verifications)
                    ) {
                        setKycApplications(kycData.kyc_verifications);
                    } else if (Array.isArray(kycData as any)) {
                        setKycApplications(kycData as any);
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuth && user?.role === "admin") {
            fetchData();
        }
    }, [activeTab]);

    // Request approval/rejection modal states
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] =
        useState<CourseRequest | null>(null);
    const [isProcessingRequest, setIsProcessingRequest] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [accessStartDate, setAccessStartDate] = useState<string>("");
    const [accessEndDate, setAccessEndDate] = useState<string>("");

    // Grant access modal states
    const [showGrantAccessModal, setShowGrantAccessModal] = useState(false);
    const [selectedCourseForGrant, setSelectedCourseForGrant] =
        useState<Course | null>(null);

    const handleApproveRequestClick = (request: CourseRequest) => {
        setSelectedRequest(request);
        setRequestError(null);
        setRequestSuccess(null);

        // Set default dates: start = today, end = 6 months from today
        const today = new Date();
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

        // Format dates as ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
        setAccessStartDate(
            today.toISOString().split("T")[0] + "T00:00:00.000Z"
        );
        setAccessEndDate(
            sixMonthsLater.toISOString().split("T")[0] + "T23:59:59.999Z"
        );

        setShowApproveModal(true);
    };

    const handleRejectRequestClick = (request: CourseRequest) => {
        setSelectedRequest(request);
        setRequestError(null);
        setRequestSuccess(null);
        setShowRejectModal(true);
    };

    const handleGrantAccessClick = (course: Course) => {
        setSelectedCourseForGrant(course);
        setShowGrantAccessModal(true);
    };

    const handleGrantAccessSuccess = async () => {
        // Refresh courses data if needed
        await fetchData();
    };

    const handleApproveRequest = async () => {
        if (!selectedRequest) return;

        // Validate dates
        if (!accessStartDate || !accessEndDate) {
            setRequestError("Please select both start and end dates");
            return;
        }

        const startDate = new Date(accessStartDate);
        const endDate = new Date(accessEndDate);

        if (endDate <= startDate) {
            setRequestError("End date must be after start date");
            return;
        }

        setIsProcessingRequest(true);
        setRequestError(null);
        setRequestSuccess(null);

        try {
            // Convert dates to ISO 8601 format
            const accessStart = new Date(accessStartDate).toISOString();
            const accessEnd = new Date(accessEndDate).toISOString();

            const response = await requestsApi.approve(selectedRequest.id, {
                access_start: accessStart,
                access_end: accessEnd,
            });

            if (response.success) {
                setRequestSuccess("Request approved successfully!");
                // Refresh requests and close modal after 1.5 seconds
                await fetchData();
                setTimeout(() => {
                    setShowApproveModal(false);
                    setSelectedRequest(null);
                    setRequestSuccess(null);
                    setRequestError(null);
                    setAccessStartDate("");
                    setAccessEndDate("");
                }, 1500);
            } else {
                const errorMsg =
                    (response as any).message || "Failed to approve request";
                const errors = (response as any).errors;
                if (errors && Array.isArray(errors)) {
                    const errorMessages = errors
                        .map((e: any) => e.msg)
                        .join(", ");
                    setRequestError(errorMessages || errorMsg);
                } else {
                    setRequestError(errorMsg);
                }
            }
        } catch (err: any) {
            const errorMsg = err.message || "Failed to approve request";
            if (
                err.response?.data?.errors &&
                Array.isArray(err.response.data.errors)
            ) {
                const errorMessages = err.response.data.errors
                    .map((e: any) => e.msg)
                    .join(", ");
                setRequestError(errorMessages || errorMsg);
            } else {
                setRequestError(errorMsg);
            }
        } finally {
            setIsProcessingRequest(false);
        }
    };

    const handleRejectRequest = async () => {
        if (!selectedRequest) return;

        setIsProcessingRequest(true);
        setRequestError(null);
        setRequestSuccess(null);

        try {
            const response = await requestsApi.reject(selectedRequest.id);

            if (response.success) {
                setRequestSuccess("Request rejected successfully!");
                // Refresh requests and close modal after 1.5 seconds
                await fetchData();
                setTimeout(() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setRequestSuccess(null);
                    setRequestError(null);
                }, 1500);
            } else {
                setRequestError(
                    (response as any).message || "Failed to reject request"
                );
            }
        } catch (err: any) {
            setRequestError(err.message || "Failed to reject request");
        } finally {
            setIsProcessingRequest(false);
        }
    };

    // KYC handlers
    const handleViewKyc = async (kyc: KYCVerification) => {
        try {
            const response = await kycApi.getById(kyc.id);
            if (response.success && response.data) {
                setSelectedKyc(response.data);
                setIsKycModalOpen(true);
                setKycAction(null);
                setRejectionReason("");
                setKycError(null);
                setKycSuccess(null);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load KYC details");
        }
    };

    const handleVerifyKyc = (kyc: KYCVerification) => {
        setSelectedKyc(kyc);
        setKycAction("verify");
        setRejectionReason("");
        setKycError(null);
        setKycSuccess(null);
        setIsKycModalOpen(true);
    };

    const handleRejectKyc = (kyc: KYCVerification) => {
        setSelectedKyc(kyc);
        setKycAction("reject");
        setRejectionReason("");
        setKycError(null);
        setKycSuccess(null);
        setIsKycModalOpen(true);
    };

    const handleKycAction = async () => {
        if (!selectedKyc || !kycAction) return;

        if (kycAction === "reject" && !rejectionReason.trim()) {
            setKycError("Rejection reason is required");
            return;
        }

        setIsProcessingKyc(true);
        setKycError(null);
        setKycSuccess(null);

        try {
            const response = await kycApi.verify(selectedKyc.id, {
                status: kycAction === "verify" ? "verified" : "rejected",
                rejection_reason:
                    kycAction === "reject" ? rejectionReason : undefined,
            });

            if (response.success) {
                setKycSuccess(
                    `KYC ${
                        kycAction === "verify" ? "verified" : "rejected"
                    } successfully!`
                );
                // Refresh KYC list and close modal after 1.5 seconds
                await fetchData();
                setTimeout(() => {
                    setIsKycModalOpen(false);
                    setSelectedKyc(null);
                    setKycAction(null);
                    setRejectionReason("");
                    setKycSuccess(null);
                    setKycError(null);
                }, 1500);
            } else {
                setKycError(
                    (response as any).message || `Failed to ${kycAction} KYC`
                );
            }
        } catch (err: any) {
            setKycError(err.message || `Failed to ${kycAction} KYC`);
        } finally {
            setIsProcessingKyc(false);
        }
    };

    // User management handlers
    const handleAddUser = () => {
        setEditingUser(null);
        setUserFormData({
            email: "",
            password: "",
            first_name: "",
            last_name: "",
            role: "user",
        });
        setError(null);
        setUserFormSuccess(null);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserFormData({
            email: user.email || "",
            password: "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            role: (user.role as "user" | "admin") || "user",
        });
        setError(null);
        setUserFormSuccess(null);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = (user: User) => {
        setUserToDelete(user);
        setDeleteError(null);
        setDeleteSuccess(null);
        setIsDeleteModalOpen(true);
    };

    const handleViewLoginDetails = async (user: User) => {
        setLoadingLoginDetails(true);
        setLoginDetails(null);
        setIsLoginDetailsModalOpen(true);

        try {
            const response = await adminApi.getUserLoginDetails(user.id);
            if (response.success && response.data) {
                setLoginDetails(response.data);
            } else {
                setError("Failed to load login details");
            }
        } catch (err: any) {
            setError(err.message || "Failed to load login details");
        } finally {
            setLoadingLoginDetails(false);
        }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        setDeleteError(null);
        setDeleteSuccess(null);

        try {
            const response = await adminApi.deleteUser(userToDelete.id);
            if (response.success) {
                setDeleteSuccess("User deleted successfully!");
                // Refresh users list
                await fetchData();
                // Close modal after 1.5 seconds
                setTimeout(() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                    setDeleteSuccess(null);
                    setDeleteError(null);
                }, 1500);
            }
        } catch (err: any) {
            setDeleteError(err.message || "Failed to delete user");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUserFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingUser(true);
        setError(null);
        setUserFormSuccess(null);

        try {
            if (editingUser) {
                // Update existing user
                const updateData: any = {
                    first_name: userFormData.first_name,
                    last_name: userFormData.last_name,
                    role: userFormData.role,
                };
                if (userFormData.email !== editingUser.email) {
                    updateData.email = userFormData.email;
                }
                if (userFormData.password) {
                    updateData.password = userFormData.password;
                }

                const response = await adminApi.updateUser(
                    editingUser.id,
                    updateData
                );
                if (response.success) {
                    setUserFormSuccess("User updated successfully!");
                    // Refresh users list
                    await fetchData();
                    // Close modal after 1.5 seconds
                    setTimeout(() => {
                        setIsUserModalOpen(false);
                        setUserFormSuccess(null);
                        setError(null);
                    }, 1500);
                }
            } else {
                // Create new user
                if (!userFormData.password) {
                    setError("Password is required for new users");
                    setIsSubmittingUser(false);
                    return;
                }

                const response = await adminApi.createUser({
                    email: userFormData.email,
                    password: userFormData.password,
                    first_name: userFormData.first_name,
                    last_name: userFormData.last_name,
                    role: userFormData.role,
                });

                if (response.success) {
                    setUserFormSuccess("User created successfully!");
                    // Refresh users list
                    await fetchData();
                    // Close modal after 1.5 seconds
                    setTimeout(() => {
                        setIsUserModalOpen(false);
                        setUserFormSuccess(null);
                        setError(null);
                        // Reset form
                        setUserFormData({
                            email: "",
                            password: "",
                            first_name: "",
                            last_name: "",
                            role: "user",
                        });
                    }, 1500);
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to save user");
            setUserFormSuccess(null);
        } finally {
            setIsSubmittingUser(false);
        }
    };

    // Course management handlers
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleAddCourse = () => {
        setEditingCourse(null);
        setCourseFormData({
            name: "",
            slug: "",
            description: "",
            price: 0,
            cover_image: null,
        });
        setCoverImagePreview(null);
        setError(null);
        setCourseFormSuccess(null);
        setIsCourseModalOpen(true);
    };

    const handleEditCourse = (course: Course) => {
        setEditingCourse(course);
        setCourseFormData({
            name: course.name || "",
            slug: course.slug || "",
            description: course.description || "",
            price: course.price || 0,
            cover_image: null,
        });
        setCoverImagePreview(course.cover_image || null);
        setError(null);
        setCourseFormSuccess(null);
        setIsCourseModalOpen(true);
    };

    const handleDeleteCourse = (course: Course) => {
        setCourseToDelete(course);
        setDeleteCourseError(null);
        setDeleteCourseSuccess(null);
        setIsDeleteCourseModalOpen(true);
    };

    const confirmDeleteCourse = async () => {
        if (!courseToDelete) return;

        setIsDeletingCourse(true);
        setDeleteCourseError(null);
        setDeleteCourseSuccess(null);

        try {
            const response = await coursesApi.delete(courseToDelete.id);
            if (response.success) {
                setDeleteCourseSuccess("Course deleted successfully!");
                // Refresh courses list
                await fetchData();
                // Close modal after 1.5 seconds
                setTimeout(() => {
                    setIsDeleteCourseModalOpen(false);
                    setCourseToDelete(null);
                    setDeleteCourseSuccess(null);
                    setDeleteCourseError(null);
                }, 1500);
            }
        } catch (err: any) {
            setDeleteCourseError(err.message || "Failed to delete course");
        } finally {
            setIsDeletingCourse(false);
        }
    };

    const handleCourseFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingCourse(true);
        setError(null);
        setCourseFormSuccess(null);

        try {
            // Auto-generate slug if not provided
            const slug =
                courseFormData.slug || generateSlug(courseFormData.name);

            if (editingCourse) {
                // For updates, we'll use the existing approach (URL or upload separately)
                // If a new file was selected, upload it first
                let coverImageUrl = coverImagePreview;
                if (courseFormData.cover_image) {
                    const uploadResponse = await uploadsApi.uploadSingle(
                        courseFormData.cover_image,
                        "images"
                    );
                    if (uploadResponse.success && uploadResponse.data) {
                        coverImageUrl = uploadResponse.data.url;
                    }
                }

                // Update existing course
                const response = await coursesApi.update(editingCourse.id, {
                    name: courseFormData.name,
                    slug: slug,
                    description: courseFormData.description,
                    price: parseFloat(courseFormData.price.toString()),
                    cover_image: coverImageUrl || undefined,
                });

                if (response.success) {
                    setCourseFormSuccess("Course updated successfully!");
                    // Refresh courses list
                    await fetchData();
                    // Close modal after 1.5 seconds
                    setTimeout(() => {
                        setIsCourseModalOpen(false);
                        setCourseFormSuccess(null);
                        setError(null);
                    }, 1500);
                }
            } else {
                // Create new course - send as JSON with base64 encoded image
                let coverImageBase64 = null;

                // Convert image file to base64 if provided
                if (courseFormData.cover_image) {
                    try {
                        coverImageBase64 = await new Promise<string>(
                            (resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    if (typeof reader.result === "string") {
                                        resolve(reader.result);
                                    } else {
                                        reject(
                                            new Error("Failed to read file")
                                        );
                                    }
                                };
                                reader.onerror = reject;
                                reader.readAsDataURL(
                                    courseFormData.cover_image!
                                );
                            }
                        );
                    } catch (error) {
                        throw new Error("Failed to process image file");
                    }
                }

                // Create course with JSON payload (includes base64 encoded image)
                const payload: any = {
                    name: courseFormData.name,
                    slug: slug,
                    description: courseFormData.description || "",
                    price: parseFloat(courseFormData.price.toString()),
                };

                if (coverImageBase64) {
                    payload.cover_image = coverImageBase64;
                }

                const response = await coursesApi.create(payload);

                if (response.success) {
                    setCourseFormSuccess("Course created successfully!");
                    // Refresh courses list
                    await fetchData();
                    // Close modal after 1.5 seconds
                    setTimeout(() => {
                        setIsCourseModalOpen(false);
                        setCourseFormSuccess(null);
                        setError(null);
                        // Reset form
                        setCourseFormData({
                            name: "",
                            slug: "",
                            description: "",
                            price: 0,
                            cover_image: null,
                        });
                        setCoverImagePreview(null);
                    }, 1500);
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to save course");
            setCourseFormSuccess(null);
        } finally {
            setIsSubmittingCourse(false);
        }
    };

    // Blog handlers
    const handleAddBlog = () => {
        setEditingBlog(null);
        setBlogFormData({
            title: "",
            excerpt: "",
            content: "",
            cover_image: "",
            is_published: false,
        });
        setError(null);
        setBlogFormSuccess(null);
        setIsBlogModalOpen(true);
    };

    const handleEditBlog = (blog: BlogPost) => {
        setEditingBlog(blog);
        setBlogFormData({
            title: blog.title || "",
            excerpt: blog.excerpt || "",
            content: blog.content || "",
            cover_image: blog.cover_image || "",
            is_published: blog.is_published || false,
        });
        setError(null);
        setBlogFormSuccess(null);
        setIsBlogModalOpen(true);
    };

    const handleDeleteBlog = (blog: BlogPost) => {
        setBlogDeleteModal({ isOpen: true, blog });
    };

    const confirmDeleteBlog = async () => {
        if (!blogDeleteModal.blog) return;

        setIsDeletingBlog(true);
        setError(null);

        try {
            const response = await blogsApi.delete(blogDeleteModal.blog.id);
            if (response.success) {
                // Refresh blog posts list
                await fetchData();
                // Close modal
                setBlogDeleteModal({ isOpen: false, blog: null });
            }
        } catch (err: any) {
            setError(err.message || "Failed to delete blog post");
        } finally {
            setIsDeletingBlog(false);
        }
    };

    const handleBlogFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingBlog(true);
        setError(null);
        setBlogFormSuccess(null);

        try {
            if (editingBlog) {
                // Update existing blog post
                const response = await blogsApi.update(
                    editingBlog.id,
                    blogFormData
                );
                if (response.success) {
                    setBlogFormSuccess("Blog post updated successfully!");
                    await fetchData();
                    setTimeout(() => {
                        setIsBlogModalOpen(false);
                        setBlogFormSuccess(null);
                        setError(null);
                        setBlogFormData({
                            title: "",
                            excerpt: "",
                            content: "",
                            cover_image: "",
                            is_published: false,
                        });
                    }, 1500);
                }
            } else {
                // Create new blog post
                const response = await blogsApi.create(blogFormData);
                if (response.success) {
                    setBlogFormSuccess("Blog post created successfully!");
                    await fetchData();
                    setTimeout(() => {
                        setIsBlogModalOpen(false);
                        setBlogFormSuccess(null);
                        setError(null);
                        setBlogFormData({
                            title: "",
                            excerpt: "",
                            content: "",
                            cover_image: "",
                            is_published: false,
                        });
                    }, 1500);
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to save blog post");
            setBlogFormSuccess(null);
        } finally {
            setIsSubmittingBlog(false);
        }
    };

    // Handle image upload for markdown editor
    // Handle image upload (single)
    const handleImageUpload = async (file: File): Promise<string> => {
        try {
            setUploadingImage(true);
            const response = await uploadsApi.uploadSingle(file, "blog");
            if (response.success && response.data) {
                return response.data.url;
            }
            throw new Error("Failed to upload image");
        } catch (error: any) {
            console.error("Image upload error:", error);
            setError(error.message || "Failed to upload image");
            throw error;
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle multiple image uploads
    const handleMultipleImageUpload = async (
        files: File[]
    ): Promise<string[]> => {
        try {
            setUploadingImage(true);

            // Verify all files are valid File objects
            const validFiles = files.filter((file) => file instanceof File);
            if (validFiles.length !== files.length) {
                throw new Error("Some files are invalid");
            }

            // Verify files have content
            for (const file of validFiles) {
                if (file.size === 0) {
                    throw new Error(`File ${file.name} is empty`);
                }
            }

            const response = await uploadsApi.uploadMultiple(
                validFiles,
                "blog"
            );
            if (response.success && response.data) {
                return response.data.map((file) => file.url);
            }
            throw new Error("Failed to upload images");
        } catch (error: any) {
            console.error("Image upload error:", error);
            setError(error.message || "Failed to upload images");
            throw error;
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle document upload (single)
    const handleDocumentUpload = async (file: File): Promise<string> => {
        try {
            setUploadingDocument(true);
            const response = await uploadsApi.uploadSingle(file, "documents");
            if (response.success && response.data) {
                return response.data.url;
            }
            throw new Error("Failed to upload document");
        } catch (error: any) {
            console.error("Document upload error:", error);
            setError(error.message || "Failed to upload document");
            throw error;
        } finally {
            setUploadingDocument(false);
        }
    };

    // Handle multiple document uploads
    const handleMultipleDocumentUpload = async (
        files: File[]
    ): Promise<string[]> => {
        try {
            setUploadingDocument(true);

            // Verify all files are valid File objects
            const validFiles = files.filter((file) => file instanceof File);
            if (validFiles.length !== files.length) {
                throw new Error("Some files are invalid");
            }

            // Verify files have content
            for (const file of validFiles) {
                if (file.size === 0) {
                    throw new Error(`File ${file.name} is empty`);
                }
            }

            const response = await uploadsApi.uploadMultiple(
                validFiles,
                "documents"
            );
            if (response.success && response.data) {
                return response.data.map((file) => file.url);
            }
            throw new Error("Failed to upload documents");
        } catch (error: any) {
            console.error("Document upload error:", error);
            setError(error.message || "Failed to upload documents");
            throw error;
        } finally {
            setUploadingDocument(false);
        }
    };

    // Toggle course videos list
    const toggleCourseVideos = async (courseId: string) => {
        if (expandedCourseId === courseId) {
            setExpandedCourseId(null);
        } else {
            setExpandedCourseId(courseId);
            // Always fetch fresh videos when expanding
            setLoadingCourseVideos(courseId);
            try {
                const response = await coursesApi.getVideos(courseId);
                if (response.success && response.data) {
                    // Handle both array response and object with videos array
                    let videosList: Video[] = [];
                    if (Array.isArray(response.data)) {
                        videosList = response.data;
                    } else if (
                        response.data &&
                        typeof response.data === "object"
                    ) {
                        // Backend returns { course: {...}, videos: [...] }
                        if (
                            "videos" in response.data &&
                            Array.isArray((response.data as any).videos)
                        ) {
                            videosList = (response.data as any).videos;
                        } else if (Array.isArray(response.data)) {
                            videosList = response.data;
                        }
                    }
                    setCourseVideosMap({
                        ...courseVideosMap,
                        [courseId]: videosList,
                    });
                }
            } catch (err: any) {
                console.error("Failed to fetch videos:", err);
                setError(err.message || "Failed to fetch videos");
            } finally {
                setLoadingCourseVideos(null);
            }
        }
    };

    // Video management handlers
    const handleManageVideos = async (course: Course) => {
        setSelectedCourse(course);
        setEditingVideo(null);
        setVideoFormData({
            title: "",
            video_url: "",
            description: "",
            order_index: 0,
            pdfs: [],
            markdown: "",
        });
        setError(null);
        setVideoFormSuccess(null);
        setIsVideoModalOpen(true);
        await fetchVideos(course.id);
    };

    const fetchVideos = async (courseId: string) => {
        setLoadingVideos(true);
        setError(null);
        try {
            const response = await coursesApi.getVideos(courseId);
            if (response.success && response.data) {
                // Handle both array response and object with videos array
                let videosList: Video[] = [];
                if (Array.isArray(response.data)) {
                    videosList = response.data;
                } else if (response.data && typeof response.data === "object") {
                    // Backend returns { course: {...}, videos: [...] }
                    if (
                        "videos" in response.data &&
                        Array.isArray((response.data as any).videos)
                    ) {
                        videosList = (response.data as any).videos;
                    } else if (Array.isArray(response.data)) {
                        videosList = response.data;
                    }
                }
                setVideos(videosList);
                // Also update the courseVideosMap for the expandable list
                setCourseVideosMap({
                    ...courseVideosMap,
                    [courseId]: videosList,
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch videos");
        } finally {
            setLoadingVideos(false);
        }
    };

    const handleAddVideo = () => {
        setEditingVideo(null);
        setVideoFormData({
            title: "",
            video_url: "",
            description: "",
            order_index: videos.length,
            pdfs: [],
            markdown: "",
        });
        setError(null);
        setVideoFormSuccess(null);
    };

    const handleEditVideo = (video: Video) => {
        setEditingVideo(video);
        // Handle both property name variations from API
        const videoUrl = (video as any).video_url || video.youtube_url || "";
        const markdownContent =
            (video as any).markdown || video.markdown_content || "";
        setVideoFormData({
            title: video.title || "",
            video_url: videoUrl,
            description: video.description || "",
            order_index: video.order_index || 0,
            pdfs: (video as any).pdfs || [],
            markdown: markdownContent,
        });
        setError(null);
        setVideoFormSuccess(null);
    };

    const handleDeleteVideo = (video: Video) => {
        setVideoToDelete(video);
        setDeleteVideoError(null);
        setDeleteVideoSuccess(null);
        setIsDeleteVideoModalOpen(true);
    };

    const confirmDeleteVideo = async () => {
        if (!videoToDelete || !selectedCourse) return;

        setIsDeletingVideo(true);
        setDeleteVideoError(null);
        setDeleteVideoSuccess(null);

        try {
            const response = await coursesApi.deleteVideo(
                selectedCourse.id,
                videoToDelete.id
            );
            if (response.success) {
                setDeleteVideoSuccess("Video deleted successfully!");
                // Refresh videos list
                await fetchVideos(selectedCourse.id);
                // Force refresh the expandable list if it's currently expanded
                if (expandedCourseId === selectedCourse.id) {
                    // Clear the cache to force a refresh
                    const updatedMap = { ...courseVideosMap };
                    delete updatedMap[selectedCourse.id];
                    setCourseVideosMap(updatedMap);
                    // Re-fetch videos for the expanded course
                    setLoadingCourseVideos(selectedCourse.id);
                    try {
                        const refreshResponse = await coursesApi.getVideos(
                            selectedCourse.id
                        );
                        if (refreshResponse.success && refreshResponse.data) {
                            setCourseVideosMap({
                                ...updatedMap,
                                [selectedCourse.id]: Array.isArray(
                                    refreshResponse.data
                                )
                                    ? refreshResponse.data
                                    : [],
                            });
                        }
                    } catch (err: any) {
                        console.error("Failed to refresh videos:", err);
                    } finally {
                        setLoadingCourseVideos(null);
                    }
                }
                // Close modal after 1.5 seconds
                setTimeout(() => {
                    setIsDeleteVideoModalOpen(false);
                    setVideoToDelete(null);
                    setDeleteVideoSuccess(null);
                    setDeleteVideoError(null);
                }, 1500);
            }
        } catch (err: any) {
            setDeleteVideoError(err.message || "Failed to delete video");
        } finally {
            setIsDeletingVideo(false);
        }
    };

    const handleVideoFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;

        setIsSubmittingVideo(true);
        setError(null);
        setVideoFormSuccess(null);

        try {
            const videoData: any = {
                title: videoFormData.title,
                video_url: videoFormData.video_url,
                order_index: parseInt(videoFormData.order_index.toString()),
            };

            if (videoFormData.description) {
                videoData.description = videoFormData.description;
            }
            if (videoFormData.markdown) {
                videoData.markdown = videoFormData.markdown;
            }
            if (videoFormData.pdfs && videoFormData.pdfs.length > 0) {
                videoData.pdfs = videoFormData.pdfs;
            }

            if (editingVideo) {
                // Update existing video
                const response = await coursesApi.updateVideo(
                    selectedCourse.id,
                    editingVideo.id,
                    videoData
                );

                if (response.success) {
                    setVideoFormSuccess("Video updated successfully!");
                    await fetchVideos(selectedCourse.id);
                    // Force refresh the expandable list if it's currently expanded
                    if (expandedCourseId === selectedCourse.id) {
                        // Clear the cache to force a refresh
                        const updatedMap = { ...courseVideosMap };
                        delete updatedMap[selectedCourse.id];
                        setCourseVideosMap(updatedMap);
                        // Re-fetch videos for the expanded course
                        setLoadingCourseVideos(selectedCourse.id);
                        try {
                            const refreshResponse = await coursesApi.getVideos(
                                selectedCourse.id
                            );
                            if (
                                refreshResponse.success &&
                                refreshResponse.data
                            ) {
                                setCourseVideosMap({
                                    ...updatedMap,
                                    [selectedCourse.id]: Array.isArray(
                                        refreshResponse.data
                                    )
                                        ? refreshResponse.data
                                        : [],
                                });
                            }
                        } catch (err: any) {
                            console.error("Failed to refresh videos:", err);
                        } finally {
                            setLoadingCourseVideos(null);
                        }
                    }
                    setTimeout(() => {
                        setEditingVideo(null);
                        setVideoFormSuccess(null);
                        setError(null);
                    }, 1500);
                }
            } else {
                // Create new video
                const response = await coursesApi.createVideo(
                    selectedCourse.id,
                    videoData
                );

                if (response.success) {
                    setVideoFormSuccess("Video created successfully!");
                    await fetchVideos(selectedCourse.id);
                    // Force refresh the expandable list if it's currently expanded
                    if (expandedCourseId === selectedCourse.id) {
                        // Clear the cache to force a refresh
                        const updatedMap = { ...courseVideosMap };
                        delete updatedMap[selectedCourse.id];
                        setCourseVideosMap(updatedMap);
                        // Re-fetch videos for the expanded course
                        setLoadingCourseVideos(selectedCourse.id);
                        try {
                            const refreshResponse = await coursesApi.getVideos(
                                selectedCourse.id
                            );
                            if (
                                refreshResponse.success &&
                                refreshResponse.data
                            ) {
                                setCourseVideosMap({
                                    ...updatedMap,
                                    [selectedCourse.id]: Array.isArray(
                                        refreshResponse.data
                                    )
                                        ? refreshResponse.data
                                        : [],
                                });
                            }
                        } catch (err: any) {
                            console.error("Failed to refresh videos:", err);
                        } finally {
                            setLoadingCourseVideos(null);
                        }
                    }
                    setTimeout(() => {
                        setVideoFormData({
                            title: "",
                            video_url: "",
                            description: "",
                            order_index: videos.length + 1,
                            pdfs: [],
                            markdown: "",
                        });
                        setVideoFormSuccess(null);
                        setError(null);
                    }, 1500);
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to save video");
            setVideoFormSuccess(null);
        } finally {
            setIsSubmittingVideo(false);
        }
    };

    // formatDate and getStatusBadge are now imported from components/admin/utils and StatusBadge

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    if (!isAuth || user?.role !== "admin") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Admin Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage users, courses, and requests
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {activeTab === "dashboard" && (
                    <DashboardTab stats={stats} loading={loading} />
                )}

                {activeTab === "users" && (
                    <UsersTab
                        users={users}
                        onAddUser={handleAddUser}
                        onEditUser={handleEditUser}
                        onDeleteUser={handleDeleteUser}
                        onViewLoginDetails={handleViewLoginDetails}
                    />
                )}

                {activeTab === "requests" && (
                    <RequestsTab
                        requests={requests}
                        onApproveRequest={handleApproveRequestClick}
                        onRejectRequest={handleRejectRequestClick}
                    />
                )}

                {/* Grant Access Modal */}
                <GrantAccessModal
                    course={selectedCourseForGrant}
                    isOpen={showGrantAccessModal}
                    onClose={() => {
                        setShowGrantAccessModal(false);
                        setSelectedCourseForGrant(null);
                    }}
                    onSuccess={handleGrantAccessSuccess}
                />

                {activeTab === "courses" && (
                    <CoursesTab
                        courses={courses}
                        expandedCourseId={expandedCourseId}
                        courseVideosMap={courseVideosMap}
                        loadingCourseVideos={loadingCourseVideos}
                        onAddCourse={handleAddCourse}
                        onEditCourse={handleEditCourse}
                        onDeleteCourse={handleDeleteCourse}
                        onManageVideos={handleManageVideos}
                        onToggleCourseVideos={toggleCourseVideos}
                        onEditVideo={handleEditVideo}
                        onDeleteVideo={handleDeleteVideo}
                        onGrantAccess={handleGrantAccessClick}
                    />
                )}

                {activeTab === "blogs" && (
                    <BlogsTab
                        blogPosts={blogPosts}
                        onAddBlog={handleAddBlog}
                        onEditBlog={handleEditBlog}
                        onDeleteBlog={handleDeleteBlog}
                    />
                )}

                {activeTab === "products" && <ProductsTab />}

                {activeTab === "orders" && <OrdersTab />}

                {activeTab === "kyc" && (
                    <KYCTab
                        kycApplications={kycApplications}
                        onViewKyc={handleViewKyc}
                        onVerifyKyc={handleVerifyKyc}
                        onRejectKyc={handleRejectKyc}
                    />
                )}
            </div>

            {/* User Add/Edit Modal */}
            {isUserModalOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => setIsUserModalOpen(false)}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingUser ? "Edit User" : "Add New User"}
                                </h2>
                                <button
                                    onClick={() => setIsUserModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleUserFormSubmit}
                                className="p-6 space-y-4"
                            >
                                {/* Success Message */}
                                {userFormSuccess && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {userFormSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={userFormData.first_name}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                first_name: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={userFormData.last_name}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                last_name: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={userFormData.email}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                email: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Password{" "}
                                        {editingUser
                                            ? "(leave blank to keep unchanged)"
                                            : "*"}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={userFormData.password}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                password: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        value={userFormData.role}
                                        onChange={(e) =>
                                            setUserFormData({
                                                ...userFormData,
                                                role: e.target.value as
                                                    | "user"
                                                    | "admin",
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsUserModalOpen(false)
                                        }
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingUser}
                                        className="px-4 py-2 text-sm font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    >
                                        {isSubmittingUser ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Save</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && userToDelete && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => {
                            if (!isDeleting) {
                                setIsDeleteModalOpen(false);
                                setUserToDelete(null);
                            }
                        }}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Delete User
                                    </h2>
                                </div>
                                {!isDeleting && !deleteSuccess && (
                                    <button
                                        onClick={() => {
                                            setIsDeleteModalOpen(false);
                                            setUserToDelete(null);
                                            setDeleteError(null);
                                            setDeleteSuccess(null);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Success Message */}
                                {deleteSuccess && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {deleteSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {deleteError && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {deleteError}
                                        </p>
                                    </div>
                                )}

                                {!deleteSuccess && (
                                    <p className="text-gray-700 mb-4">
                                        Are you sure you want to delete this
                                        user? This action cannot be undone.
                                    </p>
                                )}

                                {!deleteSuccess && (
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="shrink-0 h-12 w-12 rounded-full bg-[#B00000] flex items-center justify-center text-white font-medium">
                                                {userToDelete.first_name?.[0] ||
                                                    "U"}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {userToDelete.first_name}{" "}
                                                    {userToDelete.last_name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {userToDelete.email}
                                                </p>
                                                <span
                                                    className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                        userToDelete.role ===
                                                        "admin"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {userToDelete.role ||
                                                        "user"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    {!deleteSuccess && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDeleteModalOpen(false);
                                                setUserToDelete(null);
                                                setDeleteError(null);
                                                setDeleteSuccess(null);
                                            }}
                                            disabled={isDeleting}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {!deleteSuccess && (
                                        <button
                                            type="button"
                                            onClick={confirmDeleteUser}
                                            disabled={isDeleting}
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Deleting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Delete User</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {deleteSuccess && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDeleteModalOpen(false);
                                                setUserToDelete(null);
                                                setDeleteError(null);
                                                setDeleteSuccess(null);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Login Details Modal */}
            {isLoginDetailsModalOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => setIsLoginDetailsModalOpen(false)}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                                <div className="flex items-center space-x-3">
                                    <Monitor className="w-6 h-6 text-[#B00000]" />
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Login Details & Device Information
                                    </h2>
                                </div>
                                <button
                                    onClick={() =>
                                        setIsLoginDetailsModalOpen(false)
                                    }
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {loadingLoginDetails ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
                                    </div>
                                ) : loginDetails ? (
                                    <div className="space-y-6">
                                        {/* User Info */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                                User Information
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Name
                                                    </p>
                                                    <p className="font-medium text-slate-900">
                                                        {
                                                            loginDetails.user
                                                                .first_name
                                                        }{" "}
                                                        {
                                                            loginDetails.user
                                                                .last_name
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">
                                                        Email
                                                    </p>
                                                    <p className="font-medium text-slate-900">
                                                        {
                                                            loginDetails.user
                                                                .email
                                                        }
                                                    </p>
                                                </div>
                                                {loginDetails.user
                                                    .last_login_at && (
                                                    <>
                                                        <div>
                                                            <p className="text-sm text-gray-600">
                                                                Last Login
                                                            </p>
                                                            <p className="font-medium text-slate-900">
                                                                {formatDate(
                                                                    loginDetails
                                                                        .user
                                                                        .last_login_at
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">
                                                                Last Login IP
                                                            </p>
                                                            <p className="font-medium text-slate-900">
                                                                {
                                                                    loginDetails
                                                                        .user
                                                                        .last_login_ip
                                                                }
                                                            </p>
                                                        </div>
                                                        {loginDetails.user
                                                            .last_login_device && (
                                                            <div className="col-span-2">
                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    Last Login
                                                                    Device
                                                                </p>
                                                                <div className="flex items-center space-x-4">
                                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                                        {
                                                                            loginDetails
                                                                                .user
                                                                                .last_login_device
                                                                                .deviceType
                                                                        }
                                                                    </span>
                                                                    <span className="text-sm text-gray-700">
                                                                        {
                                                                            loginDetails
                                                                                .user
                                                                                .last_login_device
                                                                                .browser
                                                                        }
                                                                    </span>
                                                                    <span className="text-sm text-gray-700">
                                                                        {
                                                                            loginDetails
                                                                                .user
                                                                                .last_login_device
                                                                                .os
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sessions Summary */}
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900">
                                                        Active Sessions
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {
                                                            loginDetails.active_sessions_count
                                                        }{" "}
                                                        active out of{" "}
                                                        {
                                                            loginDetails.total_sessions_count
                                                        }{" "}
                                                        total sessions
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sessions List */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                                All Sessions
                                            </h3>
                                            <div className="space-y-3">
                                                {loginDetails.sessions.length >
                                                0 ? (
                                                    loginDetails.sessions.map(
                                                        (session) => {
                                                            const deviceInfo =
                                                                typeof session.device_info ===
                                                                "string"
                                                                    ? JSON.parse(
                                                                          session.device_info
                                                                      )
                                                                    : session.device_info;
                                                            const isActive =
                                                                session.is_active &&
                                                                new Date(
                                                                    session.expires_at
                                                                ) > new Date();

                                                            return (
                                                                <div
                                                                    key={
                                                                        session.id
                                                                    }
                                                                    className={`border rounded-lg p-4 ${
                                                                        isActive
                                                                            ? "border-green-200 bg-green-50"
                                                                            : "border-gray-200 bg-gray-50"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center space-x-3 mb-2">
                                                                                {deviceInfo.deviceType ===
                                                                                "mobile" ? (
                                                                                    <Smartphone className="w-5 h-5 text-gray-600" />
                                                                                ) : deviceInfo.deviceType ===
                                                                                  "tablet" ? (
                                                                                    <Tablet className="w-5 h-5 text-gray-600" />
                                                                                ) : (
                                                                                    <Monitor className="w-5 h-5 text-gray-600" />
                                                                                )}
                                                                                <span
                                                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                                        isActive
                                                                                            ? "bg-green-100 text-green-800"
                                                                                            : "bg-gray-100 text-gray-800"
                                                                                    }`}
                                                                                >
                                                                                    {
                                                                                        deviceInfo.deviceType
                                                                                    }
                                                                                </span>
                                                                                {isActive && (
                                                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                                                        Active
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                                <div>
                                                                                    <p className="text-gray-600">
                                                                                        Browser
                                                                                    </p>
                                                                                    <p className="font-medium text-slate-900">
                                                                                        {
                                                                                            deviceInfo.browser
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-gray-600">
                                                                                        Operating
                                                                                        System
                                                                                    </p>
                                                                                    <p className="font-medium text-slate-900">
                                                                                        {
                                                                                            deviceInfo.os
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-gray-600">
                                                                                        IP
                                                                                        Address
                                                                                    </p>
                                                                                    <p className="font-medium text-slate-900">
                                                                                        {
                                                                                            session.ip_address
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-gray-600">
                                                                                        Last
                                                                                        Activity
                                                                                    </p>
                                                                                    <p className="font-medium text-slate-900">
                                                                                        {formatDate(
                                                                                            session.last_activity
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-gray-600">
                                                                                        Created
                                                                                    </p>
                                                                                    <p className="font-medium text-slate-900">
                                                                                        {formatDate(
                                                                                            session.created_at
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-gray-600">
                                                                                        Expires
                                                                                    </p>
                                                                                    <p className="font-medium text-slate-900">
                                                                                        {formatDate(
                                                                                            session.expires_at
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )
                                                ) : (
                                                    <p className="text-center text-gray-500 py-8">
                                                        No sessions found
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                        No login details available
                                    </p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsLoginDetailsModalOpen(false)
                                    }
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Course Add/Edit Modal */}
            {isCourseModalOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => setIsCourseModalOpen(false)}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingCourse
                                        ? "Edit Course"
                                        : "Add New Course"}
                                </h2>
                                <button
                                    onClick={() => setIsCourseModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleCourseFormSubmit}
                                className="p-6 space-y-4"
                            >
                                {/* Success Message */}
                                {courseFormSuccess && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {courseFormSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* Course Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Course Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={courseFormData.name}
                                        onChange={(e) => {
                                            setCourseFormData({
                                                ...courseFormData,
                                                name: e.target.value,
                                                slug: editingCourse
                                                    ? courseFormData.slug
                                                    : generateSlug(
                                                          e.target.value
                                                      ),
                                            });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        placeholder="e.g., Diagnostic Tools"
                                    />
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Slug *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={courseFormData.slug}
                                        onChange={(e) =>
                                            setCourseFormData({
                                                ...courseFormData,
                                                slug: e.target.value
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-"),
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        placeholder="e.g., diagnostic-tools"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        URL-friendly identifier (auto-generated
                                        from name)
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={courseFormData.description}
                                        onChange={(e) =>
                                            setCourseFormData({
                                                ...courseFormData,
                                                description: e.target.value,
                                            })
                                        }
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        placeholder="Course description..."
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={courseFormData.price}
                                        onChange={(e) =>
                                            setCourseFormData({
                                                ...courseFormData,
                                                price:
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Cover Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Cover Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setCourseFormData({
                                                    ...courseFormData,
                                                    cover_image: file,
                                                });
                                                // Create preview
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setCoverImagePreview(
                                                        reader.result as string
                                                    );
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#B00000] file:text-white hover:file:bg-red-800 file:cursor-pointer"
                                    />
                                    {coverImagePreview && (
                                        <div className="mt-4">
                                            <img
                                                src={coverImagePreview}
                                                alt="Cover preview"
                                                className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsCourseModalOpen(false)
                                        }
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingCourse}
                                        className="px-4 py-2 text-sm font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    >
                                        {isSubmittingCourse ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Save</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Course Delete Confirmation Modal */}
            {isDeleteCourseModalOpen && courseToDelete && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => {
                            if (!isDeletingCourse) {
                                setIsDeleteCourseModalOpen(false);
                                setCourseToDelete(null);
                            }
                        }}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Delete Course
                                    </h2>
                                </div>
                                {!isDeletingCourse && !deleteCourseSuccess && (
                                    <button
                                        onClick={() => {
                                            setIsDeleteCourseModalOpen(false);
                                            setCourseToDelete(null);
                                            setDeleteCourseError(null);
                                            setDeleteCourseSuccess(null);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Success Message */}
                                {deleteCourseSuccess && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {deleteCourseSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {deleteCourseError && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {deleteCourseError}
                                        </p>
                                    </div>
                                )}

                                {!deleteCourseSuccess && (
                                    <p className="text-gray-700 mb-4">
                                        Are you sure you want to delete this
                                        course? This action cannot be undone.
                                    </p>
                                )}

                                {!deleteCourseSuccess && (
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="flex items-center space-x-3">
                                            {courseToDelete.cover_image && (
                                                <img
                                                    src={
                                                        courseToDelete.cover_image
                                                    }
                                                    alt={courseToDelete.name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {courseToDelete.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {courseToDelete.slug}
                                                </p>
                                                <p className="text-sm font-medium text-[#B00000]">
                                                    ₹
                                                    {(typeof courseToDelete.price ===
                                                    "number"
                                                        ? courseToDelete.price
                                                        : parseFloat(
                                                              String(
                                                                  courseToDelete.price ||
                                                                      "0"
                                                              )
                                                          )
                                                    ).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    {!deleteCourseSuccess && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDeleteCourseModalOpen(
                                                    false
                                                );
                                                setCourseToDelete(null);
                                                setDeleteCourseError(null);
                                                setDeleteCourseSuccess(null);
                                            }}
                                            disabled={isDeletingCourse}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {!deleteCourseSuccess && (
                                        <button
                                            type="button"
                                            onClick={confirmDeleteCourse}
                                            disabled={isDeletingCourse}
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        >
                                            {isDeletingCourse ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Deleting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Delete Course</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {deleteCourseSuccess && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDeleteCourseModalOpen(
                                                    false
                                                );
                                                setCourseToDelete(null);
                                                setDeleteCourseError(null);
                                                setDeleteCourseSuccess(null);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Blog Add/Edit Modal */}
            {isBlogModalOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => setIsBlogModalOpen(false)}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingBlog
                                        ? "Edit Blog Post"
                                        : "Add New Blog Post"}
                                </h2>
                                <button
                                    onClick={() => setIsBlogModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleBlogFormSubmit}
                                className="p-6 space-y-4"
                            >
                                {/* Success Message */}
                                {blogFormSuccess && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {blogFormSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={blogFormData.title}
                                        onChange={(e) =>
                                            setBlogFormData({
                                                ...blogFormData,
                                                title: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        placeholder="e.g., How to Use Diagnostic Tools"
                                    />
                                </div>

                                {/* Excerpt */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Excerpt
                                    </label>
                                    <textarea
                                        value={blogFormData.excerpt}
                                        onChange={(e) =>
                                            setBlogFormData({
                                                ...blogFormData,
                                                excerpt: e.target.value,
                                            })
                                        }
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        placeholder="Short description of the blog post"
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">
                                        Content *
                                    </label>
                                    <div
                                        data-color-mode="light"
                                        className="markdown-editor-wrapper"
                                    >
                                        <MDEditor
                                            value={blogFormData.content}
                                            onChange={(value) =>
                                                setBlogFormData({
                                                    ...blogFormData,
                                                    content: value || "",
                                                })
                                            }
                                            preview="edit"
                                            hideToolbar={false}
                                            visibleDragbar={true}
                                            height={500}
                                            data-color-mode="light"
                                        />
                                        <div className="mt-2 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-gray-500">
                                                    Write your blog post content
                                                    using markdown. Use the
                                                    toolbar buttons for
                                                    formatting (bold, italic,
                                                    headers, lists, links,
                                                    etc.).
                                                </p>
                                                <div className="flex items-center space-x-2">
                                                    <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors">
                                                        <span>📷 Image</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            onChange={async (
                                                                e
                                                            ) => {
                                                                const files =
                                                                    Array.from(
                                                                        e.target
                                                                            .files ||
                                                                            []
                                                                    );
                                                                if (
                                                                    files.length >
                                                                    0
                                                                ) {
                                                                    try {
                                                                        let imageUrls: string[] =
                                                                            [];
                                                                        if (
                                                                            files.length ===
                                                                            1
                                                                        ) {
                                                                            // Single image upload
                                                                            const imageUrl =
                                                                                await handleImageUpload(
                                                                                    files[0]
                                                                                );
                                                                            imageUrls =
                                                                                [
                                                                                    imageUrl,
                                                                                ];
                                                                        } else {
                                                                            // Multiple images upload
                                                                            imageUrls =
                                                                                await handleMultipleImageUpload(
                                                                                    files
                                                                                );
                                                                        }
                                                                        // Insert image markdown
                                                                        const currentContent =
                                                                            blogFormData.content ||
                                                                            "";
                                                                        const imageMarkdown =
                                                                            imageUrls
                                                                                .map(
                                                                                    (
                                                                                        url,
                                                                                        index
                                                                                    ) =>
                                                                                        `\n![${files[index].name}](${url})`
                                                                                )
                                                                                .join(
                                                                                    "\n"
                                                                                ) +
                                                                            "\n";
                                                                        setBlogFormData(
                                                                            {
                                                                                ...blogFormData,
                                                                                content:
                                                                                    currentContent +
                                                                                    imageMarkdown,
                                                                            }
                                                                        );
                                                                    } catch (error) {
                                                                        // Error already handled in upload functions
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                                        <span>📄 Document</span>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                                                            multiple
                                                            className="hidden"
                                                            onChange={async (
                                                                e
                                                            ) => {
                                                                const files =
                                                                    Array.from(
                                                                        e.target
                                                                            .files ||
                                                                            []
                                                                    );
                                                                if (
                                                                    files.length >
                                                                    0
                                                                ) {
                                                                    try {
                                                                        let docUrls: string[] =
                                                                            [];
                                                                        if (
                                                                            files.length ===
                                                                            1
                                                                        ) {
                                                                            // Single file upload
                                                                            const docUrl =
                                                                                await handleDocumentUpload(
                                                                                    files[0]
                                                                                );
                                                                            docUrls =
                                                                                [
                                                                                    docUrl,
                                                                                ];
                                                                        } else {
                                                                            // Multiple files upload
                                                                            docUrls =
                                                                                await handleMultipleDocumentUpload(
                                                                                    files
                                                                                );
                                                                        }
                                                                        // Insert document links markdown
                                                                        const currentContent =
                                                                            blogFormData.content ||
                                                                            "";
                                                                        const docMarkdown =
                                                                            docUrls
                                                                                .map(
                                                                                    (
                                                                                        url,
                                                                                        index
                                                                                    ) =>
                                                                                        `\n[${files[index].name}](${url})`
                                                                                )
                                                                                .join(
                                                                                    "\n"
                                                                                ) +
                                                                            "\n";
                                                                        setBlogFormData(
                                                                            {
                                                                                ...blogFormData,
                                                                                content:
                                                                                    currentContent +
                                                                                    docMarkdown,
                                                                            }
                                                                        );
                                                                    } catch (error) {
                                                                        // Error already handled in upload functions
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                                <p className="font-medium mb-1">
                                                    💡 Tips:
                                                </p>
                                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                                    <li>
                                                        <strong>Iframe:</strong>{" "}
                                                        Use HTML:{" "}
                                                        <code className="bg-gray-200 px-1 rounded">
                                                            &lt;iframe
                                                            src="URL"&gt;&lt;/iframe&gt;
                                                        </code>
                                                    </li>
                                                    <li>
                                                        <strong>
                                                            Documents:
                                                        </strong>{" "}
                                                        Upload via API, then
                                                        link:{" "}
                                                        <code className="bg-gray-200 px-1 rounded">
                                                            [Document Name](URL)
                                                        </code>
                                                    </li>
                                                    <li>
                                                        <strong>Images:</strong>{" "}
                                                        Click "Upload Image"
                                                        button or use:{" "}
                                                        <code className="bg-gray-200 px-1 rounded">
                                                            ![alt](URL)
                                                        </code>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        {(uploadingImage ||
                                            uploadingDocument) && (
                                            <div className="mt-2 text-sm text-blue-600 flex items-center space-x-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>
                                                    {uploadingImage
                                                        ? "Uploading image..."
                                                        : "Uploading document..."}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Write your blog post content using
                                        markdown. Use the toolbar buttons for
                                        formatting (bold, italic, headers,
                                        lists, links, etc.).
                                    </p>
                                </div>

                                {/* Published Status */}
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="is_published"
                                        checked={blogFormData.is_published}
                                        onChange={(e) =>
                                            setBlogFormData({
                                                ...blogFormData,
                                                is_published: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 text-[#B00000] border-gray-300 rounded focus:ring-[#B00000]"
                                    />
                                    <label
                                        htmlFor="is_published"
                                        className="text-sm font-medium text-slate-900"
                                    >
                                        Publish immediately
                                    </label>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsBlogModalOpen(false)
                                        }
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingBlog}
                                        className="px-4 py-2 text-sm font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    >
                                        {isSubmittingBlog ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>
                                                    {editingBlog
                                                        ? "Update"
                                                        : "Create"}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Blog Delete Confirmation Modal */}
            {blogDeleteModal.isOpen && blogDeleteModal.blog && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => {
                            if (!isDeletingBlog) {
                                setBlogDeleteModal({
                                    isOpen: false,
                                    blog: null,
                                });
                            }
                        }}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Delete Blog Post
                                    </h2>
                                </div>
                                {!isDeletingBlog && (
                                    <button
                                        onClick={() => {
                                            setBlogDeleteModal({
                                                isOpen: false,
                                                blog: null,
                                            });
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                <p className="text-gray-700 mb-4">
                                    Are you sure you want to delete this blog
                                    post? This action cannot be undone.
                                </p>

                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center space-x-3">
                                        {blogDeleteModal.blog.cover_image && (
                                            <img
                                                src={
                                                    blogDeleteModal.blog
                                                        .cover_image
                                                }
                                                alt={blogDeleteModal.blog.title}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {blogDeleteModal.blog.title}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {blogDeleteModal.blog.slug}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBlogDeleteModal({
                                                isOpen: false,
                                                blog: null,
                                            });
                                        }}
                                        disabled={isDeletingBlog}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmDeleteBlog}
                                        disabled={isDeletingBlog}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    >
                                        {isDeletingBlog ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>Delete Blog Post</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Video Management Modal */}
            {isVideoModalOpen && selectedCourse && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => {
                            setIsVideoModalOpen(false);
                            setSelectedCourse(null);
                            setVideos([]);
                        }}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Manage Videos - {selectedCourse.name}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Add, edit, or delete videos for this
                                        course
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsVideoModalOpen(false);
                                        setSelectedCourse(null);
                                        setVideos([]);
                                        setEditingVideo(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Success Message */}
                                {videoFormSuccess && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {videoFormSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* Add/Edit Video Form */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        {editingVideo
                                            ? "Edit Video"
                                            : "Add New Video"}
                                    </h3>
                                    <form
                                        onSubmit={handleVideoFormSubmit}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Title */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-900 mb-2">
                                                    Title *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={videoFormData.title}
                                                    onChange={(e) =>
                                                        setVideoFormData({
                                                            ...videoFormData,
                                                            title: e.target
                                                                .value,
                                                        })
                                                    }
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                    placeholder="Video title"
                                                />
                                            </div>

                                            {/* Order Index */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-900 mb-2">
                                                    Order Index *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={
                                                        videoFormData.order_index
                                                    }
                                                    onChange={(e) =>
                                                        setVideoFormData({
                                                            ...videoFormData,
                                                            order_index:
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 0,
                                                        })
                                                    }
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Video URL */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-900 mb-2">
                                                YouTube URL *
                                            </label>
                                            <input
                                                type="url"
                                                required
                                                value={videoFormData.video_url}
                                                onChange={(e) =>
                                                    setVideoFormData({
                                                        ...videoFormData,
                                                        video_url:
                                                            e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                placeholder="https://www.youtube.com/watch?v=..."
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-900 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={
                                                    videoFormData.description
                                                }
                                                onChange={(e) =>
                                                    setVideoFormData({
                                                        ...videoFormData,
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                placeholder="Video description..."
                                            />
                                        </div>

                                        {/* Markdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-900 mb-2">
                                                Markdown Content
                                            </label>
                                            <textarea
                                                value={videoFormData.markdown}
                                                onChange={(e) =>
                                                    setVideoFormData({
                                                        ...videoFormData,
                                                        markdown:
                                                            e.target.value,
                                                    })
                                                }
                                                rows={5}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent font-mono text-sm"
                                                placeholder="Markdown content..."
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex items-center justify-end space-x-3 pt-2">
                                            {editingVideo && (
                                                <button
                                                    type="button"
                                                    onClick={handleAddVideo}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel Edit
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={isSubmittingVideo}
                                                className="px-4 py-2 text-sm font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                {isSubmittingVideo ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        <span>
                                                            {editingVideo
                                                                ? "Update"
                                                                : "Add"}{" "}
                                                            Video
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Videos List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        Videos ({videos.length})
                                    </h3>
                                    {loadingVideos ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#B00000]" />
                                        </div>
                                    ) : videos.length > 0 ? (
                                        <div className="space-y-2">
                                            {videos
                                                .sort(
                                                    (a, b) =>
                                                        (a.order_index || 0) -
                                                        (b.order_index || 0)
                                                )
                                                .map((video) => (
                                                    <div
                                                        key={video.id}
                                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                                        #
                                                                        {
                                                                            video.order_index
                                                                        }
                                                                    </span>
                                                                    <h4 className="font-medium text-slate-900">
                                                                        {
                                                                            video.title
                                                                        }
                                                                    </h4>
                                                                </div>
                                                                {video.description && (
                                                                    <p className="text-sm text-gray-600 mt-1 ml-12">
                                                                        {
                                                                            video.description
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() =>
                                                                        handleEditVideo(
                                                                            video
                                                                        )
                                                                    }
                                                                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit Video"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteVideo(
                                                                            video
                                                                        )
                                                                    }
                                                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete Video"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-600">
                                                No videos yet
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Add your first video above
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Video Delete Confirmation Modal */}
            {isDeleteVideoModalOpen && videoToDelete && selectedCourse && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => {
                            if (!isDeletingVideo) {
                                setIsDeleteVideoModalOpen(false);
                                setVideoToDelete(null);
                            }
                        }}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Delete Video
                                    </h2>
                                </div>
                                {!isDeletingVideo && !deleteVideoSuccess && (
                                    <button
                                        onClick={() => {
                                            setIsDeleteVideoModalOpen(false);
                                            setVideoToDelete(null);
                                            setDeleteVideoError(null);
                                            setDeleteVideoSuccess(null);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Success Message */}
                                {deleteVideoSuccess && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {deleteVideoSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {deleteVideoError && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {deleteVideoError}
                                        </p>
                                    </div>
                                )}

                                {!deleteVideoSuccess && (
                                    <p className="text-gray-700 mb-4">
                                        Are you sure you want to delete this
                                        video? This action cannot be undone.
                                    </p>
                                )}

                                {!deleteVideoSuccess && (
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {videoToDelete.title}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Order: #
                                                {videoToDelete.order_index}
                                            </p>
                                            {videoToDelete.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {videoToDelete.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    {!deleteVideoSuccess && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDeleteVideoModalOpen(
                                                    false
                                                );
                                                setVideoToDelete(null);
                                                setDeleteVideoError(null);
                                                setDeleteVideoSuccess(null);
                                            }}
                                            disabled={isDeletingVideo}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {!deleteVideoSuccess && (
                                        <button
                                            type="button"
                                            onClick={confirmDeleteVideo}
                                            disabled={isDeletingVideo}
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        >
                                            {isDeletingVideo ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Deleting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Delete Video</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {deleteVideoSuccess && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsDeleteVideoModalOpen(
                                                    false
                                                );
                                                setVideoToDelete(null);
                                                setDeleteVideoError(null);
                                                setDeleteVideoSuccess(null);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Approve Request Confirmation Modal */}
            {showApproveModal && selectedRequest && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => {
                            if (!isProcessingRequest) {
                                setShowApproveModal(false);
                                setSelectedRequest(null);
                            }
                        }}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Approve Request
                                    </h2>
                                </div>
                                {!isProcessingRequest && !requestSuccess && (
                                    <button
                                        onClick={() => {
                                            setShowApproveModal(false);
                                            setSelectedRequest(null);
                                            setRequestError(null);
                                            setRequestSuccess(null);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Success Message */}
                                {requestSuccess && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {requestSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {requestError && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {requestError}
                                        </p>
                                    </div>
                                )}

                                {!requestSuccess && (
                                    <>
                                        <p className="text-gray-700 mb-4">
                                            Are you sure you want to approve
                                            this course access request?
                                        </p>
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        User:{" "}
                                                    </span>
                                                    <span className="text-sm text-slate-900">
                                                        {selectedRequest.user
                                                            ?.first_name ||
                                                            ""}{" "}
                                                        {selectedRequest.user
                                                            ?.last_name || ""}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        Course:{" "}
                                                    </span>
                                                    <span className="text-sm text-slate-900">
                                                        {selectedRequest.course
                                                            ?.name ||
                                                            "Unknown Course"}
                                                    </span>
                                                </div>
                                                {selectedRequest.request_message && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Message:{" "}
                                                        </span>
                                                        <span className="text-sm text-slate-900">
                                                            {
                                                                selectedRequest.request_message
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Date Selection Fields */}
                                        <div className="space-y-4 mb-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Access Start Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={
                                                            accessStartDate
                                                                ? new Date(
                                                                      accessStartDate
                                                                  )
                                                                      .toISOString()
                                                                      .split(
                                                                          "T"
                                                                      )[0]
                                                                : ""
                                                        }
                                                        onChange={(e) => {
                                                            const dateValue =
                                                                e.target.value;
                                                            if (dateValue) {
                                                                // Set time to start of day
                                                                const isoDate =
                                                                    new Date(
                                                                        dateValue +
                                                                            "T00:00:00.000Z"
                                                                    ).toISOString();
                                                                setAccessStartDate(
                                                                    isoDate
                                                                );
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Access End Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={
                                                            accessEndDate
                                                                ? new Date(
                                                                      accessEndDate
                                                                  )
                                                                      .toISOString()
                                                                      .split(
                                                                          "T"
                                                                      )[0]
                                                                : ""
                                                        }
                                                        onChange={(e) => {
                                                            const dateValue =
                                                                e.target.value;
                                                            if (dateValue) {
                                                                // Set time to end of day
                                                                const isoDate =
                                                                    new Date(
                                                                        dateValue +
                                                                            "T23:59:59.999Z"
                                                                    ).toISOString();
                                                                setAccessEndDate(
                                                                    isoDate
                                                                );
                                                            }
                                                        }}
                                                        min={
                                                            accessStartDate
                                                                ? new Date(
                                                                      accessStartDate
                                                                  )
                                                                      .toISOString()
                                                                      .split(
                                                                          "T"
                                                                      )[0]
                                                                : ""
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Default: 6 months access period.
                                                You can modify these dates as
                                                needed.
                                            </p>
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    {!requestSuccess && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowApproveModal(false);
                                                    setSelectedRequest(null);
                                                    setRequestError(null);
                                                    setRequestSuccess(null);
                                                    setAccessStartDate("");
                                                    setAccessEndDate("");
                                                }}
                                                disabled={isProcessingRequest}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleApproveRequest}
                                                disabled={isProcessingRequest}
                                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                {isProcessingRequest ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>
                                                            Approving...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>
                                                            Confirm Approve
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                    {requestSuccess && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowApproveModal(false);
                                                setSelectedRequest(null);
                                                setRequestError(null);
                                                setRequestSuccess(null);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Reject Request Confirmation Modal */}
            {showRejectModal && selectedRequest && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => {
                            if (!isProcessingRequest) {
                                setShowRejectModal(false);
                                setSelectedRequest(null);
                            }
                        }}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Reject Request
                                    </h2>
                                </div>
                                {!isProcessingRequest && !requestSuccess && (
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setSelectedRequest(null);
                                            setRequestError(null);
                                            setRequestSuccess(null);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Success Message */}
                                {requestSuccess && (
                                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-sm text-green-600 font-medium">
                                            {requestSuccess}
                                        </p>
                                    </div>
                                )}

                                {/* Error Message */}
                                {requestError && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">
                                            {requestError}
                                        </p>
                                    </div>
                                )}

                                {!requestSuccess && (
                                    <>
                                        <p className="text-gray-700 mb-4">
                                            Are you sure you want to reject this
                                            course access request?
                                        </p>
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        User:{" "}
                                                    </span>
                                                    <span className="text-sm text-slate-900">
                                                        {selectedRequest.user
                                                            ?.first_name ||
                                                            ""}{" "}
                                                        {selectedRequest.user
                                                            ?.last_name || ""}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        Course:{" "}
                                                    </span>
                                                    <span className="text-sm text-slate-900">
                                                        {selectedRequest.course
                                                            ?.name ||
                                                            "Unknown Course"}
                                                    </span>
                                                </div>
                                                {selectedRequest.request_message && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Message:{" "}
                                                        </span>
                                                        <span className="text-sm text-slate-900">
                                                            {
                                                                selectedRequest.request_message
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-red-600 mb-6">
                                            This action cannot be undone. The
                                            user will not be granted access to
                                            this course.
                                        </p>
                                    </>
                                )}

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    {!requestSuccess && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowRejectModal(false);
                                                    setSelectedRequest(null);
                                                    setRequestError(null);
                                                    setRequestSuccess(null);
                                                }}
                                                disabled={isProcessingRequest}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRejectRequest}
                                                disabled={isProcessingRequest}
                                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                            >
                                                {isProcessingRequest ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>
                                                            Rejecting...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4" />
                                                        <span>
                                                            Confirm Reject
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                    {requestSuccess && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowRejectModal(false);
                                                setSelectedRequest(null);
                                                setRequestError(null);
                                                setRequestSuccess(null);
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* KYC Detail Modal */}
            <KYCModal
                isOpen={isKycModalOpen}
                kyc={selectedKyc}
                kycAction={kycAction}
                rejectionReason={rejectionReason}
                isProcessing={isProcessingKyc}
                success={kycSuccess}
                error={kycError}
                onClose={() => {
                    setIsKycModalOpen(false);
                    setSelectedKyc(null);
                    setKycAction(null);
                    setRejectionReason("");
                    setKycError(null);
                    setKycSuccess(null);
                }}
                onVerify={() => {
                    if (selectedKyc) handleVerifyKyc(selectedKyc);
                }}
                onReject={() => {
                    if (selectedKyc) handleRejectKyc(selectedKyc);
                }}
                onAction={handleKycAction}
                onRejectionReasonChange={setRejectionReason}
                onCancelAction={() => {
                    setKycAction(null);
                    setRejectionReason("");
                    setKycError(null);
                }}
            />
        </div>
    );
}
