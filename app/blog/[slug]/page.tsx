import type { Metadata } from "next";
import { blogsApi } from "@/lib/api";
import { toMetaDescription } from "@/lib/utils/metadata";
import BlogPostClient from "./BlogPostClient";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    try {
        const res = await blogsApi.getBySlug(slug);
        const post = res.data;

        if (!post) {
            return { title: "Post Not Found" };
        }

        const description = post.content
            ? toMetaDescription(post.content)
            : `Read "${post.title}" on the DiagTools blog.`;

        return {
            title: post.title,
            description,
            authors: post.author_name ? [{ name: post.author_name }] : undefined,
            alternates: {
                canonical: `/blog/${slug}`,
            },
            openGraph: {
                title: post.title,
                description,
                url: `/blog/${slug}`,
                type: "article",
                publishedTime: post.published_at,
                ...(post.cover_image?.startsWith("http")
                    ? { images: [{ url: post.cover_image }] }
                    : {}),
            },
        };
    } catch {
        return { title: "Post Not Found" };
    }
}

export default function BlogPostPage() {
    return <BlogPostClient />;
}
