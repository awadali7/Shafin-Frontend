"use client";

import React from "react";

/**
 * MainContent - Updated to remove sidebar margin logic
 * Sidebar has been removed, all navigation is now in Header
 */
export default function MainContent({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <main
            className={`pt-[73px] min-h-screen ${className}`}
        >
            {children}
        </main>
    );
}
