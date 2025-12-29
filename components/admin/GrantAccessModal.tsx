"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, UserPlus, AlertCircle } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import type { User, Course } from "@/lib/api/types";

interface GrantAccessModalProps {
    course: Course | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({
    course,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [accessStartDate, setAccessStartDate] = useState<string>("");
    const [accessEndDate, setAccessEndDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isGranting, setIsGranting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load users when modal opens
    useEffect(() => {
        if (isOpen && course) {
            fetchUsers();
            // Set default dates
            const today = new Date();
            const sixMonthsLater = new Date();
            sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

            // Format dates as YYYY-MM-DD for input[type="date"]
            const formatDateForInput = (date: Date) => {
                return date.toISOString().split("T")[0];
            };

            setAccessStartDate(formatDateForInput(today));
            setAccessEndDate(formatDateForInput(sixMonthsLater));
            setSelectedUserId("");
            setError(null);
            setSuccess(null);
            setSearchQuery("");
        }
    }, [isOpen, course]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await adminApi.getAllUsers(1, 100, "user");

            if (response.success && response.data) {
                const usersData = response.data.users || response.data || [];
                setUsers(Array.isArray(usersData) ? usersData : []);
            }
        } catch (err: any) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase();
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return (
            fullName.includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    });

    const handleGrantAccess = async () => {
        if (!course || !selectedUserId) {
            setError("Please select a user");
            return;
        }

        if (!accessStartDate || !accessEndDate) {
            setError("Please select both start and end dates");
            return;
        }

        const startDate = new Date(accessStartDate);
        const endDate = new Date(accessEndDate);

        if (endDate <= startDate) {
            setError("End date must be after start date");
            return;
        }

        setIsGranting(true);
        setError(null);
        setSuccess(null);

        try {
            // Convert dates to ISO 8601 format with time
            const accessStart = new Date(accessStartDate + "T00:00:00.000Z").toISOString();
            const accessEnd = new Date(accessEndDate + "T23:59:59.999Z").toISOString();

            const { coursesApi } = await import("@/lib/api/courses");
            const response = await coursesApi.grantAccess(course.id, {
                user_id: selectedUserId,
                access_start: accessStart,
                access_end: accessEnd,
            });

            if (response.success) {
                setSuccess("Course access granted successfully!");
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    setSuccess(null);
                    setError(null);
                    setSelectedUserId("");
                    setAccessStartDate("");
                    setAccessEndDate("");
                }, 1500);
            } else {
                setError(
                    (response as any).message || "Failed to grant course access"
                );
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to grant course access"
            );
        } finally {
            setIsGranting(false);
        }
    };

    if (!isOpen || !course) return null;

    const selectedUser = users.find((u) => u.id === selectedUserId);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
                onClick={() => {
                    if (!isGranting) {
                        onClose();
                    }
                }}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-[#B00000]/10 rounded-lg">
                                <UserPlus className="w-6 h-6 text-[#B00000]" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Grant Course Access
                            </h2>
                        </div>
                        {!isGranting && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Success Message */}
                        {success && (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-green-600 shrink-0" />
                                <p className="text-sm text-green-600 font-medium">
                                    {success}
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                                <p className="text-sm text-red-600 font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        {!success && (
                            <>
                                {/* Course Info */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        Course Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">
                                                Course Name:{" "}
                                            </span>
                                            <span className="text-sm text-slate-900 font-semibold">
                                                {course.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* User Selection */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        Select User
                                    </h3>
                                    {/* Search Input */}
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    />
                                    {/* User List */}
                                    <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                                        {loadingUsers ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-5 h-5 animate-spin text-[#B00000]" />
                                            </div>
                                        ) : filteredUsers.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">
                                                No users found
                                            </div>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() =>
                                                        setSelectedUserId(
                                                            user.id
                                                        )
                                                    }
                                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                                        selectedUserId ===
                                                        user.id
                                                            ? "bg-[#B00000]/10 border-[#B00000]/20"
                                                            : ""
                                                    }`}
                                                >
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {user.first_name}{" "}
                                                        {user.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {user.email}
                                                    </p>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    {selectedUser && (
                                        <div className="mt-3 p-3 bg-[#B00000]/10 border border-[#B00000]/20 rounded-lg">
                                            <p className="text-sm text-[#B00000] font-medium">
                                                Selected: {selectedUser.first_name}{" "}
                                                {selectedUser.last_name} (
                                                {selectedUser.email})
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Access Dates */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                        Access Period
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={accessStartDate}
                                                onChange={(e) =>
                                                    setAccessStartDate(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={accessEndDate}
                                                onChange={(e) =>
                                                    setAccessEndDate(
                                                        e.target.value
                                                    )
                                                }
                                                min={accessStartDate}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Default: 6 months access period. You can
                                        modify these dates as needed.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 px-6 py-4 bg-gray-50">
                        {!success && (
                            <>
                                <button
                                    onClick={onClose}
                                    disabled={isGranting}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGrantAccess}
                                    disabled={isGranting || !selectedUserId}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isGranting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Granting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>Grant Access</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                        {success && (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#B00000] rounded-lg hover:bg-red-800 transition-colors"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

