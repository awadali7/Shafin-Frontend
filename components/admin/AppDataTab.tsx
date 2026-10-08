"use client";

import React, { useEffect, useState } from "react";
import {
    CheckCircle,
    Loader2,
    RefreshCw,
    Search,
    Smartphone,
    X,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
    appUsersApi,
    AppUser,
    AppUserCounts,
    AppUserStatus,
} from "@/lib/api/appUsers";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./utils";

type StatusFilter = AppUserStatus | "all";

const FILTERS: { id: StatusFilter; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "serial_required", label: "No Serial Yet" },
    { id: "all", label: "All" },
];

const EMPTY_COUNTS: AppUserCounts = {
    serial_required: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
};

const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

export interface AppDataTabProps {
    // Called after approve/reject so the tab badge's pending count stays current
    onPendingCountChange?: () => void;
}

export const AppDataTab: React.FC<AppDataTabProps> = ({ onPendingCountChange }) => {
    const [filter, setFilter] = useState<StatusFilter>("pending");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<AppUser[]>([]);
    const [counts, setCounts] = useState<AppUserCounts>(EMPTY_COUNTS);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<AppUser | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await appUsersApi.list(filter, search);
            setUsers(res.data?.users ?? []);
            setCounts(res.data?.counts ?? EMPTY_COUNTS);
        } catch (err) {
            toast.error(errorMessage(err, "Failed to load app users"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, search]);

    // Search on a short pause in typing rather than every keystroke
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleApprove = async (user: AppUser) => {
        setActingId(user.id);
        try {
            await appUsersApi.approve(user.id);
            toast.success(`${user.email} approved`);
            await fetchUsers();
            onPendingCountChange?.();
        } catch (err) {
            toast.error(errorMessage(err, "Failed to approve"));
        } finally {
            setActingId(null);
        }
    };

    const openReject = (user: AppUser) => {
        setRejecting(user);
        setRejectReason("");
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejecting) return;
        setActingId(rejecting.id);
        try {
            await appUsersApi.reject(rejecting.id, rejectReason);
            toast.success(
                rejecting.status === "approved"
                    ? `Access revoked for ${rejecting.email}`
                    : `${rejecting.email} rejected`
            );
            setRejecting(null);
            await fetchUsers();
            onPendingCountChange?.();
        } catch (err) {
            toast.error(errorMessage(err, "Failed to reject"));
        } finally {
            setActingId(null);
        }
    };

    const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? "";

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Pinout App Users
                    </h2>
                    <p className="text-sm text-gray-500">
                        Approve a serial number to give the user access to the app files.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            placeholder="Search name, email, phone, or serial…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            aria-label="Search app users"
                            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent w-64"
                        />
                    </div>
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        aria-label="Refresh app users"
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            <div className="px-6 py-3 border-b border-gray-200 flex gap-2 overflow-x-auto">
                {FILTERS.map((f) => {
                    const count =
                        f.id === "all"
                            ? Object.values(counts).reduce((a, b) => a + b, 0)
                            : counts[f.id];
                    return (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            aria-pressed={filter === f.id}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f.id
                                ? "bg-brand-red text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {f.label}
                            <span className={`ml-1.5 ${filter === f.id ? "text-white/80" : "text-gray-400"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-brand-red mx-auto" aria-label="Loading" />
                                </td>
                            </tr>
                        ) : users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 align-top">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900">{user.full_name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                        {user.phone && (
                                            <a
                                                href={`tel:${user.phone}`}
                                                className="block text-sm text-gray-500 hover:text-brand-red"
                                            >
                                                {user.phone}
                                            </a>
                                        )}
                                        <div className="text-xs text-gray-400">Joined {formatDate(user.created_at)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.serial_number ? (
                                            <span className="font-mono text-sm text-slate-900">{user.serial_number}</span>
                                        ) : (
                                            <span className="text-sm text-gray-400">Not submitted</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.status === "serial_required" ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                                                No serial yet
                                            </span>
                                        ) : (
                                            <StatusBadge status={user.status} />
                                        )}
                                        {user.status === "rejected" && user.rejection_reason && (
                                            <p className="mt-1.5 text-xs text-gray-500 max-w-[220px]">
                                                {user.rejection_reason}
                                            </p>
                                        )}
                                        {user.reviewed_by_email && user.status !== "pending" && (
                                            <p className="mt-1 text-xs text-gray-400 whitespace-nowrap">
                                                by {user.reviewed_by_email} · {formatDate(user.reviewed_at ?? undefined)}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.serial_submitted_at ? formatDate(user.serial_submitted_at) : "—"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.active_device ? (
                                            <div className="flex items-start gap-2">
                                                <Smartphone className="w-4 h-4 text-brand-red mt-0.5 shrink-0" aria-hidden="true" />
                                                <div>
                                                    <div className="text-sm text-slate-900">
                                                        {user.active_device.deviceName || "Unknown device"}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        Last seen {formatDate(user.active_device_last_seen ?? undefined)}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">Signed out</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            {(user.status === "pending" || user.status === "rejected") && user.serial_number && (
                                                <button
                                                    onClick={() => handleApprove(user)}
                                                    disabled={actingId === user.id}
                                                    aria-label={`Approve ${user.email}`}
                                                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-60"
                                                >
                                                    {actingId === user.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" aria-hidden="true" />
                                                    )}
                                                    <span>Approve</span>
                                                </button>
                                            )}
                                            {(user.status === "pending" || user.status === "approved") && (
                                                <button
                                                    onClick={() => openReject(user)}
                                                    disabled={actingId === user.id}
                                                    aria-label={`${user.status === "approved" ? "Revoke" : "Reject"} ${user.email}`}
                                                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-60"
                                                >
                                                    <XCircle className="w-4 h-4" aria-hidden="true" />
                                                    <span>{user.status === "approved" ? "Revoke" : "Reject"}</span>
                                                </button>
                                            )}
                                            {user.status === "serial_required" && (
                                                <span className="text-sm text-gray-400">Waiting for serial</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                    {search
                                        ? `No app users found for "${search}"`
                                        : filter === "all"
                                            ? "No app users yet"
                                            : `No ${filterLabel.toLowerCase()} app users`}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {rejecting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reject-app-user-title"
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 id="reject-app-user-title" className="font-semibold text-gray-900">
                                {rejecting.status === "approved" ? "Revoke Access" : "Reject Request"}
                            </h3>
                            <button
                                onClick={() => setRejecting(null)}
                                aria-label="Close"
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleReject} className="px-6 py-5 space-y-4">
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                    <span className="font-medium text-slate-900">{rejecting.full_name}</span> · {rejecting.email}
                                </p>
                                <p>
                                    Serial: <span className="font-mono text-slate-900">{rejecting.serial_number}</span>
                                </p>
                                {rejecting.phone && (
                                    <p>
                                        Phone: <span className="text-slate-900">{rejecting.phone}</span>
                                    </p>
                                )}
                                <p className="text-gray-500">
                                    {rejecting.status === "approved"
                                        ? "They will lose access to the app files. "
                                        : ""}
                                    The serial number is released, and they can submit a different one from the app.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason <span className="font-normal text-gray-400">(shown to the user)</span>
                                </label>
                                <textarea
                                    id="reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="e.g. Serial number doesn't match our records"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRejecting(null)}
                                    className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actingId === rejecting.id}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                                >
                                    {actingId === rejecting.id && (
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                    )}
                                    {rejecting.status === "approved" ? "Revoke Access" : "Reject"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
