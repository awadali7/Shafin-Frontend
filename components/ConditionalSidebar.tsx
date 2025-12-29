"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function ConditionalSidebar() {
    const pathname = usePathname();
    const { isAuth } = useAuth();

    // Pages where sidebar should NOT be shown (public pages)
    const publicPages = [
        "/",
        "/about",
        "/login",
        "/register",
        "/reset-password",
        "/terms",
    ];

    // Pages where sidebar should be shown (authenticated pages)
    const authenticatedPages = [
        "/dashboard",
        "/profile",
        "/my-learning",
        "/orders",
        "/downloads",
        "/kyc",
        "/settings",
        "/admin",
        "/notifications",
        "/checkout",
    ];

    // Show sidebar if user is authenticated AND on an authenticated page
    // OR on courses/blog pages (but only if authenticated)
    const showSidebar =
        isAuth &&
        (authenticatedPages.some((page) => pathname?.startsWith(page)) ||
            (pathname?.startsWith("/courses") &&
                !publicPages.includes(pathname)) ||
            (pathname?.startsWith("/blog") && !publicPages.includes(pathname)) ||
            (pathname?.startsWith("/shop") && !publicPages.includes(pathname)));

    if (!showSidebar) {
        return null;
    }

    return <Sidebar />;
}
