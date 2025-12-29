"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ordersApi } from "@/lib/api/orders";
import type { Order } from "@/lib/api/types";
import LoginDrawer from "@/components/LoginDrawer";
import RegisterDrawer from "@/components/RegisterDrawer";

function formatDate(dateString: string) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleString();
}

function StatusPill({ status }: { status: string }) {
    const styles =
        status === "paid"
            ? "bg-green-50 text-green-700 border-green-200"
            : status === "pending"
            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
            : "bg-gray-50 text-gray-700 border-gray-200";
    return (
        <span
            className={`inline-flex px-2 py-1 text-xs font-medium border rounded-full ${styles}`}
        >
            {status.toUpperCase()}
        </span>
    );
}

export default function OrdersPage() {
    const { isAuth, user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuth) {
            setIsLoginDrawerOpen(true);
            return;
        }
        if (isAuth && user) {
            (async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const resp = await ordersApi.myOrders();
                    setOrders(Array.isArray(resp.data) ? resp.data : []);
                } catch (e: any) {
                    setError(e?.message || "Failed to load orders");
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [authLoading, isAuth, user]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />
            </div>
        );
    }

    if (!isAuth) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            My Orders
                        </h1>
                        <p className="text-gray-600">
                            Please sign in to continue
                        </p>
                    </div>
                </div>
                <LoginDrawer
                    isOpen={isLoginDrawerOpen}
                    onClose={() => setIsLoginDrawerOpen(false)}
                    onSwitchToRegister={() => {
                        setIsLoginDrawerOpen(false);
                        setIsRegisterDrawerOpen(true);
                    }}
                />
                <RegisterDrawer
                    isOpen={isRegisterDrawerOpen}
                    onClose={() => setIsRegisterDrawerOpen(false)}
                    onSwitchToLogin={() => {
                        setIsRegisterDrawerOpen(false);
                        setIsLoginDrawerOpen(true);
                    }}
                />
            </>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
                <Link
                    href="/downloads"
                    className="px-4 py-2 bg-[#B00000] text-white rounded-lg text-sm font-semibold hover:bg-red-800 transition-colors"
                >
                    My Downloads
                </Link>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                    <Link
                        href="/shop"
                        className="inline-flex mt-4 text-[#B00000] hover:underline text-sm font-medium"
                    >
                        Go to Shop
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">
                                                #{o.id.slice(0, 8)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {o.id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusPill status={o.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#B00000]">
                                            ₹{Number(o.total).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(o.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
