import React from "react";

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
        case "pending":
            return (
                <span
                    className={`${baseClasses} bg-yellow-100 text-yellow-800`}
                >
                    Pending
                </span>
            );
        case "approved":
        case "verified":
            return (
                <span className={`${baseClasses} bg-green-100 text-green-800`}>
                    {status === "verified" ? "Verified" : "Approved"}
                </span>
            );
        case "rejected":
            return (
                <span className={`${baseClasses} bg-red-100 text-red-800`}>
                    Rejected
                </span>
            );
        default:
            return (
                <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                    {status}
                </span>
            );
    }
};
