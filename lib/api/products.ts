import { apiClient } from "./client";
import type { ApiResponse, Product, ProductType } from "./types";

export interface ListProductsParams {
    q?: string;
    category?: string;
    type?: ProductType;
}

export const productsApi = {
    list: async (
        params?: ListProductsParams
    ): Promise<ApiResponse<Product[]>> => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.category) qs.set("category", params.category);
        if (params?.type) qs.set("type", params.type);
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        return apiClient.get<Product[]>(`/products${suffix}`);
    },

    getBySlug: async (slug: string): Promise<ApiResponse<Product>> => {
        return apiClient.get<Product>(`/products/${slug}`);
    },

    // Admin
    adminListAll: async (): Promise<ApiResponse<Product[]>> => {
        return apiClient.get<Product[]>("/products/admin/all");
    },

    adminCreate: async (data: {
        name: string;
        slug: string;
        description?: string;
        category?: string;
        product_type: ProductType;
        price: number;
        stock_quantity?: number;
        rating?: number;
        reviews_count?: number;
        cover_image?: File | null;
        digital_file?: File | null;
        images?: File[];
        videos?: File[];
        videoTitles?: string[];
        videoThumbnails?: File[];
    }): Promise<ApiResponse<Product>> => {
        const form = new FormData();
        form.append("name", data.name);
        form.append("slug", data.slug);
        if (data.description) form.append("description", data.description);
        if (data.category) form.append("category", data.category);
        form.append("product_type", data.product_type);
        form.append("price", String(data.price));
        if (data.rating !== undefined)
            form.append("rating", String(data.rating));
        if (data.reviews_count !== undefined)
            form.append("reviews_count", String(data.reviews_count));
        if (data.product_type === "physical") {
            form.append("stock_quantity", String(data.stock_quantity ?? 0));
        }
        if (data.cover_image) form.append("cover_image", data.cover_image);
        if (data.digital_file) form.append("digital_file", data.digital_file);
        
        // Append image files directly
        if (data.images && data.images.length > 0) {
            data.images.forEach((file) => {
                if (file) form.append("images", file);
            });
        }
        
        // Append video files directly
        if (data.videos && data.videos.length > 0) {
            data.videos.forEach((file) => {
                if (file) form.append("videos", file);
            });
        }
        
        // Append video titles
        if (data.videoTitles && data.videoTitles.length > 0) {
            data.videoTitles.forEach((title, index) => {
                form.append(`video_titles[${index}]`, title);
            });
        }
        
        // Append video thumbnails
        if (data.videoThumbnails && data.videoThumbnails.length > 0) {
            data.videoThumbnails.forEach((file) => {
                if (file) form.append("video_thumbnails", file);
            });
        }
        
        return apiClient.post<Product>("/products/admin", form);
    },

    adminUpdate: async (
        id: string,
        data: Partial<{
            name: string;
            slug: string;
            description: string;
            category: string;
            product_type: ProductType;
            price: number;
            stock_quantity: number;
            rating: number;
            reviews_count: number;
            is_active: boolean;
            cover_image: File | null;
            digital_file: File | null;
            images?: File[];
            videos?: File[];
            videoTitles?: string[];
            videoThumbnails?: File[];
        }>
    ): Promise<ApiResponse<Product>> => {
        const form = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            if (v instanceof File) return;
            if (k === "images" || k === "videos" || k === "videoTitles" || k === "videoThumbnails") {
                // Skip these, handle separately
                return;
            }
            form.append(k, String(v));
        });
        if (data.cover_image instanceof File) {
            form.append("cover_image", data.cover_image);
        }
        if (data.digital_file instanceof File) {
            form.append("digital_file", data.digital_file);
        }
        
        // Append image files directly
        if (data.images && data.images.length > 0) {
            data.images.forEach((file) => {
                if (file) form.append("images", file);
            });
        }
        
        // Append video files directly
        if (data.videos && data.videos.length > 0) {
            data.videos.forEach((file) => {
                if (file) form.append("videos", file);
            });
        }
        
        // Append video titles
        if (data.videoTitles && data.videoTitles.length > 0) {
            data.videoTitles.forEach((title, index) => {
                form.append(`video_titles[${index}]`, title);
            });
        }
        
        // Append video thumbnails
        if (data.videoThumbnails && data.videoThumbnails.length > 0) {
            data.videoThumbnails.forEach((file) => {
                if (file) form.append("video_thumbnails", file);
            });
        }
        
        return apiClient.put<Product>(`/products/admin/${id}`, form);
    },

    adminDelete: async (id: string): Promise<ApiResponse<void>> => {
        return apiClient.delete<void>(`/products/admin/${id}`);
    },
};
