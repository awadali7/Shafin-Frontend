// API Response Types

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

// Auth Types
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role?: "user" | "admin";
    user_type?: "student" | "business_owner" | null;
    course_terms_accepted_at?: string | null;
    product_terms_accepted_at?: string | null;
    profile_picture?: string | null;
    last_login_at?: string;
    last_login_ip?: string;
    last_login_device?: DeviceInfo;
    created_at?: string;
    updated_at?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

export interface DeviceInfo {
    deviceType: "mobile" | "tablet" | "desktop" | "unknown";
    browser: string;
    os: string;
    userAgent: string;
}

export interface Session {
    id: string;
    sessionToken: string;
    deviceInfo: DeviceInfo;
    ipAddress: string;
    userAgent: string;
    lastActivity: string;
    createdAt: string;
    expiresAt: string;
    isCurrent: boolean;
}

export interface AuthResponse {
    user: User;
    token: string;
    refreshToken?: string;
    deviceInfo?: DeviceInfo;
}

// Course Types
export interface Course {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    cover_image?: string;
    is_featured?: boolean;
    created_at?: string;
    updated_at?: string;
    videos?: Video[];
    video_count?: number;
}

export interface CourseDetails extends Course {
    videos: Video[];
}

// Video Types
export interface Video {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    youtube_url: string;
    video_url?: string; // Alternative field name
    order_index: number;
    pdf_url?: string;
    pdfs?: Array<{ name: string; url: string }>;
    markdown_content?: string;
    markdown?: string; // Backend returns this field
    duration?: number;
    created_at?: string;
    updated_at?: string;
    is_watched?: boolean;
    is_unlocked?: boolean;
    is_locked?: boolean;
}

// Course Request Types
export interface CourseRequest {
    id: string;
    user_id: string;
    course_id: string;
    request_message?: string;
    status: "pending" | "approved" | "rejected";
    created_at?: string;
    updated_at?: string;
    course?: Course;
    user?: User;
}

export interface CreateCourseRequest {
    course_id: string;
    request_message?: string;
}

export interface ApproveCourseRequest {
    access_start: string; // ISO 8601 date string
    access_end: string; // ISO 8601 date string
}

// Course Access Types
export interface CourseAccess {
    id: string;
    user_id: string;
    course_id: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    course?: Course;
}

// Video Progress Types
export interface VideoProgress {
    id: string;
    user_id: string;
    video_id: string;
    course_id: string;
    watched: boolean;
    unlocked: boolean;
    watched_at?: string;
    unlocked_at?: string;
    created_at?: string;
    updated_at?: string;
    video?: Video;
}

export interface MarkVideoWatchedResponse {
    progress: VideoProgress;
    next_video_unlocked?: boolean;
}

export interface UnlockNextVideoResponse {
    success: boolean;
    next_video_unlocked?: boolean;
    next_video_id?: string;
}

// Progress Types
export interface CourseProgress {
    course_id: string;
    course: Course;
    total_videos: number;
    watched_videos: number;
    unlocked_videos: number;
    progress_percentage: number;
    access: CourseAccess | null;
    video_progress: VideoProgress[];
}

// Admin Types
export interface DashboardStats {
    total_users: number;
    total_courses: number;
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
}

// User Profile Types
export interface UpdateProfileRequest {
    first_name?: string;
    last_name?: string;
    email?: string;
}

// Session Types
export interface ActiveSessionsResponse {
    sessions: Session[];
    count: number;
}

// Dashboard Types
export interface UserDashboardData {
    performance: {
        total_courses: number;
        total_videos: number;
        watched_videos: number;
        completion_percentage: number;
    };
    courses: Array<
        Course & {
            progress: {
                total: number;
                watched: number;
                percentage: number;
            };
        }
    >;
    current_video: {
        id: string;
        title: string;
        video_url: string;
        order_index: number;
        watched_at: string;
        last_position?: number;
        watch_duration?: number;
        course_id: string;
        course_name: string;
        course_slug: string;
    } | null;
    latest_videos: Array<
        Video & {
            course_id: string;
            course_name: string;
            course_slug: string;
            is_watched: boolean;
            watched_at?: string;
        }
    >;
    notifications: Array<{
        id: string;
        type: string;
        message: string;
        course_name: string;
        course_slug: string;
        created_at: string;
        reviewed_at?: string;
    }>;
}

export interface AdminDashboardData {
    business_overview: {
        statistics: {
            total_users: number;
            total_courses: number;
            total_videos: number;
            pending_requests: number;
            approved_requests_30d: number;
            active_access: number;
        };
        recent_requests: Array<{
            id: string;
            status: string;
            created_at: string;
            course_name: string;
            user_email: string;
            first_name: string;
            last_name: string;
        }>;
    };
    admin_performance: {
        courses_accessed: number;
        videos_watched: number;
        total_available_videos: number;
        completion_percentage: number;
    };
    current_video: {
        id: string;
        title: string;
        video_url: string;
        order_index: number;
        watched_at: string;
        course_id: string;
        course_name: string;
        course_slug: string;
    } | null;
    latest_videos: Array<
        Video & {
            course_id: string;
            course_name: string;
            course_slug: string;
        }
    >;
    notifications: Array<{
        type: string;
        message: string;
        created_at?: string;
        expires_at?: string;
        request_id?: string;
        access_id?: string;
    }>;
}

// Blog Types
export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content?: string;
    cover_image?: string;
    author_id: string;
    author_name: string;
    author_email?: string;
    is_published?: boolean;
    views: number;
    published_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface BlogPostListResponse {
    data: BlogPost[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface CreateBlogPostRequest {
    title: string;
    content: string;
    cover_image?: string;
    is_published?: boolean;
}

export interface UpdateBlogPostRequest {
    title?: string;
    content?: string;
    cover_image?: string;
    is_published?: boolean;
}

// KYC Types (Course KYC)
export interface KYCVerification {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    address: string;
    contact_number: string;
    whatsapp_number: string;
    id_proof_url: string;
    id_proof_2_url: string;
    status: "pending" | "verified" | "rejected";
    rejection_reason?: string;
    verified_by?: string;
    verified_at?: string;
    created_at?: string;
    updated_at?: string;
    user_email?: string;
    user_first_name?: string;
    user_last_name?: string;
    verifier_email?: string;
}

// Product KYC Types
export interface ProductKYCVerification {
    id: string;
    user_id: string;
    full_name: string;
    address: string;
    contact_number: string;
    whatsapp_number: string;
    id_proofs: string[]; // Array of ID proof URLs (minimum 2)
    business_proofs: string[]; // Array of business proof URLs (optional)
    status: "pending" | "verified" | "rejected";
    rejection_reason?: string;
    verified_by?: string;
    verified_at?: string;
    created_at?: string;
    updated_at?: string;
    user_email?: string;
    user_first_name?: string;
    user_last_name?: string;
    verifier_email?: string;
}

// =========================
// Shop / Products / Orders
// =========================

export type ProductType = "physical" | "digital";
export type DigitalFileFormat = "zip" | "rar";

export interface ProductVideo {
    title: string;
    url: string;
    thumbnail?: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    english_description?: string;
    malayalam_description?: string;
    hindi_description?: string;
    price: number;
    category?: string | null; // First category for backward compatibility
    categories?: string[]; // Array of up to 4 categories
    // Backend returns product_type + we also include a friendlier `type`
    product_type?: ProductType;
    type: ProductType;
    cover_image?: string | null;
    images?: string[];
    videos?: ProductVideo[];
    is_featured?: boolean;

    // Digital product fields
    digital_file_name?: string | null;
    digital_file_format?: DigitalFileFormat | null;

    // Physical product fields
    stock_quantity?: number | null;

    // Convenience
    in_stock?: boolean;

    rating?: number;
    reviews_count?: number;
    is_active?: boolean;
    is_coming_soon?: boolean;
    is_contact_only?: boolean; // Product can only be contacted via WhatsApp (no direct purchase)
    requires_kyc?: boolean; // Product requires KYC verification to purchase
    created_at?: string;
    updated_at?: string;

    // Tiered pricing (quantity ranges) - API returns as tiered_pricing
    tiered_pricing?: Array<{
        min_qty: number;
        max_qty: number | null;
        price_per_item: number;
        courier_charge?: number;
    }>;
    quantity_pricing?: Array<{
        min_qty: number;
        max_qty: number | null;
        price_per_item: number;
        courier_charge?: number;
    }>;
}

export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface CreateOrderItem {
    product_id: string;
    quantity: number;
}

export interface CreateOrderRequest {
    items: CreateOrderItem[];
    customer?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
    };
}

export interface Order {
    id: string;
    status: OrderStatus;
    subtotal: number;
    shipping_cost: number;
    total: number;
    payment_provider?: string | null;
    payment_reference?: string | null;
    tracking_number?: string | null;
    tracking_url?: string | null;
    estimated_delivery_date?: string | null;
    shipped_at?: string | null;
    delivered_at?: string | null;
    created_at: string;
    updated_at?: string;
    items?: OrderItem[];
}

export interface AdminOrderSummary extends Order {
    user_id: string;
    user_email: string;
    first_name: string;
    last_name: string;
    digital_items: number;
    physical_items: number;
    item_names?: string;
}

export interface UpdateTrackingRequest {
    tracking_number?: string;
    tracking_url?: string;
    estimated_delivery_date?: string;
    shipped_at?: string;
}

export interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    product_type: ProductType;
    product_name: string;
    product_slug: string;
    cover_image?: string;
}

export interface AdminOrderDetailsResponse {
    order: any;
    items: OrderItem[];
}

export type EntitlementSource = "order" | "admin_grant";

export interface ProductEntitlement {
    entitlement_id: string;
    source: EntitlementSource;
    order_id?: string | null;
    note?: string | null;
    granted_at: string;
    product_id: string;
    name: string;
    slug: string;
    category?: string | null;
    product_type: ProductType;
    type: ProductType;
    cover_image?: string | null;
    digital_file_name?: string | null;
    digital_file_format?: DigitalFileFormat | null;
}
