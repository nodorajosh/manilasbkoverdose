"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type CartItem = {
    ticketName: string;
    ticketPrice: number;
    ticketCurrency: string;
    ticketId: string;
    quantity: number;
    discountCode?: string | null;
    discountedPrice?: number | null;
};

type CartPayload = {
    items?: CartItem[];
};

type CartContextType = {
    cart: CartItem[];
    isCartOpen: boolean;
    setCartOpen: (open: boolean) => void;
    addToCart: (name: string, price: number, currency: string, ticketId: string, quantity?: number, discountCode?: string | null, discountedPrice?: number | null) => Promise<void>;
    removeFromCart: (ticketId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    updateQuantity: (ticketId: string, newQuantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

async function readCartResponse(response: Response): Promise<CartItem[]> {
    const payload = await response.json().catch(() => null) as CartPayload & { error?: string; message?: string } | null;
    if (!response.ok) {
        throw new Error(payload?.error ?? payload?.message ?? "Cart request failed");
    }
    if (!payload || !Array.isArray(payload.items)) {
        throw new Error("Cart response was invalid");
    }
    return payload.items;
}

function readLocalCart(): CartItem[] {
    try {
        const raw = window.localStorage.getItem("cart");
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error("Invalid cart");
        return parsed.filter((item): item is CartItem => {
            if (!item || typeof item !== "object") return false;
            const value = item as Partial<CartItem>;
            return typeof value.ticketId === "string" && typeof value.quantity === "number" && value.quantity > 0;
        });
    } catch {
        window.localStorage.removeItem("cart");
        return [];
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const refreshCart = useCallback(async () => {
        if (session?.user) {
            const response = await fetch("/api/cart", { cache: "no-store" });
            setCart(await readCartResponse(response));
            return;
        }
        setCart(readLocalCart());
    }, [session]);

    useEffect(() => {
        let active = true;
        const loadCart = async () => {
            try {
                if (session?.user) {
                    const response = await fetch("/api/cart", { cache: "no-store" });
                    const items = await readCartResponse(response);
                    if (active) setCart(items);
                } else if (active) {
                    setCart(readLocalCart());
                }
            } catch {
                if (active) setCart([]);
            }
        };
        void loadCart();
        return () => {
            active = false;
        };
    }, [session]);

    useEffect(() => {
        if (!session?.user) {
            try {
                window.localStorage.setItem("cart", JSON.stringify(cart));
            } catch {
                return;
            }
        }
    }, [cart, session]);

    const addToCart = useCallback(async (
        ticketName: string,
        ticketPrice: number,
        ticketCurrency: string,
        ticketId: string,
        quantity = 1,
        discountCode: string | null = null,
        discountedPrice: number | null = null,
    ) => {
        const safeQuantity = Math.max(1, Math.floor(quantity));
        if (session?.user) {
            const response = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId, ticketName, ticketPrice, ticketCurrency, quantity: safeQuantity, discountCode, discountedPrice }),
            });
            setCart(await readCartResponse(response));
        } else {
            setCart((previous) => {
                const matching = previous.filter((item) => item.ticketId === ticketId);
                const others = previous.filter((item) => item.ticketId !== ticketId);
                const totalQuantity = matching.reduce((sum, item) => sum + item.quantity, 0) + safeQuantity;
                return [
                    ...others,
                    {
                        ticketName,
                        ticketPrice,
                        ticketCurrency,
                        ticketId,
                        quantity: totalQuantity,
                        discountCode,
                        discountedPrice,
                    },
                ];
            });
        }
        setIsCartOpen(true);
    }, [session]);

    const removeFromCart = useCallback(async (ticketId: string) => {
        if (session?.user) {
            const response = await fetch(`/api/cart?ticketId=${encodeURIComponent(ticketId)}`, { method: "DELETE" });
            setCart(await readCartResponse(response));
            return;
        }
        setCart((previous) => previous.filter((item) => item.ticketId !== ticketId));
    }, [session]);

    const clearCart = useCallback(async () => {
        if (session?.user) {
            const response = await fetch("/api/cart", { method: "DELETE" });
            if (!response.ok && response.status !== 404) {
                await readCartResponse(response);
            }
        }
        setCart([]);
    }, [session]);

    const updateQuantity = useCallback(async (ticketId: string, newQuantity: number) => {
        const safeQuantity = Math.max(0, Math.floor(Number.isFinite(newQuantity) ? newQuantity : 0));
        if (!session?.user) {
            setCart((previous) => safeQuantity === 0
                ? previous.filter((item) => item.ticketId !== ticketId)
                : previous.map((item) => item.ticketId === ticketId ? { ...item, quantity: safeQuantity } : item));
            return;
        }

        if (safeQuantity === 0) {
            const response = await fetch(`/api/cart?ticketId=${encodeURIComponent(ticketId)}`, { method: "DELETE" });
            setCart(await readCartResponse(response));
            return;
        }

        const response = await fetch("/api/cart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId, quantity: safeQuantity }),
        });
        setCart(await readCartResponse(response));
    }, [session]);

    return (
        <CartContext.Provider value={{ cart, isCartOpen, setCartOpen: setIsCartOpen, addToCart, removeFromCart, clearCart, refreshCart, updateQuantity }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCartContext must be used inside CartProvider");
    return context;
};
