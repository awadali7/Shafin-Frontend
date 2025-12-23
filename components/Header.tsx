"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { User, ChevronDown, LogOut, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import LoginDrawer from "./LoginDrawer";
import RegisterDrawer from "./RegisterDrawer";
import NotificationBell from "./NotificationBell";
import { setRedirectPath, shouldPreserveRedirect } from "@/lib/utils/redirect";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuth, logout, loading } = useAuth();
    const { getItemCount, setIsOpen } = useCart();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
    const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);

    const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

    // Handle opening login drawer with redirect preservation
    const handleOpenLogin = () => {
        if (pathname && shouldPreserveRedirect(pathname)) {
            setRedirectPath(pathname);
        }
        setIsLoginDrawerOpen(true);
    };

    // Handle opening register drawer with redirect preservation
    const handleOpenRegister = () => {
        if (pathname && shouldPreserveRedirect(pathname)) {
            setRedirectPath(pathname);
        }
        setIsRegisterDrawerOpen(true);
    };

    const handleLogout = async () => {
        try {
            await logout();
            setIsProfileOpen(false);
            router.push("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Display user's full name or email
    const displayName = user
        ? `${user.first_name} ${user.last_name}`.trim() || user.email
        : "Guest";
    const displayEmail = user?.email || "";

    // Check if we should show navigation (exclude authenticated-only pages)
    const shouldShowNav =
        pathname &&
        !pathname.startsWith("/dashboard") &&
        !pathname.startsWith("/admin") &&
        !pathname.startsWith("/profile") &&
        !pathname.startsWith("/my-learning") &&
        !pathname.startsWith("/settings") &&
        !pathname.startsWith("/orders") &&
        !pathname.startsWith("/downloads") &&
        !pathname.startsWith("/checkout") &&
        !pathname.startsWith("/kyc") &&
        pathname !== "/reset-password";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
                {/* Left Section - Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="relative h-8 transition-all duration-300 transform group-hover:scale-105">
                        <Image
                            src="/images/logo/header-logo.png"
                            alt="DIAGTOOLS"
                            width={1000}
                            height={1000}
                            className="h-10 w-[50%] object-contain"
                            priority
                        />
                    </div>
                </Link>

                {/* Middle Section - Navigation (show for all users on public pages) */}
                {shouldShowNav && (
                    <nav className="hidden lg:flex items-center space-x-8">
                        <Link
                            href="/"
                            className={`text-gray-700 hover:text-[#B00000] font-medium transition-colors ${
                                pathname === "/" ? "text-[#B00000]" : ""
                            }`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/about"
                            className={`text-gray-700 hover:text-[#B00000] font-medium transition-colors ${
                                pathname === "/about" ? "text-[#B00000]" : ""
                            }`}
                        >
                            About Us
                        </Link>
                        <Link
                            href="/courses"
                            className={`text-gray-700 hover:text-[#B00000] font-medium transition-colors ${
                                pathname === "/courses" ? "text-[#B00000]" : ""
                            }`}
                        >
                            Course
                        </Link>
                        <Link
                            href="/shop"
                            className={`text-gray-700 hover:text-[#B00000] font-medium transition-colors ${
                                pathname === "/shop" ? "text-[#B00000]" : ""
                            }`}
                        >
                            Shop
                        </Link>
                        <Link
                            href="/blog"
                            className={`text-gray-700 hover:text-[#B00000] font-medium transition-colors ${
                                pathname === "/blog" ? "text-[#B00000]" : ""
                            }`}
                        >
                            Blog
                        </Link>
                    </nav>
                )}

                {/* Right Section - Auth Buttons or User Profile */}
                <div className="flex items-center space-x-4">
                    {/* Shopping Cart */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative p-2 text-gray-700 hover:text-[#B00000] transition-colors"
                        aria-label="Shopping Cart"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {getItemCount() > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B00000] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {getItemCount() > 9 ? "9+" : getItemCount()}
                            </span>
                        )}
                    </button>
                    {/* Notification Bell */}
                    {isAuth && <NotificationBell />}
                    {loading ? (
                        <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
                    ) : isAuth && user ? (
                        /* User Profile Dropdown */
                        <div className="relative">
                            <button
                                onClick={toggleProfile}
                                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
                                aria-label="User Profile"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#B00000] flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-sm font-medium text-black">
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {user.role === "admin"
                                            ? "Admin"
                                            : "Student"}
                                    </p>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                                        isProfileOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={toggleProfile}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 z-20 overflow-hidden shadow-lg">
                                        <div className="p-4 border-b border-gray-200">
                                            <p className="text-sm font-semibold text-black">
                                                {displayName}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {displayEmail}
                                            </p>
                                        </div>
                                        <div className="py-2">
                                            <Link
                                                href="/profile"
                                                onClick={toggleProfile}
                                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                My Profile
                                            </Link>
                                            <Link
                                                href="/my-learning"
                                                onClick={toggleProfile}
                                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                My Learning
                                            </Link>
                                            <Link
                                                href="/orders"
                                                onClick={toggleProfile}
                                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                My Orders
                                            </Link>
                                            <Link
                                                href="/downloads"
                                                onClick={toggleProfile}
                                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                My Downloads
                                            </Link>
                                            {user.role === "admin" && (
                                                <Link
                                                    href="/admin"
                                                    onClick={toggleProfile}
                                                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                >
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <Link
                                                href="/settings"
                                                onClick={toggleProfile}
                                                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                Settings
                                            </Link>
                                        </div>
                                        <div className="border-t border-gray-200">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2.5 text-sm text-[#B00000] hover:bg-gray-100 font-medium transition-colors flex items-center space-x-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        /* Login/Register Buttons */
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleOpenLogin}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#B00000] transition-colors"
                            >
                                Login
                            </button>
                            <button
                                onClick={handleOpenRegister}
                                className="px-4 py-2.5 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-all duration-300 text-sm"
                            >
                                Join Now
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Login Drawer */}
            <LoginDrawer
                isOpen={isLoginDrawerOpen}
                onClose={() => setIsLoginDrawerOpen(false)}
                onSwitchToRegister={() => {
                    setIsLoginDrawerOpen(false);
                    handleOpenRegister();
                }}
            />

            {/* Register Drawer */}
            <RegisterDrawer
                isOpen={isRegisterDrawerOpen}
                onClose={() => setIsRegisterDrawerOpen(false)}
                onSwitchToLogin={() => {
                    setIsRegisterDrawerOpen(false);
                    handleOpenLogin();
                }}
            />
        </header>
    );
}
