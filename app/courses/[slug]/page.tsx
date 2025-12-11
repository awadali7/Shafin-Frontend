"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Play,
    ChevronRight,
    CheckCircle2,
    Lock,
    ShoppingCart,
    FileText,
    Download,
    Loader2,
    X,
    AlertCircle,
} from "lucide-react";
import { coursesApi } from "@/lib/api/courses";
import { requestsApi } from "@/lib/api/requests";
import { progressApi } from "@/lib/api/progress";
import { kycApi } from "@/lib/api/kyc";
import { useAuth } from "@/contexts/AuthContext";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";
import type { CourseDetails, Video } from "@/lib/api/types";

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const slug = params.slug as string;
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [course, setCourse] = useState<CourseDetails | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasAccess, setHasAccess] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState<string>("");
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [kycStatus, setKycStatus] = useState<
        "pending" | "verified" | "rejected" | null
    >(null);
    const [checkingKYC, setCheckingKYC] = useState(false);

    // Fetch course and videos
    useEffect(() => {
        const fetchCourseData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch course by slug
                const courseResponse = await coursesApi.getBySlug(slug);
                if (courseResponse.success && courseResponse.data) {
                    setCourse(courseResponse.data);

                    // Fetch videos for the course
                    const videosResponse = await coursesApi.getVideos(
                        courseResponse.data.id
                    );
                    if (videosResponse.success && videosResponse.data) {
                        // Handle both array response and object with videos array
                        let videosList: Video[] = [];
                        if (Array.isArray(videosResponse.data)) {
                            videosList = videosResponse.data;
                        } else if (
                            videosResponse.data &&
                            typeof videosResponse.data === "object" &&
                            "videos" in videosResponse.data
                        ) {
                            videosList = Array.isArray(
                                (videosResponse.data as any).videos
                            )
                                ? (videosResponse.data as any).videos
                                : [];
                        }
                        // Sort videos by order_index
                        videosList.sort(
                            (a, b) =>
                                (a.order_index || 0) - (b.order_index || 0)
                        );
                        setVideos(videosList);

                        // Check if user has course access by checking enrolled courses
                        if (user && courseResponse.data) {
                            try {
                                const enrolledCoursesResponse =
                                    await progressApi.getMyCourses();
                                if (
                                    enrolledCoursesResponse.success &&
                                    enrolledCoursesResponse.data
                                ) {
                                    const enrolledCourses = Array.isArray(
                                        enrolledCoursesResponse.data
                                    )
                                        ? enrolledCoursesResponse.data
                                        : [];
                                    const userHasAccess = enrolledCourses.some(
                                        (enrolled: any) =>
                                            enrolled.course_id ===
                                                courseResponse.data?.id ||
                                            enrolled.id ===
                                                courseResponse.data?.id
                                    );
                                    setHasAccess(userHasAccess);
                                }
                            } catch (err) {
                                // If API call fails, fall back to checking video unlock status
                                console.error(
                                    "Failed to check enrolled courses:",
                                    err
                                );
                            }
                        }
                    }
                } else {
                    setError("Course not found");
                }
            } catch (err: any) {
                setError(err.message || "Failed to load course");
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchCourseData();
        }
    }, [slug]);

    // Check if user has access to the course
    useEffect(() => {
        const checkCourseAccess = async () => {
            if (course && user) {
                try {
                    // Check if user has course access by checking enrolled courses
                    const enrolledCoursesResponse =
                        await progressApi.getMyCourses();
                    if (
                        enrolledCoursesResponse.success &&
                        enrolledCoursesResponse.data
                    ) {
                        const enrolledCourses = Array.isArray(
                            enrolledCoursesResponse.data
                        )
                            ? enrolledCoursesResponse.data
                            : [];
                        const userHasAccess = enrolledCourses.some(
                            (enrolled: any) =>
                                enrolled.course_id === course.id ||
                                enrolled.id === course.id
                        );
                        setHasAccess(userHasAccess);
                    } else {
                        // Fallback: check if any video after first is unlocked
                        const hasPurchasedAccess = videos.some(
                            (video, index) => {
                                if (index === 0) return false;
                                const videoData = video as any;
                                return videoData.is_unlocked === true;
                            }
                        );
                        setHasAccess(hasPurchasedAccess);
                    }
                } catch (err) {
                    // Fallback: check video unlock status
                    const hasPurchasedAccess = videos.some((video, index) => {
                        if (index === 0) return false;
                        const videoData = video as any;
                        return videoData.is_unlocked === true;
                    });
                    setHasAccess(hasPurchasedAccess);
                }
            } else {
                setHasAccess(false);
            }
        };

        if (course && user) {
            checkCourseAccess();
        } else if (!user) {
            setHasAccess(false);
        }
    }, [course, user, videos]);

    // Refresh course access when user logs in
    useEffect(() => {
        if (user && course && !isLoginDrawerOpen && !isRegisterDrawerOpen) {
            // User just logged in, refresh course data to get access status
            const refreshAccess = async () => {
                try {
                    // Refresh videos to get updated unlock status
                    const videosResponse = await coursesApi.getVideos(
                        course.id
                    );
                    if (videosResponse.success && videosResponse.data) {
                        let videosList: Video[] = [];
                        if (Array.isArray(videosResponse.data)) {
                            videosList = videosResponse.data;
                        } else if (
                            videosResponse.data &&
                            typeof videosResponse.data === "object" &&
                            "videos" in videosResponse.data
                        ) {
                            videosList = Array.isArray(
                                (videosResponse.data as any).videos
                            )
                                ? (videosResponse.data as any).videos
                                : [];
                        }
                        videosList.sort(
                            (a, b) =>
                                (a.order_index || 0) - (b.order_index || 0)
                        );
                        setVideos(videosList);

                        // Check access
                        const enrolledCoursesResponse =
                            await progressApi.getMyCourses();
                        if (
                            enrolledCoursesResponse.success &&
                            enrolledCoursesResponse.data
                        ) {
                            const enrolledCourses = Array.isArray(
                                enrolledCoursesResponse.data
                            )
                                ? enrolledCoursesResponse.data
                                : [];
                            const userHasAccess = enrolledCourses.some(
                                (enrolled: any) =>
                                    enrolled.course_id === course.id ||
                                    enrolled.id === course.id
                            );
                            setHasAccess(userHasAccess);
                        }
                    }
                } catch (err) {
                    console.error("Failed to refresh course data:", err);
                }
            };
            // Small delay to ensure auth state is updated
            const timer = setTimeout(refreshAccess, 300);
            return () => clearTimeout(timer);
        }
    }, [user, course, isLoginDrawerOpen, isRegisterDrawerOpen]);

    // Debug: Log markdown content for troubleshooting (must be before early returns)
    useEffect(() => {
        if (videos.length > 0 && videos[currentVideoIndex]) {
            const video = videos[currentVideoIndex];
            const hasMarkdown =
                video.markdown ||
                video.markdown_content ||
                (video as any).markdown;
            if (hasMarkdown) {
                console.log("Markdown content found for video:", {
                    title: video.title,
                    markdown: video.markdown,
                    markdown_content: video.markdown_content,
                    any_markdown: (video as any).markdown,
                });
            }
        }
    }, [videos, currentVideoIndex]);

    // Check KYC status
    useEffect(() => {
        const checkKYC = async () => {
            if (!user) {
                setKycStatus(null);
                return;
            }

            try {
                setCheckingKYC(true);
                const response = await kycApi.getMyKYC();
                if (response.success && response.data) {
                    setKycStatus(response.data.status);
                } else {
                    setKycStatus(null); // No KYC submitted
                }
            } catch (err) {
                console.error("Failed to check KYC:", err);
                setKycStatus(null);
            } finally {
                setCheckingKYC(false);
            }
        };

        checkKYC();
    }, [user]);

    const handleRequestAccessClick = async () => {
        if (!user) {
            // Open login drawer if not authenticated
            setIsLoginDrawerOpen(true);
            return;
        }

        // Check KYC status before showing request modal
        try {
            const kycResponse = await kycApi.getMyKYC();
            if (!kycResponse.success || !kycResponse.data) {
                // No KYC submitted - redirect to KYC page
                router.push("/kyc?redirect=/courses/" + slug);
                return;
            }

            const kyc = kycResponse.data;
            if (kyc.status !== "verified") {
                // KYC not verified - redirect to KYC page
                router.push("/kyc?redirect=/courses/" + slug);
                return;
            }

            // KYC is verified - show request modal
            setShowRequestModal(true);
            setRequestError(null);
        } catch (err) {
            // If error checking KYC, redirect to KYC page to be safe
            router.push("/kyc?redirect=/courses/" + slug);
        }
    };

    const handleConfirmRequest = async () => {
        if (!course || !user) {
            return;
        }

        setRequestLoading(true);
        setRequestError(null);
        setRequestSuccess(false);
        setShowRequestModal(false);

        try {
            const response = await requestsApi.create({
                course_id: course.id,
                request_message: `Requesting access to ${course.name}`,
            });

            if (response.success) {
                setRequestSuccess(true);
            } else {
                // Check if it's a duplicate request error
                const errorMessage =
                    (response as any).message ||
                    response.message ||
                    "Failed to submit request. Please try again.";
                if (
                    errorMessage
                        .toLowerCase()
                        .includes("already have a pending request") ||
                    errorMessage.toLowerCase().includes("pending request") ||
                    errorMessage.toLowerCase().includes("already have")
                ) {
                    setErrorModalMessage(errorMessage);
                    setShowErrorModal(true);
                } else {
                    setRequestError(errorMessage);
                }
            }
        } catch (err: any) {
            // Extract error message from response
            let errorMessage = "Failed to submit request. Please try again.";
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            }

            // Check if it's a KYC requirement error
            if (
                errorMessage.toLowerCase().includes("kyc") ||
                errorMessage
                    .toLowerCase()
                    .includes("verification is required") ||
                err.response?.data?.requires_kyc === true
            ) {
                // Redirect to KYC page
                router.push("/kyc?redirect=/courses/" + slug);
                return;
            }

            // Check if it's a duplicate request error
            if (
                errorMessage
                    .toLowerCase()
                    .includes("already have a pending request") ||
                errorMessage.toLowerCase().includes("pending request") ||
                errorMessage.toLowerCase().includes("already have")
            ) {
                setErrorModalMessage(errorMessage);
                setShowErrorModal(true);
            } else {
                setRequestError(errorMessage);
            }
        } finally {
            setRequestLoading(false);
        }
    };

    const isVideoLocked = (video: Video, index: number) => {
        // First video (order_index === 0) is always FREE and unlocked
        if (video.order_index === 0 || index === 0) {
            return false;
        }

        // For videos after the first one, check unlock status
        const videoData = video as any;

        // If user has course access (hasAccess state), unlock all videos
        // This handles the case where user has access but backend hasn't created progress records for all videos yet
        if (hasAccess) {
            return false;
        }

        // Backend returns is_unlocked property when user has course access and progress exists
        // If video is marked as unlocked, user has access to it
        if (videoData.is_unlocked === true) {
            return false; // Video is unlocked
        }

        // If video is explicitly marked as locked, it's locked
        if (videoData.is_locked === true) {
            return true; // Video is locked
        }

        // Default: lock videos after first if user doesn't have access
        return true;
    };

    if (loading) {
        return (
            <div className="p-6 lg:p-8">
                <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="p-6 lg:p-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">
                        {error || "Course not found"}
                    </h1>
                    <Link
                        href="/courses"
                        className="text-[#B00000] hover:underline"
                    >
                        Back to Courses
                    </Link>
                </div>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="p-6 lg:p-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">
                        {course.name}
                    </h1>
                    <p className="text-gray-600 mb-4">
                        No videos available for this course yet.
                    </p>
                    <Link
                        href="/courses"
                        className="text-[#B00000] hover:underline"
                    >
                        Back to Courses
                    </Link>
                </div>
            </div>
        );
    }

    const currentVideo = videos[currentVideoIndex];

    const hasNextVideo =
        currentVideoIndex < videos.length - 1 &&
        !isVideoLocked(videos[currentVideoIndex + 1], currentVideoIndex + 1);
    const hasPrevVideo = currentVideoIndex > 0;

    const handleNextVideo = () => {
        if (
            hasNextVideo &&
            !isVideoLocked(videos[currentVideoIndex + 1], currentVideoIndex + 1)
        ) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        }
    };

    const handlePrevVideo = () => {
        if (hasPrevVideo) {
            setCurrentVideoIndex(currentVideoIndex - 1);
        }
    };

    const handleVideoSelect = (index: number) => {
        const video = videos[index];
        if (!isVideoLocked(video, index)) {
            setCurrentVideoIndex(index);
        }
    };

    // Get video URL - handle both property names
    const getVideoUrl = (video: Video) => {
        const videoUrl = (video as any).video_url || video.youtube_url || "";
        // Ensure it's an embed URL
        if (videoUrl && !videoUrl.includes("embed")) {
            // Convert YouTube URL to embed format if needed
            const match = videoUrl.match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
            );
            if (match) {
                return `https://www.youtube.com/embed/${match[1]}`;
            }
        }
        return videoUrl;
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <Link
                        href="/courses"
                        className="inline-flex items-center space-x-2 text-sm sm:text-base text-gray-600 hover:text-[#B00000] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            Back to Courses
                        </span>
                        <span className="sm:hidden">Back</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Main Video Player */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
                        {/* Video Player */}
                        <div className="bg-white rounded-xl overflow-hidden">
                            <div className="aspect-video bg-black w-full relative">
                                {isVideoLocked(
                                    currentVideo,
                                    currentVideoIndex
                                ) ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                        <div className="text-center px-4">
                                            <Lock className="w-16 h-16 text-white mx-auto mb-4" />
                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                This video is locked
                                            </h3>
                                            <p className="text-gray-300 mb-4">
                                                Request course access to unlock
                                                all videos
                                            </p>
                                            {!user ? (
                                                <button
                                                    onClick={() =>
                                                        setIsLoginDrawerOpen(
                                                            true
                                                        )
                                                    }
                                                    className="px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center space-x-2 mx-auto"
                                                >
                                                    <span>
                                                        Login to Request Access
                                                    </span>
                                                </button>
                                            ) : requestSuccess ? (
                                                <div className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium">
                                                    Request Submitted
                                                    Successfully!
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={
                                                        handleRequestAccessClick
                                                    }
                                                    disabled={
                                                        requestLoading ||
                                                        requestSuccess
                                                    }
                                                    className="px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {requestLoading ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            <span>
                                                                Submitting...
                                                            </span>
                                                        </>
                                                    ) : requestSuccess ? (
                                                        <>
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span>
                                                                Request
                                                                Submitted
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>
                                                                Request Course
                                                                Access
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {requestError && (
                                                <p className="text-red-400 mt-2 text-sm">
                                                    {requestError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <iframe
                                        src={getVideoUrl(currentVideo)}
                                        title={currentVideo.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                )}
                            </div>
                            {/* Video Title - Below Player */}
                            <div className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">
                                        {currentVideo.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Lesson {currentVideoIndex + 1} of{" "}
                                        {videos.length}
                                    </p>
                                </div>

                                {/* Video Description */}
                                {currentVideo.description && (
                                    <div>
                                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                            {currentVideo.description}
                                        </p>
                                    </div>
                                )}

                                {/* PDF Downloads */}
                                {(currentVideo as any).pdfs &&
                                    Array.isArray((currentVideo as any).pdfs) &&
                                    (currentVideo as any).pdfs.length > 0 && (
                                        <div className="border-t border-gray-200 pt-4">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                                                <FileText className="w-4 h-4" />
                                                <span>
                                                    Resources & Downloads
                                                </span>
                                            </h4>
                                            <div className="space-y-2">
                                                {(
                                                    (currentVideo as any)
                                                        .pdfs || []
                                                ).map(
                                                    (
                                                        pdf: any,
                                                        index: number
                                                    ) => (
                                                        <a
                                                            key={index}
                                                            href={pdf.url}
                                                            download
                                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 rounded-lg bg-[#B00000]/10 flex items-center justify-center">
                                                                    <FileText className="w-5 h-5 text-[#B00000]" />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {pdf.name}
                                                                </span>
                                                            </div>
                                                            <Download className="w-4 h-4 text-gray-500 group-hover:text-[#B00000] transition-colors" />
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Markdown Content */}
                                {(currentVideo.markdown ||
                                    currentVideo.markdown_content ||
                                    (currentVideo as any).markdown) && (
                                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                                            Course Notes & Details
                                        </h4>
                                        <div className="markdown-content text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {(() => {
                                                let markdownText =
                                                    currentVideo.markdown ||
                                                    currentVideo.markdown_content ||
                                                    (currentVideo as any)
                                                        .markdown ||
                                                    "";

                                                // Replace escaped newlines with actual newlines
                                                markdownText =
                                                    markdownText.replace(
                                                        /\\n/g,
                                                        "\n"
                                                    );

                                                const lines =
                                                    markdownText.split("\n");
                                                const elements: React.ReactElement[] =
                                                    [];
                                                let i = 0;

                                                while (i < lines.length) {
                                                    const line = lines[i];

                                                    // Headers
                                                    if (line.startsWith("# ")) {
                                                        elements.push(
                                                            <h1
                                                                key={i}
                                                                className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3"
                                                            >
                                                                {line.substring(
                                                                    2
                                                                )}
                                                            </h1>
                                                        );
                                                        i++;
                                                    } else if (
                                                        line.startsWith("## ")
                                                    ) {
                                                        elements.push(
                                                            <h2
                                                                key={i}
                                                                className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2"
                                                            >
                                                                {line.substring(
                                                                    3
                                                                )}
                                                            </h2>
                                                        );
                                                        i++;
                                                    } else if (
                                                        line.startsWith("### ")
                                                    ) {
                                                        elements.push(
                                                            <h3
                                                                key={i}
                                                                className="text-base font-semibold text-slate-900 dark:text-white mt-3 mb-2"
                                                            >
                                                                {line.substring(
                                                                    4
                                                                )}
                                                            </h3>
                                                        );
                                                        i++;
                                                    }
                                                    // Horizontal rule
                                                    else if (
                                                        line.trim() === "---" ||
                                                        line.trim() === "***" ||
                                                        line.trim() === "___"
                                                    ) {
                                                        elements.push(
                                                            <hr
                                                                key={i}
                                                                className="my-4 border-gray-300 dark:border-slate-600"
                                                            />
                                                        );
                                                        i++;
                                                    }
                                                    // Unordered lists
                                                    else if (
                                                        line.startsWith("- ")
                                                    ) {
                                                        const listItems: string[] =
                                                            [];
                                                        while (
                                                            i < lines.length &&
                                                            lines[i].startsWith(
                                                                "- "
                                                            )
                                                        ) {
                                                            listItems.push(
                                                                lines[
                                                                    i
                                                                ].substring(2)
                                                            );
                                                            i++;
                                                        }
                                                        elements.push(
                                                            <ul
                                                                key={i}
                                                                className="list-disc ml-6 mb-3 space-y-1"
                                                            >
                                                                {listItems.map(
                                                                    (
                                                                        item,
                                                                        idx
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                idx
                                                                            }
                                                                        >
                                                                            {
                                                                                item
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        );
                                                    }
                                                    // Ordered lists
                                                    else if (
                                                        /^\d+\. /.test(line)
                                                    ) {
                                                        const listItems: string[] =
                                                            [];
                                                        while (
                                                            i < lines.length &&
                                                            /^\d+\. /.test(
                                                                lines[i]
                                                            )
                                                        ) {
                                                            const match =
                                                                lines[i].match(
                                                                    /^\d+\. (.*)/
                                                                );
                                                            if (match) {
                                                                listItems.push(
                                                                    match[1]
                                                                );
                                                            }
                                                            i++;
                                                        }
                                                        elements.push(
                                                            <ol
                                                                key={i}
                                                                className="list-decimal ml-6 mb-3 space-y-1"
                                                            >
                                                                {listItems.map(
                                                                    (
                                                                        item,
                                                                        idx
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                idx
                                                                            }
                                                                        >
                                                                            {
                                                                                item
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ol>
                                                        );
                                                    }
                                                    // Regular text
                                                    else if (line.trim()) {
                                                        const processedLine =
                                                            line
                                                                .replace(
                                                                    /\*\*(.*?)\*\*/g,
                                                                    '<strong class="font-semibold">$1</strong>'
                                                                )
                                                                .replace(
                                                                    /\*(.*?)\*/g,
                                                                    "<em>$1</em>"
                                                                );
                                                        elements.push(
                                                            <p
                                                                key={i}
                                                                className="mb-2"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: processedLine,
                                                                }}
                                                            />
                                                        );
                                                        i++;
                                                    } else {
                                                        i++;
                                                    }
                                                }

                                                return elements;
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Course Request Banner - Show after first video */}
                        {currentVideoIndex === 0 &&
                            videos.length > 1 &&
                            !hasAccess && (
                                <div className="bg-gradient-to-r from-[#B00000] to-red-700 rounded-xl p-4 sm:p-6 text-white">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg sm:text-xl font-bold mb-2">
                                                Want to continue learning?
                                            </h3>
                                            <p className="text-sm sm:text-base text-white/90">
                                                Request access to unlock all{" "}
                                                {videos.length} lessons in this
                                                course
                                            </p>
                                            {requestError && (
                                                <p className="text-red-200 mt-2 text-sm">
                                                    {requestError}
                                                </p>
                                            )}
                                            {requestSuccess && (
                                                <p className="text-green-200 mt-2 text-sm">
                                                    Request submitted
                                                    successfully! Admin will
                                                    review your request.
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0">
                                            {!user ? (
                                                <button
                                                    onClick={() =>
                                                        setIsLoginDrawerOpen(
                                                            true
                                                        )
                                                    }
                                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-[#B00000] rounded-lg font-medium hover:bg-gray-100 transition-all duration-300 whitespace-nowrap"
                                                >
                                                    Login to Request
                                                </button>
                                            ) : requestSuccess ? (
                                                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-medium whitespace-nowrap">
                                                    Request Submitted ✓
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={
                                                        handleRequestAccessClick
                                                    }
                                                    disabled={
                                                        requestLoading ||
                                                        requestSuccess
                                                    }
                                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-[#B00000] rounded-lg font-medium hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center space-x-2"
                                                >
                                                    {requestLoading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>
                                                                Submitting...
                                                            </span>
                                                        </>
                                                    ) : requestSuccess ? (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>
                                                                Request
                                                                Submitted
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span>
                                                            Request Course
                                                            Access
                                                        </span>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                            <button
                                onClick={handlePrevVideo}
                                disabled={!hasPrevVideo}
                                className={`
                                    flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base
                                    ${
                                        hasPrevVideo
                                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                                    }
                                `}
                            >
                                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">
                                    Previous
                                </span>
                                <span className="sm:hidden">Prev</span>
                            </button>

                            <button
                                onClick={handleNextVideo}
                                disabled={!hasNextVideo}
                                className={`
                                    flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base
                                    ${
                                        hasNextVideo
                                            ? "bg-[#B00000] text-white hover:bg-red-800"
                                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                                    }
                                `}
                            >
                                <span>Next</span>
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Video List Sidebar */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="bg-white rounded-xl p-3 sm:p-4 lg:sticky lg:top-24 max-h-[600px] lg:max-h-[calc(100vh-120px)] overflow-y-auto">
                            {/* Course Heading - On Side */}
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
                                {course.name}
                            </h2>
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
                                Course Content
                            </h3>
                            {!hasAccess && (
                                <div className="mb-4 p-4 bg-[#B00000]/10 rounded-xl border border-[#B00000]/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">
                                                Unlock Full Course
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                Get access to all{" "}
                                                {videos.length} lessons
                                            </p>
                                        </div>
                                        <div className="text-2xl font-bold text-[#B00000]">
                                            ₹
                                            {(typeof course.price === "number"
                                                ? course.price
                                                : parseFloat(
                                                      String(
                                                          course.price || "0"
                                                      )
                                                  )
                                            ).toFixed(2)}
                                        </div>
                                    </div>

                                    {/* KYC Status Indicator */}
                                    {user &&
                                        kycStatus &&
                                        kycStatus !== "verified" && (
                                            <div
                                                className={`mb-3 p-3 rounded-lg ${
                                                    kycStatus === "pending"
                                                        ? "bg-yellow-50 border border-yellow-200"
                                                        : "bg-red-50 border border-red-200"
                                                }`}
                                            >
                                                <div className="flex items-start space-x-2">
                                                    {kycStatus === "pending" ? (
                                                        <Loader2 className="w-5 h-5 text-yellow-600 mt-0.5 animate-spin" />
                                                    ) : (
                                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p
                                                            className={`text-sm font-medium ${
                                                                kycStatus ===
                                                                "pending"
                                                                    ? "text-yellow-800"
                                                                    : "text-red-800"
                                                            }`}
                                                        >
                                                            {kycStatus ===
                                                            "pending"
                                                                ? "KYC verification pending. Please wait for admin approval."
                                                                : "KYC verification required. Please complete your KYC to request course access."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    {!user ? (
                                        <button
                                            onClick={() =>
                                                setIsLoginDrawerOpen(true)
                                            }
                                            className="w-full px-4 py-2.5 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center justify-center space-x-2"
                                        >
                                            <span>Login to Request Access</span>
                                        </button>
                                    ) : requestSuccess ? (
                                        <div className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-center">
                                            Request Submitted ✓
                                        </div>
                                    ) : checkingKYC ? (
                                        <button
                                            disabled
                                            className="w-full px-4 py-2.5 bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center space-x-2 cursor-not-allowed"
                                        >
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Checking...</span>
                                        </button>
                                    ) : kycStatus &&
                                      kycStatus !== "verified" ? (
                                        <button
                                            onClick={() =>
                                                router.push(
                                                    "/kyc?redirect=/courses/" +
                                                        slug
                                                )
                                            }
                                            className="w-full px-4 py-2.5 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center justify-center space-x-2"
                                        >
                                            <span>
                                                {kycStatus === "pending"
                                                    ? "View KYC Status"
                                                    : "Complete KYC Verification"}
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleRequestAccessClick}
                                            disabled={
                                                requestLoading || requestSuccess
                                            }
                                            className="w-full px-4 py-2.5 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {requestLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Submitting...</span>
                                                </>
                                            ) : requestSuccess ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span>
                                                        Request Submitted
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>
                                                        Request Course Access
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="space-y-2">
                                {videos.map((video, index) => {
                                    const locked = isVideoLocked(video, index);
                                    return (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                handleVideoSelect(index)
                                            }
                                            disabled={locked}
                                            className={`
                                                w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300
                                                ${
                                                    locked
                                                        ? "opacity-60 cursor-not-allowed bg-gray-50"
                                                        : index ===
                                                          currentVideoIndex
                                                        ? "bg-[#B00000] text-white"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }
                                            `}
                                        >
                                            <div className="flex items-start space-x-2 sm:space-x-3">
                                                <div
                                                    className={`
                                                    shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center
                                                    ${
                                                        locked
                                                            ? "bg-gray-300"
                                                            : index ===
                                                              currentVideoIndex
                                                            ? "bg-white/20"
                                                            : "bg-[#B00000]/10"
                                                    }
                                                `}
                                                >
                                                    {locked ? (
                                                        <Lock
                                                            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500`}
                                                        />
                                                    ) : index <
                                                      currentVideoIndex ? (
                                                        <CheckCircle2
                                                            className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                                                index ===
                                                                currentVideoIndex
                                                                    ? "text-white"
                                                                    : "text-[#B00000]"
                                                            }`}
                                                        />
                                                    ) : (
                                                        <Play
                                                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                                                index ===
                                                                currentVideoIndex
                                                                    ? "text-white"
                                                                    : "text-[#B00000]"
                                                            }`}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`
                                                        text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 line-clamp-2
                                                        ${
                                                            index ===
                                                            currentVideoIndex
                                                                ? "text-white"
                                                                : "text-gray-900"
                                                        }
                                                    `}
                                                    >
                                                        {video.title}
                                                    </p>
                                                    <p
                                                        className={`
                                                        text-xs
                                                        ${
                                                            locked
                                                                ? "text-gray-400"
                                                                : index ===
                                                                  currentVideoIndex
                                                                ? "text-white/80"
                                                                : "text-gray-500"
                                                        }
                                                    `}
                                                    >
                                                        {locked
                                                            ? "Locked"
                                                            : `Lesson ${
                                                                  index + 1
                                                              }`}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Request Confirmation Modal */}
            {showRequestModal && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => setShowRequestModal(false)}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-[#B00000]/10 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-[#B00000]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Request Course Access
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-gray-700 mb-4">
                                    Are you sure you want to request access to{" "}
                                    <span className="font-semibold text-slate-900">
                                        {course?.name}
                                    </span>
                                    ?
                                </p>
                                <p className="text-sm text-gray-600 mb-6">
                                    Your request will be sent to the admin for
                                    review. You will be notified once your
                                    request is approved.
                                </p>

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowRequestModal(false)
                                        }
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmRequest}
                                        className="px-4 py-2 text-sm font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
                                    >
                                        <span>Confirm Request</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Error Modal for Duplicate Request */}
            {showErrorModal && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                        onClick={() => setShowErrorModal(false)}
                    ></div>

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Request Already Submitted
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-gray-700 mb-4">
                                    {errorModalMessage ||
                                        "You already have a pending request for this course."}
                                </p>
                                <p className="text-sm text-gray-600 mb-6">
                                    Please wait for the admin to review your
                                    existing request. You will be notified once
                                    it's approved.
                                </p>

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowErrorModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Login Drawer */}
            <LoginDrawer
                isOpen={isLoginDrawerOpen}
                preventRedirect={true}
                onClose={() => {
                    setIsLoginDrawerOpen(false);
                }}
                onSwitchToRegister={() => {
                    setIsLoginDrawerOpen(false);
                    setIsRegisterDrawerOpen(true);
                }}
            />

            {/* Register Drawer */}
            <RegisterDrawer
                isOpen={isRegisterDrawerOpen}
                preventRedirect={true}
                onClose={() => setIsRegisterDrawerOpen(false)}
                onSwitchToLogin={() => {
                    setIsRegisterDrawerOpen(false);
                    setIsLoginDrawerOpen(true);
                }}
            />
        </div>
    );
}
