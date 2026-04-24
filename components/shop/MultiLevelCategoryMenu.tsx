"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";

interface Product {
    id: string;
    categories?: string[];
    category?: string;
}

interface MultiLevelCategoryMenuProps {
    products: Product[];
    selectedPath: string[];
    onFilterChange: (selectedPath: string[]) => void;
}

interface CategoryNode {
    name: string;
    children: Map<string, CategoryNode>;
}

const MAX_LEVELS = 4;
const LEVEL_LABELS = [
    "Main category",
    "Sub-category",
    "Series",
    "Variant",
];

export default function MultiLevelCategoryMenu({
    products,
    selectedPath,
    onFilterChange,
}: MultiLevelCategoryMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const categoryTree = useMemo(() => {
        const root = new Map<string, CategoryNode>();

        products.forEach((product) => {
            const cats = (
                product.categories?.length
                    ? product.categories
                    : product.category
                      ? [product.category]
                      : []
            )
                .map((cat) => cat.trim())
                .filter(Boolean)
                .slice(0, MAX_LEVELS);

            if (cats.length === 0) return;

            let currentLevel = root;

            cats.forEach((cat) => {
                if (!currentLevel.has(cat)) {
                    currentLevel.set(cat, {
                        name: cat,
                        children: new Map(),
                    });
                }

                currentLevel = currentLevel.get(cat)!.children;
            });
        });

        return root;
    }, [products]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const levels = useMemo(() => {
        const output: string[][] = [];
        let currentLevel = categoryTree;

        for (let level = 0; level < MAX_LEVELS; level += 1) {
            const options = Array.from(currentLevel.values())
                .map((node) => node.name)
                .sort((a, b) => a.localeCompare(b));

            if (options.length === 0) break;
            output.push(options);

            const selected = selectedPath[level];
            const nextNode = selected ? currentLevel.get(selected) : undefined;
            if (!nextNode) break;
            currentLevel = nextNode.children;
        }

        return output;
    }, [categoryTree, selectedPath]);

    const totalCategories = useMemo(() => {
        const unique = new Set<string>();

        products.forEach((product) => {
            (product.categories?.length
                ? product.categories
                : product.category
                  ? [product.category]
                  : []
            )
                .map((cat) => cat.trim())
                .filter(Boolean)
                .forEach((cat) => unique.add(cat));
        });

        return unique.size;
    }, [products]);

    const handleSelect = (level: number, category: string) => {
        const alreadySelected = selectedPath[level] === category;
        const nextPath = alreadySelected
            ? selectedPath.slice(0, level)
            : [...selectedPath.slice(0, level), category];

        onFilterChange(nextPath);
    };

    const handleClear = () => {
        onFilterChange([]);
        setIsOpen(false);
    };

    const hasCategories = levels.length > 0;

    return (
        <div className="relative w-full lg:w-auto" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm transition-colors lg:min-w-[280px] ${
                    selectedPath.length > 0
                        ? "border-[#B00000] bg-white text-[#B00000]"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
                aria-expanded={isOpen}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <Filter className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                        {selectedPath.length > 0
                            ? selectedPath.join(" / ")
                            : "Filter by Category"}
                    </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                    {selectedPath.length > 0 && (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleClear();
                            }}
                            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#B00000]"
                            aria-label="Clear filter"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                </span>
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full z-[200] mt-2 w-full lg:min-w-[720px] lg:w-auto">
                    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Filter by Category
                                </p>
                                <p className="text-xs text-gray-500">
                                    {totalCategories > 0
                                        ? `${totalCategories} categories available`
                                        : "Choose a category path"}
                                </p>
                            </div>
                            {selectedPath.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="text-sm text-[#B00000] hover:underline"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {!hasCategories ? (
                            <div className="px-4 py-6 text-sm text-gray-500">
                                Categories will appear once products are loaded.
                            </div>
                        ) : (
                            <div className="grid gap-3 p-4 lg:grid-cols-4">
                                {levels.map((options, level) => (
                                    <section
                                        key={`level-${level}`}
                                        className="min-w-0"
                                    >
                                        <p className="mb-2 text-xs font-medium text-gray-500">
                                            {LEVEL_LABELS[level] || `Level ${level + 1}`}
                                        </p>
                                        <div className="space-y-1.5">
                                            {options.map((option) => {
                                                const isSelected =
                                                    selectedPath[level] === option;
                                                const isActiveParent =
                                                    level === 0 ||
                                                    selectedPath[level - 1] !== undefined;

                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() =>
                                                            handleSelect(level, option)
                                                        }
                                                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                                                            isSelected
                                                                ? "border-[#B00000] bg-[#B00000] text-white"
                                                                : isActiveParent
                                                                  ? "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                                                  : "border-gray-100 bg-gray-50 text-gray-400"
                                                        }`}
                                                    >
                                                        <span className="truncate">
                                                            {option}
                                                        </span>
                                                        <ChevronRight
                                                            className={`h-4 w-4 shrink-0 ${
                                                                isSelected
                                                                    ? "text-white"
                                                                    : "text-gray-300"
                                                            }`}
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}

                        {selectedPath.length > 0 && (
                            <div className="border-t border-gray-200 px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                    {selectedPath.map((item, index) => (
                                        <button
                                            key={`${item}-${index}`}
                                            type="button"
                                            onClick={() =>
                                                onFilterChange(
                                                    selectedPath.slice(0, index + 1)
                                                )
                                            }
                                            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:border-[#B00000] hover:text-[#B00000]"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
