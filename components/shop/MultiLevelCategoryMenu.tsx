"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { ChevronRight, Filter, X, ChevronDown } from "lucide-react";

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
    const [isMobile, setIsMobile] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint (Tailwind default)
        };

        // Check immediately on mount
        checkMobile();

        // Listen for resize events
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Toggle submenu (for mobile click behavior)
    const toggleSubmenu = (itemKey: string) => {
        setOpenSubmenus((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(itemKey)) {
                newSet.delete(itemKey);
            } else {
                newSet.add(itemKey);
            }
            return newSet;
        });
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

        // Mobile: click to expand, desktop: hover to expand
        const handleItemClick = (e: React.MouseEvent) => {
            if (isMobile && hasChildren) {
                e.stopPropagation();
                toggleSubmenu(itemKey);
            } else {
                handleSelect(itemPath);
            }
        };

        const handleChevronClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hasChildren) {
                toggleSubmenu(itemKey);
            }
        };

        return (
            <div
                className="relative"
                onMouseEnter={() => {
                    if (!isMobile && hasChildren) {
                        setOpenSubmenus((prev) => new Set([...prev, itemKey]));
                    }
                }}
                onMouseLeave={() => {
                    if (!isMobile && hasChildren) {
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
                    onClick={handleItemClick}
                    className={`w-full px-4 py-2.5 flex items-center justify-between text-left text-sm transition-colors ${isSelected
                        ? "bg-[#B00000] text-white font-medium"
                        : isInSelectedPath
                            ? "bg-red-50 text-[#B00000] font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    <span className="flex-1 truncate">{node.name}</span>
                    {hasChildren && (
                        <button
                            onClick={handleChevronClick}
                            className="ml-2 p-1 hover:bg-black/10 rounded"
                        >
                            {isMobile ? (
                                <ChevronDown
                                    className={`w-4 h-4 shrink-0 transition-transform ${isSubmenuOpen ? "rotate-180" : ""
                                        } ${isSelected ? "text-white" : "text-gray-400"}`}
                                />
                            ) : (
                                <ChevronRight
                                    className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-gray-400"
                                        }`}
                                />
                            )}
                        </button>
                    )}
                </button>

                {/* Submenu */}
                {hasChildren && isSubmenuOpen && (
                    <div
                        className={`${isMobile
                            ? "relative left-0 top-0 pl-4 bg-gray-50"
                            : "absolute left-full top-0 shadow-xl border border-gray-200 bg-white min-w-[200px] z-[9999]"
                            }`}
                        onMouseEnter={() => {
                            if (!isMobile) {
                                setOpenSubmenus((prev) => new Set([...prev, itemKey]));
                            }
                        }}
                        onMouseLeave={() => {
                            if (!isMobile) {
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
                className={`h-10 px-4 flex items-center gap-2 text-sm font-medium rounded-md transition-all ${selectedPath.length > 0
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
                <div className={`absolute top-full mt-2 z-50 ${isMobile
                        ? 'left-0 right-0 w-full'
                        : 'left-0'
                    }`}>
                    <div className={`shadow-xl border border-gray-200 bg-white ${isMobile
                            ? 'w-full max-h-[70vh] overflow-y-auto rounded-lg'
                            : 'min-w-[220px] overflow-visible rounded-md'
                        }`}>
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

