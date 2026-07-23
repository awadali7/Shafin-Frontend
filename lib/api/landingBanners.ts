import { apiClient } from './client';

export interface LandingBanner {
    id: number;
    image_url: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export const getBannerImageUrl = (p: string): string => {
    if (!p) return '';
    if (p.startsWith('http')) return p;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const base = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
};

export const landingBannersApi = {
    getActive: () => apiClient.get<LandingBanner[]>('/landing-banners/active'),
    getAll: () => apiClient.get<LandingBanner[]>('/landing-banners'),
    upload: (formData: FormData) => apiClient.post<LandingBanner>('/landing-banners/upload', formData),
    toggleStatus: (id: number, is_active: boolean) =>
        apiClient.patch<LandingBanner>(`/landing-banners/${id}/status`, { is_active }),
    delete: (id: number) => apiClient.delete<{ message: string }>(`/landing-banners/${id}`),
};
