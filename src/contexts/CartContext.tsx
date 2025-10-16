"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

export type CartItem = {
    ticketName: string;
    ticketPrice: number;
    ticketCurrency: string;
    ticketId: string;
    quantity: number;
};

type CartContextType = {
    cart: CartItem[];
    addToCart: (name: string, price: number, currency: string, ticketId: string, quantity?: number) => Promise<void>;
    removeFromCart: (ticketId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    updateQuantity: (ticketId: string, newQuantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load cart (server for logged in, localStorage for guests)
    useEffect(() => {
        const load = async () => {
            if (session?.user) {
                try {
                    const res = await fetch("/api/cart");
                    const data = await res.json();
                    setCart(data?.items ?? []);
                } catch (err) {
                    console.error("Failed to load server cart:", err);
                    setCart([]);
                }
            } else {
                const raw = localStorage.getItem("cart");
                setCart(raw ? JSON.parse(raw) : []);
            }
        };
        load();
    }, [session]);

    // persist guest cart to localStorage
    useEffect(() => {
        if (!session?.user) {
            try {
                localStorage.setItem("cart", JSON.stringify(cart));
            } catch {
                // ignore
            }
        }
    }, [cart, session]);

    const addToCart = useCallback(
        async (ticketName: string, ticketPrice: number, ticketCurrency: string, ticketId: string, quantity = 1) => {
            if (session?.user) {
                // server expects POST to increment/add
                await fetch("/api/cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticketId, ticketName, ticketPrice, ticketCurrency, quantity }),
                });
                const res = await fetch("/api/cart");
                const data = await res.json();
                setCart(data.items ?? []);
            } else {
                setCart((prev) => {
                    const found = prev.find((p) => p.ticketId === ticketId);
                    if (found) {
                        return prev.map((p) => (p.ticketId === ticketId ? { ...p, quantity: p.quantity + quantity } : p));
                    }
                    return [...prev, { ticketName, ticketPrice, ticketCurrency, ticketId, quantity }];
                });
            }
        },
        [session]
    );

    const removeFromCart = useCallback(
        async (ticketId: string) => {
            if (session?.user) {
                await fetch(`/api/cart?ticketId=${encodeURIComponent(ticketId)}`, { method: "DELETE" });
                const res = await fetch("/api/cart");
                const data = await res.json();
                setCart(data.items ?? []);
            } else {
                setCart((prev) => prev.filter((p) => p.ticketId !== ticketId));
            }
        },
        [session]
    );

    const clearCart = useCallback(async () => {
        if (session?.user) {
            await fetch("/api/cart", { method: "DELETE" });
        }
        setCart([]);
    }, [session]);

    /**
     * updateQuantity - set item quantity to an absolute value
     *
     * Implementation notes:
     * - For guests: local update + localStorage.
     * - For logged-in users: we use the existing API:
     *    - If newQty > existingQty: call POST with delta (server increments).
     *    - If newQty === 0: call DELETE to remove.
     *    - If newQty < existingQty: call DELETE to remove then POST with newQty to set absolute.
     * This avoids adding a new backend endpoint.
     */
    const updateQuantity = useCallback(
        async (ticketId: string, newQuantity: number) => {
            newQuantity = Math.max(0, Math.floor(newQuantity ?? 0));
            if (!session?.user) {
                setCart((prev) => {
                    if (newQuantity <= 0) return prev.filter((i) => i.ticketId !== ticketId);
                    return prev.map((i) => (i.ticketId === ticketId ? { ...i, quantity: newQuantity } : i));
                });
                return;
            }

            // logged-in server flow
            // fetch current cart to determine existing value (prefer local state)
            const existing = cart.find((c) => c.ticketId === ticketId)?.quantity ?? 0;

            try {
                if (newQuantity <= 0) {
                    // remove entirely
                    await fetch(`/api/cart?ticketId=${encodeURIComponent(ticketId)}`, { method: "DELETE" });
                } else if (newQuantity > existing) {
                    // increment by delta
                    const delta = newQuantity - existing;
                    await fetch("/api/cart", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ticketId, quantity: delta }),
                    });
                } else if (newQuantity < existing) {
                    // no direct decrement endpoint: remove and re-add with newQuantity
                    await fetch(`/api/cart?ticketId=${encodeURIComponent(ticketId)}`, { method: "DELETE" });
                    // re-add with newQty
                    await fetch("/api/cart", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ticketId, quantity: newQuantity }),
                    });
                }
            } catch (err) {
                console.error("updateQuantity (server) failed:", err);
            } finally {
                // refresh server cart to get canonical state
                try {
                    const res = await fetch("/api/cart");
                    const data = await res.json();
                    setCart(data.items ?? []);
                } catch (err) {
                    console.error("Failed to refresh cart after update:", err);
                }
            }
        },
        [cart, session]
    );

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCartContext = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCartContext must be used inside CartProvider");
    return ctx;
};
