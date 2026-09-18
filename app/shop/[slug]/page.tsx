import type { Metadata } from "next";
import { productsApi } from "@/lib/api/products";
import { toMetaDescription } from "@/lib/utils/metadata";
import ProductDetailClient from "./ProductDetailClient";

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    try {
        const res = await productsApi.getBySlug(slug);
        const product = res.data;

        if (!product) {
            return { title: "Product Not Found" };
        }

        const description = product.description
            ? toMetaDescription(product.description)
            : `Buy ${product.name} from DiagTools - automotive diagnostic tools and equipment.`;

        return {
            title: product.name,
            description,
            alternates: {
                canonical: `/shop/${slug}`,
            },
            openGraph: {
                title: product.name,
                description,
                url: `/shop/${slug}`,
                type: "website",
                ...(product.cover_image?.startsWith("http")
                    ? { images: [{ url: product.cover_image }] }
                    : {}),
            },
        };
    } catch {
        return { title: "Product Not Found" };
    }
}

export default function ProductDetailPage() {
    return <ProductDetailClient />;
}
