import type { Metadata } from "next";
import CoursesPageClient from "./CoursesPageClient";

export const metadata: Metadata = {
    title: "Courses",
    description:
        "Browse DiagTools' automotive diagnostic training courses covering ECM repairing, key programming, IMMO programming, and meter calibration, with multilingual support.",
    alternates: {
        canonical: "/courses",
    },
};

export default function CoursesPage() {
    return <CoursesPageClient />;
}
