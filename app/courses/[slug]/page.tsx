"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import {
    ArrowLeft,
    Play,
    ChevronRight,
    CheckCircle2,
    Lock,
    FileText,
    Download,
    Loader2,
} from "lucide-react";
import { coursesApi } from "@/lib/api/courses";
import { progressApi } from "@/lib/api/progress";
import { paymentsApi } from "@/lib/api/payments";
import { useAuth } from "@/contexts/AuthContext";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";
import type { CourseDetails, Video } from "@/lib/api/types";
import { setRedirectPath, shouldPreserveRedirect } from "@/lib/utils/redirect";

// Razorpay types
type RazorpaySuccessResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
};

type RazorpayOptions = {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    handler: (response: RazorpaySuccessResponse) => void;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, string>;
    theme?: { color?: string };
    modal?: {
        ondismiss?: () => void;
    };
};

type RazorpayInstance = {
    open: () => void;
    on?: (event: string, cb: (response?: any) => void) => void;
};

type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
    interface Window {
        Razorpay?: RazorpayCtor;
    }
}

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
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Inject CSS early to hide YouTube share button - must be at top level
    useEffect(() => {
        const styleId = "youtube-share-button-hide";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
                .fullscreen-controls-always-on .fullscreen-action-menu {
                    display: none !important;
                }
                /* Hide YouTube share button and Copy Link button */
                ytd-menu-renderer[target-id="watch-fullscreen-action-menu"],
                .ytp-fullscreen-button,
                .ytp-share-button,
                .ytp-copylink-button,
                button[aria-label*="Copy"],
                button[aria-label*="copy"],
                button[title*="Copy"],
                button[title*="copy"],
                ytd-menu-renderer[target-id*="copy"],
                ytd-menu-renderer[target-id*="Copy"],
                /* Privacy-enhanced mode Copy Link button selectors */
                .ytp-copylink-icon,
                ytd-copylink-button-renderer,
                #copy-link-button,
                button.ytp-button[aria-label*="link"],
                /* Additional share menu items */
                ytd-menu-service-item-renderer[aria-label*="Copy"],
                ytd-menu-service-item-renderer[aria-label*="Share"] {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    // Block clipboard operations to prevent copying video URLs (YouTube and Vimeo)
    useEffect(() => {
        const handleCopy = (e: ClipboardEvent) => {
            // Block copying if it contains video platform URLs
            const selection = window.getSelection()?.toString() || "";
            const clipboardData = e.clipboardData;

            if (
                selection.includes("youtube.com") ||
                selection.includes("youtu.be") ||
                selection.includes("youtube-nocookie.com") ||
                selection.includes("vimeo.com")
            ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Also check clipboard data
            if (clipboardData) {
                const pastedData = clipboardData.getData("text/plain");
                if (
                    pastedData.includes("youtube.com") ||
                    pastedData.includes("youtu.be") ||
                    pastedData.includes("youtube-nocookie.com") ||
                    pastedData.includes("vimeo.com")
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
        };

        const handleCopyEvent = (e: Event) => {
            const event = e as ClipboardEvent;
            handleCopy(event);
        };

        // Block copy events
        document.addEventListener("copy", handleCopyEvent, true);
        document.addEventListener("cut", handleCopyEvent, true);

        // Block keyboard shortcuts (Ctrl+C, Cmd+C)
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "c") {
                const selection = window.getSelection()?.toString() || "";
                if (
                    selection.includes("youtube.com") ||
                    selection.includes("youtu.be") ||
                    selection.includes("youtube-nocookie.com") ||
                    selection.includes("vimeo.com")
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);

        return () => {
            document.removeEventListener("copy", handleCopyEvent, true);
            document.removeEventListener("cut", handleCopyEvent, true);
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, []);

    // Handle fullscreen mode - add overlays when fullscreen is entered
    useEffect(() => {
        const handleFullscreenChange = () => {
            const fullscreenElement =
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement;

            if (fullscreenElement) {
                // Fullscreen entered - add overlays to block sharing options
                const overlayId = "fullscreen-share-blocker";
                if (!document.getElementById(overlayId)) {
                    const overlay = document.createElement("div");
                    overlay.id = overlayId;
                    overlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        right: 0;
                        width: 150px;
                        height: 80px;
                        background: linear-gradient(225deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.8) 70%, transparent 100%);
                        clip-path: polygon(100% 0, 100% 100%, 0 0);
                        pointer-events: auto;
                        z-index: 999999;
                        cursor: not-allowed;
                    `;
                    overlay.onclick = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    };
                    overlay.onmousedown = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    };
                    overlay.oncontextmenu = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    };
                    fullscreenElement.appendChild(overlay);
                }
            } else {
                // Fullscreen exited - remove overlays
                const overlay = document.getElementById(
                    "fullscreen-share-blocker"
                );
                if (overlay) {
                    overlay.remove();
                }
            }
        };

        // Listen for fullscreen changes
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener(
            "webkitfullscreenchange",
            handleFullscreenChange
        );
        document.addEventListener(
            "mozfullscreenchange",
            handleFullscreenChange
        );
        document.addEventListener("MSFullscreenChange", handleFullscreenChange);

        return () => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );
            document.removeEventListener(
                "webkitfullscreenchange",
                handleFullscreenChange
            );
            document.removeEventListener(
                "mozfullscreenchange",
                handleFullscreenChange
            );
            document.removeEventListener(
                "MSFullscreenChange",
                handleFullscreenChange
            );

            // Clean up overlay if it exists
            const overlay = document.getElementById("fullscreen-share-blocker");
            if (overlay) {
                overlay.remove();
            }
        };
    }, []);

    // Helper to open login drawer with redirect preservation
    const handleOpenLoginDrawer = () => {
        const currentPath = `/courses/${slug}`;
        if (shouldPreserveRedirect(currentPath)) {
            setRedirectPath(currentPath);
        }
        setIsLoginDrawerOpen(true);
    };

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

    async function loadRazorpayScript(): Promise<boolean> {
        if (typeof window === "undefined") return false;
        if ((window as any).Razorpay) return true;
        return await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    const handlePurchaseCourse = async () => {
        if (!course || !user) {
            if (!user) {
                handleOpenLoginDrawer();
            }
            return;
        }

        setIsProcessingPayment(true);

        try {
            // Create course purchase order
            const purchaseResponse = await coursesApi.purchase(course.id);
            const orderId = purchaseResponse.data?.order_id;
            if (!orderId)
                throw new Error("Failed to create course purchase order");

            // Load Razorpay SDK
            const ok = await loadRazorpayScript();
            if (!ok || !window.Razorpay) {
                setIsProcessingPayment(false);
                throw new Error(
                    "Razorpay payment gateway failed to load. Please refresh and try again."
                );
            }

            // Create Razorpay order
            const rp = await paymentsApi.createRazorpayOrder({
                order_id: orderId,
            });
            if (!rp.data) {
                setIsProcessingPayment(false);
                throw new Error(
                    "Failed to initialize payment. Please try again."
                );
            }

            const options: RazorpayOptions = {
                key: rp.data.key_id,
                amount: rp.data.amount,
                currency: rp.data.currency,
                name: "DiagTools",
                description: `Course: ${course.name}`,
                order_id: rp.data.razorpay_order_id,
                handler: async (response) => {
                    try {
                        setIsProcessingPayment(true);
                        // Verify payment with backend
                        await paymentsApi.verifyRazorpayPayment({
                            internal_order_id: orderId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        // Payment verified successfully - refresh page to show access
                        setIsProcessingPayment(false);
                        window.location.reload();
                    } catch (e: any) {
                        setIsProcessingPayment(false);
                        const errorMsg =
                            e?.response?.data?.message ||
                            e?.message ||
                            "Payment verification failed";
                        alert(`Payment verification failed: ${errorMsg}`);
                    }
                },
                prefill: {
                    name: `${user.first_name || ""} ${
                        user.last_name || ""
                    }`.trim(),
                    email: user.email || "",
                    contact: "",
                },
                notes: { course_id: course.id },
                theme: { color: "#B00000" },
            };

            const rzp = new window.Razorpay({
                ...options,
                modal: {
                    ondismiss: () => {
                        setIsProcessingPayment(false);
                    },
                },
            });

            // Handle payment failure
            rzp.on?.("payment.failed", (response: any) => {
                setIsProcessingPayment(false);
                const errorMsg =
                    response?.error?.description ||
                    response?.error?.reason ||
                    "Payment failed";
                alert(`Payment failed: ${errorMsg}`);
            });

            // Open Razorpay payment modal
            rzp.open();
            setIsProcessingPayment(false); // Modal opened, user can interact
        } catch (err: any) {
            setIsProcessingPayment(false);

            // Check for KYC or Terms requirement errors
            // The API client returns the error response in err.response.data or directly in err
            const errorResponse = err?.response?.data || err?.data || err || {};
            const errorMessage = errorResponse.message || err?.message || "";

            // Check if user already has access to the course
            if (
                errorResponse.already_purchased === true ||
                errorMessage.toLowerCase().includes("already have access") ||
                errorMessage.toLowerCase().includes("already purchased")
            ) {
                // User already has access - refresh page to update UI
                alert(
                    "✅ You already have access to this course!\n\nRefreshing page..."
                );
                window.location.reload();
                return;
            }

            // Check for KYC or Terms requirement errors ONLY if those flags are explicitly set
            if (
                errorResponse.requires_kyc === true ||
                errorResponse.requires_terms_acceptance === true
            ) {
                // Redirect to KYC page with redirect path
                setRedirectPath(`/courses/${slug}`);
                router.push(`/kyc?redirect=/courses/${slug}`);
                return;
            }

            // Show generic error for other cases
            alert(errorMessage || "Purchase failed. Please try again.");
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

    // Extract YouTube video ID from any URL format
    const extractYouTubeId = (url: string): string | null => {
        if (!url) return null;

        // Handle embed URLs
        const embedMatch = url.match(
            /(?:youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([^&\n?#]+)/
        );
        if (embedMatch) return embedMatch[1];

        // Handle watch URLs
        const watchMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
        );
        if (watchMatch) return watchMatch[1];

        // Handle short URLs
        const shortMatch = url.match(/youtu\.be\/([^&\n?#]+)/);
        if (shortMatch) return shortMatch[1];

        return null;
    };

    // Detect video platform (YouTube or Vimeo)
    const detectVideoPlatform = (
        url: string
    ): "youtube" | "vimeo" | "unknown" => {
        if (!url) return "unknown";
        const urlLower = url.toLowerCase();

        if (
            urlLower.includes("youtube.com") ||
            urlLower.includes("youtu.be") ||
            urlLower.includes("youtube-nocookie.com")
        ) {
            return "youtube";
        }

        if (urlLower.includes("vimeo.com")) {
            return "vimeo";
        }

        return "unknown";
    };

    // Extract Vimeo video ID from URL
    const extractVimeoId = (url: string): string | null => {
        // Handle player.vimeo.com/video/ID format
        const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
        if (playerMatch && playerMatch[1]) {
            return playerMatch[1];
        }
        
        // Handle vimeo.com/ID format (including channels, groups)
        const regExp =
            /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|video\/|)(\d+)(?:|\/\?))/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    };

    // Get video URL for iframe embed (supports both YouTube and Vimeo)
    const getVideoUrl = (video: Video): string => {
        const videoUrl = (video as any).video_url || video.youtube_url || "";
        if (!videoUrl) return "";

        const platform = detectVideoPlatform(videoUrl);

        // Handle Vimeo videos
        if (platform === "vimeo") {
            const videoId = extractVimeoId(videoUrl);
            if (videoId) {
                // Vimeo embed with privacy options
                return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&dnt=1`;
            }
            // If already an embed URL, return as is
            if (videoUrl.includes("player.vimeo.com")) {
                return videoUrl;
            }
            return videoUrl;
        }

        // Handle YouTube videos (existing logic)
        if (platform === "youtube") {
        const videoId = extractYouTubeId(videoUrl);
        if (videoId) {
            // Use youtube-nocookie.com to remove Share and Watch Later buttons
            return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&playsinline=1`;
        }

        // If already an embed URL, convert to youtube-nocookie.com
            if (videoUrl.includes("embed")) {
            try {
                let urlToParse = videoUrl.startsWith("http")
                    ? videoUrl
                    : `https://${videoUrl}`;

                urlToParse = urlToParse.replace(
                    /youtube\.com\/embed\//g,
                    "youtube-nocookie.com/embed/"
                );

                const url = new URL(urlToParse);
                url.searchParams.set("modestbranding", "1");
                url.searchParams.set("rel", "0");
                url.searchParams.set("controls", "1");
                url.searchParams.set("fs", "1");
                url.searchParams.set("cc_load_policy", "0");
                url.searchParams.set("iv_load_policy", "3");
                url.searchParams.set("playsinline", "1");
                return url.toString();
            } catch (e) {
                let processedUrl = videoUrl.replace(
                    /youtube\.com\/embed\//g,
                    "youtube-nocookie.com/embed/"
                );
                const separator = processedUrl.includes("?") ? "&" : "?";
                return `${processedUrl}${separator}modestbranding=1&rel=0&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&playsinline=1`;
                }
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
                                                Purchase this course to unlock
                                                all videos
                                            </p>
                                            {!user ? (
                                                <button
                                                    onClick={
                                                        handleOpenLoginDrawer
                                                    }
                                                    className="px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center space-x-2 mx-auto"
                                                >
                                                    <span>
                                                        Login to Purchase
                                                    </span>
                                                </button>
                                            ) : hasAccess ? (
                                                <div className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium">
                                                    Course Purchased ✓
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={
                                                        handlePurchaseCourse
                                                    }
                                                    disabled={
                                                        isProcessingPayment
                                                    }
                                                    className="px-6 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isProcessingPayment ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            <span>
                                                                Processing...
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>
                                                                Purchase Course
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="relative w-full h-full"
                                        onContextMenu={(e) => {
                                            // Prevent right-click menu on video container
                                            e.preventDefault();
                                            return false;
                                        }}
                                    >
                                        <iframe
                                            src={getVideoUrl(currentVideo)}
                                            title={currentVideo.title}
                                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                        ></iframe>
                                    </div>
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
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <h4 className="text-sm font-semibold text-slate-900 mb-3">
                                            Course Notes & Details
                                        </h4>
                                        <div className="markdown-content prose prose-sm sm:prose-base max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[rehypeRaw]}
                                                components={{
                                                    // Headings
                                                    h1: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <h1
                                                            className="text-2xl font-bold text-slate-900 mt-6 mb-4"
                                                            {...props}
                                                        />
                                                    ),
                                                    h2: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <h2
                                                            className="text-xl font-bold text-slate-900 mt-5 mb-3"
                                                            {...props}
                                                        />
                                                    ),
                                                    h3: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <h3
                                                            className="text-lg font-semibold text-slate-900 mt-4 mb-2"
                                                            {...props}
                                                        />
                                                    ),
                                                    h4: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <h4
                                                            className="text-base font-semibold text-slate-900 mt-3 mb-2"
                                                            {...props}
                                                        />
                                                    ),
                                                    h5: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <h5
                                                            className="text-sm font-semibold text-slate-900 mt-2 mb-1"
                                                            {...props}
                                                        />
                                                    ),
                                                    h6: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <h6
                                                            className="text-sm font-medium text-slate-900 mt-2 mb-1"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Paragraphs
                                                    p: ({ node, ...props }) => (
                                                        <p
                                                            className="mb-3 text-gray-700 leading-relaxed"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Links
                                                    a: ({ node, ...props }) => (
                                                        <a
                                                            className="text-[#B00000] hover:text-red-800 underline font-medium"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Lists
                                                    ul: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <ul
                                                            className="list-disc ml-6 mb-3 space-y-1 text-gray-700"
                                                            {...props}
                                                        />
                                                    ),
                                                    ol: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <ol
                                                            className="list-decimal ml-6 mb-3 space-y-1 text-gray-700"
                                                            {...props}
                                                        />
                                                    ),
                                                    li: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <li
                                                            className="mb-1"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Horizontal rule (divider)
                                                    hr: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <hr
                                                            className="my-6 border-gray-300"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Code blocks
                                                    code: ({
                                                        node,
                                                        inline,
                                                        ...props
                                                    }: any) => {
                                                        if (inline) {
                                                            return (
                                                                <code
                                                                    className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800"
                                                                    {...props}
                                                                />
                                                            );
                                                        }
                                                        return (
                                                            <code
                                                                className="block bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto mb-3"
                                                                {...props}
                                                            />
                                                        );
                                                    },
                                                    pre: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <pre
                                                            className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Blockquotes
                                                    blockquote: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <blockquote
                                                            className="border-l-4 border-[#B00000] pl-4 italic text-gray-600 my-3"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Images
                                                    img: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <img
                                                            className="rounded-lg my-4 max-w-full h-auto"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Tables (from remark-gfm)
                                                    table: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <div className="overflow-x-auto my-4">
                                                            <table
                                                                className="min-w-full border border-gray-300 rounded-lg"
                                                                {...props}
                                                            />
                                                        </div>
                                                    ),
                                                    thead: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <thead
                                                            className="bg-gray-50"
                                                            {...props}
                                                        />
                                                    ),
                                                    th: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <th
                                                            className="px-4 py-2 text-left font-semibold text-slate-900 border-b border-gray-300"
                                                            {...props}
                                                        />
                                                    ),
                                                    td: ({
                                                        node,
                                                        ...props
                                                    }) => (
                                                        <td
                                                            className="px-4 py-2 border-b border-gray-200 text-gray-700"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Iframes (via rehype-raw)
                                                    iframe: ({
                                                        node,
                                                        ...props
                                                    }: any) => (
                                                        <div className="my-4 rounded-lg overflow-hidden">
                                                            <iframe
                                                                className="w-full"
                                                                style={{
                                                                    minHeight:
                                                                        "400px",
                                                                }}
                                                                allowFullScreen
                                                                {...props}
                                                            />
                                                        </div>
                                                    ),
                                                }}
                                            >
                                                {(() => {
                                                    let markdownText =
                                                        currentVideo.markdown ||
                                                        currentVideo.markdown_content ||
                                                        (currentVideo as any)
                                                            .markdown ||
                                                        "";

                                                    // Replace escaped newlines with actual newlines
                                                    return markdownText.replace(
                                                        /\\n/g,
                                                        "\n"
                                                    );
                                                })()}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Course Purchase Banner - Show after first video */}
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
                                                Purchase this course to unlock
                                                all {videos.length} lessons
                                            </p>
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
                                                    Login to Purchase
                                                </button>
                                            ) : hasAccess ? (
                                                <div className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-medium whitespace-nowrap">
                                                    Course Purchased ✓
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={
                                                        handlePurchaseCourse
                                                    }
                                                    disabled={
                                                        isProcessingPayment
                                                    }
                                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-[#B00000] rounded-lg font-medium hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center space-x-2"
                                                >
                                                    {isProcessingPayment ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span>
                                                                Processing...
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>
                                                                Purchase Course
                                                            </span>
                                                        </>
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

                                    {!user ? (
                                        <button
                                            onClick={handleOpenLoginDrawer}
                                            className="w-full px-4 py-2.5 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center justify-center space-x-2"
                                        >
                                            <span>Login to Purchase</span>
                                        </button>
                                    ) : hasAccess ? (
                                        <div className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-center">
                                            Course Purchased ✓
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handlePurchaseCourse}
                                            disabled={isProcessingPayment}
                                            className="w-full px-4 py-2.5 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessingPayment ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Purchase Course</span>
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
                    handleOpenLoginDrawer();
                }}
            />
        </div>
    );
}
