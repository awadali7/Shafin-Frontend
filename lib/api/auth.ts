import { apiClient } from "./client";
import type {
    ApiResponse,
    User,
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UpdateProfileRequest,
    UserDashboardData,
} from "./types";

// Authentication API Services
export const authApi = {
    // Register new user
    register: async (
        data: RegisterRequest
    ): Promise<ApiResponse<AuthResponse>> => {
        const response = await apiClient.post<AuthResponse>(
            "/auth/register",
            data
        );

        if (response.success && response.data) {
            // Store tokens and user data
            apiClient.setToken(response.data.token);
            if (response.data.refreshToken) {
                apiClient.setRefreshToken(response.data.refreshToken);
            }
            apiClient.setUser(response.data.user);
        }

        return response;
    },

    // Login user
    login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
        const response = await apiClient.post<AuthResponse>(
            "/auth/login",
            data
        );

        if (response.success && response.data) {
            // Store tokens and user data
            apiClient.setToken(response.data.token);
            if (response.data.refreshToken) {
                apiClient.setRefreshToken(response.data.refreshToken);
            }
            apiClient.setUser(response.data.user);
        }

        return response;
    },

    // Logout user
    logout: async (): Promise<ApiResponse<void>> => {
        try {
            await apiClient.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Clear local storage regardless of API response
            apiClient.clearAuth();
        }

        return { success: true };
    },

    // Refresh access token
    refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
        const refreshToken = apiClient.getRefreshToken();
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await apiClient.post<{ token: string }>(
            "/auth/refresh",
            {
                refreshToken,
            }
        );

        if (response.success && response.data) {
            apiClient.setToken(response.data.token);
        }

        return response;
    },

    // Request password reset
    forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
        return apiClient.post<void>("/auth/forgot-password", { email });
    },

    // Reset password with token
    resetPassword: async (
        token: string,
        password: string
    ): Promise<ApiResponse<void>> => {
        return apiClient.post<void>("/auth/reset-password", {
            token,
            password,
        });
    },

    // Get current user profile
    getProfile: async (): Promise<ApiResponse<User>> => {
        return apiClient.get<User>("/users/profile");
    },

    // Update user profile
    updateProfile: async (
        data: UpdateProfileRequest
    ): Promise<ApiResponse<User>> => {
        const response = await apiClient.put<User>("/users/profile", data);

        if (response.success && response.data) {
            apiClient.setUser(response.data);
        }

        return response;
    },

    // Get active sessions
    getActiveSessions: async (): Promise<
        ApiResponse<{ sessions: any[]; count: number }>
    > => {
        return apiClient.get<{ sessions: any[]; count: number }>(
            "/auth/sessions"
        );
    },

    // Get user dashboard
    getUserDashboard: async (): Promise<ApiResponse<UserDashboardData>> => {
        return apiClient.get<UserDashboardData>("/users/dashboard");
    },

    // Accept terms and conditions
    acceptTerms: async (): Promise<ApiResponse<void>> => {
        return apiClient.post<void>("/users/accept-terms", {});
    },
};
