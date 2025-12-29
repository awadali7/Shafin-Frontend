"use client";

import React from "react";
import {
    Plus,
    Edit2,
    Trash2,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Play,
    Loader2,
    UserPlus,
} from "lucide-react";
import { formatDate } from "./utils";
import type { Course, Video } from "@/lib/api/types";

interface CoursesTabProps {
    courses: Course[];
    expandedCourseId: string | null;
    courseVideosMap: { [key: string]: Video[] };
    loadingCourseVideos: string | null;
    onAddCourse: () => void;
    onEditCourse: (course: Course) => void;
    onDeleteCourse: (course: Course) => void;
    onManageVideos: (course: Course) => void;
    onToggleCourseVideos: (courseId: string) => void;
    onEditVideo: (video: Video) => void;
    onDeleteVideo: (video: Video) => void;
    onGrantAccess: (course: Course) => void;
}

export const CoursesTab: React.FC<CoursesTabProps> = ({
    courses,
    expandedCourseId,
    courseVideosMap,
    loadingCourseVideos,
    onAddCourse,
    onEditCourse,
    onDeleteCourse,
    onManageVideos,
    onToggleCourseVideos,
    onEditVideo,
    onDeleteVideo,
    onGrantAccess,
}) => {
    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                    All Courses
                </h2>
                <button
                    onClick={onAddCourse}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-all duration-300 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Course</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Course
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Slug
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Videos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {courses.length > 0 ? (
                            courses.map((course) => (
                                <React.Fragment key={course.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {course.cover_image && (
                                                    <img
                                                        src={course.cover_image}
                                                        alt={course.name}
                                                        className="w-10 h-10 rounded-lg object-cover mr-3"
                                                    />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {course.name}
                                                    </div>
                                                    {course.description && (
                                                        <div className="text-xs text-gray-500 truncate max-w-xs">
                                                            {course.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {course.slug}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-[#B00000]">
                                                ₹
                                                {(typeof course.price ===
                                                "number"
                                                    ? course.price
                                                    : parseFloat(
                                                          String(
                                                              course.price ||
                                                                  "0"
                                                          )
                                                      )
                                                ).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() =>
                                                    onToggleCourseVideos(
                                                        course.id
                                                    )
                                                }
                                                className="flex items-center space-x-2 text-sm text-gray-900 hover:text-[#B00000] transition-colors"
                                            >
                                                <span>
                                                    {course.video_count ||
                                                        course.videos?.length ||
                                                        0}{" "}
                                                    Videos
                                                </span>
                                                {expandedCourseId ===
                                                course.id ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(course.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() =>
                                                        onGrantAccess(course)
                                                    }
                                                    className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Grant Access to User"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        onManageVideos(course)
                                                    }
                                                    className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Manage Videos"
                                                >
                                                    <BookOpen className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        onEditCourse(course)
                                                    }
                                                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Course"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        onDeleteCourse(course)
                                                    }
                                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Course"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Expanded Videos Row */}
                                    {expandedCourseId === course.id && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-4 bg-gray-50"
                                            >
                                                {loadingCourseVideos ===
                                                course.id ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Loader2 className="w-6 h-6 animate-spin text-[#B00000]" />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-900 mb-3">
                                                            Course Videos
                                                        </h4>
                                                        {courseVideosMap[
                                                            course.id
                                                        ] &&
                                                        courseVideosMap[
                                                            course.id
                                                        ].length > 0 ? (
                                                            <div className="space-y-2">
                                                                {courseVideosMap[
                                                                    course.id
                                                                ]
                                                                    .sort(
                                                                        (
                                                                            a,
                                                                            b
                                                                        ) =>
                                                                            (a.order_index ||
                                                                                0) -
                                                                            (b.order_index ||
                                                                                0)
                                                                    )
                                                                    .map(
                                                                        (
                                                                            video
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    video.id
                                                                                }
                                                                                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:shadow-sm transition-shadow"
                                                                            >
                                                                                <div className="flex items-center space-x-3 flex-1">
                                                                                    <div className="p-2 bg-[#B00000]/10 rounded-lg">
                                                                                        <Play className="w-4 h-4 text-[#B00000]" />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center space-x-2">
                                                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                                                                #
                                                                                                {
                                                                                                    video.order_index
                                                                                                }
                                                                                            </span>
                                                                                            <h5 className="text-sm font-medium text-slate-900">
                                                                                                {
                                                                                                    video.title
                                                                                                }
                                                                                            </h5>
                                                                                        </div>
                                                                                        {video.description && (
                                                                                            <p className="text-xs text-gray-600 mt-1">
                                                                                                {
                                                                                                    video.description
                                                                                                }
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-2">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            onManageVideos(
                                                                                                course
                                                                                            );
                                                                                            setTimeout(
                                                                                                () => {
                                                                                                    onEditVideo(
                                                                                                        video
                                                                                                    );
                                                                                                },
                                                                                                100
                                                                                            );
                                                                                        }}
                                                                                        className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                                                        title="Edit Video"
                                                                                    >
                                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            onManageVideos(
                                                                                                course
                                                                                            );
                                                                                            setTimeout(
                                                                                                () => {
                                                                                                    onDeleteVideo(
                                                                                                        video
                                                                                                    );
                                                                                                },
                                                                                                100
                                                                                            );
                                                                                        }}
                                                                                        className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                                                                                        title="Delete Video"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
                                                                <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                                <p className="text-sm text-gray-600">
                                                                    No videos in
                                                                    this course
                                                                </p>
                                                                <button
                                                                    onClick={() =>
                                                                        onManageVideos(
                                                                            course
                                                                        )
                                                                    }
                                                                    className="mt-2 text-sm text-[#B00000] hover:underline"
                                                                >
                                                                    Add videos
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                    No courses found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
