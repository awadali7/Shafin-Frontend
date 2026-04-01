import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface ProductExtraInfo {
    id: string;
    title: string;
    body: string;
    zip_file_path: string;
    created_at: string;
    updated_at: string;
}

export const productExtraInfoApi = {
    // List all Product Extra Infos
    list: async (): Promise<ApiResponse<ProductExtraInfo[]>> => {
        return apiClient.get<ProductExtraInfo[]>("/product-extra-info");
    },
    
    // Create new Product Extra Info package
    create: async (data: {
        title: string;
        body?: string;
        images?: File[];
        pdfs?: File[];
    }): Promise<ApiResponse<ProductExtraInfo>> => {
        const form = new FormData();
        form.append("title", data.title);
        if (data.body) form.append("body", data.body);
        
        if (data.images && data.images.length > 0) {
            data.images.forEach(img => form.append("images", img));
        }
        
        if (data.pdfs && data.pdfs.length > 0) {
            data.pdfs.forEach(pdf => form.append("pdfs", pdf));
        }
        
        return apiClient.post<ProductExtraInfo>("/product-extra-info", form);
    },

    // Grant access to a user
    grantAccess: async (data: {
        product_extra_info_id: string;
        user_id: string;
        product_name?: string;
    }): Promise<ApiResponse<any>> => {
        return apiClient.post<any>("/product-extra-info/grant", data);
    }
};
