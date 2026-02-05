"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Plus, Trash2, X, Image as ImageIcon, Video, Trash } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { adminApi } from "@/lib/api/admin";
import type { Product, ProductType, User, ProductVideo } from "@/lib/api/types";
import { generateSlug } from "./utils";
import { ImageCropper } from "@/components/ui/ImageCropper";

type ImageFile = {
    file: File | null;
    preview: string | null; // For preview purposes only
};

type VideoFile = {
    title: string;
    url: string;
    thumbnail: string;
};

type ProductFormState = {
    name: string;
    slug: string;
    category: string;  // Kept for backward compatibility
    categories: string[];  // Array of up to 4 categories
    description: string;
    product_type: ProductType;
    price: number;
    stock_quantity: number;
    is_active: boolean;
    is_featured: boolean;
    is_coming_soon: boolean;
    requires_kyc: boolean;
    cover_image: File | null;
    digital_file: File | null;
    digital_file_name_input?: string; // For linking existing files
    images: ImageFile[];
    videos: VideoFile[];
    quantity_pricing: Array<{ min_qty: number | string; max_qty: number | string | null; price_per_item: number | string; courier_charge: number | string }>;
};

// Helper function to convert file to data URL for preview only
const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const defaultForm: ProductFormState = {
    name: "",
    slug: "",
    category: "",
    categories: ["", "", "", ""],  // 4 category slots
    description: "",
    product_type: "physical",
    price: 0,
    stock_quantity: 0,
    is_active: true,
    is_featured: false,
    is_coming_soon: false,
    requires_kyc: false,
    cover_image: null,
    digital_file: null,
    digital_file_name_input: "",
    images: [],
    videos: [],
    quantity_pricing: [{ min_qty: "", max_qty: "", price_per_item: "", courier_charge: "" }],
};

export const ProductsTab: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductFormState>(defaultForm);

    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
    const [grantProduct, setGrantProduct] = useState<Product | null>(null);
    const [grantUsers, setGrantUsers] = useState<User[]>([]);
    const [grantUserId, setGrantUserId] = useState("");
    const [grantNote, setGrantNote] = useState("");
    const [grantLoading, setGrantLoading] = useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [existingCategories, setExistingCategories] = useState<string[]>([]);
    const [categoryInputValue, setCategoryInputValue] = useState("");

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [cropTarget, setCropTarget] = useState<{ type: 'cover' | 'gallery', index?: number } | null>(null);

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery', index?: number) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const src = URL.createObjectURL(file);
            setCropImageSrc(src);
            setCropTarget({ type, index });
            setCropModalOpen(true);
            // Clear input so same file can be selected again if cancelled
            e.target.value = ''; 
        }
    };

    const onCropComplete = (croppedBlob: Blob) => {
        if (!cropTarget) return;

        const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });

        if (cropTarget.type === 'cover') {
            setForm(p => ({ ...p, cover_image: file }));
        } else if (cropTarget.type === 'gallery' && typeof cropTarget.index === 'number') {
             fileToDataURL(file).then(preview => {
                 setForm(p => {
                     const newImages = [...p.images];
                     newImages[cropTarget.index!] = { file, preview };
                     return { ...p, images: newImages };
                 });
             });
        }
        
        setCropModalOpen(false);
        setCropImageSrc(null);
        setCropTarget(null);
    };

    const onCropCancel = () => {
        setCropModalOpen(false);
        setCropImageSrc(null);
        setCropTarget(null);
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const resp = await productsApi.adminListAll();
            const productsList = Array.isArray(resp.data) ? resp.data : [];
            setProducts(productsList);
            
            // Extract unique categories
            const categories = new Set<string>();
            productsList.forEach(p => {
                if (p.category && p.category.trim()) {
                    categories.add(p.category.trim());
                }
            });
            setExistingCategories(Array.from(categories).sort());
        } catch (e: any) {
            setError(e?.message || "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const openCreate = () => {
        router.push("/admin/products/new");
    };

    const openEdit = (p: Product) => {
        // Navigate to dedicated edit page instead of opening modal
        router.push(`/admin/products/${p.id}/edit`);
    };

    const onNameChange = (val: string) => {
        setForm((prev) => ({
            ...prev,
            name: val,
            slug: slugManuallyEdited ? prev.slug : generateSlug(val),
        }));
    };

    const onSlugChange = (val: string) => {
        setSlugManuallyEdited(true);
        setForm((prev) => ({
            ...prev,
            slug: val,
        }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            setError(null);

            if (!form.name.trim()) throw new Error("Name is required");
            if (!form.slug.trim()) throw new Error("Slug is required");

            if (
                form.product_type === "digital" &&
                !editing &&
                !form.digital_file &&
                !form.digital_file_name_input
            ) {
                throw new Error("Digital file (ZIP/RAR) or Linked File Name is required");
            }

            // Extract files from ImageFile and VideoFile objects
            const imageFiles = form.images
                .map(img => img.file)
                .filter((file): file is File => file !== null);
            
            const videos = form.videos
                .filter(video => video.url && video.url.trim() !== "")
                .map(video => ({
                    title: video.title,
                    url: video.url,
                    thumbnail: video.thumbnail || undefined
                }));

            // Filter out empty categories
            const filteredCategories = form.categories.filter(cat => cat && cat.trim());
            
            // Filter and prepare tiered pricing
            const quantityPricing = form.quantity_pricing
                .filter(tier => tier.min_qty && tier.price_per_item)
                .map(tier => ({
                    min_qty: Number(tier.min_qty),
                    max_qty: tier.max_qty && tier.max_qty !== "" ? Number(tier.max_qty) : null,
                    price_per_item: Number(tier.price_per_item),
                    courier_charge: Number(tier.courier_charge) || 0
                }))
                .filter(tier => !isNaN(tier.min_qty) && !isNaN(tier.price_per_item) && tier.min_qty > 0 && tier.price_per_item > 0);
            
            if (!editing) {
                await productsApi.adminCreate({
                    name: form.name,
                    slug: form.slug,
                    description: form.description || undefined,
                    categories: filteredCategories.length > 0 ? filteredCategories : undefined,
                    product_type: form.product_type,
                    price: form.price,
                    stock_quantity: form.stock_quantity,
                    is_featured: form.is_featured,
                    is_coming_soon: form.is_coming_soon,
                    requires_kyc: form.requires_kyc,
                    cover_image: form.cover_image,
                    digital_file: form.digital_file_name_input ? undefined : form.digital_file,
                    digital_file_name: form.digital_file_name_input || undefined,
                    images: imageFiles.length > 0 ? imageFiles : undefined,
                    videos: videos.length > 0 ? videos : undefined,
                    quantity_pricing: quantityPricing.length > 0 ? quantityPricing : undefined,
                });
            } else {
                await productsApi.adminUpdate(editing.id, {
                    name: form.name,
                    slug: form.slug,
                    description: form.description,
                    categories: filteredCategories.length > 0 ? filteredCategories : undefined,
                    product_type: form.product_type,
                    price: form.price,
                    stock_quantity: form.stock_quantity,
                    is_active: form.is_active,
                    digital_file: form.digital_file_name_input ? undefined : form.digital_file,
                    digital_file_name: form.digital_file_name_input || undefined,
                    is_featured: form.is_featured,
                    is_coming_soon: form.is_coming_soon,
                    requires_kyc: form.requires_kyc,
                    cover_image: form.cover_image,
                    images: imageFiles.length > 0 ? imageFiles : undefined,
                    videos: videos.length > 0 ? videos : undefined,
                    quantity_pricing: quantityPricing.length > 0 ? quantityPricing : undefined,
                });
            }

            setIsModalOpen(false);
            setEditing(null);
            setForm(defaultForm);
            setSlugManuallyEdited(false);
            setCategoryInputValue("");
            await fetchProducts();
        } catch (e: any) {
            setError(e?.message || "Failed to save product");
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteProduct = async (p: Product) => {
        if (!confirm(`Delete product "${p.name}"?`)) return;
        try {
            await productsApi.adminDelete(p.id);
            await fetchProducts();
        } catch (e: any) {
            alert(e?.message || "Failed to delete product");
        }
    };

    const openGrant = async (p: Product) => {
        setGrantProduct(p);
        setGrantUserId("");
        setGrantNote("");
        setIsGrantModalOpen(true);
        try {
            setGrantLoading(true);
            const resp = await adminApi.getAllUsers(1, 100);
            const users = (resp.data as any)?.users || resp.data;
            setGrantUsers(Array.isArray(users) ? users : []);
        } catch (e: any) {
            setGrantUsers([]);
        } finally {
            setGrantLoading(false);
        }
    };

    const submitGrant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!grantProduct) return;
        try {
            setGrantLoading(true);
            if (!grantUserId) throw new Error("Select a user");
            await adminApi.grantProductEntitlement({
                user_id: grantUserId,
                product_id: grantProduct.id,
                note: grantNote || undefined,
            });
            setIsGrantModalOpen(false);
            setGrantProduct(null);
        } catch (e: any) {
            alert(e?.message || "Failed to grant product");
        } finally {
            setGrantLoading(false);
        }
    };

    const digitalProducts = useMemo(
        () => products.filter((p) => p.type === "digital"),
        [products]
    );

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Products
                    </h2>
                    <p className="text-sm text-gray-500">
                        Physical + Digital (ZIP/RAR)
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-all duration-300 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border-b border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-10 text-center text-gray-500"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-10 text-center text-gray-500"
                                >
                                    No products yet
                                </td>
                            </tr>
                        ) : (
                            products.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-900">
                                            {p.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {p.slug}
                                        </div>
                                        {p.type === "digital" &&
                                            p.digital_file_name && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    File: {p.digital_file_name}
                                                </div>
                                            )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                                                p.type === "digital"
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            }`}
                                        >
                                            {p.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {p.category || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#B00000]">
                                        ₹{Number(p.price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {p.is_active === false
                                            ? "Inactive"
                                            : "Active"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {p.type === "digital" && (
                                                <button
                                                    onClick={() => openGrant(p)}
                                                    className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                                                >
                                                    Grant
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="p-2 text-gray-500 hover:text-[#B00000] hover:bg-gray-100 rounded-lg transition-colors"
                                                aria-label="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(p)}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                aria-label="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={() => {
                            setIsModalOpen(false);
                            setForm(defaultForm);
                            setSlugManuallyEdited(false);
                            setCategoryInputValue("");
                        }}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editing ? "Edit Product" : "Add Product"}
                                </h2>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setForm(defaultForm);
                                        setSlugManuallyEdited(false);
                                        setCategoryInputValue("");
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name *
                                        </label>
                                        <input
                                            value={form.name}
                                            onChange={(e) =>
                                                onNameChange(e.target.value)
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Slug *
                                        </label>
                                        <input
                                            value={form.slug}
                                            onChange={(e) => onSlugChange(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type *
                                    </label>
                                    <select
                                        value={form.product_type}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                product_type: e.target
                                                    .value as ProductType,
                                            }))
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    >
                                        <option value="physical">
                                            Physical
                                        </option>
                                        <option value="digital">
                                            Digital
                                        </option>
                                    </select>
                                </div>

                                {/* Category Hierarchy (up to 4 levels) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category Path (Hierarchy) *
                                        <span className="text-xs font-normal text-gray-500 ml-2">
                                            e.g., Vehicle › Motorcycle › Yezdi › Indie
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { index: 0, label: "Main Category", placeholder: "e.g., Vehicle" },
                                            { index: 1, label: "Sub-Category", placeholder: "e.g., Motorcycle" },
                                            { index: 2, label: "Sub-Sub-Category", placeholder: "e.g., Yezdi" },
                                            { index: 3, label: "Model/Variant", placeholder: "e.g., Indie" }
                                        ].map(({ index, label, placeholder }) => (
                                            <div key={index} className="relative">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    {label} {index === 0 && <span className="text-red-500">*</span>}
                                                </label>
                                                <input
                                                    value={form.categories[index] || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const newCategories = [...form.categories];
                                                        newCategories[index] = value;
                                                        setForm((p) => ({
                                                            ...p,
                                                            categories: newCategories,
                                                            category: newCategories[0] || "",
                                                        }));
                                                        if (index === 0) {
                                                            setCategoryInputValue(value);
                                                            setShowCategoryDropdown(true);
                                                        }
                                                    }}
                                                    onFocus={() => {
                                                        if (index === 0) {
                                                            setShowCategoryDropdown(true);
                                                        }
                                                    }}
                                                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                    placeholder={placeholder}
                                                />
                                                {index === 0 && showCategoryDropdown && existingCategories.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {existingCategories
                                                            .filter(cat => 
                                                                !categoryInputValue || 
                                                                cat.toLowerCase().includes(categoryInputValue.toLowerCase())
                                                            )
                                                            .map((cat) => (
                                                                <button
                                                                    key={cat}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newCategories = [...form.categories];
                                                                        newCategories[0] = cat;
                                                                        setCategoryInputValue(cat);
                                                                        setForm((p) => ({ ...p, categories: newCategories, category: cat }));
                                                                        setShowCategoryDropdown(false);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                                                                >
                                                                    {cat}
                                                                </button>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Preview */}
                                    {form.categories.filter(c => c && c.trim()).length > 0 && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                            <span className="text-xs text-gray-500">Preview: </span>
                                            <span className="text-sm font-medium text-[#B00000]">
                                                {form.categories.filter(c => c && c.trim()).join(' › ')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                description: e.target.value,
                                            }))
                                        }
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price *
                                        </label>
                                        <input
                                            type="number"
                                            value={form.price}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    price: Number(
                                                        e.target.value
                                                    ),
                                                }))
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock (physical)
                                        </label>
                                        <input
                                            type="number"
                                            value={form.stock_quantity}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    stock_quantity: Number(
                                                        e.target.value
                                                    ),
                                                }))
                                            }
                                            disabled={
                                                form.product_type !== "physical"
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent disabled:bg-gray-50"
                                        />
                                    </div>
                                </div>

                                {/* Tiered Pricing Section */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                        💰 Tiered Pricing (Optional)
                                    </h3>
                                    <p className="text-xs text-gray-600 mb-3">
                                        Set price per item and courier charge based on quantity ranges.
                                    </p>
                                    
                                    <div className="space-y-2">
                                        {form.quantity_pricing.map((tier, index) => {
                                            const minQty = Number(tier.min_qty) || 0;
                                            const maxQty = tier.max_qty && tier.max_qty !== "" ? Number(tier.max_qty) : null;
                                            const pricePerItem = Number(tier.price_per_item) || 0;
                                            const courierCharge = Number(tier.courier_charge) || 0;
                                            const savingsPerItem = form.price > 0 && pricePerItem > 0 ? form.price - pricePerItem : 0;
                                            const savingsPercent = form.price > 0 ? Math.round((savingsPerItem / form.price) * 100) : 0;
                                            const exampleQty = minQty > 0 ? Math.max(minQty, 2) : 2;
                                            const exampleTotal = pricePerItem > 0 ? (pricePerItem * exampleQty) + courierCharge : 0;
                                            
                                            return (
                                                <div key={index} className="bg-white p-3 rounded border border-gray-200">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="Min"
                                                            value={tier.min_qty}
                                                            onChange={(e) => {
                                                                const newPricing = [...form.quantity_pricing];
                                                                newPricing[index] = { ...newPricing[index], min_qty: e.target.value };
                                                                setForm(p => ({ ...p, quantity_pricing: newPricing }));
                                                            }}
                                                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000] focus:border-transparent"
                                                        />
                                                        <span className="text-gray-400 text-xs">to</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                                placeholder="Max"
                                                            value={tier.max_qty || ""}
                                                            onChange={(e) => {
                                                                const newPricing = [...form.quantity_pricing];
                                                                newPricing[index] = { ...newPricing[index], max_qty: e.target.value || null };
                                                                setForm(p => ({ ...p, quantity_pricing: newPricing }));
                                                            }}
                                                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000] focus:border-transparent"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                            <span className="text-gray-500 text-xs">₹</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                                placeholder="Price/item"
                                                            value={tier.price_per_item}
                                                            onChange={(e) => {
                                                                const newPricing = [...form.quantity_pricing];
                                                                newPricing[index] = { ...newPricing[index], price_per_item: e.target.value };
                                                                setForm(p => ({ ...p, quantity_pricing: newPricing }));
                                                            }}
                                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000] focus:border-transparent"
                                                        />
                                                    </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-gray-500 text-xs">🚚</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="Courier"
                                                                value={tier.courier_charge}
                                                                onChange={(e) => {
                                                                    const newPricing = [...form.quantity_pricing];
                                                                    newPricing[index] = { ...newPricing[index], courier_charge: e.target.value };
                                                                    setForm(p => ({ ...p, quantity_pricing: newPricing }));
                                                                }}
                                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000] focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs text-gray-600">
                                                            {savingsPerItem > 0 && (
                                                                <span className="text-green-600">💰 Save ₹{savingsPerItem.toFixed(0)} ({savingsPercent}%) per item | </span>
                                                            )}
                                                            {exampleTotal > 0 && (
                                                                <span className="text-blue-600">Ex: {exampleQty} items = ₹{exampleTotal.toFixed(0)}</span>
                                                    )}
                                                        </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newPricing = form.quantity_pricing.filter((_, i) => i !== index);
                                                                setForm(p => ({ ...p, quantity_pricing: newPricing.length > 0 ? newPricing : [{ min_qty: "", max_qty: "", price_per_item: "", courier_charge: "" }] }));
                                                        }}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm(p => ({
                                                    ...p,
                                                    quantity_pricing: [...p.quantity_pricing, { min_qty: "", max_qty: "", price_per_item: "", courier_charge: "" }]
                                                }));
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-dashed border-gray-300 rounded text-gray-600 hover:border-[#B00000] hover:text-[#B00000] transition-colors"
                                        >
                                            + Add Pricing Tier
                                        </button>
                                        
                                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                                            <strong>Example:</strong> 1-1: ₹100, 2-5: ₹90, 6-10: ₹80, 11+: ₹70 (leave max empty for unlimited)
                                        </div>
                                    </div>
                                </div>

                                {/* Cover Image (legacy - kept for backward compatibility) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cover Image (optional - will be added to images array)
                                        <span className="block text-xs font-normal text-gray-500 mt-0.5">
                                            Recommended size: 1280x720 px (16:9 aspect ratio)
                                        </span>
                                    </label>
                                    {form.cover_image && (
                                        <div className="mb-3 relative inline-block">
                                            <img 
                                                src={URL.createObjectURL(form.cover_image)} 
                                                alt="Cover preview"
                                                className="w-40 h-24 object-cover rounded border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setForm(p => ({ ...p, cover_image: null }))}
                                                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                                title="Remove cover image"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => onFileSelect(e, 'cover')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#B00000] file:text-white hover:file:bg-red-800 file:cursor-pointer"
                                    />
                                </div>

                                {/* Multiple Images */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <ImageIcon className="w-4 h-4 inline mr-1" />
                                        Images
                                        <span className="block text-xs font-normal text-gray-500 mt-0.5 ml-5">
                                            Recommended size: 1280x720 px (16:9 aspect ratio)
                                        </span>
                                    </label>
                                    <div className="space-y-3">
                                        {form.images.map((img, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                {(img.preview || (img.file && URL.createObjectURL(img.file))) && (
                                                    <img 
                                                        src={img.preview || (img.file ? URL.createObjectURL(img.file) : "")} 
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-16 h-16 object-cover rounded border border-gray-200"
                                                    />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => onFileSelect(e, 'gallery', index)}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#B00000] file:text-white hover:file:bg-red-800 file:cursor-pointer"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newImages = form.images.filter((_, i) => i !== index);
                                                        setForm((p) => ({ ...p, images: newImages }));
                                                    }}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm((p) => ({ ...p, images: [...p.images, { file: null, preview: null }] }));
                                            }}
                                            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#B00000] hover:text-[#B00000] transition-colors"
                                        >
                                            + Add Image
                                        </button>
                                    </div>
                                </div>

                                {/* Videos */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Video className="w-4 h-4 inline mr-1" />
                                        Videos
                                    </label>
                                    <div className="space-y-4">
                                        {form.videos.map((video, index) => (
                                            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700">Video {index + 1}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newVideos = form.videos.filter((_, i) => i !== index);
                                                            setForm((p) => ({ ...p, videos: newVideos }));
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={video.title}
                                                    onChange={(e) => {
                                                        const newVideos = [...form.videos];
                                                        newVideos[index] = { ...newVideos[index], title: e.target.value };
                                                        setForm((p) => ({ ...p, videos: newVideos }));
                                                    }}
                                                    placeholder="Video Title"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                />
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Video URL (YouTube/Vimeo)</label>
                                                    <input
                                                        type="text"
                                                        value={video.url}
                                                        onChange={(e) => {
                                                            const newVideos = [...form.videos];
                                                            newVideos[index] = { ...newVideos[index], url: e.target.value };
                                                            setForm((p) => ({ ...p, videos: newVideos }));
                                                        }}
                                                        placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Thumbnail URL (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={video.thumbnail}
                                                        onChange={(e) => {
                                                            const newVideos = [...form.videos];
                                                            newVideos[index] = { ...newVideos[index], thumbnail: e.target.value };
                                                            setForm((p) => ({ ...p, videos: newVideos }));
                                                        }}
                                                        placeholder="https://example.com/thumbnail.jpg"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm((p) => ({ ...p, videos: [...p.videos, { title: "", url: "", thumbnail: "" }] }));
                                            }}
                                            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#B00000] hover:text-[#B00000] transition-colors"
                                        >
                                            + Add Video
                                        </button>
                                    </div>
                                </div>

                                {/* Digital File */}
                                {form.product_type === "digital" && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                                            Digital File Source
                                        </h4>
                                        
                                        <div className="flex items-center space-x-4 mb-4">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="digital_source" 
                                                    checked={!form.digital_file_name_input}
                                                    onChange={() => setForm(p => ({ ...p, digital_file_name_input: "" }))}
                                                    className="text-[#B00000] focus:ring-[#B00000]"
                                                />
                                                <span className="text-sm text-gray-700">Upload New File</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="digital_source" 
                                                    checked={!!form.digital_file_name_input}
                                                    onChange={() => setForm(p => ({ ...p, digital_file_name_input: " " }))} // Set dummy to switch mode
                                                    className="text-[#B00000] focus:ring-[#B00000]"
                                                />
                                                <span className="text-sm text-gray-700">Link from Library</span>
                                            </label>
                                        </div>

                                        {!form.digital_file_name_input ? (
                                            <div>
                                                <label className="block text-sm font-medium text-blue-900 mb-1">
                                                    Upload File (ZIP/RAR) *
                                                </label>
                                                <input
                                                    type="file"
                                                    accept=".zip,.rar,.7z"
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            digital_file:
                                                                e.target.files?.[0] ||
                                                                null,
                                                        }))
                                                    }
                                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                                />
                                                <p className="text-xs text-blue-700 mt-1">
                                                    Allowed formats: .zip, .rar, .7z
                                                </p>
                                            </div>
                                        ) : (
                                             <div>
                                                <label className="block text-sm font-medium text-blue-900 mb-1">
                                                    Paste Filename from Library *
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={form.digital_file_name_input === " " ? "" : form.digital_file_name_input}
                                                        onChange={(e) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                digital_file_name_input: e.target.value,
                                                                digital_file: null // Clear upload if linking
                                                            }))
                                                        }
                                                        placeholder="e.g. ps-advanced-2024.zip"
                                                        className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                    />
                                                </div>
                                                <p className="text-xs text-blue-700 mt-1">
                                                    Copy the filename from the "Digital Files" tab and paste it here.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        is_active: e.target.checked,
                                                    }))
                                                }
                                                className="w-4 h-4 text-[#B00000] border-gray-300 rounded focus:ring-[#B00000]"
                                            />
                                            Active
                                        </label>

                                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.is_featured}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        is_featured: e.target.checked,
                                                    }))
                                                }
                                                className="w-4 h-4 text-[#B00000] border-gray-300 rounded focus:ring-[#B00000]"
                                            />
                                            Featured (Landing Page)
                                        </label>

                                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.is_coming_soon}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        is_coming_soon: e.target.checked,
                                                    }))
                                                }
                                                className="w-4 h-4 text-[#B00000] border-gray-300 rounded focus:ring-[#B00000]"
                                            />
                                            Coming Soon 🚀
                                        </label>

                                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={form.requires_kyc}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        requires_kyc: e.target.checked,
                                                    }))
                                                }
                                                className="w-4 h-4 text-[#B00000] border-gray-300 rounded focus:ring-[#B00000]"
                                            />
                                            Requires KYC 🔒
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setForm(defaultForm);
                                                setSlugManuallyEdited(false);
                                                setCategoryInputValue("");
                                            }}
                                            className="px-4 py-2 border border-gray-300 text-slate-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-60"
                                        >
                                            {isSubmitting
                                                ? "Saving..."
                                                : editing
                                                ? "Save"
                                                : "Create"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Grant Modal */}
            {isGrantModalOpen && grantProduct && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={() => setIsGrantModalOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-slate-900">
                                    Grant “{grantProduct.name}”
                                </h2>
                                <button
                                    onClick={() => setIsGrantModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <form
                                onSubmit={submitGrant}
                                className="p-6 space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        User *
                                    </label>
                                    <select
                                        value={grantUserId}
                                        onChange={(e) =>
                                            setGrantUserId(e.target.value)
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    >
                                        <option value="">
                                            {grantLoading
                                                ? "Loading users..."
                                                : "Select user"}
                                        </option>
                                        {grantUsers.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.email} ({u.first_name}{" "}
                                                {u.last_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Note (optional)
                                    </label>
                                    <input
                                        value={grantNote}
                                        onChange={(e) =>
                                            setGrantNote(e.target.value)
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsGrantModalOpen(false)
                                        }
                                        className="px-4 py-2 border border-gray-300 text-slate-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={grantLoading}
                                        className="px-4 py-2 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-60"
                                    >
                                        Grant Access
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {/* Image Cropper Modal */}
            {cropModalOpen && cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={onCropComplete}
                    onCancel={onCropCancel}
                    aspectRatio={16 / 9}
                />
            )}
        </div>
    );
};

