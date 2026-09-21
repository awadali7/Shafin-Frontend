import type { Metadata } from "next";
import CoursesPageClient from "./CoursesPageClient";

export const metadata: Metadata = {
    title: "Courses",
    description:
        "Browse DiagTools' automotive diagnostic training courses covering ECM repairing, key programming, IMMO programming, and meter calibration, with multilingual support.",
    keywords: [
        "automotive diagnostic courses",
        "ECM repairing course",
        "key programming course",
        "IMMO programming course",
        "meter calibration course",
        "auto electrician training",
        "online automotive courses",
        "car diagnostic training India",
    ],
    alternates: {
        canonical: "/courses",
    },
};

export default function CoursesPage() {
    return <CoursesPageClient />;
}
