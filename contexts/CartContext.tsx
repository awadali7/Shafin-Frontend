"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image?: string;
    type: "physical" | "digital" | "course";
    quantity: number;
    slug?: string;
    quantity_pricing?: Array<{ min_qty: number; max_qty: number | null; price_per_item: number; courier_charge?: number }>;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
    getItemCount: () => number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedCart = localStorage.getItem("cart");
            if (savedCart) {
                try {
                    setItems(JSON.parse(savedCart));
                } catch (error) {
                    console.error("Error loading cart:", error);
                }
            }
        }
    }, []);

    // Save cart to localStorage whenever items change
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cart", JSON.stringify(items));
        }
    }, [items]);

    const addToCart = (item: CartItem) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === item.id);
            if (existingItem) {
                return prevItems.map((i) =>
                    i.id === item.id
                        ? { 
                            ...i, 
                            ...item, // Merge new item data (including quantity_pricing)
                            quantity: i.quantity + item.quantity 
                        }
                        : i
                );
            }
            return [...prevItems, item];
        });
    };

    const removeFromCart = (id: string) => {
        setItems((prevItems) => prevItems.filter((i) => i.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        setItems((prevItems) =>
            prevItems.map((i) => (i.id === id ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const getTotalPrice = () => {
        return items.reduce((total, item) => {
            // Apply tiered pricing if available
            if (item.quantity_pricing && item.quantity_pricing.length > 0) {
                const tier = item.quantity_pricing.find(t => {
                    const minQty = t.min_qty || 1;
                    const maxQty = t.max_qty || Infinity;
                    return item.quantity >= minQty && item.quantity <= maxQty;
                });
                
                if (tier) {
                    return total + (tier.price_per_item * item.quantity);
                }
            }
            
            // Fallback to base price if no tier applies
            return total + (item.price * item.quantity);
        }, 0);
    };

    const getItemCount = () => {
        return items.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotalPrice,
                getItemCount,
                isOpen,
                setIsOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}



