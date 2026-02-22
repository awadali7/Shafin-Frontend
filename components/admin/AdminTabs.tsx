"use client";

import React from "react";

interface AdminTabsProps {
    activeTab:
    | "dashboard"
    | "users"
    | "requests"
    | "courses"
    | "blogs"
    | "kyc"
    | "product_kyc"
    | "products"
    | "orders"
    | "digital_files"
    | "settings";
    onTabChange: (
        tab:
            | "dashboard"
            | "users"
            | "requests"
            | "courses"
            | "blogs"
            | "kyc"
            | "product_kyc"
            | "products"
            | "orders"
            | "digital_files"
            | "settings"
    ) => void;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
    activeTab,
    onTabChange,
}) => {
    const tabs = [
        { id: "dashboard" as const, label: "Dashboard" },
        { id: "users" as const, label: "Users" },
        { id: "requests" as const, label: "Course Requests" },
        { id: "courses" as const, label: "Courses" },
        { id: "products" as const, label: "Products" },
        { id: "digital_files" as const, label: "Digital Files" },
        { id: "orders" as const, label: "Orders" },
        { id: "blogs" as const, label: "Blogs" },
        { id: "kyc" as const, label: "Course KYC" },
        { id: "product_kyc" as const, label: "Product KYC" },
        { id: "settings" as const, label: "Settings" },
    ];

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? "border-[#B00000] text-[#B00000]"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
