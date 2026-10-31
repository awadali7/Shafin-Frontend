"use client";

import React, { useMemo } from "react";
import { ChevronDown, X } from "lucide-react";

interface Product {
    id: string;
    categories?: string[];
    category?: string;
}

interface CascadingCategoryFilterProps {
    products: Product[];
    selectedPath: string[];
    onFilterChange: (selectedPath: string[]) => void;
}

export default function CascadingCategoryFilter({
    products,
    selectedPath,
    onFilterChange,
}: CascadingCategoryFilterProps) {
    // Build category hierarchy tree from products
    const categoryTree = useMemo(() => {
        const tree: { [key: string]: Set<string> } = {
            _root: new Set(), // Top-level categories
        };

        products.forEach((product) => {
            const cats =
                product.categories ||
                (product.category ? [product.category] : []);

            if (cats.length === 0) return;

            // Add first category to root
            tree._root.add(cats[0]);

            // Build parent-child relationships
            for (let i = 0; i < cats.length - 1; i++) {
                const parent = cats[i];
                const child = cats[i + 1];

                if (!tree[parent]) {
                    tree[parent] = new Set();
                }
                tree[parent].add(child);
            }
        });

        return tree;
    }, [products]);

    // Get available options for the next level based on current selection
    const getAvailableOptions = (level: number): string[] => {
        if (level === 0) {
            // Root level - show all main categories
            return Array.from(categoryTree._root).sort();
        }

        // Get parent category
        const parent = selectedPath[level - 1];
        if (!parent || !categoryTree[parent]) {
            return [];
        }

        return Array.from(categoryTree[parent]).sort();
    };

    // Handle category selection
    const handleSelect = (level: number, category: string) => {
        onFilterChange([...selectedPath.slice(0, level), category]);
    };

    // Clear filter
    const handleClear = () => {
        onFilterChange([]);
    };

    // Remove selection from a specific level
    const handleRemoveLevel = (level: number) => {
        onFilterChange(selectedPath.slice(0, level));
    };

    // Calculate how many levels to show (max 4)
    const maxLevels = 4;
    const levelsToShow = Math.min(selectedPath.length + 1, maxLevels);

    const levelLabels = [
        "Main Category",
        "Sub-Category",
        "Brand/Type",
        "Model/Variant",
    ];

    return (
        <div className="space-y-2">
            {/* Cascading Dropdowns - Minimal Inline */}
            <div className="flex items-center gap-2 flex-wrap">
                {Array.from({ length: levelsToShow }).map((_, level) => {
                    const options = getAvailableOptions(level);
                    const currentSelection = selectedPath[level];
                    const isDisabled = level > 0 && !selectedPath[level - 1];

                    if (options.length === 0 && level > 0) return null;

                    return (
                        <div key={level} className="relative">
                            <select
                                value={currentSelection || ""}
                                onChange={(e) =>
                                    handleSelect(level, e.target.value)
                                }
                                disabled={isDisabled}
                                className={`h-10 pl-3 pr-8 text-sm border-0 border-b-2 bg-transparent appearance-none focus:outline-none focus:border-[#B00000] transition-all ${
                                    isDisabled
                                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                        : currentSelection
                                        ? "border-[#B00000] text-[#B00000] font-medium"
                                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                                }`}
                            >
                                <option value="">
                                    {isDisabled ? "—" : levelLabels[level]}
                                </option>
                                {options.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className={`absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${
                                    isDisabled
                                        ? "text-gray-300"
                                        : currentSelection
                                        ? "text-[#B00000]"
                                        : "text-gray-400"
                                }`}
                            />
                        </div>
                    );
                })}

                {/* Clear Button - Minimal */}
                {selectedPath.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="h-10 px-3 text-xs font-medium text-gray-500 hover:text-[#B00000] transition-colors flex items-center gap-1"
                        title="Clear all filters"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>
                )}
            </div>

            {/* Breadcrumb - Minimal */}
            {selectedPath.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {selectedPath.map((cat, idx) => (
                        <React.Fragment key={idx}>
                            <span className="text-[#B00000] font-medium">{cat}</span>
                            {idx < selectedPath.length - 1 && (
                                <span>/</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}

