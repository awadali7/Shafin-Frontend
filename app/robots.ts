import type { MetadataRoute } from "next";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.diagtools.in";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin",
                "/admin/",
                "/dashboard",
                "/checkout",
                "/choose-user-type",
                "/downloads",
                "/kyc",
                "/kyc/",
                "/my-learning",
                "/notifications",
                "/orders",
                "/profile",
                "/reset-password",
                "/settings",
                "/product-extra-info",
            ],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
