"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { blogsApi } from "@/lib/api";
import type { BlogPost } from "@/lib/api/types";
import { Calendar, User, Eye, Clock, Share2, Bookmark, MessageCircle } from "lucide-react";

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

    const isHTML = (str: string) => {
        return /<[a-z][\s\S]*>/i.test(str);
    };

    const [isPortrait, setIsPortrait] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setIsPortrait(naturalHeight > naturalWidth);
    };

    // Universal Orientation Handler for all content images (Tiptap & Markdown)
    useEffect(() => {
        if (!contentRef.current || loading) return;

        const processImages = () => {
            const images = contentRef.current?.querySelectorAll('img');
            images?.forEach(img => {
                const checkOrientation = () => {
                    if (img.naturalHeight > img.naturalWidth) {
                        img.setAttribute('data-orientation', 'portrait');
                    } else {
                        img.setAttribute('data-orientation', 'landscape');
                    }
                };

                if (img.complete) {
                    checkOrientation();
                } else {
                    img.addEventListener('load', checkOrientation);
                }
            });
        };

        // Run initially
        processImages();

        // Also watch for content changes (for Tiptap dynamic loads)
        const observer = new MutationObserver(processImages);
        observer.observe(contentRef.current, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [post?.content, loading]);

    // Sub-component for images within content to handle individual orientation
    const ResponsiveContentImage = (props: any) => {
        const [port, setPort] = useState(false);
        const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
            const { naturalWidth, naturalHeight } = e.currentTarget;
            setPort(naturalHeight > naturalWidth);
        };

        return (
            <div className="my-16 flex justify-center">
                <div className={`relative ${port ? 'max-w-2xl w-full' : 'w-full'}`}>
                    <img
                        {...props}
                        onLoad={onImgLoad}
                        className="w-full h-auto rounded-sm"
                        alt={props.alt || ""}
                    />
                    {props.alt && (
                        <p className="text-center text-xs text-gray-400 mt-4 uppercase tracking-widest font-medium">
                            {props.alt}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-32 text-center">
                <p className="text-gray-500 mb-8">{error || "Entry not found"}</p>
                <Link
                    href="/blog"
                    className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-1"
                >
                    Back to Blog
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-32">
            {/* Top Navigation */}
            <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Link
                    href="/blog"
                    className="group inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Blog
                </Link>
            </nav>

            <article className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <header className="mb-16">
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-8">
                        <span>{formatDate(post.published_at || post.created_at)}</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>{getReadingTime(post.content)}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-8">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-gray-900">{post.author_name}</span>
                            <span className="block text-[11px] text-gray-400 uppercase tracking-widest">Author</span>
                        </div>
                    </div>
                </header>

                {/* Main Image */}
                {post.cover_image && (
                    <div className={`mb-20 flex justify-center`}>
                        <div className={`relative ${isPortrait ? 'max-w-2xl w-full' : 'w-full'}`}>
                            <img
                                src={post.cover_image}
                                alt={post.title}
                                onLoad={handleImageLoad}
                                className="w-full h-auto rounded-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div
                    ref={contentRef}
                    className="prose prose-neutral prose-lg max-w-none 
                    prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-8
                    prose-a:text-gray-900 prose-a:underline prose-a:underline-offset-4 prose-a:decoration-gray-200 hover:prose-a:decoration-gray-900 prose-a:transition-colors
                    prose-img:rounded-sm prose-img:my-16 prose-img:mx-auto
                    prose-img:[data-orientation='portrait']:max-w-2xl prose-img:[data-orientation='portrait']:block prose-img:[data-orientation='portrait']:mx-auto
                    prose-blockquote:border-l-gray-900 prose-blockquote:font-medium prose-blockquote:text-gray-900 prose-blockquote:italic
                    prose-code:text-gray-900 prose-code:bg-gray-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">

                    {isHTML(post.content || "") ? (
                        <div
                            className="tiptap-content"
                            dangerouslySetInnerHTML={{ __html: post.content || "" }}
                        />
                    ) : (
                        <ReactMarkdown
                            rehypePlugins={[rehypeRaw]}
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                                img: ResponsiveContentImage,
                            }}
                        >
                            {(post.content || "").replace(
                                /(!?)\[(.*?)\]\((.*?)\)/g,
                                (match, prefix, text, url) => {
                                    if (url && url.includes(" ")) {
                                        return `${prefix}[${text}](${encodeURI(url)})`;
                                    }
                                    return match;
                                }
                            )}
                        </ReactMarkdown>
                    )}
                </div>

                {/* Detailed Footer */}
                <footer className="mt-32 pt-16 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-xs">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Newsletter</h4>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                Receive our latest entries directly in your inbox.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="flex-1 bg-gray-50 border border-gray-100 px-4 py-2 text-sm focus:outline-none focus:border-gray-900 transition-colors"
                                />
                                <button className="bg-gray-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
                                    Join
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="p-3 border border-gray-100 hover:border-gray-900 transition-colors" title="Share via Twitter">
                                <Share2 className="w-4 h-4 text-gray-400 hover:text-gray-900" />
                            </button>
                            <button className="p-3 border border-gray-100 hover:border-gray-900 transition-colors" title="Save for later">
                                <Bookmark className="w-4 h-4 text-gray-400 hover:text-gray-900" />
                            </button>
                        </div>
                    </div>
                </footer>
            </article>
        </div>
    );
}
