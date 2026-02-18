"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { User, ChevronDown, LogOut, ShoppingCart, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

    // Prevent body scroll when mobile menu is open
    React.useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

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

    const userTypeLabel = React.useMemo(() => {
        if (!user) return "Guest";
        if (user.role === "admin") return "Admin";
        if (user.user_type === "business_owner") return "Business Owner";
        if (user.user_type === "student") return "Student";
        return "Guest";
    }, [user]);

    // Navigation is always visible in header (public navigation)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
                {/* Menu Button (Visible on all screens now) */}
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 text-gray-700 hover:text-[#B00000] transition-colors mr-2"
                    aria-label="Open Menu"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Left Section - Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="relative h-8 transition-all duration-300 transform group-hover:scale-105">
                        <Image
                            src="/images/logo/header-logo.png"
                            alt="DIAGTOOLS"
                            width={1000}
                            height={1000}
                            className="h-10 w-[70%] object-contain"
                            priority
                        />
                    </div>
                </Link>

                {/* Middle Section - Public Navigation (always visible) */}
                <nav className="hidden lg:flex items-center space-x-8">
                    <Link
                        href="/"
                        className={`font-medium transition-all duration-200 relative pb-1 ${pathname === "/"
                            ? "text-[#B00000]"
                            : "text-gray-700 hover:text-[#B00000]"
                            }`}
                    >
                        Home
                        {pathname === "/" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B00000]"></span>
                        )}
                    </Link>
                    <Link
                        href="/about"
                        className={`font-medium transition-all duration-200 relative pb-1 ${pathname === "/about"
                            ? "text-[#B00000]"
                            : "text-gray-700 hover:text-[#B00000]"
                            }`}
                    >
                        About Us
                        {pathname === "/about" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B00000]"></span>
                        )}
                    </Link>
                    <Link
                        href="/courses"
                        className={`font-medium transition-all duration-200 relative pb-1 ${pathname === "/courses" || pathname?.startsWith("/courses/")
                            ? "text-[#B00000]"
                            : "text-gray-700 hover:text-[#B00000]"
                            }`}
                    >
                        Courses
                        {(pathname === "/courses" || pathname?.startsWith("/courses/")) && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B00000]"></span>
                        )}
                    </Link>
                    <Link
                        href="/shop"
                        className={`font-medium transition-all duration-200 relative pb-1 ${pathname === "/shop" || pathname?.startsWith("/shop/")
                            ? "text-[#B00000]"
                            : "text-gray-700 hover:text-[#B00000]"
                            }`}
                    >
                        Shop
                        {(pathname === "/shop" || pathname?.startsWith("/shop/")) && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B00000]"></span>
                        )}
                    </Link>
                    <Link
                        href="/blog"
                        className={`font-medium transition-all duration-200 relative pb-1 ${pathname === "/blog" || pathname?.startsWith("/blog/")
                            ? "text-[#B00000]"
                            : "text-gray-700 hover:text-[#B00000]"
                            }`}
                    >
                        Blog
                        {(pathname === "/blog" || pathname?.startsWith("/blog/")) && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B00000]"></span>
                        )}
                    </Link>
                </nav>

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
                                        {userTypeLabel}
                                    </p>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""
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
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 z-20 overflow-hidden shadow-lg max-h-[80vh] overflow-y-auto">
                                        {/* User Info */}
                                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                                            <p className="text-sm font-semibold text-black">
                                                {displayName}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {displayEmail}
                                            </p>
                                            <p className="text-xs text-[#B00000] font-medium mt-1">
                                                {userTypeLabel}
                                            </p>
                                        </div>

                                        {/* Dashboard */}
                                        <div className="py-2 border-b border-gray-200">
                                            <Link
                                                href="/dashboard"
                                                onClick={toggleProfile}
                                                className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/dashboard"
                                                    ? "bg-red-50 text-[#B00000] font-medium"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                    }`}
                                            >
                                                Dashboard
                                            </Link>
                                        </div>

                                        {/* My Learning Section */}
                                        <div className="py-2 border-b border-gray-200">
                                            <div className="px-4 py-1.5">
                                                <p className="text-xs font-semibold text-gray-500 uppercase">
                                                    My Learning
                                                </p>
                                            </div>
                                            <Link
                                                href="/my-learning"
                                                onClick={toggleProfile}
                                                className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/my-learning" || pathname?.startsWith("/my-learning/")
                                                    ? "bg-red-50 text-[#B00000] font-medium"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                    }`}
                                            >
                                                My Learning
                                            </Link>
                                            <Link
                                                href="/orders"
                                                onClick={toggleProfile}
                                                className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/orders" || pathname?.startsWith("/orders/")
                                                    ? "bg-red-50 text-[#B00000] font-medium"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                    }`}
                                            >
                                                My Orders
                                            </Link>
                                            <Link
                                                href="/downloads"
                                                onClick={toggleProfile}
                                                className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/downloads" || pathname?.startsWith("/downloads/")
                                                    ? "bg-red-50 text-[#B00000] font-medium"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                    }`}
                                            >
                                                My Downloads
                                            </Link>
                                            {user.user_type === "student" && (
                                                <Link
                                                    href="/kyc"
                                                    onClick={toggleProfile}
                                                    className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/kyc"
                                                        ? "bg-red-50 text-[#B00000] font-medium"
                                                        : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                        }`}
                                                >
                                                    Student KYC
                                                </Link>
                                            )}
                                            {user.user_type === "business_owner" && (
                                                <Link
                                                    href="/kyc/product"
                                                    onClick={toggleProfile}
                                                    className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/kyc/product"
                                                        ? "bg-red-50 text-[#B00000] font-medium"
                                                        : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                        }`}
                                                >
                                                    Business KYC
                                                </Link>
                                            )}
                                        </div>

                                        {/* Account Section */}
                                        <div className="py-2 border-b border-gray-200">
                                            <div className="px-4 py-1.5">
                                                <p className="text-xs font-semibold text-gray-500 uppercase">
                                                    Account
                                                </p>
                                            </div>
                                            <Link
                                                href="/profile"
                                                onClick={toggleProfile}
                                                className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/profile"
                                                    ? "bg-red-50 text-[#B00000] font-medium"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                    }`}
                                            >
                                                My Profile
                                            </Link>
                                            <Link
                                                href="/settings"
                                                onClick={toggleProfile}
                                                className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/settings" || pathname?.startsWith("/settings/")
                                                    ? "bg-red-50 text-[#B00000] font-medium"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                    }`}
                                            >
                                                Settings
                                            </Link>
                                        </div>

                                        {/* Admin Section */}
                                        {user.role === "admin" && (
                                            <div className="py-2 border-b border-gray-200">
                                                <div className="px-4 py-1.5">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase">
                                                        Admin
                                                    </p>
                                                </div>
                                                <Link
                                                    href="/admin"
                                                    onClick={toggleProfile}
                                                    className={`block px-4 py-2.5 text-sm transition-colors ${pathname === "/admin" || pathname?.startsWith("/admin/")
                                                        ? "bg-red-50 text-[#B00000] font-medium"
                                                        : "text-gray-700 hover:bg-gray-100 hover:text-[#B00000]"
                                                        }`}
                                                >
                                                    Admin Dashboard
                                                </Link>
                                            </div>
                                        )}

                                        {/* Logout */}
                                        <div className="py-2">
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
                        <div className="hidden lg:flex items-center space-x-3">
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

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            className="fixed inset-y-0 left-0 w-[300px] sm:w-[350px] bg-white z-50 shadow-2xl flex flex-col h-full"
                        >
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Menu
                                    </h2>
                                    <button
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className="p-2 text-gray-500 hover:text-[#B00000] transition-colors"
                                        aria-label="Close Menu"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Navigation Links */}
                                <nav className="flex-1 overflow-y-auto py-4">
                                    <Link
                                        href="/"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === "/"
                                            ? "text-[#B00000] bg-red-50"
                                            : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                            }`}
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href="/about"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === "/about"
                                            ? "text-[#B00000] bg-red-50"
                                            : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                            }`}
                                    >
                                        About Us
                                    </Link>
                                    <Link
                                        href="/courses"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === "/courses" ||
                                            pathname?.startsWith("/courses/")
                                            ? "text-[#B00000] bg-red-50"
                                            : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                            }`}
                                    >
                                        Courses
                                    </Link>
                                    <Link
                                        href="/shop"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === "/shop" ||
                                            pathname?.startsWith("/shop/")
                                            ? "text-[#B00000] bg-red-50"
                                            : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                            }`}
                                    >
                                        Shop
                                    </Link>
                                    <Link
                                        href="/blog"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === "/blog" ||
                                            pathname?.startsWith("/blog/")
                                            ? "text-[#B00000] bg-red-50"
                                            : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                            }`}
                                    >
                                        Blog
                                    </Link>

                                    {/* User Links (if authenticated) */}
                                    {isAuth && user && (
                                        <>
                                            {/* Dashboard */}
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() =>
                                                        setIsMobileMenuOpen(false)
                                                    }
                                                    className={`block px-6 py-3 text-base font-medium transition-colors ${pathname === "/dashboard"
                                                        ? "text-[#B00000] bg-red-50"
                                                        : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                        }`}
                                                >
                                                    Dashboard
                                                </Link>
                                            </div>

                                            {/* My Learning Section */}
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <div className="px-6 mb-3">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase">
                                                        My Learning
                                                    </p>
                                                </div>
                                                <Link
                                                    href="/my-learning"
                                                    onClick={() =>
                                                        setIsMobileMenuOpen(false)
                                                    }
                                                    className={`block px-6 py-3 text-base transition-colors ${pathname === "/my-learning" || pathname?.startsWith("/my-learning/")
                                                        ? "text-[#B00000] bg-red-50 font-medium"
                                                        : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                        }`}
                                                >
                                                    My Learning
                                                </Link>
                                                <Link
                                                    href="/orders"
                                                    onClick={() =>
                                                        setIsMobileMenuOpen(false)
                                                    }
                                                    className={`block px-6 py-3 text-base transition-colors ${pathname === "/orders" || pathname?.startsWith("/orders/")
                                                        ? "text-[#B00000] bg-red-50 font-medium"
                                                        : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                        }`}
                                                >
                                                    My Orders
                                                </Link>
                                                <Link
                                                    href="/downloads"
                                                    onClick={() =>
                                                        setIsMobileMenuOpen(false)
                                                    }
                                                    className={`block px-6 py-3 text-base transition-colors ${pathname === "/downloads" || pathname?.startsWith("/downloads/")
                                                        ? "text-[#B00000] bg-red-50 font-medium"
                                                        : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                        }`}
                                                >
                                                    My Downloads
                                                </Link>
                                                {user.user_type === "student" && (
                                                    <Link
                                                        href="/kyc"
                                                        onClick={() =>
                                                            setIsMobileMenuOpen(false)
                                                        }
                                                        className={`block px-6 py-3 text-base transition-colors ${pathname === "/kyc"
                                                            ? "text-[#B00000] bg-red-50 font-medium"
                                                            : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        Student KYC
                                                    </Link>
                                                )}
                                                {user.user_type === "business_owner" && (
                                                    <Link
                                                        href="/kyc/product"
                                                        onClick={() =>
                                                            setIsMobileMenuOpen(false)
                                                        }
                                                        className={`block px-6 py-3 text-base transition-colors ${pathname === "/kyc/product"
                                                            ? "text-[#B00000] bg-red-50 font-medium"
                                                            : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        Business KYC
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Account Section */}
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <div className="px-6 mb-3">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase">
                                                        Account
                                                    </p>
                                                </div>
                                                <Link
                                                    href="/profile"
                                                    onClick={() =>
                                                        setIsMobileMenuOpen(false)
                                                    }
                                                    className={`block px-6 py-3 text-base transition-colors ${pathname === "/profile"
                                                        ? "text-[#B00000] bg-red-50 font-medium"
                                                        : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                        }`}
                                                >
                                                    My Profile
                                                </Link>
                                                <Link
                                                    href="/settings"
                                                    onClick={() =>
                                                        setIsMobileMenuOpen(false)
                                                    }
                                                    className={`block px-6 py-3 text-base transition-colors ${pathname === "/settings" || pathname?.startsWith("/settings/")
                                                        ? "text-[#B00000] bg-red-50 font-medium"
                                                        : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                        }`}
                                                >
                                                    Settings
                                                </Link>
                                            </div>

                                            {/* Admin Section */}
                                            {user.role === "admin" && (
                                                <div className="mt-6 pt-6 border-t border-gray-200">
                                                    <div className="px-6 mb-3">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase">
                                                            Admin
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href="/admin"
                                                        onClick={() =>
                                                            setIsMobileMenuOpen(false)
                                                        }
                                                        className={`block px-6 py-3 text-base transition-colors ${pathname === "/admin" || pathname?.startsWith("/admin/")
                                                            ? "text-[#B00000] bg-red-50 font-medium"
                                                            : "text-gray-700 hover:text-[#B00000] hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        Admin Dashboard
                                                    </Link>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </nav>

                                {/* Footer - Auth Actions */}
                                <div className="border-t border-gray-200 p-4">
                                    {isAuth && user ? (
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-[#B00000] rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sign Out</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => {
                                                    setIsMobileMenuOpen(false);
                                                    handleOpenLogin();
                                                }}
                                                className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Login
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsMobileMenuOpen(false);
                                                    handleOpenRegister();
                                                }}
                                                className="w-full px-4 py-3 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors"
                                            >
                                                Join Now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
