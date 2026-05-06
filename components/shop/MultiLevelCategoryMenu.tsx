"use client";

import React, { useMemo } from "react";
import { ChevronRight, X } from "lucide-react";

interface Product {
    id: string;
    categories?: string[];
    category?: string;
}

interface Props {
    products: Product[];
    selectedPath: string[];
    onFilterChange: (path: string[]) => void;
}

interface CategoryNode {
    name: string;
    children: Map<string, CategoryNode>;
}

const MAX_LEVELS = 4;

function buildTree(products: Product[]): Map<string, CategoryNode> {
    const root = new Map<string, CategoryNode>();

    products.forEach((p) => {
        const cats = (
            p.categories?.length
                ? p.categories
                : p.category
                  ? [p.category]
                  : []
        )
            .map((c) => c.trim())
            .filter(Boolean)
            .slice(0, MAX_LEVELS);

        if (!cats.length) return;

        let level = root;
        cats.forEach((cat) => {
            if (!level.has(cat)) {
                level.set(cat, { name: cat, children: new Map() });
            }
            level = level.get(cat)!.children;
        });
    });

    return root;
}

function TreeLevel({
    nodes,
    level,
    selectedPath,
    onSelect,
}: {
    nodes: Map<string, CategoryNode>;
    level: number;
    selectedPath: string[];
    onSelect: (level: number, name: string) => void;
}) {
    const sorted = Array.from(nodes.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    return (
        <ul className="space-y-0.5">
            {sorted.map((node) => {
                const isSelected = selectedPath[level] === node.name;
                const hasChildren = node.children.size > 0;

                return (
                    <li key={node.name}>
                        <button
                            type="button"
                            onClick={() => onSelect(level, node.name)}
                            className={`group w-full flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-left transition-colors ${
                                isSelected
                                    ? "bg-[#B00000] text-white font-medium"
                                    : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            <span className="truncate">{node.name}</span>
                            {hasChildren && (
                                <ChevronRight
                                    className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform ${
                                        isSelected
                                            ? "rotate-90 text-white"
                                            : "text-gray-400 group-hover:text-gray-500"
                                    }`}
                                />
                            )}
                        </button>

                        {isSelected && hasChildren && (
                            <div className="ml-3 mt-0.5 mb-1 border-l-2 border-red-100 pl-2">
                                <TreeLevel
                                    nodes={node.children}
                                    level={level + 1}
                                    selectedPath={selectedPath}
                                    onSelect={onSelect}
                                />
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default function MultiLevelCategoryMenu({
    products,
    selectedPath,
    onFilterChange,
}: Props) {
    const tree = useMemo(() => buildTree(products), [products]);

    const handleSelect = (level: number, name: string) => {
        const alreadySelected = selectedPath[level] === name;
        onFilterChange(
            alreadySelected
                ? selectedPath.slice(0, level)
                : [...selectedPath.slice(0, level), name]
        );
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Categories
                </h3>
                {selectedPath.length > 0 && (
                    <button
                        type="button"
                        onClick={() => onFilterChange([])}
                        className="text-xs text-[#B00000] hover:underline"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Active filter breadcrumb chips */}
            {selectedPath.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                    {selectedPath.map((item, i) => (
                        <span
                            key={`${item}-${i}`}
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs text-[#B00000] font-medium"
                        >
                            {item}
                            <button
                                type="button"
                                onClick={() => onFilterChange(selectedPath.slice(0, i))}
                                className="hover:text-red-800 ml-0.5"
                                aria-label={`Remove ${item} filter`}
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Category tree */}
            {tree.size === 0 ? (
                <p className="text-xs text-gray-400 py-2">Loading categories…</p>
            ) : (
                <TreeLevel
                    nodes={tree}
                    level={0}
                    selectedPath={selectedPath}
                    onSelect={handleSelect}
                />
            )}
        </div>
    );
}
