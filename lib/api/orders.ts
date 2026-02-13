import { apiClient } from "./client";
import type {
    ApiResponse,
    Order,
    CreateOrderRequest,
    AdminOrderSummary,
    AdminOrderDetailsResponse,
    UpdateTrackingRequest,
} from "./types";

export const ordersApi = {
    create: async (data: CreateOrderRequest): Promise<ApiResponse<any>> => {
        return apiClient.post<any>("/orders", data);
    },

    myOrders: async (): Promise<ApiResponse<Order[]>> => {
        return apiClient.get<Order[]>("/orders/my");
    },

    // Admin
    adminAll: async (): Promise<ApiResponse<AdminOrderSummary[]>> => {
        return apiClient.get<AdminOrderSummary[]>("/orders/admin/all");
    },

    adminGetById: async (
        id: string
    ): Promise<ApiResponse<AdminOrderDetailsResponse>> => {
        return apiClient.get<AdminOrderDetailsResponse>(`/orders/admin/${id}`);
    },

    adminMarkPaid: async (
        id: string,
        payload?: { payment_provider?: string; payment_reference?: string }
    ): Promise<ApiResponse<any>> => {
        return apiClient.post<any>(`/orders/${id}/mark-paid`, payload || {});
    },

    adminUpdateTracking: async (
        id: string,
        data: UpdateTrackingRequest
    ): Promise<ApiResponse<Order>> => {
        return apiClient.patch<Order>(`/orders/${id}/tracking`, data);
    },
};
