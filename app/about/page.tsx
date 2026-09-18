import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
    title: "About Us",
    description:
        "Learn about DiagTools' mission to deliver India's leading automotive diagnostic training, ECM repairing, key programming, and IMMO programming education.",
    alternates: {
        canonical: "/about",
    },
};

export default function AboutPage() {
    return <AboutPageClient />;
}
