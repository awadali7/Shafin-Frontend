/**
 * Navigation Configuration
 * Centralized navigation structure for Header and Sidebar
 */

import React from "react";
import {
    Home,
    BookOpen,
    FileText,
    Target,
    Settings,
    User,
    Shield,
    ShoppingBag,
    Package,
    Download,
    UserCheck,
    LayoutDashboard,
    Store,
    BadgeCheck,
} from "lucide-react";

export interface NavigationItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    requiresAuth?: boolean;
    adminOnly?: boolean;
    badge?: string | number;
    // Conditional visibility based on user data
    showIfHasCourses?: boolean;
    showIfHasOrders?: boolean;
    showIfHasDownloads?: boolean;
    // Conditional visibility based on user type
    showIfUserType?: "student" | "business_owner" | null;
}

export interface NavigationSection {
    title?: string;
    items: NavigationItem[];
}

// Public navigation items (shown in Header)
export const publicNavigation: NavigationItem[] = [
    {
        label: "Home",
        href: "/",
        icon: Home,
        requiresAuth: false,
    },
    {
        label: "About",
        href: "/about",
        icon: Home, // Icon not used in header
        requiresAuth: false,
    },
    {
        label: "Courses",
        href: "/courses",
        icon: BookOpen,
        requiresAuth: false,
    },
    {
        label: "Shop",
        href: "/shop",
        icon: Store,
        requiresAuth: false,
    },
    {
        label: "Blog",
        href: "/blog",
        icon: FileText,
        requiresAuth: false,
    },
];

// Sidebar navigation sections (for authenticated users)
export const sidebarSections: NavigationSection[] = [
    {
        title: "Main",
        items: [
            {
                label: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
                requiresAuth: true,
            },
            {
                label: "Courses",
                href: "/courses",
                icon: BookOpen,
                requiresAuth: true,
            },
            {
                label: "Blog",
                href: "/blog",
                icon: FileText,
                requiresAuth: true,
            },
        ],
    },
    {
        title: "My Learning",
        items: [
            {
                label: "My Learning",
                href: "/my-learning",
                icon: Target,
                requiresAuth: true,
                showIfHasCourses: true,
            },
            {
                label: "My Orders",
                href: "/orders",
                icon: ShoppingBag,
                requiresAuth: true,
                showIfHasOrders: true,
            },
            {
                label: "My Downloads",
                href: "/downloads",
                icon: Download,
                requiresAuth: true,
                showIfHasDownloads: true,
            },
            {
                label: "Student KYC",
                href: "/kyc",
                icon: UserCheck,
                requiresAuth: true,
                showIfUserType: "student",
            },
            {
                label: "Business KYC",
                href: "/kyc/product",
                icon: BadgeCheck,
                requiresAuth: true,
                showIfUserType: "business_owner",
            },
        ],
    },
    {
        title: "Account",
        items: [
            {
                label: "Profile",
                href: "/profile",
                icon: User,
                requiresAuth: true,
            },
            {
                label: "Settings",
                href: "/settings",
                icon: Settings,
                requiresAuth: true,
            },
        ],
    },
    {
        title: "Admin",
        items: [
            {
                label: "Admin Dashboard",
                href: "/admin",
                icon: Shield,
                requiresAuth: true,
                adminOnly: true,
            },
        ],
    },
];

// Get all sidebar items (flattened, for easy filtering)
export const getAllSidebarItems = (): NavigationItem[] => {
    return sidebarSections.flatMap((section) => section.items);
};

// Check if a navigation item should be visible for a user
export const isNavigationVisible = (
    item: NavigationItem,
    isAuthenticated: boolean,
    isAdmin: boolean = false,
    userStats?: {
        hasCourses?: boolean;
        hasOrders?: boolean;
        hasDownloads?: boolean;
    },
    userType?: "student" | "business_owner" | null
): boolean => {
    // Basic auth checks
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.adminOnly && !isAdmin) return false;
    
    // Conditional visibility based on user data (admins see everything)
    if (!isAdmin && userStats) {
        if (item.showIfHasCourses && !userStats.hasCourses) return false;
        if (item.showIfHasOrders && !userStats.hasOrders) return false;
        if (item.showIfHasDownloads && !userStats.hasDownloads) return false;
    }
    
    // Conditional visibility based on user type (admins see all KYC options)
    if (!isAdmin && item.showIfUserType) {
        // If user hasn't selected a type yet, show both KYC options
        if (userType === null || userType === undefined) {
            return true;
        }
        // Otherwise, only show the KYC option matching their user type
        if (item.showIfUserType !== userType) {
            return false;
        }
    }
    
    return true;
};

