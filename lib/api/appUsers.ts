import { apiClient } from "./client";
import type { ApiResponse } from "./types";

// Pinout app accounts — separate from website users
export type AppUserStatus = "serial_required" | "pending" | "approved" | "rejected";

export interface AppUserDevice {
    deviceName?: string;
    platform?: string;
}

export interface AppUser {
    id: string;
    full_name: string;
    email: string;
    serial_number: string | null;
    // Given with the serial; null for accounts that submitted before it was asked
    phone: string | null;
    status: AppUserStatus;
    rejection_reason: string | null;
    serial_submitted_at: string | null;
    reviewed_at: string | null;
    reviewed_by_email: string | null;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    // The device currently signed in (only one at a time), if any
    active_device: AppUserDevice | null;
    active_device_last_seen: string | null;
}

export type AppUserCounts = Record<AppUserStatus, number>;

export interface AppUserList {
    users: AppUser[];
    counts: AppUserCounts;
}

export const appUsersApi = {
    list: (
        status: AppUserStatus | "all",
        search = ""
    ): Promise<ApiResponse<AppUserList>> => {
        const params = new URLSearchParams({ status });
        if (search.trim()) params.set("search", search.trim());
        return apiClient.get<AppUserList>(`/admin/app-users?${params.toString()}`);
    },

    approve: (id: string): Promise<ApiResponse<{ user: AppUser }>> =>
        apiClient.post<{ user: AppUser }>(`/admin/app-users/${id}/approve`),

    // Also used to revoke an approved user
    reject: (id: string, reason: string): Promise<ApiResponse<{ user: AppUser }>> =>
        apiClient.post<{ user: AppUser }>(`/admin/app-users/${id}/reject`, {
            reason: reason.trim() || null,
        }),
};
