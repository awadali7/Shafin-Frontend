import { apiClient } from './client';

export interface GalleryImage {
    id: number;
    image_url: string;
    heading: string | null;
    is_active: boolean;
    created_at: string;
}

export const getImageUrl = (path: string): string => {
    if (!path) return "/images/placeholder.jpg";
    if (path.startsWith("http")) return path;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
    const baseUrl = apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const galleryApi = {
    // Public get
    getActive: async () => {
        return apiClient.get<GalleryImage[]>('/gallery/active');
    },

    // Admin get all
    getAll: async () => {
        return apiClient.get<GalleryImage[]>('/gallery');
    },

    // Admin upload
    upload: async (formData: FormData) => {
        return apiClient.post<{ message: string; image: GalleryImage }>('/gallery/upload', formData);
    },

    // Admin toggle status
    toggleStatus: async (id: number, is_active: boolean) => {
        return apiClient.patch<{ message: string; is_active: boolean }>(`/gallery/${id}/status`, { is_active });
    },

    // Admin delete
    delete: async (id: number) => {
        return apiClient.delete<{ message: string }>(`/gallery/${id}`);
    }
};
