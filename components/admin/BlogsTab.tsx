"use client";

import React from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import type { BlogPost } from "@/lib/api/types";

interface BlogsTabProps {
    blogPosts: BlogPost[];
    onAddBlog: () => void;
    onEditBlog: (blog: BlogPost) => void;
    onDeleteBlog: (blog: BlogPost) => void;
}

export const BlogsTab: React.FC<BlogsTabProps> = ({
    blogPosts,
    onAddBlog,
    onEditBlog,
    onDeleteBlog,
}) => {
    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                    All Blog Posts
                </h2>
                <button
                    onClick={onAddBlog}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-all duration-300 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Blog Post</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Author
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Views
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Published
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {blogPosts.length > 0 ? (
                            blogPosts.map((blog) => (
                                <tr key={blog.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {blog.cover_image && (
                                                <img
                                                    src={blog.cover_image}
                                                    alt={blog.title}
                                                    className="w-12 h-12 rounded-lg object-cover mr-3"
                                                />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">
                                                    {blog.title}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {blog.author_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                blog.is_published
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {blog.is_published
                                                ? "Published"
                                                : "Draft"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {blog.views || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {blog.published_at
                                            ? new Date(
                                                  blog.published_at
                                              ).toLocaleDateString()
                                            : blog.created_at
                                            ? new Date(
                                                  blog.created_at
                                              ).toLocaleDateString()
                                            : "—"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => onEditBlog(blog)}
                                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Blog Post"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onDeleteBlog(blog)
                                                }
                                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Blog Post"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                    No blog posts found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
