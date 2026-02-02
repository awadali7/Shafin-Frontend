import { apiClient } from "./client";

export interface UserStats {
    hasCourses: boolean;
    hasOrders: boolean;
    hasDownloads: boolean;
    coursesCount?: number;
    ordersCount?: number;
    downloadsCount?: number;
}

export const userStatsApi = {
    /**
     * Get user navigation stats (for sidebar visibility)
     */
    getNavigationStats: async (): Promise<UserStats> => {
        const response = await apiClient.get<UserStats>("/users/navigation-stats");
        return response.data as UserStats;
    },
};

