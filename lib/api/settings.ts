import { apiClient } from './client';
import type { ApiResponse } from './types';

export interface SiteSetting {
    id: number;
    setting_key: string;
    setting_value: string;
    setting_type: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface PublicSettings {
    hero_video_url?: string;
    hero_title?: string;
    hero_description?: string;
}

export const settingsApi = {
    /**
     * Get public settings (no auth required)
     */
    getPublic: async (): Promise<ApiResponse<PublicSettings>> => {
        return apiClient.get<PublicSettings>('/settings/public');
    },

    /**
     * Get all settings (admin only)
     */
    getAll: async (): Promise<ApiResponse<SiteSetting[]>> => {
        return apiClient.get<SiteSetting[]>('/settings');
    },

    /**
     * Get a specific setting by key (admin only)
     */
    getByKey: async (key: string): Promise<ApiResponse<SiteSetting>> => {
        return apiClient.get<SiteSetting>(`/settings/${key}`);
    },

    /**
     * Update a setting (admin only)
     */
    update: async (key: string, value: string): Promise<ApiResponse<SiteSetting>> => {
        return apiClient.put<SiteSetting>(`/settings/${key}`, { setting_value: value });
    },

    /**
     * Create a new setting (admin only)
     */
    create: async (data: {
        setting_key: string;
        setting_value?: string;
        setting_type?: string;
        description?: string;
    }): Promise<ApiResponse<SiteSetting>> => {
        return apiClient.post<SiteSetting>('/settings', data);
    },

    /**
     * Delete a setting (admin only)
     */
    delete: async (key: string): Promise<ApiResponse<void>> => {
        return apiClient.delete<void>(`/settings/${key}`);
    },
};

