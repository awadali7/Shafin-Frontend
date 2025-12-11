import { apiClient } from "./client";
import type {
    ApiResponse,
    BlogPost,
    BlogPostListResponse,
    CreateBlogPostRequest,
    UpdateBlogPostRequest,
} from "./types";

// Blogs API Services
export const blogsApi = {
    // Get all published blog posts (public)
    getAll: async (params?: {
        limit?: number;
        offset?: number;
        search?: string;
    }): Promise<ApiResponse<BlogPostListResponse>> => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.offset)
            queryParams.append("offset", params.offset.toString());
        if (params?.search) queryParams.append("search", params.search);

        const queryString = queryParams.toString();
        return apiClient.get<BlogPostListResponse>(
            `/blogs${queryString ? `?${queryString}` : ""}`
        );
    },

    // Get blog post by slug (public)
    getBySlug: async (slug: string): Promise<ApiResponse<BlogPost>> => {
        return apiClient.get<BlogPost>(`/blogs/${slug}`);
    },

    // Get all blog posts (admin - includes unpublished)
    getAllAdmin: async (params?: {
        limit?: number;
        offset?: number;
        search?: string;
        status?: "published" | "draft";
    }): Promise<ApiResponse<BlogPostListResponse>> => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.offset)
            queryParams.append("offset", params.offset.toString());
        if (params?.search) queryParams.append("search", params.search);
        if (params?.status) queryParams.append("status", params.status);

        const queryString = queryParams.toString();
        return apiClient.get<BlogPostListResponse>(
            `/blogs/admin/all${queryString ? `?${queryString}` : ""}`
        );
    },

    // Get blog post by ID (admin)
    getById: async (id: string): Promise<ApiResponse<BlogPost>> => {
        return apiClient.get<BlogPost>(`/blogs/admin/${id}`);
    },

    // Create blog post (Admin only)
    create: async (
        data: CreateBlogPostRequest
    ): Promise<ApiResponse<BlogPost>> => {
        return apiClient.post<BlogPost>("/blogs", data);
    },

    // Update blog post (Admin only)
    update: async (
        id: string,
        data: UpdateBlogPostRequest
    ): Promise<ApiResponse<BlogPost>> => {
        return apiClient.put<BlogPost>(`/blogs/${id}`, data);
    },

    // Delete blog post (Admin only)
    delete: async (id: string): Promise<ApiResponse<void>> => {
        return apiClient.delete<void>(`/blogs/${id}`);
    },
};
