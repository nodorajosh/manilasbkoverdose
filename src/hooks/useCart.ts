"use client";

import { useEffect, useState } from "react";

export function useCart(session: any) {
    const [cart, setCart] = useState<any[]>([]);

    // Load cart on mount
    useEffect(() => {
        if (session) {
            // Logged-in user → fetch from API
            fetch("/api/cart")
                .then((res) => res.json())
                .then((data) => setCart(data.items || []));
        } else {
            // Guest user → localStorage
            const localCart = localStorage.getItem("cart");
            setCart(localCart ? JSON.parse(localCart) : []);
        }
    }, [session]);

    // Save localStorage cart when not logged in
    useEffect(() => {
        if (!session) {
            localStorage.setItem("cart", JSON.stringify(cart));
        }
    }, [cart, session]);

    // Add item
    const addToCart = async (ticketId: string, quantity = 1) => {
        if (session) {
            await fetch("/api/cart", {
                method: "POST",
                body: JSON.stringify({ ticketId, quantity }),
                headers: { "Content-Type": "application/json" },
            });
            const res = await fetch("/api/cart");
            const data = await res.json();
            setCart(data.items || []);
        } else {
            const existing = cart.find((i) => i.ticketId === ticketId);
            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({ ticketId, quantity });
            }
            setCart([...cart]);
        }
    };

    // Remove item
    const removeFromCart = async (ticketId: string) => {
        if (session) {
            await fetch("/api/cart", {
                method: "DELETE",
                body: JSON.stringify({ ticketId }),
                headers: { "Content-Type": "application/json" },
            });
            const res = await fetch("/api/cart");
            const data = await res.json();
            setCart(data.items || []);
        } else {
            setCart(cart.filter((i) => i.ticketId !== ticketId));
        }
    };

    return { cart, addToCart, removeFromCart };
}
