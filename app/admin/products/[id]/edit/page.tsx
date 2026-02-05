"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash, ImageIcon, Video, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { productsApi } from "@/lib/api/products";
import type { ProductType } from "@/lib/api/types";
import { generateSlug } from "@/components/admin/utils";
import { ImageCropper } from "@/components/ui/ImageCropper";

type ImageFile = {
    file: File | null;
    preview: string | null;
};

type VideoFile = {
    title: string;
    url: string;
    thumbnail: string;
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
    quantity_pricing: Array<{ min_qty: number | string; max_qty: number | string | null; price_per_item: number | string; courier_charge: number | string }>;
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
    quantity_pricing: [{ min_qty: "", max_qty: "", price_per_item: "", courier_charge: "" }],
};

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const { user, loading: authLoading, isAuth } = useAuth();

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<ProductFormState>(defaultForm);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [existingCategories, setExistingCategories] = useState<string[][]>([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState<number | null>(null);

    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [cropTarget, setCropTarget] = useState<{ type: 'cover' | 'gallery', index?: number } | null>(null);

    // Authentication check
    useEffect(() => {
        if (!authLoading) {
            if (!isAuth || user?.role !== "admin") {
                router.push("/login");
            }
        }
    }, [authLoading, isAuth, user, router]);

    // Fetch product data for editing
    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;
            
            try {
                setLoading(true);
                const products = await productsApi.adminListAll();
                const product = products.data?.find((p: any) => p.id === productId);
                
                if (!product) {
                    alert("Product not found");
                    router.push("/admin");
                    return;
                }
                
                // Prepare existing images
                const existingImages = (product.images || []).map((url: string) => ({
                    file: null,
                    preview: url,
                }));
                
                // Prepare existing videos
                const existingVideos = (product.videos || []).map((v: any) => ({
                    title: v.title || "",
                    url: v.url || "",
                    thumbnail: v.thumbnail || "",
                }));
                
                // Prepare categories
                const productCategories = product.categories && product.categories.length > 0 
                    ? product.categories 
                    : (product.category ? [product.category] : []);
                
                const categoriesArray = [...productCategories];
                while (categoriesArray.length < 4) {
                    categoriesArray.push("");
                }
                
                // Prepare quantity pricing
                const pricingData = product.tiered_pricing || product.quantity_pricing;
                const quantityPricing = pricingData && Array.isArray(pricingData)
                    ? pricingData.map((qp: any) => ({
                        min_qty: qp.min_qty || "",
                        max_qty: qp.max_qty || "",
                        price_per_item: qp.price_per_item || "",
                        courier_charge: qp.courier_charge || ""
                      }))
                    : [{ min_qty: "", max_qty: "", price_per_item: "", courier_charge: "" }];
                
                setForm({
                    name: product.name,
                    slug: product.slug,
                    category: productCategories[0] || "",
                    categories: categoriesArray,
                    description: product.description || "",
                    product_type: product.type,
                    price: Number(product.price),
                    stock_quantity: product.type === "physical" ? Number(product.stock_quantity || 0) : 0,
                    is_active: product.is_active !== false,
                    is_featured: product.is_featured || false,
                    is_coming_soon: product.is_coming_soon || false,
                    requires_kyc: product.requires_kyc || false,
                    cover_image: null,
                    digital_file: null,
                    images: existingImages,
                    videos: existingVideos,
                    quantity_pricing: quantityPricing,
                });
                
                setSlugManuallyEdited(true);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch product:", error);
                alert("Failed to load product");
                router.push("/admin");
            }
        };
        
        fetchProduct();
    }, [productId, router]);

    useEffect(() => {
        fetchExistingCategories();
    }, []);

    const fetchExistingCategories = async () => {
        try {
            const resp = await productsApi.adminListAll();
            const products = resp.data || [];
            const categoryHierarchies: string[][] = [];
            
            products.forEach((p: any) => {
                if (p.categories && Array.isArray(p.categories)) {
                    // Product has category hierarchy
                    const filtered = p.categories.filter((c: string) => c && c.trim());
                    if (filtered.length > 0) {
                        categoryHierarchies.push(filtered);
                    }
                } else if (p.category) {
                    // Fallback to single category
                    categoryHierarchies.push([p.category]);
                }
            });
            
            setExistingCategories(categoryHierarchies);
        } catch (e) {
            console.error("Failed to fetch categories:", e);
        }
    };

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery', index?: number) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const src = await fileToDataURL(file);
            setCropImageSrc(src);
            setCropTarget({ type, index });
            setCropModalOpen(true);
            e.target.value = '';
        }
    };

    const onCropComplete = async (croppedBlob: Blob) => {
        const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
        
        if (cropTarget?.type === 'cover') {
            setForm(prev => ({ ...prev, cover_image: croppedFile }));
        } else if (cropTarget?.type === 'gallery' && cropTarget.index !== undefined) {
            const newImages = [...form.images];
            const preview = await fileToDataURL(croppedFile);
            newImages[cropTarget.index] = { file: croppedFile, preview };
            setForm(prev => ({ ...prev, images: newImages }));
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

    // Get available options for each category level based on parent selections
    const getCategoryOptions = (level: number): string[] => {
        if (existingCategories.length === 0) return [];
        
        const options = new Set<string>();
        
        existingCategories.forEach((hierarchy) => {
            // Check if parent levels match current form values
            let matches = true;
            for (let i = 0; i < level; i++) {
                if (form.categories[i] && hierarchy[i] !== form.categories[i]) {
                    matches = false;
                    break;
                }
            }
            
            // If parent levels match and this level exists, add it
            if (matches && hierarchy[level]) {
                options.add(hierarchy[level]);
            }
        });
        
        return Array.from(options).sort();
    };

    const onNameChange = (val: string) => {
        setForm((prev) => ({
            ...prev,
            name: val,
            slug: slugManuallyEdited ? prev.slug : generateSlug(val),
        }));
    };

    const onSlugChange = (val: string) => {
        setForm((prev) => ({ ...prev, slug: val }));
        setSlugManuallyEdited(true);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.name.trim() || !form.slug.trim() || !form.categories[0]?.trim()) {
            alert("Please fill in Name, Slug, and at least Main Category");
            return;
        }

        if (form.product_type === "digital" && !form.digital_file && !form.digital_file_name_input?.trim()) {
            alert("Digital products require a file (upload or link from library)");
            return;
        }

        setIsSubmitting(true);
        try {
            const filteredCategories = form.categories.filter(c => c && c.trim());
            
            const validPricing = form.quantity_pricing
                .filter(tier => tier.min_qty !== "" && tier.price_per_item !== "")
                .map(tier => ({
                    min_qty: Number(tier.min_qty),
                    max_qty: tier.max_qty && tier.max_qty !== "" ? Number(tier.max_qty) : null,
                    price_per_item: Number(tier.price_per_item),
                    courier_charge: tier.courier_charge !== "" ? Number(tier.courier_charge) : 0
                }))
                .filter(tier => !isNaN(tier.min_qty) && !isNaN(tier.price_per_item) && tier.min_qty > 0 && tier.price_per_item > 0);

            const images = form.images.map(img => img.file).filter((f): f is File => f !== null);
            
            // Filter valid videos (must have title and url)
            const validVideos = form.videos.filter(vid => 
                vid.title.trim() && vid.url.trim()
            );

            await productsApi.adminUpdate(productId, {
                name: form.name,
                slug: form.slug,
                description: form.description || undefined,
                category: filteredCategories[0] || undefined,
                categories: filteredCategories.length > 0 ? filteredCategories : undefined,
                product_type: form.product_type,
                price: form.price,
                stock_quantity: form.product_type === "physical" ? form.stock_quantity : 0,
                is_featured: form.is_featured,
                is_coming_soon: form.is_coming_soon,
                requires_kyc: form.requires_kyc,
                cover_image: form.cover_image || undefined,
                digital_file: form.product_type === "digital" ? form.digital_file : undefined,
                digital_file_name: form.digital_file_name_input?.trim() || undefined,
                images: images.length > 0 ? images : undefined,
                videos: validVideos.length > 0 ? validVideos : undefined,
                quantity_pricing: validPricing.length > 0 ? validPricing : undefined,
            });

            router.push("/admin?tab=products");
        } catch (error: any) {
            alert(error?.message || "Failed to update product");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/admin?tab=products")}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Edit Product
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Update product details and settings
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={submit} className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
                    {/* Basic Information Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-gray-200">
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    value={form.name}
                                    onChange={(e) => onNameChange(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    placeholder="Product name"
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
                                    placeholder="product-slug"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
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
                    </div>

                    {/* Category Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-gray-200">
                            Category Hierarchy
                        </h2>
                        <p className="text-sm text-gray-600 mb-3">
                            e.g., Vehicle › Motorcycle › Yezdi › Indie
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { index: 0, label: "Main Category", placeholder: "e.g., Vehicle" },
                                { index: 1, label: "Sub-Category", placeholder: "e.g., Motorcycle" },
                                { index: 2, label: "Sub-Sub-Category", placeholder: "e.g., Yezdi" },
                                { index: 3, label: "Model/Variant", placeholder: "e.g., Indie" }
                            ].map(({ index, label, placeholder }) => {
                                const availableOptions = getCategoryOptions(index);
                                const currentValue = form.categories[index] || "";
                                
                                return (
                                    <div key={index} className="relative">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            {label} {index === 0 && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            value={currentValue}
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
                                            }}
                                            onFocus={() => {
                                                if (availableOptions.length > 0) {
                                                    setShowCategoryDropdown(index);
                                                }
                                            }}
                                            onBlur={() => setTimeout(() => setShowCategoryDropdown(null), 200)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                            placeholder={placeholder}
                                        />
                                        {showCategoryDropdown === index && availableOptions.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {availableOptions
                                                    .filter(opt => 
                                                        !currentValue || 
                                                        opt.toLowerCase().includes(currentValue.toLowerCase())
                                                    )
                                                    .map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                const newCategories = [...form.categories];
                                                                newCategories[index] = opt;
                                                                // Clear child categories when parent changes
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
                                                            {opt}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {form.categories.filter(c => c && c.trim()).length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-xs text-gray-500">Preview: </span>
                                <span className="text-sm font-medium text-[#B00000]">
                                    {form.categories.filter(c => c && c.trim()).join(' › ')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
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
                            placeholder="Product description..."
                        />
                    </div>

                    {/* Pricing Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-gray-200">
                            Pricing & Inventory
                        </h2>
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
                                            price: Number(e.target.value),
                                        }))
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock (physical only)
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
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Tiered Pricing */}
                        <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                💰 Tiered Pricing (Optional)
                            </h3>
                            <p className="text-xs text-gray-600 mb-3">
                                Set price per item and courier charge based on quantity ranges.
                            </p>
                            
                            <div className="space-y-3">
                                {form.quantity_pricing.map((tier, index) => {
                                    const minQty = Number(tier.min_qty) || 0;
                                    const pricePerItem = Number(tier.price_per_item) || 0;
                                    const courierCharge = Number(tier.courier_charge) || 0;
                                    const savingsPerItem = form.price > 0 && pricePerItem > 0 ? form.price - pricePerItem : 0;
                                    const savingsPercent = form.price > 0 ? Math.round((savingsPerItem / form.price) * 100) : 0;
                                    
                                    // Example calculation for display (e.g., 2 items)
                                    const exampleQty = minQty > 0 ? Math.max(minQty, 2) : 2;
                                    const exampleTotal = pricePerItem > 0 ? (pricePerItem * exampleQty) + courierCharge : 0;
                                    
                                    return (
                                        <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {/* Quantity Range */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Quantity Range
                                                    </label>
                                                    <div className="flex items-center gap-2">
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
                                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000]"
                                                        />
                                                        <span className="text-gray-400 text-xs">to</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="Max (empty = ∞)"
                                                            value={tier.max_qty || ""}
                                                            onChange={(e) => {
                                                                const newPricing = [...form.quantity_pricing];
                                                                newPricing[index] = { ...newPricing[index], max_qty: e.target.value || null };
                                                                setForm(p => ({ ...p, quantity_pricing: newPricing }));
                                                            }}
                                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Price Per Item */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Price Per Item
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500 text-sm">₹</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="e.g., 100"
                                                            value={tier.price_per_item}
                                                            onChange={(e) => {
                                                                const newPricing = [...form.quantity_pricing];
                                                                newPricing[index] = { ...newPricing[index], price_per_item: e.target.value };
                                                                setForm(p => ({ ...p, quantity_pricing: newPricing }));
                                                            }}
                                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000]"
                                                        />
                                                        <span className="text-xs text-gray-500">/each</span>
                                                    </div>
                                                </div>

                                                {/* Courier Charge */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        🚚 Courier Charge
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500 text-sm">₹</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="e.g., 70"
                                                            value={tier.courier_charge}
                                                            onChange={(e) => {
                                                                const newPricing = [...form.quantity_pricing];
                                                                newPricing[index] = { ...newPricing[index], courier_charge: e.target.value };
                                                                setForm(p => ({ ...p, quantity_pricing: newPricing }));
                                                            }}
                                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#B00000]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Savings & Example */}
                                                <div className="flex flex-col justify-center">
                                                    {savingsPerItem > 0 && (
                                                        <div className="text-xs text-green-600 mb-1">
                                                            💰 Save ₹{savingsPerItem.toFixed(0)} ({savingsPercent}%) per item
                                                        </div>
                                                    )}
                                                    {exampleTotal > 0 && (
                                                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                            📦 Example: {exampleQty} items = ₹{(pricePerItem * exampleQty).toFixed(0)} + ₹{courierCharge.toFixed(0)} courier = <strong>₹{exampleTotal.toFixed(0)}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <div className="mt-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newPricing = form.quantity_pricing.filter((_, i) => i !== index);
                                                        setForm(p => ({ ...p, quantity_pricing: newPricing.length > 0 ? newPricing : [{ min_qty: "", max_qty: "", price_per_item: "", courier_charge: "" }] }));
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                                                >
                                                    <Trash className="w-3 h-3" />
                                                    Remove Tier
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
                                    className="w-full px-4 py-3 text-sm border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#B00000] hover:text-[#B00000] hover:bg-red-50 transition-colors"
                                >
                                    + Add Pricing Tier
                                </button>

                                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                                    <strong>💡 Example:</strong> For 1-5 items: ₹100/item + ₹70 courier | For 6-10 items: ₹90/item + ₹50 courier
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Media Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-gray-200">
                            Media
                        </h2>

                        {/* Cover Image */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Image
                                <span className="block text-xs font-normal text-gray-500 mt-0.5">
                                    Recommended: 1280x720px (16:9)
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

                        {/* Images */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <ImageIcon className="w-4 h-4 inline mr-1" />
                                Additional Images
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
                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#B00000] hover:text-[#B00000]"
                                >
                                    + Add Image
                                </button>
                            </div>
                        </div>

                        {/* Videos */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Video className="w-4 h-4 inline mr-1" />
                                Videos
                            </label>
                            <div className="space-y-4">
                                {form.videos.map((video, index) => (
                                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-2 bg-gray-50">
                                        <div className="flex items-center justify-between">
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
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000]"
                                        />
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Video URL (YouTube or Vimeo Embed/Watch URL) *
                                            </label>
                                            <input
                                                type="text"
                                                value={video.url}
                                                onChange={(e) => {
                                                    const newVideos = [...form.videos];
                                                    newVideos[index] = { ...newVideos[index], url: e.target.value };
                                                    setForm((p) => ({ ...p, videos: newVideos }));
                                                }}
                                                placeholder="e.g., https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000]"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Paste YouTube watch/embed URL or Vimeo URL. It will be auto-converted to embed format.
                                            </p>
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
                                                placeholder="e.g., https://example.com/thumbnail.jpg"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000]"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm((p) => ({ ...p, videos: [...p.videos, { title: "", url: "", thumbnail: "" }] }));
                                    }}
                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#B00000] hover:text-[#B00000]"
                                >
                                    + Add Video
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Digital File Section */}
                    {form.product_type === "digital" && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-sm font-medium text-blue-900 mb-2">
                                Digital File Source
                            </h3>
                            
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
                                        className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <p className="text-xs text-blue-700 mt-1">
                                        Copy the filename from the "Digital Files" tab.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Options Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-gray-200">
                            Product Options
                        </h2>
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
                                Active (Product is visible)
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
                                Featured (Show on landing page)
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

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.push("/admin?tab=products")}
                            className="px-6 py-2 border border-gray-300 text-slate-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-[#B00000] text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                "Creating..."
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Update Product
                                </>
                            )}
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
                    aspectRatio={16 / 9}
                />
            )}
        </div>
    );
}
