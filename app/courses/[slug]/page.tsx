import type { Metadata } from "next";
import { coursesApi } from "@/lib/api/courses";
import { toMetaDescription } from "@/lib/utils/metadata";
import CourseDetailClient from "./CourseDetailClient";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    try {
        const res = await coursesApi.getBySlug(slug);
        const course = res.data;

        if (!course) {
            return { title: "Course Not Found" };
        }

        const description = course.description
            ? toMetaDescription(course.description)
            : `Learn ${course.name} with DiagTools' automotive diagnostic training platform.`;

        return {
            title: course.name,
            description,
            alternates: {
                canonical: `/courses/${slug}`,
            },
            openGraph: {
                title: course.name,
                description,
                url: `/courses/${slug}`,
                type: "website",
                ...(course.cover_image?.startsWith("http")
                    ? { images: [{ url: course.cover_image }] }
                    : {}),
            },
        };
    } catch {
        return { title: "Course Not Found" };
    }
}

export default function CourseDetailPage() {
    return <CourseDetailClient />;
}
