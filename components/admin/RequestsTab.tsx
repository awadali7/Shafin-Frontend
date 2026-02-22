"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle, XCircle, Search } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./utils";
import type { CourseRequest } from "@/lib/api/types";

interface RequestsTabProps {
    requests: CourseRequest[];
    onApproveRequest: (request: CourseRequest) => void;
    onRejectRequest: (request: CourseRequest) => void;
}

export const RequestsTab: React.FC<RequestsTabProps> = ({
    requests,
    onApproveRequest,
    onRejectRequest,
}) => {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return requests;
        const q = search.trim().toLowerCase();
        return requests.filter((r: any) => {
            const name = `${r.user_first_name || r.user?.first_name || ""} ${r.user_last_name || r.user?.last_name || ""}`.toLowerCase();
            const email = (r.user_email || r.user?.email || "").toLowerCase();
            const course = (r.course_name || r.course?.name || "").toLowerCase();
            return name.includes(q) || email.includes(q) || course.includes(q);
        });
    }, [requests, search]);

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-slate-900">
                    Course Requests
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.length > 0 ? (
                            filtered.map((request: any) => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">
                                            {(request as any).user_first_name || request.user?.first_name
                                                ? `${(request as any).user_first_name || request.user?.first_name} ${(request as any).user_last_name || request.user?.last_name}`
                                                : "Unknown User"}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {(request as any).user_email || request.user?.email || ""}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">
                                            {(request as any).course_name || request.course?.name || "Unknown Course"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={request.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(request.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {request.status === "pending" && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => onApproveRequest(request)}
                                                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-1.5 text-sm font-medium"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Approve</span>
                                                </button>
                                                <button
                                                    onClick={() => onRejectRequest(request)}
                                                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-1.5 text-sm font-medium"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    <span>Reject</span>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                                    No requests found{search ? ` for "${search}"` : ""}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
