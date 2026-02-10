import { apiClient } from "./client";
import type { ApiResponse, Product, ProductType } from "./types";

export interface ListProductsParams {
    q?: string;
    category?: string;
    type?: ProductType;
    page?: number;
    limit?: number;
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    pagination?: PaginationInfo;
}

export const productsApi = {
    list: async (
        params?: ListProductsParams
    ): Promise<PaginatedResponse<Product[]>> => {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.category) qs.set("category", params.category);
        if (params?.type) qs.set("type", params.type);
        if (params?.page) qs.set("page", params.page.toString());
        if (params?.limit) qs.set("limit", params.limit.toString());
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        return apiClient.get<Product[]>(`/products${suffix}`);
    },

    getFeatured: async (): Promise<ApiResponse<Product[]>> => {
        return apiClient.get<Product[]>("/products/featured/list");
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
        english_description?: string;
        malayalam_description?: string;
        hindi_description?: string;
        category?: string;
        categories?: string[];
        product_type: ProductType;
        price: number;
        stock_quantity?: number;
        rating?: number;
        reviews_count?: number;
        is_featured?: boolean;
        is_coming_soon?: boolean;
        requires_kyc?: boolean;
        cover_image?: File | null;
        digital_file?: File | null;
        images?: File[];
        videos?: Array<{ title: string; url: string; thumbnail?: string }>;
        digital_file_name?: string; // For linking existing files
        quantity_pricing?: Array<{ min_qty: number; max_qty: number | null; price_per_item: number; courier_charge?: number }>;
    }): Promise<ApiResponse<Product>> => {
        const form = new FormData();
        form.append("name", data.name);
        form.append("slug", data.slug);
        if (data.description) form.append("description", data.description);
        if (data.english_description) form.append("english_description", data.english_description);
        if (data.malayalam_description) form.append("malayalam_description", data.malayalam_description);
        if (data.hindi_description) form.append("hindi_description", data.hindi_description);
        if (data.category) form.append("category", data.category);
        // Send categories as JSON string
        if (data.categories && data.categories.length > 0) {
            form.append("categories", JSON.stringify(data.categories));
        }
        form.append("product_type", data.product_type);
        form.append("price", String(data.price));
        if (data.rating !== undefined)
            form.append("rating", String(data.rating));
        if (data.reviews_count !== undefined)
            form.append("reviews_count", String(data.reviews_count));
        if (data.is_featured !== undefined)
            form.append("is_featured", String(data.is_featured));
        if (data.is_coming_soon !== undefined)
            form.append("is_coming_soon", String(data.is_coming_soon));
        if (data.requires_kyc !== undefined)
            form.append("requires_kyc", String(data.requires_kyc));
        if (data.product_type === "physical") {
            form.append("stock_quantity", String(data.stock_quantity ?? 0));
        }
        if (data.cover_image) form.append("cover_image", data.cover_image);
        if (data.digital_file) form.append("digital_file", data.digital_file);
        if (data.digital_file_name) form.append("digital_file_name", data.digital_file_name);
        
        // Append image files directly
        if (data.images && data.images.length > 0) {
            data.images.forEach((file) => {
                if (file) form.append("images", file);
            });
        }
        
        // Append videos as JSON
        if (data.videos && data.videos.length > 0) {
            form.append("videos", JSON.stringify(data.videos));
        }
        
        // Append quantity pricing as JSON string
        if (data.quantity_pricing && data.quantity_pricing.length > 0) {
            form.append("quantity_pricing", JSON.stringify(data.quantity_pricing));
        }
        
        return apiClient.post<Product>("/products/admin", form);
    },

    adminUpdate: async (
        id: string,
        data: Partial<{
            name: string;
            slug: string;
            description: string;
            english_description: string;
            malayalam_description: string;
            hindi_description: string;
            category: string;
            categories: string[];
            product_type: ProductType;
            price: number;
            stock_quantity: number;
            rating: number;
            reviews_count: number;
            is_active: boolean;
            is_featured: boolean;
            is_coming_soon: boolean;
            requires_kyc: boolean;
            cover_image: File | null;
            digital_file: File | null;
            images?: File[];
            videos?: Array<{ title: string; url: string; thumbnail?: string }>;
            digital_file_name?: string; // For linking existing files
            quantity_pricing?: Array<{ min_qty: number; max_qty: number | null; price_per_item: number; courier_charge?: number }>;
        }>
    ): Promise<ApiResponse<Product>> => {
        const form = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            if (v instanceof File) return;
            if (k === "images" || k === "videos" || k === "categories" || k === "quantity_pricing") {
                // Skip these, handle separately
                return;
            }
            form.append(k, String(v));
        });
        // Handle categories separately (as JSON string)
        if (data.categories && data.categories.length > 0) {
            form.append("categories", JSON.stringify(data.categories));
        }
        if (data.cover_image instanceof File) {
            form.append("cover_image", data.cover_image);
        }
        if (data.digital_file instanceof File) {
            form.append("digital_file", data.digital_file);
        }
        if (data.digital_file_name) {
             form.append("digital_file_name", data.digital_file_name);
        }
        
        // Append image files directly
        if (data.images && data.images.length > 0) {
            data.images.forEach((file) => {
                if (file) form.append("images", file);
            });
        }
        
        // Append videos as JSON
        if (data.videos && data.videos.length > 0) {
            form.append("videos", JSON.stringify(data.videos));
        }
        
        // Append quantity pricing as JSON string
        if (data.quantity_pricing && data.quantity_pricing.length > 0) {
            form.append("quantity_pricing", JSON.stringify(data.quantity_pricing));
        }
        
        return apiClient.put<Product>(`/products/admin/${id}`, form);
    },

    adminDelete: async (id: string): Promise<ApiResponse<void>> => {
        return apiClient.delete<void>(`/products/admin/${id}`);
    },
};
