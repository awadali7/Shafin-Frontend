import type { Metadata } from "next";
import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
    title: "Shop",
    description:
        "Shop automotive diagnostic tools, key programming devices, ECM repair equipment, and other professional diagnostic products from DiagTools.",
    keywords: [
        "automotive diagnostic tools shop",
        "key programming devices",
        "ECM repair equipment",
        "OBD scanner online",
        "car diagnostic scanner India",
        "buy diagnostic tools online",
        "automotive workshop equipment",
    ],
    alternates: {
        canonical: "/shop",
    },
};

export default function ShopPage() {
    return <ShopPageClient />;
}
