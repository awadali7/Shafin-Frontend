import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SidebarProvider } from "@/components/SidebarContext";
import MainContent from "@/components/MainContent";
import { AuthProvider } from "@/contexts/AuthContext";
import ConditionalSidebar from "@/components/ConditionalSidebar";
import PushNotificationInitializer from "@/components/PushNotificationInitializer";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

// Bricolage Grotesque for headings
const bricolageGrotesque = Bricolage_Grotesque({
    variable: "--font-heading",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

// Onset Regular for body text (paragraphs, lists, links)
// TODO: Replace with Onset font when files are added to public/fonts/
// For now, using Inter as a temporary fallback
// To use Onset, uncomment the localFont code below and add font files to public/fonts/
const onsetRegular = Inter({
    variable: "--font-body",
    subsets: ["latin"],
    weight: ["400"],
    display: "swap",
});

// Uncomment this when Onset font files are added to public/fonts/ directory:
// const onsetRegular = localFont({
//     src: [
//         {
//             path: "../public/fonts/Onset-Regular.woff2",
//             weight: "400",
//             style: "normal",
//         },
//         {
//             path: "../public/fonts/Onset-Regular.woff",
//             weight: "400",
//             style: "normal",
//         },
//     ],
//     variable: "--font-body",
//     fallback: ["Arial", "Helvetica", "sans-serif"],
//     display: "swap",
// });

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
                className={`${bricolageGrotesque.variable} ${onsetRegular.variable} antialiased`}
            >
                <AuthProvider>
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
                        </div>
                    </SidebarProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
