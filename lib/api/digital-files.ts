import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface DigitalFileAccess {
    access_id: string;
    filename: string;
    source: string;
    access_start: string;
    access_end: string;
    granted_at: string;
}

export const digitalFilesApi = {
    getMyAccess: async (): Promise<ApiResponse<DigitalFileAccess[]>> => {
        return apiClient.get<DigitalFileAccess[]>("/users/digital-file-access");
    },
};
