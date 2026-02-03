"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { blogsApi } from "@/lib/api";
import type { BlogPost } from "@/lib/api/types";

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
    });

    useEffect(() => {
        // Reset to first page when search changes
        setPagination((prev) => ({ ...prev, offset: 0 }));
        setPosts([]);
    }, [searchQuery]);

    useEffect(() => {
        fetchBlogPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.offset, searchQuery]);

    const fetchBlogPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await blogsApi.getAll({
                limit: pagination.limit,
                offset: pagination.offset,
                search: searchQuery || undefined,
            });

            if (response.success && response.data) {
                // Handle response structure - data can be an object with data/pagination or array directly
                let postsData: BlogPost[] = [];
                let paginationData = {
                    total: 0,
                    limit: pagination.limit,
                    offset: pagination.offset,
                    hasMore: false,
                };

                // Check if response.data is an array (old format) or object (new format)
                if (Array.isArray(response.data)) {
                    // Old format: data is array directly
                    postsData = response.data;
                    paginationData = {
                        total: postsData.length,
                        limit: pagination.limit,
                        offset: pagination.offset,
                        hasMore: false,
                    };
                } else if (
                    response.data.data &&
                    Array.isArray(response.data.data)
                ) {
                    // New format: data.data is array, data.pagination exists
                    postsData = response.data.data;
                    paginationData = response.data.pagination || paginationData;
                }

                if (pagination.offset === 0) {
                    // First load - replace posts
                    setPosts(postsData);
                } else {
                    // Load more - append posts
                    setPosts((prev) => [...prev, ...postsData]);
                }
                setPagination(paginationData);
            } else {
                setError(response.message || "Failed to load blog posts");
            }
        } catch (err: any) {
            console.error("Error fetching blog posts:", err);
            setError(err.message || "Failed to load blog posts");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Blog</h1>
                <p className="text-slate-600">
                    Latest articles, tips, and insights from our experts
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
                <div className="max-w-md">
                    <input
                        type="text"
                        placeholder="Search blog posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent bg-white"
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-lg border border-gray-200 p-12">
                    <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#B00000]"></div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && posts.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12">
                    <div className="text-center">
                        <p className="text-slate-600">
                            No blog posts available yet. Check back soon!
                        </p>
                    </div>
                </div>
            )}

            {/* Blog Posts Grid */}
            {!loading && !error && posts.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => {
                            const isExcerptLong =
                                post.excerpt && post.excerpt.length > 100;

                            return (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                                >
                                    {/* Cover Image */}
                                    {post.cover_image ? (
                                        <div className="h-40 w-full overflow-hidden bg-gray-100">
                                            <img
                                                src={post.cover_image}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-40 bg-gradient-to-br from-[#B00000] to-red-800"></div>
                                    )}

                                    {/* Content */}
                                    <div className="flex flex-col grow p-5">
                                        {/* Meta Info */}
                                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                                            <span>
                                                {formatDate(
                                                    post.published_at ||
                                                        post.created_at
                                                )}
                                            </span>
                                            {post.views > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>
                                                        {post.views} views
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 min-h-14 group-hover:text-[#B00000] transition-colors">
                                            {post.title}
                                        </h2>

                                        {/* Excerpt with Tooltip */}
                                        {post.excerpt && (
                                            <p
                                                className={`text-sm text-gray-600 mb-4 line-clamp-2 grow ${
                                                    isExcerptLong
                                                        ? "cursor-help"
                                                        : ""
                                                }`}
                                                title={
                                                    isExcerptLong
                                                        ? post.excerpt
                                                        : undefined
                                                }
                                            >
                                                {post.excerpt}
                                            </p>
                                        )}

                                        {/* Footer */}
                                        <div className="mt-auto pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">
                                                    {post.author_name}
                                                </span>
                                                <span className="text-[#B00000] text-sm font-medium group-hover:underline">
                                                    Read More →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.hasMore && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => {
                                    setPagination((prev) => ({
                                        ...prev,
                                        offset: prev.offset + prev.limit,
                                    }));
                                }}
                                disabled={loading}
                                className="px-6 py-2.5 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                {loading ? "Loading..." : "Load More"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
