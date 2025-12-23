/**
 * Redirect utility to preserve the intended destination before authentication
 */

const REDIRECT_KEY = "auth_redirect_path";

/**
 * Store the current path as redirect destination
 */
export function setRedirectPath(path: string | null): void {
    if (typeof window === "undefined") return;

    if (path) {
        // Store path in sessionStorage (cleared when tab closes)
        sessionStorage.setItem(REDIRECT_KEY, path);
    } else {
        sessionStorage.removeItem(REDIRECT_KEY);
    }
}

/**
 * Get the stored redirect path and clear it
 */
export function getAndClearRedirectPath(): string | null {
    if (typeof window === "undefined") return null;

    const path = sessionStorage.getItem(REDIRECT_KEY);
    if (path) {
        sessionStorage.removeItem(REDIRECT_KEY);
        return path;
    }
    return null;
}

/**
 * Get the stored redirect path without clearing it
 */
export function getRedirectPath(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(REDIRECT_KEY);
}

/**
 * Check if a path should be preserved as redirect
 * (Excludes auth-related paths and admin pages)
 */
export function shouldPreserveRedirect(path: string): boolean {
    // Don't preserve redirects for these paths
    const excludedPaths = [
        "/login",
        "/register",
        "/reset-password",
        "/dashboard",
        "/admin",
    ];

    return !excludedPaths.some((excluded) => path.startsWith(excluded));
}
