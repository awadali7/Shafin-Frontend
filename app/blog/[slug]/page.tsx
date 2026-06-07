"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Syne } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { blogsApi } from "@/lib/api";
import type { BlogPost } from "@/lib/api/types";
import { Calendar, User, Eye, Clock, Share2, Bookmark, MessageCircle, FileText, Download } from "lucide-react";

// Display font for this page only — the rest of the site keeps Bricolage Grotesque
const syne = Syne({
    subsets: ["latin"],
    weight: ["700", "800"],
    display: "swap",
});

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
        } catch (err) {
            console.error("Error fetching blog post:", err);
            setError(err instanceof Error ? err.message : "Failed to load blog post");
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
    const ResponsiveContentImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
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
                        className="w-full h-auto rounded-2xl"
                        alt={props.alt || ""}
                    />
                    {props.alt && (
                        <p className="text-center text-xs text-[#6B7280] mt-4 uppercase tracking-widest font-medium">
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
                <div className="w-6 h-6 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-32 text-center">
                <p className="text-[#6B7280] mb-8">{error || "Entry not found"}</p>
                <Link
                    href="/blog"
                    className="text-sm font-bold uppercase tracking-widest text-[#0D0D14] border-b border-[#C41E3A] pb-1"
                >
                    Back to Blog
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-32">
            {/* Top Navigation */}
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Link
                    href="/blog"
                    className="group inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#6B7280] hover:text-[#0D0D14] transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                    Blog
                </Link>
            </nav>

            <article className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <header className="mb-16">
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-[#6B7280] mb-8">
                        <span>{formatDate(post.published_at || post.created_at)}</span>
                        <span className="w-1 h-1 bg-[#E5E7EB] rounded-full"></span>
                        <span>{getReadingTime(post.content)}</span>
                    </div>

                    <h1 className={`${syne.className} text-4xl md:text-5xl font-bold tracking-[-1px] text-[#0D0D14] leading-tight mb-8`}>
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#F8F9FC] border border-[#E5E7EB] flex items-center justify-center">
                            <User className="w-5 h-5 text-[#6B7280]" />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-[#0D0D14]">{post.author_name}</span>
                            <span className="block text-[11px] text-[#6B7280] uppercase tracking-widest">Author</span>
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
                                className="w-full h-auto rounded-2xl"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div
                    ref={contentRef}
                    className="prose prose-neutral prose-lg max-w-none 
                    prose-headings:text-[#0D0D14] prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:text-[#6B7280] prose-p:leading-relaxed prose-p:mb-8
                    prose-a:text-[#0D0D14] prose-a:underline prose-a:underline-offset-4 prose-a:decoration-[#E5E7EB] hover:prose-a:decoration-[#C41E3A] prose-a:transition-colors
                    prose-img:rounded-2xl prose-img:my-16 prose-img:mx-auto
                    prose-img:[data-orientation='portrait']:max-w-2xl prose-img:[data-orientation='portrait']:block prose-img:[data-orientation='portrait']:mx-auto
                    prose-blockquote:border-l-[#C41E3A] prose-blockquote:font-medium prose-blockquote:text-[#0D0D14] prose-blockquote:italic
                    prose-code:text-[#0D0D14] prose-code:bg-[#F8F9FC] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">

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

                {/* Attachments Section */}
                {post.pdfs && post.pdfs.length > 0 && (
                    <div className="mt-20 pt-16 border-t border-[#E5E7EB]">
                        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-[0.2em] mb-10">
                            Attachments
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {post.pdfs.map((pdf, index) => (
                                <a
                                    key={index}
                                    href={pdf.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between p-6 bg-[#F8F9FC] hover:bg-white transition-all duration-300 border border-[#E5E7EB] hover:border-[#C41E3A] rounded-2xl"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-[#E5E7EB] group-hover:border-[#E5E7EB] transition-colors">
                                            <FileText className="w-6 h-6 text-[#C41E3A]" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block text-sm font-bold text-[#0D0D14] truncate">
                                                {pdf.name}
                                            </span>
                                            <span className="block text-[10px] text-[#6B7280] font-medium uppercase tracking-wider mt-1">
                                                PDF Document
                                            </span>
                                        </div>
                                    </div>
                                    <Download className="w-5 h-5 text-[#E5E7EB] group-hover:text-[#0D0D14] transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detailed Footer */}
                <footer className="mt-32 pt-16 border-t border-[#E5E7EB]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="max-w-xs">
                            <h4 className="text-sm font-bold text-[#0D0D14] uppercase tracking-widest mb-4">Newsletter</h4>
                            <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
                                Receive our latest entries directly in your inbox.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="flex-1 bg-[#F8F9FC] border border-[#E5E7EB] px-4 py-2 text-sm focus:outline-none focus:border-[#C41E3A] transition-colors"
                                />
                                <button className="bg-[#C41E3A] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#8B0000] transition-colors">
                                    Join
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="p-3 border border-[#E5E7EB] hover:border-[#C41E3A] transition-colors" title="Share via Twitter">
                                <Share2 className="w-4 h-4 text-[#6B7280] hover:text-[#0D0D14]" />
                            </button>
                            <button className="p-3 border border-[#E5E7EB] hover:border-[#C41E3A] transition-colors" title="Save for later">
                                <Bookmark className="w-4 h-4 text-[#6B7280] hover:text-[#0D0D14]" />
                            </button>
                        </div>
                    </div>
                </footer>
            </article>
        </div>
    );
}
