"use client";

import React, { useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

export type TypeFilter = "all" | "digital" | "physical";
export type SortOption = "name" | "price-asc" | "price-desc" | "newest";

export interface PriceRangeOption {
    id: string;
    label: string;
    min: number | null;
    max: number | null;
}

export const PRICE_RANGES: PriceRangeOption[] = [
    { id: "any", label: "Any Price", min: null, max: null },
    { id: "under-5k", label: "Under ₹5,000", min: null, max: 5000 },
    { id: "5k-20k", label: "₹5,000 – ₹20,000", min: 5000, max: 20000 },
    { id: "20k-50k", label: "₹20,000 – ₹50,000", min: 20000, max: 50000 },
    { id: "above-50k", label: "Above ₹50,000", min: 50000, max: null },
];

export const SORT_LABELS: Record<SortOption, string> = {
    name: "A – Z",
    "price-asc": "Price: Low to High",
    "price-desc": "Price: High to Low",
    newest: "Newest First",
};

const TYPE_LABELS: Record<TypeFilter, string> = {
    all: "All",
    digital: "Digital",
    physical: "Physical",
};

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    typeFilter: TypeFilter;
    onTypeChange: (value: TypeFilter) => void;
    inStockOnly: boolean;
    onInStockChange: (value: boolean) => void;
    priceRangeId: string;
    onPriceRangeChange: (id: string) => void;
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
    onClearAll: () => void;
}

export default function FilterBar({
    searchQuery,
    onSearchChange,
    typeFilter,
    onTypeChange,
    inStockOnly,
    onInStockChange,
    priceRangeId,
    onPriceRangeChange,
    sortBy,
    onSortChange,
    onClearAll,
}: FilterBarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [priceMenuOpen, setPriceMenuOpen] = useState(false);

    const activePriceRange = PRICE_RANGES.find((r) => r.id === priceRangeId) ?? PRICE_RANGES[0];

    const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
    if (typeFilter !== "all") {
        activeChips.push({
            key: "type",
            label: TYPE_LABELS[typeFilter],
            onRemove: () => onTypeChange("all"),
        });
    }
    if (inStockOnly) {
        activeChips.push({
            key: "stock",
            label: "In Stock Only",
            onRemove: () => onInStockChange(false),
        });
    }
    if (activePriceRange.id !== "any") {
        activeChips.push({
            key: "price",
            label: activePriceRange.label,
            onRemove: () => onPriceRangeChange("any"),
        });
    }
    if (sortBy !== "name") {
        activeChips.push({
            key: "sort",
            label: SORT_LABELS[sortBy],
            onRemove: () => onSortChange("name"),
        });
    }

    const filterCount = activeChips.length;

    const TypePills = (
        <div className="flex items-center gap-1.5" role="group" aria-label="Filter by product type">
            {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((key) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onTypeChange(key)}
                    aria-pressed={typeFilter === key}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        typeFilter === key
                            ? "bg-brand-red text-white"
                            : "border border-[#D1D5DB] text-brand-gray hover:border-brand-red/50 hover:text-brand-red"
                    }`}
                >
                    {TYPE_LABELS[key]}
                </button>
            ))}
        </div>
    );

    const StockToggle = (
        <button
            type="button"
            onClick={() => onInStockChange(!inStockOnly)}
            aria-pressed={inStockOnly}
            aria-label="Toggle in-stock products only"
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                inStockOnly
                    ? "bg-brand-red text-white"
                    : "border border-[#D1D5DB] text-brand-gray hover:border-brand-red/50 hover:text-brand-red"
            }`}
        >
            <span
                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                    inStockOnly ? "bg-white/30" : "bg-[#D1D5DB]"
                }`}
                aria-hidden="true"
            >
                <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                        inStockOnly ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                />
            </span>
            In Stock
        </button>
    );

    const PriceMenu = (
        <div className="relative">
            <button
                type="button"
                onClick={() => setPriceMenuOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={priceMenuOpen}
                aria-label="Filter by price range"
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    activePriceRange.id !== "any"
                        ? "bg-brand-red text-white"
                        : "border border-[#D1D5DB] text-brand-gray hover:border-brand-red/50 hover:text-brand-red"
                }`}
            >
                {activePriceRange.id === "any" ? "Price" : activePriceRange.label}
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {priceMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setPriceMenuOpen(false)}
                        aria-hidden="true"
                    />
                    <ul
                        role="listbox"
                        aria-label="Price ranges"
                        className="absolute left-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg"
                    >
                        {PRICE_RANGES.map((range) => (
                            <li key={range.id}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={priceRangeId === range.id}
                                    onClick={() => {
                                        onPriceRangeChange(range.id);
                                        setPriceMenuOpen(false);
                                    }}
                                    className={`block w-full px-3.5 py-2 text-left text-sm transition-colors ${
                                        priceRangeId === range.id
                                            ? "bg-brand-red/10 font-medium text-brand-red"
                                            : "text-[#0D0D14] hover:bg-[#F8F9FC]"
                                    }`}
                                >
                                    {range.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );

    const SortSelect = (
        <div className="relative shrink-0">
            <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                aria-label="Sort products"
                className="h-10 appearance-none rounded-full border border-[#D1D5DB] bg-white py-0 pl-4 pr-9 text-sm text-[#0D0D14] transition-colors focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
            >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <option key={key} value={key}>
                        {SORT_LABELS[key]}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" aria-hidden="true" />
        </div>
    );

    return (
        <div className="border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" aria-hidden="true" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search diagnostic tools, courses…"
                            aria-label="Search products"
                            className="h-11 w-full rounded-full border border-[#D1D5DB] bg-[#F8F9FC] pl-10 pr-9 text-sm text-[#0D0D14] transition-colors placeholder:text-brand-gray focus:border-brand-red focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                        />
                        {searchQuery.trim().length > 0 && (
                            <button
                                type="button"
                                onClick={() => onSearchChange("")}
                                aria-label="Clear search"
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-gray hover:text-[#0D0D14]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Mobile filters button */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open filters"
                        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-[#D1D5DB] px-4 text-sm font-medium text-[#0D0D14] sm:hidden"
                    >
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        Filters
                        {filterCount > 0 && (
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                                {filterCount}
                            </span>
                        )}
                    </button>

                    {/* Desktop pills + sort */}
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        {TypePills}
                        {StockToggle}
                        {PriceMenu}
                        <span className="h-6 w-px bg-[#E5E7EB]" aria-hidden="true" />
                        {SortSelect}
                    </div>
                </div>

                {/* Active filter chips */}
                {activeChips.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {activeChips.map((chip) => (
                            <span
                                key={chip.key}
                                className="inline-flex items-center gap-1 rounded-full border border-brand-red/20 bg-brand-red/10 px-2.5 py-1 text-xs font-medium text-brand-red"
                            >
                                {chip.label}
                                <button
                                    type="button"
                                    onClick={chip.onRemove}
                                    aria-label={`Remove ${chip.label} filter`}
                                    className="hover:text-[#8B0000]"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                        <button
                            type="button"
                            onClick={onClearAll}
                            className="text-xs font-semibold text-brand-gray underline-offset-2 hover:text-brand-red hover:underline"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile bottom-sheet drawer */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                        onClick={() => setMobileOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filters and sort"
                        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl sm:hidden"
                    >
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="h-1 w-10 rounded-full bg-gray-300" />
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
                            <h2 className="font-semibold text-[#0D0D14]">Filters & Sort</h2>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close filters"
                                className="rounded-full p-1.5 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5 text-brand-gray" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-gray">Type</p>
                                {TypePills}
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-gray">Availability</p>
                                {StockToggle}
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-gray">Price Range</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {PRICE_RANGES.map((range) => (
                                        <button
                                            key={range.id}
                                            type="button"
                                            onClick={() => onPriceRangeChange(range.id)}
                                            aria-pressed={priceRangeId === range.id}
                                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                                priceRangeId === range.id
                                                    ? "bg-brand-red text-white"
                                                    : "border border-[#D1D5DB] text-brand-gray"
                                            }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-gray">Sort by</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => onSortChange(key)}
                                            aria-pressed={sortBy === key}
                                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                                sortBy === key
                                                    ? "bg-brand-red text-white"
                                                    : "border border-[#D1D5DB] text-brand-gray"
                                            }`}
                                        >
                                            {SORT_LABELS[key]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex gap-3 border-t border-gray-100 px-4 pt-3"
                            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
                        >
                            {filterCount > 0 && (
                                <button
                                    type="button"
                                    onClick={onClearAll}
                                    className="rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-medium text-[#0D0D14] transition-colors hover:bg-[#F8F9FC]"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="flex-1 rounded-xl bg-brand-red py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8B0000]"
                            >
                                Show Results
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
