import type { Metadata } from "next";
import GalleryPageClient from "./GalleryPageClient";

export const metadata: Metadata = {
    title: "Gallery",
    description:
        "Browse photos from DiagTools' automotive diagnostic training sessions, workshops, and student events.",
    alternates: {
        canonical: "/gallery",
    },
};

export default function GalleryPage() {
    return <GalleryPageClient />;
}
