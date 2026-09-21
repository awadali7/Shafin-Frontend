import type { MetadataRoute } from "next";
import { blogsApi } from "@/lib/api/blogs";
import { coursesApi } from "@/lib/api/courses";
import { productsApi } from "@/lib/api/products";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.diagtools.in";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
        { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
        { url: `${SITE_URL}/courses`, changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
        { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
        { url: `${SITE_URL}/gallery`, changeFrequency: "weekly", priority: 0.5 },
        {
            url: `${SITE_URL}/admission-team`,
            changeFrequency: "monthly",
            priority: 0.6,
        },
        { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
        {
            url: `${SITE_URL}/privacy-policy`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/refund-policy`,
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    const [courseRoutes, productRoutes, blogRoutes] = await Promise.all([
        coursesApi
            .getAll()
            .then((res) =>
                (res.data || []).map(
                    (course): MetadataRoute.Sitemap[number] => ({
                        url: `${SITE_URL}/courses/${course.slug}`,
                        lastModified: course.updated_at
                            ? new Date(course.updated_at)
                            : undefined,
                        changeFrequency: "weekly",
                        priority: 0.8,
                    })
                )
            )
            .catch(() => []),
        productsApi
            .list({ limit: 1000 })
            .then((res) =>
                (res.data || []).map(
                    (product): MetadataRoute.Sitemap[number] => ({
                        url: `${SITE_URL}/shop/${product.slug}`,
                        lastModified: product.updated_at
                            ? new Date(product.updated_at)
                            : undefined,
                        changeFrequency: "weekly",
                        priority: 0.7,
                    })
                )
            )
            .catch(() => []),
        blogsApi
            .getAll({ limit: 1000 })
            .then((res) =>
                (res.data?.data || []).map(
                    (post): MetadataRoute.Sitemap[number] => ({
                        url: `${SITE_URL}/blog/${post.slug}`,
                        lastModified: post.updated_at
                            ? new Date(post.updated_at)
                            : undefined,
                        changeFrequency: "monthly",
                        priority: 0.6,
                    })
                )
            )
            .catch(() => []),
    ]);

    return [...staticRoutes, ...courseRoutes, ...productRoutes, ...blogRoutes];
}
