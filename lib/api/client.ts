import { ApiResponse } from "./types";

// Get API base URL from environment variable
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Token storage keys
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_data";

// API Client Class
class ApiClient {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    // Get stored token
    getToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(TOKEN_KEY);
    }

    // Get stored refresh token
    getRefreshToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    // Store token
    setToken(token: string): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(TOKEN_KEY, token);
    }

    // Store refresh token
    setRefreshToken(refreshToken: string): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Store user data
    setUser(user: any): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    // Get user data
    getUser(): any | null {
        if (typeof window === "undefined") return null;
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Clear all auth data
    clearAuth(): void {
        if (typeof window === "undefined") return;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    // Build headers with authentication
    private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...customHeaders,
        };

        const token = this.getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        return headers;
    }

    // Main fetch wrapper
    private async fetch<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        // Check if body is FormData - if so, use headers as-is (already set in post method)
        const isFormData = options.body instanceof FormData;

        const config: RequestInit = {
            ...options,
            // If FormData, use headers from options (already set correctly in post method)
            // Otherwise, merge with default headers
            headers: isFormData
                ? options.headers
                : this.getHeaders(options.headers as Record<string, string>),
        };

        try {
            const response = await fetch(url, config);

            // Check if response is JSON
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                // If not JSON, try to get text
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch {
                    throw new Error(
                        `Server error: ${response.status} ${response.statusText}`
                    );
                }
            }

            // Handle token expiration and session invalidation
            if (response.status === 401) {
                const errorMessage = data.message || "";
                const isSessionError =
                    errorMessage.includes("Session expired") ||
                    errorMessage.includes("Session invalid") ||
                    errorMessage.includes("session") ||
                    errorMessage.includes("token");

                if (isSessionError) {
                    this.clearAuth();
                    // Dispatch custom event for session expiration
                    if (typeof window !== "undefined") {
                        window.dispatchEvent(
                            new CustomEvent("session-expired", {
                                detail: {
                                    message:
                                        errorMessage ||
                                        "Your session has expired. Please login again.",
                                },
                            })
                        );
                    }
                    throw new Error(
                        errorMessage ||
                            "Authentication expired. Please login again."
                    );
                }
            }

            // Handle errors
            if (!response.ok) {
                const error: any = new Error(
                    data.message || `HTTP error! status: ${response.status}`
                );
                // Preserve error response data for handling specific error types (e.g., requires_kyc)
                error.response = { data, status: response.status };
                error.data = data;
                throw error;
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
                    `2. Is the API URL correct? (${this.baseURL})\n` +
                    `3. Check CORS configuration in backend\n` +
                    `4. Check if backend port matches the API URL`;

                console.error("API Connection Error:", errorMessage);
                throw new Error(
                    `Connection failed. Make sure the backend server is running at ${this.baseURL}`
                );
            }

            console.error("API Error:", error);
            throw error;
        }
    }

    // GET request
    async get<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        return this.fetch<T>(endpoint, {
            ...options,
            method: "GET",
        });
    }

    // POST request
    async post<T>(
        endpoint: string,
        body?: any,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        // Check if body is FormData
        const isFormData = body instanceof FormData;

        // For FormData, don't set Content-Type - browser will set it with boundary
        // Also don't include other headers that might interfere
        let headers: HeadersInit;
        if (isFormData) {
            // Only include Authorization if token exists
            const token = this.getToken();
            headers = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
        } else {
            headers = this.getHeaders();
        }

        return this.fetch<T>(endpoint, {
            ...options,
            method: "POST",
            headers: {
                ...headers,
                ...(options?.headers as Record<string, string>),
            },
            body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        });
    }

    // PUT request
    async put<T>(
        endpoint: string,
        body?: any,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        const isFormData = body instanceof FormData;

        let headers: HeadersInit;
        if (isFormData) {
            const token = this.getToken();
            headers = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
        } else {
            headers = this.getHeaders();
        }

        return this.fetch<T>(endpoint, {
            ...options,
            method: "PUT",
            headers: {
                ...headers,
                ...(options?.headers as Record<string, string>),
            },
            body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        });
    }

    // DELETE request
    async delete<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        return this.fetch<T>(endpoint, {
            ...options,
            method: "DELETE",
        });
    }

    // PATCH request
    async patch<T>(
        endpoint: string,
        body?: any,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        return this.fetch<T>(endpoint, {
            ...options,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        });
    }
}

// Create and export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export utility functions
export const isAuthenticated = (): boolean => {
    return !!apiClient.getToken();
};

export const getStoredUser = (): any | null => {
    return apiClient.getUser();
};

export const clearAuth = (): void => {
    apiClient.clearAuth();
};
