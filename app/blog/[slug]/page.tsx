"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { blogsApi } from "@/lib/api";
import type { BlogPost } from "@/lib/api/types";

export default function BlogPostPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            fetchBlogPost();
        }
    }, [slug]);

    const fetchBlogPost = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await blogsApi.getBySlug(slug);

            if (response.success && response.data) {
                setPost(response.data);
            } else {
                setError(response.message || "Blog post not found");
            }
        } catch (err: any) {
            console.error("Error fetching blog post:", err);
            setError(err.message || "Failed to load blog post");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#B00000]"></div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-600">
                        {error || "Blog post not found"}
                    </p>
                </div>
                <Link
                    href="/blog"
                    className="inline-flex items-center text-[#B00000] hover:underline text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Blog
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <Link
                href="/blog"
                className="inline-flex items-center text-gray-600 hover:text-[#B00000] mb-8 transition-colors text-sm"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
            </Link>

            {/* Cover Image */}
            {post.cover_image && (
                <div className="mb-8 rounded-lg overflow-hidden">
                    <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-64 md:h-80 object-cover"
                    />
                </div>
            )}

            {/* Post Header */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                    {post.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-center space-x-1.5">
                        <span>
                            {formatDate(post.published_at || post.created_at)}
                        </span>
                    </div>
                    {post.views > 0 && (
                        <>
                            <span>•</span>
                            <span>{post.views} views</span>
                        </>
                    )}
                    <span>•</span>
                    <span>{post.author_name}</span>
                </div>

                {/* Excerpt */}
                {post.excerpt && (
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                        {post.excerpt}
                    </p>
                )}
            </div>

            {/* Post Content */}
            <article className="mb-12">
                <div
                    className="blog-content prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content || "" }}
                />
            </article>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-600">
                            Written by{" "}
                            <span className="font-medium">
                                {post.author_name}
                            </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Published on{" "}
                            {formatDate(post.published_at || post.created_at)}
                        </p>
                    </div>
                    <Link
                        href="/blog"
                        className="inline-flex items-center px-5 py-2.5 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium"
                    >
                        View All Posts
                    </Link>
                </div>
            </div>
        </div>
    );
}
