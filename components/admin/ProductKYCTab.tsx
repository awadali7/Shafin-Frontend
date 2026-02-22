"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle, XCircle, Search } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./utils";
import type { ProductKYCVerification } from "@/lib/api/types";

interface ProductKYCTabProps {
    kycApplications: ProductKYCVerification[];
    onViewKyc: (kyc: ProductKYCVerification) => void;
    onVerifyKyc: (kyc: ProductKYCVerification) => void;
    onRejectKyc: (kyc: ProductKYCVerification) => void;
}

export const ProductKYCTab: React.FC<ProductKYCTabProps> = ({
    kycApplications,
    onViewKyc,
    onVerifyKyc,
    onRejectKyc,
}) => {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return kycApplications;
        const q = search.trim().toLowerCase();
        return kycApplications.filter(
            (k) =>
                (k.user_email || "").toLowerCase().includes(q) ||
                `${k.user_first_name || ""} ${k.user_last_name || ""}`.toLowerCase().includes(q) ||
                (k.full_name || "").toLowerCase().includes(q) ||
                (k.contact_number || "").includes(q)
        );
    }, [kycApplications, search]);

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-slate-900">
                    Product KYC Verifications
                    <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
                </h2>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search name, email, or contact…"
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.length > 0 ? (
                            filtered.map((kyc) => (
                                <tr key={kyc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">{kyc.user_email || "N/A"}</div>
                                        <div className="text-sm text-gray-500">{kyc.user_first_name || ""} {kyc.user_last_name || ""}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">{kyc.full_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{kyc.contact_number}</div>
                                        <div className="text-sm text-gray-500">{kyc.whatsapp_number}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={kyc.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(kyc.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => onViewKyc(kyc)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-1.5 text-sm font-medium"
                                            >
                                                <span>View</span>
                                            </button>
                                            {kyc.status === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => onVerifyKyc(kyc)}
                                                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-1.5 text-sm font-medium"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Verify</span>
                                                    </button>
                                                    <button
                                                        onClick={() => onRejectKyc(kyc)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-1.5 text-sm font-medium"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        <span>Reject</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                    No Product KYC applications found{search ? ` for "${search}"` : ""}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
