import type { Metadata } from "next";
import BlogPageClient from "./BlogPageClient";

export const metadata: Metadata = {
    title: "Blog",
    description:
        "Read the DiagTools blog for guides, updates, and insights on automotive diagnostics, ECM repairing, key programming, and IMMO programming.",
    alternates: {
        canonical: "/blog",
    },
};

export default function BlogPage() {
    return <BlogPageClient />;
}
