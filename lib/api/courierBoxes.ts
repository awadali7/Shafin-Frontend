import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface CourierBox {
    id: string;
    name: string;
    charge_a: number;
    charge_b: number;
    charge_c: number;
    charge_d: number;
    charge_e: number;
    charge_f: number;
    created_at: string;
}

export type CourierBoxInput = Omit<CourierBox, "id" | "created_at">;

export const courierBoxesApi = {
    list: (): Promise<ApiResponse<CourierBox[]>> =>
        apiClient.get<CourierBox[]>("/admin/courier-boxes"),

    create: (data: CourierBoxInput): Promise<ApiResponse<CourierBox>> =>
        apiClient.post<CourierBox>("/admin/courier-boxes", data),

    update: (id: string, data: CourierBoxInput): Promise<ApiResponse<CourierBox>> =>
        apiClient.put<CourierBox>(`/admin/courier-boxes/${id}`, data),

    delete: (id: string): Promise<ApiResponse<void>> =>
        apiClient.delete<void>(`/admin/courier-boxes/${id}`),
};
