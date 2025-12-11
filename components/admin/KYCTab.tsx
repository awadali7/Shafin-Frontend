"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./utils";
import type { KYCVerification } from "@/lib/api/types";

interface KYCTabProps {
    kycApplications: KYCVerification[];
    onViewKyc: (kyc: KYCVerification) => void;
    onVerifyKyc: (kyc: KYCVerification) => void;
    onRejectKyc: (kyc: KYCVerification) => void;
}

export const KYCTab: React.FC<KYCTabProps> = ({
    kycApplications,
    onViewKyc,
    onVerifyKyc,
    onRejectKyc,
}) => {
    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-slate-900">
                    KYC Verifications
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submitted
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {kycApplications.length > 0 ? (
                            kycApplications.map((kyc) => (
                                <tr key={kyc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">
                                            {kyc.user_email || "N/A"}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {kyc.user_first_name || ""}{" "}
                                            {kyc.user_last_name || ""}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">
                                            {kyc.first_name} {kyc.last_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {kyc.contact_number}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {kyc.whatsapp_number}
                                        </div>
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
                                                        onClick={() =>
                                                            onVerifyKyc(kyc)
                                                        }
                                                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-1.5 text-sm font-medium"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Verify</span>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            onRejectKyc(kyc)
                                                        }
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
                                <td
                                    colSpan={6}
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                    No KYC applications found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
