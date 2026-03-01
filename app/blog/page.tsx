"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { blogsApi } from "@/lib/api";
import type { BlogPost } from "@/lib/api/types";
import { Search, Calendar, User, ArrowRight, Eye, Clock } from "lucide-react";

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
                let postsData: BlogPost[] = [];
                let paginationData = {
                    total: 0,
                    limit: pagination.limit,
                    offset: pagination.offset,
                    hasMore: false,
                };

                if (Array.isArray(response.data)) {
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
                    postsData = response.data.data;
                    paginationData = response.data.pagination || paginationData;
                }

                if (pagination.offset === 0) {
                    setPosts(postsData);
                } else {
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
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getReadingTime = (content: string = "") => {
        const wordsPerMinute = 200;
        const text = content.replace(/<[^>]*>/g, "");
        const words = text.trim().split(/\s+/).length;
        const time = Math.ceil(words / wordsPerMinute);
        return `${time} min read`;
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Minimal Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-12">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-[1px] bg-[#B00000]"></div>
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Updates & Insights</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                            BLOG
                        </h1>
                    </div>

                    {/* Minimal Search Bar */}
                    <div className="relative w-full max-w-[240px]">
                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                            <Search className="h-3.5 w-3.5 text-gray-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-6 pr-4 py-2 text-xs border-b border-gray-50 focus:border-gray-900 text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-300"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                {error && (
                    <div className="mb-12 p-4 bg-gray-50 border border-gray-100 rounded text-sm text-gray-600">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && posts.length === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-6">
                                <div className="aspect-[16/10] bg-gray-50 rounded-sm animate-pulse"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-50 rounded w-1/4 animate-pulse"></div>
                                    <div className="h-7 bg-gray-50 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-50 rounded w-full animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && posts.length === 0 && (
                    <div className="py-20 text-center">
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No articles found</h3>
                        <p className="text-gray-500">Try adjusting your filter or search terms.</p>
                    </div>
                )}

                {/* Blog Posts Grid */}
                {!error && posts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group flex flex-col h-full"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-50 rounded-sm mb-8 transition-opacity group-hover:opacity-90">
                                    {post.cover_image ? (
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full border border-gray-100 flex items-center justify-center">
                                            <span className="text-gray-200 text-sm font-medium tracking-widest uppercase">Shafin</span>
                                        </div>
                                    )}
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                                    <span>{formatDate(post.published_at || post.created_at)}</span>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <span>{getReadingTime(post.content)}</span>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-gray-600 transition-colors">
                                    {post.title}
                                </h2>

                                {/* Excerpt */}
                                <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-6">
                                    {(post.content || "").replace(/<[^>]*>/g, "")}
                                </p>

                                <div className="mt-auto flex items-center text-xs font-bold uppercase tracking-widest text-gray-900 transform translate-x-0 group-hover:translate-x-1 transition-transform">
                                    Read more <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Minimal Pagination */}
                {pagination.hasMore && (
                    <div className="flex justify-center mt-24">
                        <button
                            onClick={() => {
                                setPagination((prev) => ({
                                    ...prev,
                                    offset: prev.offset + prev.limit,
                                }));
                            }}
                            disabled={loading}
                            className="px-10 py-4 border border-gray-200 text-sm font-bold uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Load more entries"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
