"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, ChevronLeft } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import {
    sidebarSections,
    isNavigationVisible,
    type NavigationItem,
} from "@/lib/navigation";
import { userStatsApi } from "@/lib/api/user-stats";

export default function Sidebar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isMinimized, setIsMinimized } = useSidebar();
    const pathname = usePathname();
    const { user } = useAuth();
    const [userStats, setUserStats] = useState<{
        hasCourses: boolean;
        hasOrders: boolean;
        hasDownloads: boolean;
    }>({
        hasCourses: false,
        hasOrders: false,
        hasDownloads: false,
    });

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleMinimize = () => setIsMinimized(!isMinimized);

    const isActive = (path: string) => {
        // For root path, only match exactly
        if (path === "/") {
            return pathname === "/";
        }
        // For KYC paths, match exactly (don't match /kyc when on /kyc/product)
        if (path === "/kyc" || path === "/kyc/product") {
            return pathname === path;
        }
        // For other paths, match exact or starts with path
        return pathname === path || pathname.startsWith(path + "/");
    };

    // Fetch user stats for conditional navigation visibility
    useEffect(() => {
        const fetchUserStats = async () => {
            if (user && user.role !== 'admin') {
                try {
                    const stats = await userStatsApi.getNavigationStats();
                    setUserStats({
                        hasCourses: stats.hasCourses,
                        hasOrders: stats.hasOrders,
                        hasDownloads: stats.hasDownloads,
                    });
                } catch (error) {
                    console.error("Failed to fetch user stats:", error);
                }
            } else if (user && user.role === 'admin') {
                // Admins see all navigation items
                setUserStats({
                    hasCourses: true,
                    hasOrders: true,
                    hasDownloads: true,
                });
            }
        };

        fetchUserStats();
    }, [user]);

    // Sidebar now visible for all users (logged in or not)
    // if (user) {
    //     return null;
    // }

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-[85px] left-4 z-40 p-2 rounded-lg bg-[#B00000] text-white hover:bg-red-800 transition-all duration-300"
                aria-label="Toggle Menu"
            >
                {isSidebarOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Menu className="w-6 h-6" />
                )}
            </button>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20 backdrop-blur-sm transition-opacity duration-300"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-[73px] left-0 z-30 h-[calc(100vh-73px)] bg-white
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isMinimized ? "w-20" : "w-72"}
          border-r border-gray-200
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Minimize Button */}
                    <button
                        onClick={toggleMinimize}
                        className="hidden lg:flex absolute -right-3 top-6 z-40 w-6 h-6 rounded-full bg-[#B00000] text-white items-center justify-center hover:bg-red-800 transition-all duration-300 hover:scale-110"
                        aria-label={
                            isMinimized ? "Expand Sidebar" : "Minimize Sidebar"
                        }
                    >
                        {isMinimized ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                    </button>

                    {/* Navigation */}
                    <nav
                        className={`flex-1 overflow-y-auto py-6 custom-scrollbar transition-all duration-300 ${
                            isMinimized ? "px-2" : "px-4"
                        }`}
                    >
                        {sidebarSections.map((section, sectionIndex) => {
                            // Filter items based on user role, authentication, and user stats
                            const visibleItems = section.items.filter((item) =>
                                isNavigationVisible(
                                    item,
                                    !!user, // user is authenticated
                                    user?.role === 'admin', // user is admin
                                    userStats, // user stats for conditional visibility
                                    user?.user_type // user type for KYC visibility
                                )
                            );

                            // Skip sections with no visible items
                            if (visibleItems.length === 0) return null;

                            return (
                                <div
                                    key={sectionIndex}
                                    className={sectionIndex > 0 ? "mt-6" : ""}
                                >
                                    {/* Section Title */}
                                    {section.title && !isMinimized && (
                                        <div className="px-4 mb-2">
                                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                {section.title}
                                            </h3>
                                        </div>
                                    )}

                                    {/* Section Items */}
                                    <div className="space-y-1">
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.href);

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => {
                                                        // Close mobile sidebar when link is clicked
                                                        if (
                                                            window.innerWidth <
                                                            1024
                                                        ) {
                                                            setIsSidebarOpen(
                                                                false
                                                            );
                                                        }
                                                    }}
                                                    className={`
                                            flex items-center py-3 rounded-xl transition-all duration-300
                                            ${
                                                isMinimized
                                                    ? "justify-center w-full"
                                                    : "gap-3 px-4"
                                            }
                                            ${
                                                active
                                                    ? "bg-[#B00000] text-white"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                            }
                                          `}
                                                    title={
                                                        isMinimized
                                                            ? item.label
                                                            : ""
                                                    }
                                                >
                                                    <Icon className="w-5 h-5 shrink-0 flex-shrink-0" />
                                                    {!isMinimized && (
                                                        <span className="font-medium transition-opacity duration-300 flex-1">
                                                            {item.label}
                                                        </span>
                                                    )}
                                                    {item.badge &&
                                                        !isMinimized && (
                                                            <span className="px-2 py-0.5 text-xs font-semibold bg-[#B00000] text-white rounded-full">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .custom-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </>
    );
}
