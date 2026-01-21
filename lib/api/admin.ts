import { apiClient } from "./client";
import type {
    ApiResponse,
    DashboardStats,
    User,
    CourseRequest,
    AdminDashboardData,
} from "./types";

// Admin API Response Types
export interface UsersResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface RequestsResponse {
    requests: CourseRequest[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Admin API Services
export const adminApi = {
    // Get dashboard statistics (legacy)
    getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
        return apiClient.get<DashboardStats>("/admin/dashboard");
    },

    // Get admin dashboard (enhanced)
    getAdminDashboard: async (): Promise<ApiResponse<AdminDashboardData>> => {
        return apiClient.get<AdminDashboardData>("/admin/dashboard");
    },

    // Get all users (with pagination support)
    getAllUsers: async (
        page: number = 1,
        limit: number = 50,
        role?: string,
        search?: string
    ): Promise<ApiResponse<UsersResponse>> => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (role) params.append("role", role);
        if (search) params.append("search", search);

        return apiClient.get<UsersResponse>(
            `/admin/users?${params.toString()}`
        );
    },

    // Get all course requests (with pagination support)
    getAllRequests: async (
        page: number = 1,
        limit: number = 50,
        status?: string
    ): Promise<ApiResponse<RequestsResponse>> => {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        if (status) params.append("status", status);

        return apiClient.get<RequestsResponse>(
            `/admin/requests?${params.toString()}`
        );
    },

    // Create user (Admin only)
    createUser: async (data: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        role?: "user" | "admin";
    }): Promise<ApiResponse<User>> => {
        return apiClient.post<User>("/admin/users", data);
    },

    // Update user (Admin only)
    updateUser: async (
        id: string,
        data: Partial<User> & { password?: string }
    ): Promise<ApiResponse<User>> => {
        return apiClient.put<User>(`/admin/users/${id}`, data);
    },

    // Delete user (Admin only)
    deleteUser: async (id: string): Promise<ApiResponse<void>> => {
        return apiClient.delete<void>(`/admin/users/${id}`);
    },

    // Get user login details (Admin only)
    getUserLoginDetails: async (
        id: string
    ): Promise<
        ApiResponse<{
            user: User;
            sessions: any[];
            active_sessions_count: number;
            total_sessions_count: number;
        }>
    > => {
        return apiClient.get<{
            user: User;
            sessions: any[];
            active_sessions_count: number;
            total_sessions_count: number;
        }>(`/admin/users/${id}/login-details`);
    },

    // Create announcement (Admin only)
    createAnnouncement: async (data: {
        title: string;
        message: string;
        type?: "info" | "warning" | "success" | "error";
        target_audience?: "all" | "users" | "admins";
    }): Promise<ApiResponse<any>> => {
        return apiClient.post<any>("/admin/announcements", data);
    },

    // Get announcements (Admin only)
    getAnnouncements: async (
        isActive?: boolean
    ): Promise<ApiResponse<any[]>> => {
        const query = isActive !== undefined ? `?is_active=${isActive}` : "";
        return apiClient.get<any[]>(`/admin/announcements${query}`);
    },

    grantProductEntitlement: (data: {
        user_id: string;
        product_id: string;
        note?: string;
    }): Promise<ApiResponse<any>> => {
        return apiClient.post<any>("/admin/product-entitlements/grant", data);
    },

    // Digital File Library
    listDigitalFiles: async (): Promise<ApiResponse<{ name: string; size: number; created_at: string }[]>> => {
        return apiClient.get<{ name: string; size: number; created_at: string }[]>("/admin/digital-files");
    },

    uploadDigitalFile: async (data: FormData): Promise<ApiResponse<{ name: string; size: number }>> => {
        return apiClient.post<{ name: string; size: number }>("/admin/digital-files", data);
    },

    deleteDigitalFile: async (filename: string): Promise<ApiResponse<any>> => {
        return apiClient.delete<any>(`/admin/digital-files/${filename}`);
    },
    
    downloadDigitalFile: async (filename: string): Promise<void> => {
        const token = apiClient.getToken();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
        
        const response = await fetch(`${baseUrl}/admin/digital-files/${filename}/download`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Download failed");
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};
