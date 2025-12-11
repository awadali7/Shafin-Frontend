"use client";

import React from "react";
import {
    Users,
    BookOpen,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    Loader2,
} from "lucide-react";
import type { DashboardStats } from "@/lib/api/types";

interface DashboardTabProps {
    stats: DashboardStats | null;
    loading?: boolean;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
    stats,
    loading = false,
}) => {
    if (loading || !stats) {
        return (
            <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000] mx-auto" />
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Total Users
                            </p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                {stats.total_users}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Total Courses */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Total Courses
                            </p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                {stats.total_courses}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Pending Requests
                            </p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                {stats.pending_requests}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                {/* Total Requests */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Total Requests
                            </p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                {stats.total_requests}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Approved
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                                {stats.approved_requests || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <div className="flex items-center space-x-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Rejected
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                                {stats.rejected_requests || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <div className="flex items-center space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Pending
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                                {stats.pending_requests}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
