"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./utils";
import type { CoursePurchase } from "@/lib/api/admin";

interface RequestsTabProps {
    coursePurchases: CoursePurchase[];
}

export const RequestsTab: React.FC<RequestsTabProps> = ({
    coursePurchases,
}) => {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return coursePurchases;
        const q = search.trim().toLowerCase();
        return coursePurchases.filter((p: any) => {
            const name = `${p.user_first_name || ""} ${p.user_last_name || ""}`.toLowerCase();
            const email = (p.user_email || "").toLowerCase();
            const course = (p.course_name || "").toLowerCase();
            return name.includes(q) || email.includes(q) || course.includes(q);
        });
    }, [coursePurchases, search]);

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-slate-900">
                    Course Purchases
                    <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
                </h2>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search user, email, or course…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent w-64"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Info</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.length > 0 ? (
                            filtered.map((purchase: any) => (
                                <tr key={purchase.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">
                                            {purchase.user_first_name || purchase.user_last_name
                                                ? `${purchase.user_first_name || ""} ${purchase.user_last_name || ""}`
                                                : "Unknown User"}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {purchase.user_email || ""}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">
                                            {purchase.course_name || "Unknown Course"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">
                                            ₹{purchase.course_price}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {/* You can define a custom payment status display here or use StatusBadge */}
                                        <StatusBadge status={purchase.payment_status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(purchase.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="text-sm text-gray-500">
                                            Start: {purchase.access_start ? new Date(purchase.access_start).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            End: {purchase.access_end ? new Date(purchase.access_end).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                    No course purchases found{search ? ` for "${search}"` : ""}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

