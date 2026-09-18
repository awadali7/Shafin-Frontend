import type { Metadata } from "next";
import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
    title: "Shop",
    description:
        "Shop automotive diagnostic tools, key programming devices, ECM repair equipment, and other professional diagnostic products from DiagTools.",
    alternates: {
        canonical: "/shop",
    },
};

export default function ShopPage() {
    return <ShopPageClient />;
}
