"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/contexts/AuthContext";

export default function MainContent({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const { isMinimized } = useSidebar();
    const pathname = usePathname();
    const { isAuth } = useAuth();

    // Check if sidebar should be shown (must match ConditionalSidebar logic)
    const publicPages = [
        "/",
        "/about",
        "/login",
        "/register",
        "/reset-password",
        "/terms",
    ];

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

    const showSidebar =
        isAuth &&
        (authenticatedPages.some((page) => pathname?.startsWith(page)) ||
            (pathname?.startsWith("/courses") &&
                !publicPages.includes(pathname)) ||
            (pathname?.startsWith("/blog") && !publicPages.includes(pathname)));

    return (
        <main
            className={`pt-[73px] min-h-screen transition-all duration-300 ${
                showSidebar ? (isMinimized ? "lg:ml-20" : "lg:ml-72") : "ml-0"
            } ${className}`}
        >
            {children}
        </main>
    );
}
