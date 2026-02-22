"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Phone, MapPin, Instagram, Facebook, Youtube } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Footer() {
    const pathname = usePathname();
    const { isAuth } = useAuth();

    // Hide footer on specific routes
    const routesWithoutFooter = [
        "/my-learning",
        "/orders",
        "/downloads",
        "/kyc",
        "/profile",
        "/settings",
        "/shop",
        "/notifications",
        "/blog",
        "/courses",
        "/dashboard",
        "/admin",
        "/choose-user-type",
        "/checkout",
    ];

    const shouldHideFooter =
        routesWithoutFooter.some((route) => pathname?.startsWith(route));

    if (shouldHideFooter) {
        return null;
    }

    return (
        <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Company Info */}
                    <div>
                        <div className="mb-4">
                            <div className="relative h-8 w-auto">
                                <Image
                                    src="/images/logo/header-logo.png"
                                    alt="DIAGTOOLS"
                                    width={200}
                                    height={60}
                                    className="h-8 w-auto object-contain"
                                />
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            India's leading provider of advanced automotive
                            diagnostic tools, key programming solutions, and
                            specialized online training.
                        </p>
                    </div>

                    {/* Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            Information
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className="text-gray-600 hover:text-[#B00000] transition-colors text-sm"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-gray-600 hover:text-[#B00000] transition-colors text-sm"
                                >
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/refund-policy"
                                    className="text-gray-600 hover:text-[#B00000] transition-colors text-sm"
                                >
                                    Refunds Policy & Information
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/admission-team"
                                    className="text-gray-600 hover:text-[#B00000] transition-colors text-sm"
                                >
                                    Admission Team
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            Follow Us
                        </h3>
                        <div className="flex space-x-4">
                            <a
                                href="https://www.instagram.com/diagtools.in?igsh=dWx3MmpkOGs4aHQ="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-[#B00000] transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-6 h-6" />
                            </a>
                            <a
                                href="https://www.facebook.com/share/182iG6zhSp/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-[#B00000] transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-6 h-6" />
                            </a>
                            <a
                                href="https://youtube.com/@diagwheels?si=Ji913duMc8Bg63VX"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-[#B00000] transition-colors"
                                aria-label="YouTube"
                            >
                                <Youtube className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            Contact Us
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start space-x-3">
                                <Phone className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                                <span className="text-gray-600 text-sm">
                                    8714388741
                                </span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                                <span className="text-gray-600 text-sm">
                                    Pezhakkppilly P.O
                                    <br />
                                    Muvattupezha 686673
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 pt-8 mt-8">
                    <div className="text-center">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} DiagTools. All rights
                            reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
