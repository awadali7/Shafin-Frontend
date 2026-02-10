import { apiClient } from "./client";
import type { ApiResponse, ProductKYCVerification } from "./types";

// Product KYC API Services
export const productKycApi = {
    // Submit Product KYC information (multipart/form-data)
    submit: async (
        formData: FormData
    ): Promise<ApiResponse<ProductKYCVerification>> => {
        const token = apiClient.getToken();
        const API_BASE_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

        try {
            const response = await fetch(`${API_BASE_URL}/product-kyc`, {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    // Don't set Content-Type for FormData - browser will set it with boundary
                },
                body: formData,
            });

            // Check if response is JSON
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error(
                        `Server error: ${response.status} ${response.statusText}`
                    );
                }
            }

            // Handle 401 errors (session expired)
            if (response.status === 401) {
                apiClient.clearAuth();
                if (typeof window !== "undefined") {
                    window.dispatchEvent(
                        new CustomEvent("session-expired", {
                            detail: {
                                message:
                                    "Your session has expired. Please login again.",
                            },
                        })
                    );
                }
                throw new Error("Authentication expired. Please login again.");
            }

            if (!response.ok) {
                throw new Error(
                    data.message || `HTTP error! status: ${response.status}`
                );
            }

            return data;
        } catch (error: any) {
            // Better error handling for network/CORS issues
            if (
                error instanceof TypeError &&
                error.message === "Failed to fetch"
            ) {
                const errorMessage =
                    `Cannot connect to the server. Please check:\n` +
                    `1. Is the backend server running?\n` +
                    `2. Is the API URL correct? (${API_BASE_URL})\n` +
                    `3. Check CORS configuration in backend`;

                console.error("API Connection Error:", errorMessage);
                throw new Error(
                    `Connection failed. Make sure the backend server is running at ${API_BASE_URL}`
                );
            }
            throw error;
        }
    },

    // Get user's Product KYC status
    getMyProductKYC: async (): Promise<
        ApiResponse<ProductKYCVerification | null>
    > => {
        return apiClient.get<ProductKYCVerification | null>("/product-kyc/me");
    },

    // Get all Product KYC verifications (Admin only)
    getAll: async (params?: {
        status?: "pending" | "verified" | "rejected";
        page?: number;
        limit?: number;
    }): Promise<
        ApiResponse<{
            kyc_verifications: ProductKYCVerification[];
            pagination: any;
        }>
    > => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append("status", params.status);
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());

        const query = queryParams.toString();
        return apiClient.get<{
            kyc_verifications: ProductKYCVerification[];
            pagination: any;
        }>(`/product-kyc${query ? `?${query}` : ""}`);
    },

    // Get specific Product KYC by ID (Admin only)
    getById: async (
        id: string
    ): Promise<ApiResponse<ProductKYCVerification>> => {
        return apiClient.get<ProductKYCVerification>(`/product-kyc/${id}`);
    },

    // Verify or reject Product KYC (Admin only)
    verify: async (
        id: string,
        data: { status: "verified" | "rejected"; rejection_reason?: string }
    ): Promise<ApiResponse<ProductKYCVerification>> => {
        return apiClient.put<ProductKYCVerification>(
            `/product-kyc/${id}/verify`,
            data
        );
    },
};


