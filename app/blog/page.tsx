"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Syne } from "next/font/google";
import { blogsApi } from "@/lib/api";
import type { BlogPost } from "@/lib/api/types";
import { Search, Calendar, User, ArrowRight, Eye, Clock } from "lucide-react";

// Display font for this page only — the rest of the site keeps Bricolage Grotesque
const syne = Syne({
    subsets: ["latin"],
    weight: ["700", "800"],
    display: "swap",
});

const HERO_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 41) % 100}%`,
    top: `${(i * 59) % 100}%`,
    delay: `${(i % 6) * 0.9}s`,
}));

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
        } catch (err) {
            console.error("Error fetching blog posts:", err);
            setError(err instanceof Error ? err.message : "Failed to load blog posts");
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
            {/* Hero — dark cinematic */}
            <section
                className="relative flex min-h-[36vh] items-center overflow-hidden bg-[#0A0A0F] py-16"
                aria-label="Blog hero"
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse at 20% 50%, rgba(139,0,0,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(196,30,58,0.2) 0%, transparent 40%), #0A0A0F",
                    }}
                    aria-hidden="true"
                />
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {HERO_PARTICLES.map((p, i) => (
                        <span
                            key={i}
                            className="blog-particle"
                            style={{ left: p.left, top: p.top, animationDelay: p.delay }}
                        />
                    ))}
                </div>

                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#C41E3A]/40 bg-[#C41E3A]/10 px-4 py-2 text-xs font-semibold tracking-[0.5px] text-white/90 uppercase">
                        Updates &amp; Insights
                    </span>
                    <h1
                        className={`${syne.className} mt-6 text-4xl leading-[1.1] font-bold tracking-[-1.5px] text-white sm:text-5xl lg:text-[56px] lg:leading-16 lg:tracking-[-2px]`}
                    >
                        Stories from the
                        <br />
                        <span className="bg-linear-to-r from-[#C41E3A] to-[#F59E0B] bg-clip-text text-transparent">
                            Workshop Floor
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-gray-400">
                        Practical guides, product updates, and stories from
                        India&rsquo;s automotive diagnostic community.
                    </p>
                </div>
            </section>

            <style jsx>{`
                .blog-particle {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.5);
                    animation: blog-twinkle 6s ease-in-out infinite;
                }
                @keyframes blog-twinkle {
                    0%,
                    100% {
                        opacity: 0.05;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.25;
                        transform: scale(1.6);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .blog-particle {
                        animation: none;
                    }
                }
            `}</style>

            {/* Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                <div className="flex justify-end">
                    <div className="relative w-full max-w-[260px]">
                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-1">
                            <Search className="h-3.5 w-3.5 text-[#6B7280]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-7 pr-4 py-2 text-sm border-b border-[#E5E7EB] focus:border-[#C41E3A] text-[#0D0D14] placeholder-gray-400 focus:outline-none transition-colors duration-300"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {error && (
                    <div className="mb-12 p-4 bg-[#C41E3A]/5 border border-[#C41E3A]/20 rounded-xl text-sm text-[#C41E3A]">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && posts.length === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-6">
                                <div className="aspect-[16/10] bg-[#F8F9FC] rounded-2xl animate-pulse"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-[#F8F9FC] rounded w-1/4 animate-pulse"></div>
                                    <div className="h-7 bg-[#F8F9FC] rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-[#F8F9FC] rounded w-full animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && posts.length === 0 && (
                    <div className="py-20 text-center">
                        <h3 className="text-xl font-medium text-[#0D0D14] mb-2">No articles found</h3>
                        <p className="text-[#6B7280]">Try adjusting your filter or search terms.</p>
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
                                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#F8F9FC] mb-8 transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_16px_48px_rgba(196,30,58,0.12)]">
                                    {post.cover_image ? (
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full border border-[#E5E7EB] flex items-center justify-center">
                                            <span className="text-gray-200 text-sm font-medium tracking-widest uppercase">DiagTools</span>
                                        </div>
                                    )}
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-[#6B7280] mb-4">
                                    <span>{formatDate(post.published_at || post.created_at)}</span>
                                    <span className="w-1 h-1 bg-[#E5E7EB] rounded-full"></span>
                                    <span>{getReadingTime(post.content)}</span>
                                </div>

                                {/* Title */}
                                <h2 className={`${syne.className} text-2xl font-bold tracking-[-0.5px] text-[#0D0D14] mb-4 leading-tight group-hover:text-[#C41E3A] transition-colors`}>
                                    {post.title}
                                </h2>

                                {/* Excerpt */}
                                <p className="text-[#6B7280] text-sm line-clamp-2 leading-relaxed mb-6">
                                    {(post.content || "").replace(/<[^>]*>/g, "")}
                                </p>

                                <div className="mt-auto flex items-center text-xs font-bold uppercase tracking-widest text-[#0D0D14] transition-all group-hover:translate-x-1 group-hover:text-[#C41E3A]">
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
                            className="rounded-xl border border-[#C41E3A]/50 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0D0D14] transition-colors hover:bg-[#C41E3A]/5 hover:text-[#C41E3A] disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Load more entries"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
