/**
 * User Type Utilities
 * Helper functions to determine user types and permissions
 */

import type { User, UserType, UserTypeFlags } from "@/lib/api/types";

/**
 * Check if user is a guest (not logged in)
 */
export const isGuest = (user: User | null): boolean => {
    return user === null || user === undefined;
};

/**
 * Check if user is authenticated (logged in)
 */
export const isAuthenticated = (user: User | null): boolean => {
    return user !== null && user !== undefined;
};

/**
 * Check if user is a student (has verified KYC for courses)
 */
export const isStudent = (user: User | null): boolean => {
    if (!user) return false;
    return user.kyc_status === "verified";
};

/**
 * Check if user is a business owner (has verified Product KYC for products)
 */
export const isBusinessOwner = (user: User | null): boolean => {
    if (!user) return false;
    return user.product_kyc_status === "verified";
};

/**
 * Check if user is an admin
 */
export const isAdmin = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === "admin";
};

/**
 * Check if user has any verified KYC (either regular or product)
 */
export const hasAnyVerifiedKYC = (user: User | null): boolean => {
    if (!user) return false;
    return user.kyc_status === "verified" || user.product_kyc_status === "verified";
};

/**
 * Check if user needs KYC verification (for course access)
 */
export const needsKYC = (user: User | null): boolean => {
    if (!user) return false;
    return user.kyc_status !== "verified";
};

/**
 * Check if user needs Product KYC verification (for product purchases)
 */
export const needsProductKYC = (user: User | null): boolean => {
    if (!user) return false;
    return user.product_kyc_status !== "verified";
};

/**
 * Get detailed user type with primary classification
 */
export const getUserType = (user: User | null): UserType => {
    if (isGuest(user)) return "guest";
    
    const admin = isAdmin(user);
    const student = isStudent(user);
    const business = isBusinessOwner(user);
    
    // Admin combinations
    if (admin && student && business) return "admin_all";
    if (admin && student) return "admin_student";
    if (admin && business) return "admin_business";
    if (admin) return "admin";
    
    // Non-admin combinations
    if (student && business) return "student_business";
    if (student) return "student";
    if (business) return "business_owner";
    
    // Authenticated but no verified KYC
    return "guest";
};

/**
 * Get user type display name
 */
export const getUserTypeLabel = (userType: UserType): string => {
    const labels: Record<UserType, string> = {
        guest: "Guest",
        student: "Student",
        business_owner: "Business Owner",
        admin: "Admin",
        student_business: "Student & Business Owner",
        admin_student: "Admin & Student",
        admin_business: "Admin & Business Owner",
        admin_all: "Admin (Full Access)",
    };
    return labels[userType];
};

/**
 * Get all user type flags and information
 */
export const getUserTypeFlags = (user: User | null): UserTypeFlags => {
    return {
        isGuest: isGuest(user),
        isAuthenticated: isAuthenticated(user),
        isStudent: isStudent(user),
        isBusinessOwner: isBusinessOwner(user),
        isAdmin: isAdmin(user),
        userType: getUserType(user),
        hasAnyKYC: hasAnyVerifiedKYC(user),
        needsKYC: needsKYC(user),
        needsProductKYC: needsProductKYC(user),
    };
};

/**
 * Check if user can access courses
 */
export const canAccessCourses = (user: User | null): boolean => {
    return isStudent(user) || isAdmin(user);
};

/**
 * Check if user can purchase products
 */
export const canPurchaseProducts = (user: User | null): boolean => {
    // Any authenticated user can browse, but business owners get special pricing
    return isAuthenticated(user);
};

/**
 * Check if user can access wholesale/bulk features
 */
export const canAccessWholesale = (user: User | null): boolean => {
    return isBusinessOwner(user) || isAdmin(user);
};

/**
 * Check if user can access admin panel
 */
export const canAccessAdmin = (user: User | null): boolean => {
    return isAdmin(user);
};

/**
 * Get redirect path based on user type
 */
export const getDefaultRedirectPath = (user: User | null): string => {
    if (isGuest(user)) return "/";
    if (isAdmin(user)) return "/admin";
    if (isStudent(user) && isBusinessOwner(user)) return "/dashboard";
    if (isStudent(user)) return "/my-learning";
    if (isBusinessOwner(user)) return "/shop";
    return "/dashboard";
};

/**
 * Get KYC status message
 */
export const getKYCStatusMessage = (user: User | null): string | null => {
    if (!user) return null;
    
    const kycStatus = user.kyc_status;
    const productKycStatus = user.product_kyc_status;
    
    if (kycStatus === "pending" || productKycStatus === "pending") {
        return "Your KYC verification is pending review.";
    }
    
    if (kycStatus === "rejected") {
        return "Your KYC verification was rejected. Please resubmit.";
    }
    
    if (productKycStatus === "rejected") {
        return "Your Product KYC verification was rejected. Please resubmit.";
    }
    
    if (!kycStatus && !productKycStatus) {
        return "Complete KYC verification to access courses or products.";
    }
    
    return null;
};

/**
 * Get available features for user
 */
export const getAvailableFeatures = (user: User | null): string[] => {
    const features: string[] = [];
    
    if (isGuest(user)) {
        features.push("Browse Courses", "Browse Products", "View Blog");
        return features;
    }
    
    if (isAdmin(user)) {
        features.push("Full Admin Access", "Manage Users", "Manage Courses", "Manage Products", "Manage Orders");
    }
    
    if (isStudent(user)) {
        features.push("Access Courses", "Track Learning Progress", "Download Resources");
    }
    
    if (isBusinessOwner(user)) {
        features.push("Purchase Products", "Bulk Pricing", "Wholesale Access", "Product Downloads");
    }
    
    // Common authenticated features
    if (isAuthenticated(user)) {
        features.push("Order History", "Profile Management", "Notifications");
    }
    
    return features;
};

/**
 * Export all utilities
 */
export const userTypeUtils = {
    isGuest,
    isAuthenticated,
    isStudent,
    isBusinessOwner,
    isAdmin,
    hasAnyVerifiedKYC,
    needsKYC,
    needsProductKYC,
    getUserType,
    getUserTypeLabel,
    getUserTypeFlags,
    canAccessCourses,
    canPurchaseProducts,
    canAccessWholesale,
    canAccessAdmin,
    getDefaultRedirectPath,
    getKYCStatusMessage,
    getAvailableFeatures,
};

