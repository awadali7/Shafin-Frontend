import { apiClient } from "./client";
import type { ApiResponse, Course, CourseDetails, Video } from "./types";

// Courses API Services
export const coursesApi = {
    // Get all courses (public)
    getAll: async (): Promise<ApiResponse<Course[]>> => {
        return apiClient.get<Course[]>("/courses");
    },

    // Get course by slug
    getBySlug: async (slug: string): Promise<ApiResponse<CourseDetails>> => {
        return apiClient.get<CourseDetails>(`/courses/${slug}`);
    },

    // Get course by ID
    getById: async (id: string): Promise<ApiResponse<CourseDetails>> => {
        return apiClient.get<CourseDetails>(`/courses/${id}`);
    },

    // Create course (Admin only)
    // Accepts FormData (with image file) or Course object
    create: async (
        data: Partial<Course> | FormData
    ): Promise<ApiResponse<Course>> => {
        return apiClient.post<Course>("/courses", data);
    },

    // Update course (Admin only)
    update: async (
        id: string,
        data: Partial<Course>
    ): Promise<ApiResponse<Course>> => {
        return apiClient.put<Course>(`/courses/${id}`, data);
    },

    // Delete course (Admin only)
    delete: async (id: string): Promise<ApiResponse<void>> => {
        return apiClient.delete<void>(`/courses/${id}`);
    },

    // Get all videos for a course
    getVideos: async (courseId: string): Promise<ApiResponse<Video[]>> => {
        return apiClient.get<Video[]>(`/courses/${courseId}/videos`);
    },

    // Get video details
    getVideo: async (
        courseId: string,
        videoId: string
    ): Promise<ApiResponse<Video>> => {
        return apiClient.get<Video>(`/courses/${courseId}/videos/${videoId}`);
    },

    // Create video (Admin only)
    createVideo: async (
        courseId: string,
        data: Partial<Video>
    ): Promise<ApiResponse<Video>> => {
        return apiClient.post<Video>(`/courses/${courseId}/videos`, data);
    },

    // Update video (Admin only)
    updateVideo: async (
        courseId: string,
        videoId: string,
        data: Partial<Video>
    ): Promise<ApiResponse<Video>> => {
        return apiClient.put<Video>(
            `/courses/${courseId}/videos/${videoId}`,
            data
        );
    },

    // Delete video (Admin only)
    deleteVideo: async (
        courseId: string,
        videoId: string
    ): Promise<ApiResponse<void>> => {
        return apiClient.delete<void>(`/courses/${courseId}/videos/${videoId}`);
    },

    // Purchase course - creates order and returns order_id for payment
    purchase: async (courseId: string): Promise<ApiResponse<{ order_id: string }>> => {
        return apiClient.post<{ order_id: string }>(`/courses/${courseId}/purchase`);
    },

    // Grant course access to a user (Admin only)
    grantAccess: async (
        courseId: string,
        data: {
            user_id: string;
            access_start: string;
            access_end: string;
        }
    ): Promise<ApiResponse<any>> => {
        return apiClient.post<any>(`/courses/${courseId}/grant-access`, data);
    },
};
