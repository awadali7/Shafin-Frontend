import type { Metadata } from "next";
import {
    Bricolage_Grotesque,
    IBM_Plex_Sans,
    IBM_Plex_Sans_Condensed,
} from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SidebarProvider } from "@/components/SidebarContext";
import MainContent from "@/components/MainContent";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ConditionalSidebar from "@/components/ConditionalSidebar";
import PushNotificationInitializer from "@/components/PushNotificationInitializer";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import ShoppingCart from "@/components/ShoppingCart";
import { Toaster } from "sonner";

// Bricolage Grotesque for headings
const bricolageGrotesque = Bricolage_Grotesque({
    variable: "--font-heading",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

// IBM Plex Sans for body text (paragraphs, lists, links, form controls) -
// technical/engineered feel that matches the diagnostic-tools brand, with
// clean alphanumeric rendering for product/part codes (e.g. "DP032626").
const bodyFont = IBM_Plex_Sans({
    variable: "--font-body",
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    display: "swap",
});

// IBM Plex Sans Condensed for product names - same technical family as the
// body font, but condensed so long product titles (e.g. "APACHE 2V (6PIN)
// DISPLAY - DP032626") fit cleanly in card/list layouts without wrapping badly.
const productNameFont = IBM_Plex_Sans_Condensed({
    variable: "--font-product-name",
    subsets: ["latin"],
    weight: ["500", "600"],
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default:
            "DiagTools - India's Leading Automotive Diagnostic Training Platform",
        template: "%s | DiagTools",
    },
    description:
        "DiagTools is India's leading provider of advanced automotive diagnostic tools, key programming solutions, and specialized online training. Learn ECM repairing, IMMO programming, meter calibration, and more. Multilingual support in Malayalam, English, Tamil, and Hindi.",
    keywords: [
        "automotive diagnostic tools",
        "key programming",
        "ECM repairing",
        "IMMO programming",
        "meter calibration",
        "automotive training",
        "online courses",
        "vehicle diagnosis",
        "automotive technology",
        "diagnostic equipment",
        "India automotive training",
        "multilingual training",
    ],
    authors: [{ name: "DiagTools" }],
    creator: "DiagTools",
    publisher: "DiagTools",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    ),
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "en_IN",
        url: "/",
        title: "DiagTools - India's Leading Automotive Diagnostic Training Platform",
        description:
            "Learn advanced automotive diagnostics, key programming, ECM repairing, and IMMO programming. Expert training in multiple languages including Malayalam, English, Tamil, and Hindi.",
        siteName: "DiagTools",
        images: [
            {
                url: "/images/logo/header-logo.png",
                width: 1200,
                height: 630,
                alt: "DiagTools - Automotive Diagnostic Training",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "DiagTools - India's Leading Automotive Diagnostic Training",
        description:
            "Advanced automotive diagnostic tools, key programming, and specialized online training. Multilingual support available.",
        images: ["/images/logo/header-logo.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    verification: {
        // Add your verification codes here when available
        // google: "your-google-verification-code",
        // yandex: "your-yandex-verification-code",
        // bing: "your-bing-verification-code",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en-IN">
            <head>
                <link
                    rel="stylesheet"
                    href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css"
                />
            </head>
            <body
                className={`${bricolageGrotesque.variable} ${bodyFont.variable} ${productNameFont.variable} antialiased`}
            >
                <AuthProvider>
                    <CartProvider>
                        <SidebarProvider>
                            <PushNotificationInitializer />
                            <div className="min-h-screen bg-slate-50 flex flex-col">
                                <Header />
                                <ConditionalSidebar />
                                <MainContent className="flex-1">
                                    {children}
                                </MainContent>
                                <Footer />
                                <WhatsAppFloatingButton />
                                <ShoppingCart />
                            </div>
                        </SidebarProvider>
                        <Toaster position="top-right" richColors />
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
