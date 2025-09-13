"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type CartItem = {
    ticketId: string;
    name: string;
    price: number;
    quantity: number;
};

type CartContextType = {
    cart: CartItem[];
    addToCart: (ticket: CartItem) => void;
    removeFromCart: (ticketId: string) => void;
    clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [cart, setCart] = useState<CartItem[]>([]);

    // --- Fetch cart on login ---
    useEffect(() => {
        if (session?.user) {
            fetch("/api/cart")
                .then((res) => res.json())
                .then((data) => {
                    const items = data.items.map((item: any) => ({
                        ticketId: item.ticketId._id,
                        name: item.ticketId.name,
                        price: item.ticketId.price,
                        quantity: item.quantity,
                    }));
                    setCart(items);
                });
        } else {
            // Load from localStorage if not logged in
            const localCart = localStorage.getItem("cart");
            if (localCart) {
                setCart(JSON.parse(localCart));
            }
        }
    }, [session]);

    // --- Sync cart to localStorage if not logged in ---
    useEffect(() => {
        if (!session?.user) {
            localStorage.setItem("cart", JSON.stringify(cart));
        }
    }, [cart, session]);

    const addToCart = async (ticket: CartItem) => {
        if (session?.user) {
            // persistent cart
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId: ticket.ticketId, quantity: 1 }),
            });
            if (res.ok) {
                const data = await res.json();
                const items = data.items.map((item: any) => ({
                    ticketId: item.ticketId._id,
                    name: item.ticketId.name,
                    price: item.ticketId.price,
                    quantity: item.quantity,
                }));
                setCart(items);
            }
        } else {
            // guest cart
            setCart((prev) => {
                const existing = prev.find((i) => i.ticketId === ticket.ticketId);
                if (existing) {
                    return prev.map((i) =>
                        i.ticketId === ticket.ticketId
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    );
                }
                return [...prev, { ...ticket, quantity: 1 }];
            });
        }
    };

    const removeFromCart = async (ticketId: string) => {
        if (session?.user) {
            const res = await fetch("/api/cart", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId }),
            });
            if (res.ok) {
                const data = await res.json();
                const items = data.items.map((item: any) => ({
                    ticketId: item.ticketId._id,
                    name: item.ticketId.name,
                    price: item.ticketId.price,
                    quantity: item.quantity,
                }));
                setCart(items);
            }
        } else {
            setCart((prev) => prev.filter((i) => i.ticketId !== ticketId));
        }
    };

    const clearCart = () => {
        setCart([]);
        if (!session?.user) {
            localStorage.removeItem("cart");
        }
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error("useCart must be used within CartProvider");
    }
    return ctx;
}
