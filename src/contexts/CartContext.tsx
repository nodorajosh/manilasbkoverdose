"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type CartItem = {
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
    handleCheckout: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [cart, setCart] = useState<CartItem[]>([]);

    // 🔄 Load cart (Mongo if logged in, localStorage if not)
    useEffect(() => {
        const loadCart = async () => {
            if (session?.user) {
                const res = await fetch("/api/cart");
                const data = await res.json();
                setCart(data.items ?? []);
            } else {
                const localCart = localStorage.getItem("cart");
                setCart(localCart ? JSON.parse(localCart) : []);
            }
        };
        loadCart();
    }, [session]);

    // 🔄 Keep localStorage in sync when logged out
    useEffect(() => {
        if (!session?.user) {
            localStorage.setItem("cart", JSON.stringify(cart));
        }
    }, [cart, session]);

    // 🛒 Actions
    const addToCart = useCallback(
        async (ticketName: string, ticketPrice: number, ticketCurrency: string, ticketId: string, quantity = 1) => {
            if (session?.user) {
                await fetch("/api/cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticketName, ticketPrice, ticketCurrency, ticketId, quantity }),
                });
                const res = await fetch("/api/cart");
                const data = await res.json();
                setCart(data.items ?? []);
            } else {
                setCart((prev) => {
                    const existing = prev.find((i) => i.ticketId === ticketId);
                    if (existing) {
                        return prev.map((i) =>
                            i.ticketId === ticketId ? { ...i, quantity: i.quantity + quantity } : i
                        );
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
                await fetch(`/api/cart?ticketId=${ticketId}`, { method: "DELETE" });
                const res = await fetch("/api/cart");
                const data = await res.json();
                setCart(data.items ?? []);
            } else {
                setCart((prev) => prev.filter((i) => i.ticketId !== ticketId));
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

    const handleCheckout = async () => {
        if (!session?.user) {
            alert("You need to log in to checkout.");
            return;
        }

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: cart }),
            });

            if (!res.ok) {
                throw new Error("Checkout failed");
            }

            const { redirectUrl } = await res.json();

            // Redirect to Wise payment page
            window.location.href = redirectUrl;
        } catch (err) {
            console.error("Checkout error:", err);
            alert("Something went wrong during checkout.");
        }
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, handleCheckout }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCartContext = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCartContext must be used inside CartProvider");
    return ctx;
};
