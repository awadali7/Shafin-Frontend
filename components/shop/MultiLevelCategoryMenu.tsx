"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { ChevronRight, Filter, X } from "lucide-react";

interface Product {
    id: string;
    categories?: string[];
    category?: string;
}

interface MultiLevelCategoryMenuProps {
    products: Product[];
    onFilterChange: (selectedPath: string[]) => void;
}

interface CategoryNode {
    name: string;
    children: Map<string, CategoryNode>;
    hasProducts: boolean;
}

export default function MultiLevelCategoryMenu({
    products,
    onFilterChange,
}: MultiLevelCategoryMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPath, setSelectedPath] = useState<string[]>([]);
    const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
    const menuRef = useRef<HTMLDivElement>(null);

    // Build category tree structure
    const categoryTree = useMemo(() => {
        const root = new Map<string, CategoryNode>();

        products.forEach((product) => {
            const cats =
                product.categories ||
                (product.category ? [product.category] : []);

            if (cats.length === 0) return;

            let currentLevel = root;

            cats.forEach((cat, index) => {
                if (!currentLevel.has(cat)) {
                    currentLevel.set(cat, {
                        name: cat,
                        children: new Map(),
                        hasProducts: index === cats.length - 1,
                    });
                }

                const node = currentLevel.get(cat)!;
                if (index === cats.length - 1) {
                    node.hasProducts = true;
                }
                currentLevel = node.children;
            });
        });

        return root;
    }, [products]);

    // Handle category selection
    const handleSelect = (path: string[]) => {
        setSelectedPath(path);
        onFilterChange(path);
        setIsOpen(false);
        setOpenSubmenus(new Set());
    };

    // Handle clear filter
    const handleClear = () => {
        setSelectedPath([]);
        onFilterChange([]);
        setIsOpen(false);
        setOpenSubmenus(new Set());
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setOpenSubmenus(new Set());
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Recursive menu item component
    const MenuItem = ({
        node,
        path,
        level,
    }: {
        node: CategoryNode;
        path: string[];
        level: number;
    }) => {
        const buttonRef = useRef<HTMLButtonElement>(null);
        const itemPath = [...path, node.name];
        const itemKey = itemPath.join(">");
        const hasChildren = node.children.size > 0;
        const isSubmenuOpen = openSubmenus.has(itemKey);
        const isSelected =
            selectedPath.length === itemPath.length &&
            itemPath.every((cat, idx) => selectedPath[idx] === cat);
        const isInSelectedPath =
            selectedPath.length > 0 &&
            selectedPath
                .slice(0, itemPath.length)
                .every((cat, idx) => itemPath[idx] === cat);

        // Calculate fixed position for submenu
        const [submenuPos, setSubmenuPos] = useState<{top: number, left: number} | null>(null);

        useEffect(() => {
            if (isSubmenuOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setSubmenuPos({
                    top: rect.top,
                    left: rect.right
                });
            }
        }, [isSubmenuOpen]);

        return (
            <div
                className="relative overflow-visible"
                onMouseEnter={() => {
                    if (hasChildren) {
                        setOpenSubmenus((prev) => new Set([...prev, itemKey]));
                    }
                }}
                onMouseLeave={() => {
                    if (hasChildren) {
                        setTimeout(() => {
                            setOpenSubmenus((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(itemKey);
                                return newSet;
                            });
                        }, 300);
                    }
                }}
            >
                <button
                    ref={buttonRef}
                    onClick={() => handleSelect(itemPath)}
                    className={`w-full px-4 py-2.5 flex items-center justify-between text-left text-sm transition-colors ${
                        isSelected
                            ? "bg-[#B00000] text-white font-medium"
                            : isInSelectedPath
                            ? "bg-red-50 text-[#B00000] font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                    <span className="flex-1 truncate">{node.name}</span>
                    {hasChildren && (
                        <ChevronRight
                            className={`w-4 h-4 shrink-0 ml-2 ${
                                isSelected ? "text-white" : "text-gray-400"
                            }`}
                        />
                    )}
                </button>

                {/* Submenu */}
                {hasChildren && isSubmenuOpen && (
                    <div 
                        className="absolute left-full top-0 shadow-xl border border-gray-200 bg-white min-w-[200px] max-h-[400px] overflow-y-auto z-9999"
                        onMouseEnter={() => {
                            setOpenSubmenus((prev) => new Set([...prev, itemKey]));
                        }}
                        onMouseLeave={() => {
                            setTimeout(() => {
                                setOpenSubmenus((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(itemKey);
                                    return newSet;
                                });
                            }, 300);
                        }}
                    >
                        {Array.from(node.children.values())
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((childNode) => (
                                <MenuItem
                                    key={childNode.name}
                                    node={childNode}
                                    path={itemPath}
                                    level={level + 1}
                                />
                            ))}
                    </div>
                )}
            </div>
        );
    };

    const rootCategories = Array.from(categoryTree.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    return (
        <div className="relative" ref={menuRef}>
            {/* Filter Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-10 px-4 flex items-center gap-2 text-sm font-medium rounded-md transition-all ${
                    selectedPath.length > 0
                        ? "bg-[#B00000] text-white shadow-sm"
                        : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
            >
                <Filter className="w-4 h-4" />
                {selectedPath.length > 0 ? (
                    <>
                        <span className="max-w-[200px] truncate">
                            {selectedPath.join(" > ")}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            className="ml-1 hover:bg-red-800 rounded-full p-0.5 transition-colors"
                            aria-label="Clear filter"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </>
                ) : (
                    <span>Filter by Category</span>
                )}
            </button>

            {/* Cascading Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50">
                    <div className="shadow-xl border border-gray-200 bg-white min-w-[220px] max-h-[400px] overflow-auto">
                        <div className="relative">
                            {rootCategories.map((node) => (
                                <MenuItem
                                    key={node.name}
                                    node={node}
                                    path={[]}
                                    level={0}
                                />
                            ))}

                            {/* Clear button */}
                            {selectedPath.length > 0 && (
                                <button
                                    onClick={handleClear}
                                    className="w-full px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-sm font-medium text-gray-600 hover:text-[#B00000] hover:bg-gray-100 transition-colors text-left"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
