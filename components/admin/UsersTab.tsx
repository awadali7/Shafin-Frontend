"use client";

import React, { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Monitor, Search } from "lucide-react";
import { formatDate } from "./utils";
import type { User } from "@/lib/api/types";

interface UsersTabProps {
    users: User[];
    onAddUser: () => void;
    onEditUser: (user: User) => void;
    onDeleteUser: (user: User) => void;
    onViewLoginDetails: (user: User) => void;
}

type FilterKey = "all" | "admin" | "student_kyc" | "business_kyc" | "both_kyc";

// 🎓 Student KYC  = verified in kyc_verifications (course KYC table)
// 🏢 Business KYC = verified in product_kyc_verifications (product KYC table)
const hasStudentKyc = (u: any) => u.course_kyc_status === "verified";
const hasBusinessKyc = (u: any) => u.product_kyc_status === "verified";
const hasBothKyc = (u: any) => hasStudentKyc(u) && hasBusinessKyc(u);

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "admin", label: "Admins" },
    { key: "student_kyc", label: "🎓 Student KYC" },
    { key: "business_kyc", label: "🏢 Business KYC" },
    { key: "both_kyc", label: "⭐ Both KYC" },
];


export const UsersTab: React.FC<UsersTabProps> = ({
    users,
    onAddUser,
    onEditUser,
    onDeleteUser,
    onViewLoginDetails,
}) => {
    const [filter, setFilter] = useState<FilterKey>("all");
    const [search, setSearch] = useState("");

    const counts = useMemo<Record<FilterKey, number>>(() => ({
        all: users.length,
        admin: users.filter((u) => u.role === "admin").length,
        student_kyc: users.filter((u) => hasStudentKyc(u)).length,
        business_kyc: users.filter((u) => hasBusinessKyc(u)).length,
        both_kyc: users.filter((u) => hasBothKyc(u)).length,
    }), [users]);

    const filtered = useMemo(() => {
        let list = users;

        if (filter === "admin") list = list.filter((u) => u.role === "admin");
        else if (filter === "student_kyc") list = list.filter((u) => hasStudentKyc(u));
        else if (filter === "business_kyc") list = list.filter((u) => hasBusinessKyc(u));
        else if (filter === "both_kyc") list = list.filter((u) => hasBothKyc(u));

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                (u) =>
                    `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q)
            );
        }

        return list;
    }, [users, filter, search]);



    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-slate-900">All Users</h2>
                <button
                    onClick={onAddUser}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-all duration-300 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add User</span>
                </button>
            </div>

            {/* Filter Tabs + Search */}
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap bg-gray-50">
                {/* Filter pills */}
                <div className="flex items-center gap-1 flex-wrap">
                    {FILTERS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filter === key
                                    ? "bg-[#B00000] text-white border-[#B00000]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800"
                                }`}
                        >
                            {label}
                            <span
                                className={`inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold ${filter === key
                                        ? "bg-white/25 text-white"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                            >
                                {counts[key]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search name or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent w-56"
                    />
                </div>
            </div>

            {/* Section heading */}
            <div className="px-6 pt-3 pb-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    {FILTERS.find((f) => f.key === filter)?.label} — {filtered.length} user{filtered.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.length > 0 ? (
                            filtered.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="shrink-0 h-8 w-8 rounded-full bg-[#B00000] flex items-center justify-center text-white font-medium text-sm">
                                                {u.first_name?.[0] || "U"}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-slate-900">
                                                    {u.first_name} {u.last_name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{u.email}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === "admin"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {u.role || "user"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {(u as any).user_type ? (
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(u as any).user_type === "student"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : (u as any).user_type === "business_owner"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {(u as any).user_type === "student"
                                                    ? "🎓 Student"
                                                    : (u as any).user_type === "business_owner"
                                                        ? "🏢 Business"
                                                        : "Not Set"}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">Not set</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {u.last_login_at ? formatDate(u.last_login_at) : "Never"}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(u.created_at)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-1">
                                            <button
                                                onClick={() => onViewLoginDetails(u)}
                                                className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                                title="View Login Details"
                                            >
                                                <Monitor className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEditUser(u)}
                                                className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteUser(u)}
                                                className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                                    No users found{search ? ` for "${search}"` : ""}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
