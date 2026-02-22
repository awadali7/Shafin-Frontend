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
    ShoppingCart,
    Package,
    IndianRupee,
    BarChart3,
    FileText,
    ShieldCheck,
    AlertTriangle,
    Video,
    UserPlus,
    RefreshCw,
} from "lucide-react";
import type { DashboardStats, RecentOrder, RecentUser } from "@/lib/api/types";

interface DashboardTabProps {
    stats: DashboardStats | null;
    loading?: boolean;
    onTabChange?: (
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

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function StatusPill({ status }: { status: string }) {
    const map: Record<string, string> = {
        paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pending: "bg-amber-50 text-amber-700 border-amber-200",
        cancelled: "bg-rose-50 text-rose-700 border-rose-200",
        refunded: "bg-slate-50 text-slate-600 border-slate-200",
        verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
        rejected: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border capitalize ${
                map[status] ?? "bg-slate-50 text-slate-600 border-slate-200"
            }`}
        >
            {status}
        </span>
    );
}

interface KpiCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    sub?: string;
    onClick?: () => void;
    accent?: string;
}

function KpiCard({ label, value, icon, sub, onClick, accent = "bg-slate-100" }: KpiCardProps) {
    return (
        <div
            onClick={onClick}
            className={`bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3 ${
                onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all" : ""
            }`}
        >
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
                    {label}
                </p>
                <p className="text-2xl font-semibold text-slate-900">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </div>
            <div className={`p-2.5 rounded-lg ${accent} flex-shrink-0`}>{icon}</div>
        </div>
    );
}

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <span className="text-slate-500">{icon}</span>
                <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
    stats,
    loading = false,
    onTabChange,
}) => {
    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
            </div>
        );
    }

    const draftBlogs = (stats.total_blogs ?? 0) - (stats.published_blogs ?? 0);
    const totalKyc = (stats.kyc_pending ?? 0) + (stats.kyc_verified ?? 0) + (stats.kyc_rejected ?? 0);

    return (
        <div className="space-y-6">
            {/* ── Top KPI Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Total Revenue"
                    value={formatCurrency(stats.total_revenue ?? 0)}
                    sub={`This month: ${formatCurrency(stats.monthly_revenue ?? 0)}`}
                    icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
                    accent="bg-emerald-50"
                    onClick={() => onTabChange?.("orders")}
                />
                <KpiCard
                    label="Total Orders"
                    value={stats.total_orders ?? 0}
                    sub={`${stats.pending_orders ?? 0} pending · ${stats.paid_orders ?? 0} paid`}
                    icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
                    accent="bg-blue-50"
                    onClick={() => onTabChange?.("orders")}
                />
                <KpiCard
                    label="Total Users"
                    value={stats.total_users ?? 0}
                    sub={`${stats.active_access ?? 0} with active course access`}
                    icon={<Users className="w-5 h-5 text-violet-600" />}
                    accent="bg-violet-50"
                    onClick={() => onTabChange?.("users")}
                />
                <KpiCard
                    label="Total Courses"
                    value={stats.total_courses ?? 0}
                    sub={`${stats.total_videos ?? 0} videos total`}
                    icon={<BookOpen className="w-5 h-5 text-orange-600" />}
                    accent="bg-orange-50"
                    onClick={() => onTabChange?.("courses")}
                />
            </div>

            {/* ── Alerts Row ──────────────────────────────────────────────── */}
            {((stats.pending_requests ?? 0) > 0 ||
                (stats.kyc_pending ?? 0) > 0 ||
                (stats.product_kyc_pending ?? 0) > 0 ||
                (stats.low_stock_products ?? 0) > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(stats.pending_requests ?? 0) > 0 && (
                        <button
                            onClick={() => onTabChange?.("requests")}
                            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left hover:bg-amber-100 transition-colors"
                        >
                            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-amber-800">
                                    {stats.pending_requests} Pending Course Requests
                                </p>
                                <p className="text-xs text-amber-600">Needs review</p>
                            </div>
                        </button>
                    )}
                    {(stats.kyc_pending ?? 0) > 0 && (
                        <button
                            onClick={() => onTabChange?.("kyc")}
                            className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-left hover:bg-blue-100 transition-colors"
                        >
                            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-blue-800">
                                    {stats.kyc_pending} Pending Course KYC
                                </p>
                                <p className="text-xs text-blue-600">Needs review</p>
                            </div>
                        </button>
                    )}
                    {(stats.product_kyc_pending ?? 0) > 0 && (
                        <button
                            onClick={() => onTabChange?.("product_kyc")}
                            className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-left hover:bg-purple-100 transition-colors"
                        >
                            <ShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-purple-800">
                                    {stats.product_kyc_pending} Pending Product KYC
                                </p>
                                <p className="text-xs text-purple-600">Needs review</p>
                            </div>
                        </button>
                    )}
                    {(stats.low_stock_products ?? 0) > 0 && (
                        <button
                            onClick={() => onTabChange?.("products")}
                            className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-left hover:bg-rose-100 transition-colors"
                        >
                            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-rose-800">
                                    {stats.low_stock_products} Low Stock Products
                                </p>
                                <p className="text-xs text-rose-600">Stock &lt; 5 units</p>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* ── Middle 3-column grid ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Orders Breakdown */}
                <Section
                    title="Orders"
                    icon={<ShoppingCart className="w-4 h-4" />}
                >
                    <div className="space-y-3">
                        {[
                            { label: "Paid", count: stats.paid_orders ?? 0, color: "text-emerald-600 bg-emerald-50", icon: <CheckCircle className="w-3.5 h-3.5" /> },
                            { label: "Pending", count: stats.pending_orders ?? 0, color: "text-amber-600 bg-amber-50", icon: <Clock className="w-3.5 h-3.5" /> },
                            { label: "Cancelled", count: stats.cancelled_orders ?? 0, color: "text-rose-600 bg-rose-50", icon: <XCircle className="w-3.5 h-3.5" /> },
                            { label: "Refunded", count: stats.refunded_orders ?? 0, color: "text-slate-500 bg-slate-50", icon: <RefreshCw className="w-3.5 h-3.5" /> },
                        ].map((item) => (
                            <div
                                key={item.label}
                                onClick={() => onTabChange?.("orders")}
                                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className={`p-1 rounded-md ${item.color}`}>{item.icon}</span>
                                    <span className="text-sm text-slate-600">{item.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Products */}
                <Section
                    title="Products"
                    icon={<Package className="w-4 h-4" />}
                >
                    <div className="space-y-3">
                        {[
                            { label: "Total Active", count: stats.total_products ?? 0, color: "text-blue-600 bg-blue-50", icon: <Package className="w-3.5 h-3.5" /> },
                            { label: "Physical", count: stats.physical_products ?? 0, color: "text-orange-600 bg-orange-50", icon: <Package className="w-3.5 h-3.5" /> },
                            { label: "Digital", count: stats.digital_products ?? 0, color: "text-violet-600 bg-violet-50", icon: <FileText className="w-3.5 h-3.5" /> },
                            { label: "Low Stock (<5)", count: stats.low_stock_products ?? 0, color: stats.low_stock_products > 0 ? "text-rose-600 bg-rose-50" : "text-slate-500 bg-slate-50", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                        ].map((item) => (
                            <div
                                key={item.label}
                                onClick={() => onTabChange?.("products")}
                                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className={`p-1 rounded-md ${item.color}`}>{item.icon}</span>
                                    <span className="text-sm text-slate-600">{item.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Content & KYC */}
                <Section
                    title="Content & KYC"
                    icon={<BarChart3 className="w-4 h-4" />}
                >
                    <div className="space-y-3">
                        {[
                            { label: "Courses", count: stats.total_courses ?? 0, tab: "courses" as const, color: "text-orange-600 bg-orange-50", icon: <BookOpen className="w-3.5 h-3.5" /> },
                            { label: "Videos", count: stats.total_videos ?? 0, tab: "courses" as const, color: "text-blue-600 bg-blue-50", icon: <Video className="w-3.5 h-3.5" /> },
                            { label: "Published Blogs", count: stats.published_blogs ?? 0, tab: "blogs" as const, color: "text-teal-600 bg-teal-50", icon: <FileText className="w-3.5 h-3.5" /> },
                            { label: "Blog Drafts", count: draftBlogs, tab: "blogs" as const, color: "text-slate-500 bg-slate-50", icon: <FileText className="w-3.5 h-3.5" /> },
                            { label: "KYC Verified", count: stats.kyc_verified ?? 0, tab: "kyc" as const, color: "text-emerald-600 bg-emerald-50", icon: <CheckCircle className="w-3.5 h-3.5" /> },
                            { label: "KYC Pending", count: stats.kyc_pending ?? 0, tab: "kyc" as const, color: "text-amber-600 bg-amber-50", icon: <AlertCircle className="w-3.5 h-3.5" /> },
                        ].map((item) => (
                            <div
                                key={item.label}
                                onClick={() => onTabChange?.(item.tab)}
                                className="flex items-center justify-between cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className={`p-1 rounded-md ${item.color}`}>{item.icon}</span>
                                    <span className="text-sm text-slate-600">{item.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-800">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>

            {/* ── Course Requests ─────────────────────────────────────────── */}
            <Section title="Course Requests" icon={<TrendingUp className="w-4 h-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Total", count: stats.total_requests ?? 0, color: "border-slate-200 text-slate-700" },
                        { label: "Pending",  count: stats.pending_requests ?? 0,  color: "border-amber-200 text-amber-700" },
                        { label: "Approved", count: stats.approved_requests ?? 0, color: "border-emerald-200 text-emerald-700" },
                        { label: "Rejected", count: stats.rejected_requests ?? 0, color: "border-rose-200 text-rose-700" },
                    ].map((item) => (
                        <div
                            key={item.label}
                            onClick={() => onTabChange?.("requests")}
                            className={`text-center border rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-colors ${item.color}`}
                        >
                            <p className="text-2xl font-semibold">{item.count}</p>
                            <p className="text-xs mt-1 font-medium opacity-80">{item.label}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Bottom 2-column: Recent Orders + Recent Users ────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Orders */}
                <Section title="Recent Orders" icon={<ShoppingCart className="w-4 h-4" />}>
                    {!stats.recent_orders || stats.recent_orders.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No orders yet</p>
                    ) : (
                        <div className="space-y-2">
                            {stats.recent_orders.map((order: RecentOrder) => (
                                <div
                                    key={order.id}
                                    onClick={() => onTabChange?.("orders")}
                                    className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                            {order.first_name} {order.last_name}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {order.user_email} · {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        <StatusPill status={order.status} />
                                        <span className="text-sm font-semibold text-slate-700">
                                            {formatCurrency(order.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* Recent Users */}
                <Section title="Recent Users" icon={<UserPlus className="w-4 h-4" />}>
                    {!stats.recent_users || stats.recent_users.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No users yet</p>
                    ) : (
                        <div className="space-y-2">
                            {stats.recent_users.map((user: RecentUser) => (
                                <div
                                    key={user.id}
                                    onClick={() => onTabChange?.("users")}
                                    className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${
                                            user.role === "admin"
                                                ? "bg-violet-50 text-violet-700 border-violet-200"
                                                : "bg-slate-50 text-slate-500 border-slate-200"
                                        }`}>
                                            {user.role}
                                        </span>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            {formatDate(user.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>
        </div>
    );
};
