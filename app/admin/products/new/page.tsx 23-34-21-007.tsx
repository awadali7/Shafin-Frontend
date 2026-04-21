"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, Video, Trash } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import type { ProductType, ProductVideo } from "@/lib/api/types";
import { generateSlug } from "@/components/admin/utils";
import { ImageCropper } from "@/components/ui/ImageCropper";

type ImageFile = {
    file: File | null;
    preview: string | null;
};

type VideoFile = {
    title: string;
    file: File | null;
    thumbnail: File | null;
    preview: string | null;
    thumbnailPreview: string | null;
};

type ProductFormState = {
    name: string;
    slug: string;
    category: string;
    categories: string[];
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
    digital_file_name_input?: string;
    images: ImageFile[];
    videos: VideoFile[];
    quantity_pricing: Array<{ min_qty: number | string; max_qty: number | string | null; price_per_item: number | string }>;
};

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
    categories: ["", "", "", ""],
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
    quantity_pricing: [{ min_qty: "", max_qty: "", price_per_item: "" }],
};

export default function NewProductPage() {
    const router = useRouter();
    const [form, setForm] = useState<ProductFormState>(defaultForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [categoryHierarchy, setCategoryHierarchy] = useState<Record<string, string[]>>({});
    const [showCategoryDropdown, setShowCategoryDropdown] = useState<number | null>(null);

    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [cropTarget, setCropTarget] = useState<{ type: 'cover' | 'gallery', index?: number } | null>(null);

    useEffect(() => {
        // Fetch existing categories and build hierarchy
        const fetchCategories = async () => {
            try {
                const resp = await productsApi.adminListAll();
                const productsList = Array.isArray(resp.data) ? resp.data : [];
                
                // Build category hierarchy
                const hierarchy: Record<string, Set<string>> = {};
                
                productsList.forEach(p => {
                    // Try to get categories from either categories array or single category field
                    let categoriesArray: string[] = [];
                    
                    if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) {
                        categoriesArray = p.categories.filter(c => c && c.trim());
                    } else if (p.category && p.category.trim()) {
                        categoriesArray = [p.category.trim()];
                    }
                    
                    if (categoriesArray.length > 0) {
                        // Add top-level category
                        if (!hierarchy['']) {
                            hierarchy[''] = new Set();
                        }
                        hierarchy[''].add(categoriesArray[0]);
                        
                        // Build parent-child relationships for deeper levels
                        for (let i = 0; i < categoriesArray.length - 1; i++) {
                            const parent = categoriesArray.slice(0, i + 1).join('|');
                            const child = categoriesArray[i + 1];
                            
                            if (child && child.trim()) {
                                if (!hierarchy[parent]) {
                                    hierarchy[parent] = new Set();
                                }
                                hierarchy[parent].add(child.trim());
                            }
                        }
                    }
                });
                
                // Convert Sets to sorted arrays
                const finalHierarchy: Record<string, string[]> = {};
                Object.keys(hierarchy).forEach(key => {
                    finalHierarchy[key] = Array.from(hierarchy[key]).sort();
                });
                
                setCategoryHierarchy(finalHierarchy);
            } catch (e) {
                console.error("Failed to load categories", e);
            }
        };
        fetchCategories();
    }, []);

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery', index?: number) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const src = URL.createObjectURL(file);
            setCropImageSrc(src);
            setCropTarget({ type, index });
            setCropModalOpen(true);
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

    // Get available options for a category level based on parent selection
    const getCategoryOptions = (level: number): string[] => {
        if (level === 0) {
            // Top level categories
            return categoryHierarchy[''] || [];
        }
        
        // Build parent key from previous levels
        const parentCategories = form.categories.slice(0, level).filter(c => c && c.trim());
        if (parentCategories.length !== level) {
            // Parent is not fully filled
            return [];
        }
        
        const parentKey = parentCategories.join('|');
        return categoryHierarchy[parentKey] || [];
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
                !form.digital_file &&
                !form.digital_file_name_input
            ) {
                throw new Error("Digital file (ZIP/RAR) or Linked File Name is required");
            }

            const imageFiles = form.images
                .map(img => img.file)
                .filter((file): file is File => file !== null);

            const videoFiles = form.videos
                .map(video => video.file)
                .filter((file): file is File => file !== null);

            const videoTitles = form.videos
                .map(video => video.title)
                .filter(title => title.trim() !== "");

            const videoThumbnailFiles = form.videos
                .map(video => video.thumbnail)
                .filter((file): file is File => file !== null);

            const filteredCategories = form.categories.filter(cat => cat && cat.trim());

            const quantityPricing = form.quantity_pricing
                .filter(tier => tier.min_qty && tier.price_per_item)
                .map(tier => ({
                    min_qty: Number(tier.min_qty),
                    max_qty: tier.max_qty && tier.max_qty !== "" ? Number(tier.max_qty) : null,
                    price_per_item: Number(tier.price_per_item)
                }))
                .filter(tier => !isNaN(tier.min_qty) && !isNaN(tier.price_per_item) && tier.min_qty > 0 && tier.price_per_item > 0);

            await productsApi.adminCreate({
                name: form.name,
                slug: form.slug,
                category: filteredCategories[0] || "",
                categories: filteredCategories,
                description: form.description,
                product_type: form.product_type,
                price: form.price,
                stock_quantity: form.product_type === "physical" ? form.stock_quantity : undefined,
                is_featured: form.is_featured,
                is_coming_soon: form.is_coming_soon,
                requires_kyc: form.requires_kyc,
                digital_file: form.digital_file || undefined,
                digital_file_name: form.digital_file_name_input || undefined,
                cover_image: form.cover_image,
                images: imageFiles.length > 0 ? imageFiles : undefined,
                videos: videoFiles.length > 0 ? videoFiles : undefined,
                videoTitles: videoTitles.length > 0 ? videoTitles : undefined,
                videoThumbnails: videoThumbnailFiles.length > 0 ? videoThumbnailFiles : undefined,
                quantity_pricing: quantityPricing.length > 0 ? quantityPricing : undefined,
            });

            router.push("/admin");
        } catch (e: any) {
            setError(e?.message || "Failed to create product");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push("/admin")}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
                                <p className="text-sm text-gray-500 mt-1">Create a new physical or digital product</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    value={form.name}
                                    onChange={(e) => onNameChange(e.target.value)}
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

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type *
                            </label>
                            <select
                                value={form.product_type}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        product_type: e.target.value as ProductType,
                                    }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                            >
                                <option value="physical">Physical</option>
                                <option value="digital">Digital</option>
                            </select>
                        </div>

                        {/* Category Hierarchy */}
                        <div className="mb-4">
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
                                ].map(({ index, label, placeholder }) => {
                                    const options = getCategoryOptions(index);
                                    const isDisabled = index > 0 && !form.categories[index - 1];
                                    const filteredOptions = options.filter(cat =>
                                        !form.categories[index] ||
                                        cat.toLowerCase().includes(form.categories[index].toLowerCase())
                                    );
                                    
                                    return (
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
                                                    // Clear child categories when parent changes
                                                    for (let i = index + 1; i < 4; i++) {
                                                        newCategories[i] = "";
                                                    }
                                                    setForm((p) => ({
                                                        ...p,
                                                        categories: newCategories,
                                                        category: newCategories[0] || "",
                                                    }));
                                                    if (!isDisabled) {
                                                        setShowCategoryDropdown(index);
                                                    }
                                                }}
                                                onFocus={() => {
                                                    if (!isDisabled) {
                                                        setShowCategoryDropdown(index);
                                                    }
                                                }}
                                                onBlur={() => setTimeout(() => setShowCategoryDropdown(null), 200)}
                                                disabled={isDisabled}
                                                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent ${
                                                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                                                }`}
                                                placeholder={isDisabled ? 'Select parent category first' : placeholder}
                                            />
                                            {showCategoryDropdown === index && !isDisabled && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {filteredOptions.length > 0 ? (
                                                        filteredOptions.map((cat) => (
                                                            <button
                                                                key={cat}
                                                                type="button"
                                                                onClick={() => {
                                                                    const newCategories = [...form.categories];
                                                                    newCategories[index] = cat;
                                                                    // Clear child categories when selecting from dropdown
                                                                    for (let i = index + 1; i < 4; i++) {
                                                                        newCategories[i] = "";
                                                                    }
                                                                    setForm((p) => ({ 
                                                                        ...p, 
                                                                        categories: newCategories, 
                                                                        category: newCategories[0] || "" 
                                                                    }));
                                                                    setShowCategoryDropdown(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-sm text-gray-500 italic">
                                                            {options.length === 0 && index === 0 
                                                                ? "No existing categories. Type to create first category."
                                                                : options.length === 0 && index > 0
                                                                ? "No subcategories exist. Type to create new."
                                                                : "No matching options. Keep typing to create new."}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
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
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing & Stock</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                                            price: Number(e.target.value),
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
                                            stock_quantity: Number(e.target.value),
                                        }))
                                    }
                                    disabled={form.product_type !== "physical"}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent disabled:bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Tiered Pricing */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                💰 Tiered Pricing (Optional)
                            </h3>
                            <p className="text-xs text-gray-600 mb-3">
                                Set price per item based on quantity ranges. Example: 2-5 items → ₹90 each
                            </p>

                            <div className="space-y-2">
                                {form.quantity_pricing.map((tier, index) => {
                                    const minQty = Number(tier.min_qty) || 0;
                                    const maxQty = tier.max_qty && tier.max_qty !== "" ? Number(tier.max_qty) : null;
                                    const pricePerItem = Number(tier.price_per_item) || 0;
                                    const savingsPerItem = form.price > 0 && pricePerItem > 0 ? form.price - pricePerItem : 0;
                                    const savingsPercent = form.price > 0 ? Math.round((savingsPerItem / form.price) * 100) : 0;

                                    return (
                                        <div key={index} className="grid grid-cols-[auto,1fr,auto,auto] gap-2 items-center bg-white p-2 rounded">
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
                                                <span className="text-gray-400 text-xs">→</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="₹/item"
                                                    value={tier.price_per_item}
                                                    onChange={(e) => {
                                                        const newPricing = [...form.quantity_pricing];
                                                        newPricing[index] = { ...newPricing[index], price_per_item: e.target.value };
                                                        setForm(p => ({ ...p, quantity_pricing: newPricing }));
                                                    }}
                                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000] focus:border-transparent"
                                                />
                                                <span className="text-xs text-gray-500">/each</span>
                                            </div>
                                            {minQty > 0 && pricePerItem > 0 && (
                                                <div className="text-xs text-gray-600 whitespace-nowrap">
                                                    {savingsPerItem > 0 && (
                                                        <span className="text-green-600">Save ₹{savingsPerItem.toFixed(0)} ({savingsPercent}%)</span>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newPricing = form.quantity_pricing.filter((_, i) => i !== index);
                                                    setForm(p => ({ ...p, quantity_pricing: newPricing.length > 0 ? newPricing : [{ min_qty: "", max_qty: "", price_per_item: "" }] }));
                                                }}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm(p => ({
                                            ...p,
                                            quantity_pricing: [...p.quantity_pricing, { min_qty: "", max_qty: "", price_per_item: "" }]
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
                    </div>

                    {/* Media */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Media</h2>

                        {/* Cover Image */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Image (optional - will be added to images array)
                                <span className="block text-xs font-normal text-gray-500 mt-0.5">
                                    Recommended size: 1280x720 px (16:9 aspect ratio)
                                </span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => onFileSelect(e, 'cover')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#B00000] file:text-white hover:file:bg-red-800 file:cursor-pointer"
                            />
                        </div>

                        {/* Multiple Images */}
                        <div className="mb-4">
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
                                            <label className="block text-xs text-gray-600 mb-1">Video File</label>
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        try {
                                                            const preview = await fileToDataURL(file);
                                                            const newVideos = [...form.videos];
                                                            newVideos[index] = { ...newVideos[index], file, preview };
                                                            setForm((p) => ({ ...p, videos: newVideos }));
                                                        } catch (error) {
                                                            alert("Failed to load video");
                                                        }
                                                    }
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#B00000] file:text-white hover:file:bg-red-800 file:cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Thumbnail (optional)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        try {
                                                            const thumbnailPreview = await fileToDataURL(file);
                                                            const newVideos = [...form.videos];
                                                            newVideos[index] = { ...newVideos[index], thumbnail: file, thumbnailPreview };
                                                            setForm((p) => ({ ...p, videos: newVideos }));
                                                        } catch (error) {
                                                            alert("Failed to load thumbnail");
                                                        }
                                                    }
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#B00000] file:text-white hover:file:bg-red-800 file:cursor-pointer"
                                            />
                                        </div>
                                        {(video.preview || video.thumbnailPreview) && (
                                            <div className="mt-2 flex gap-2">
                                                {video.thumbnailPreview && (
                                                    <img
                                                        src={video.thumbnailPreview}
                                                        alt="Thumbnail"
                                                        className="w-24 h-24 object-cover rounded border border-gray-200"
                                                    />
                                                )}
                                                {video.preview && (
                                                    <video
                                                        src={video.preview}
                                                        controls
                                                        className="flex-1 max-h-48 rounded border border-gray-200"
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm((p) => ({ ...p, videos: [...p.videos, { title: "", file: null, thumbnail: null, preview: null, thumbnailPreview: null }] }));
                                    }}
                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#B00000] hover:text-[#B00000] transition-colors"
                                >
                                    + Add Video
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Digital File */}
                    {form.product_type === "digital" && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Digital File</h2>

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
                                            onChange={() => setForm(p => ({ ...p, digital_file_name_input: " " }))}
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
                                                    digital_file: e.target.files?.[0] || null,
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
                                                        digital_file: null
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
                        </div>
                    )}

                    {/* Settings */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Settings</h2>

                        <div className="flex flex-col gap-3">
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
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <button
                            type="button"
                            onClick={() => router.push("/admin")}
                            className="px-6 py-2 border border-gray-300 text-slate-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-60"
                        >
                            {isSubmitting ? "Creating..." : "Create Product"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Image Cropper Modal */}
            {cropModalOpen && cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCropComplete={onCropComplete}
                    onCancel={onCropCancel}
                />
            )}
        </div>
    );
}

