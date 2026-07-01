"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Loader2, Save, Search, Tag, X } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";

export const OfferProductsTab: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterOffersOnly, setFilterOffersOnly] = useState(false);

    // Draft offer-price text per product id, seeded from each product's current offer_price
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const resp = await productsApi.adminListAll();
            const list = Array.isArray(resp.data) ? resp.data : [];
            setProducts(list);
            setDrafts(
                Object.fromEntries(
                    list.map((p) => [p.id, p.offer_price != null ? String(p.offer_price) : ""])
                )
            );
        } catch (e: any) {
            setError(e?.message || "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        let list = products;
        if (filterOffersOnly) {
            list = list.filter((p) => p.offer_price != null && Number(p.offer_price) > 0);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.slug || "").toLowerCase().includes(q)
            );
        }
        return list;
    }, [products, search, filterOffersOnly]);

    const saveOffer = async (product: Product, value: number) => {
        try {
            setSavingId(product.id);
            setError(null);
            await productsApi.adminUpdate(product.id, { offer_price: value });
            await fetchProducts();
        } catch (e: any) {
            setError(e?.message || "Failed to save offer price");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#B00000]" />
                        Offer Products
                        <span className="ml-1 text-sm font-normal text-gray-400">
                            ({filteredProducts.length})
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500">
                        Pick a product below and set its offer price. It will immediately show with a strikethrough on the regular price and discount badge across the shop and product pages.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={filterOffersOnly}
                            onChange={(e) => setFilterOffersOnly(e.target.checked)}
                            className="w-4 h-4 text-[#B00000] border-gray-300 rounded focus:ring-[#B00000]"
                        />
                        Active offers only
                    </label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search products…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B00000] focus:border-transparent w-52"
                        />
                    </div>
                </div>
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                Image
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Regular Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Offer Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Discount
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                    No products found
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((p) => {
                                const price = Number(p.price);
                                const draft = drafts[p.id] ?? "";
                                const draftNum = Number(draft);
                                const hasValidDraft =
                                    draft.trim() !== "" && !isNaN(draftNum) && draftNum > 0 && draftNum < price;
                                const currentOffer = p.offer_price != null ? Number(p.offer_price) : null;
                                const isDirty = draft !== (currentOffer != null ? String(currentOffer) : "");
                                const discountPercent = hasValidDraft
                                    ? Math.round(((price - draftNum) / price) * 100)
                                    : currentOffer && currentOffer > 0 && currentOffer < price
                                        ? Math.round(((price - currentOffer) / price) * 100)
                                        : null;

                                return (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {p.cover_image ? (
                                                <img
                                                    src={p.cover_image}
                                                    alt={p.name}
                                                    className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-slate-900">{p.name}</div>
                                            <div className="text-xs text-gray-500">{p.slug}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            ₹{price.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500 text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="No offer"
                                                    value={draft}
                                                    onChange={(e) =>
                                                        setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                                                    }
                                                    className="w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B00000] focus:border-transparent"
                                                />
                                            </div>
                                            {draft.trim() !== "" && !hasValidDraft && (
                                                <p className="mt-1 text-[11px] text-red-600">
                                                    Must be greater than 0 and less than ₹{price.toFixed(2)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {discountPercent !== null ? (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                                                    {discountPercent}% OFF
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {currentOffer != null && currentOffer > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setDrafts((d) => ({ ...d, [p.id]: "" }));
                                                            saveOffer(p, 0);
                                                        }}
                                                        disabled={savingId === p.id}
                                                        className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                                                        title="Remove offer"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => saveOffer(p, draftNum)}
                                                    disabled={!hasValidDraft || !isDirty || savingId === p.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#B00000] text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {savingId === p.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Save className="w-3.5 h-3.5" />
                                                    )}
                                                    Save
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
