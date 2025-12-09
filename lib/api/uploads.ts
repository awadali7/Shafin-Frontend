import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface UploadedFile {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    url: string;
    path: string;
}

// Uploads API Services
export const uploadsApi = {
    // Upload single file
    uploadSingle: async (
        file: File,
        type: "images" | "documents" | "blog" = "images"
    ): Promise<ApiResponse<UploadedFile>> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        // Don't set Content-Type header - let browser set it with boundary
        return apiClient.post<UploadedFile>("/uploads/single", formData);
    },

    // Upload multiple files
    uploadMultiple: async (
        files: File[],
        type: "images" | "documents" | "blog" = "images"
    ): Promise<ApiResponse<UploadedFile[]>> => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });
        formData.append("type", type);

        // Don't set Content-Type header - let browser set it with boundary
        return apiClient.post<UploadedFile[]>("/uploads/multiple", formData);
    },

    // Delete file
    delete: async (
        filename: string,
        type: "images" | "documents" | "blog" = "images"
    ): Promise<ApiResponse<void>> => {
        return apiClient.delete<void>(`/uploads/${type}/${filename}`);
    },
};
