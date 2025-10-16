// components/paypal/PayWithPayPalButton.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useToast } from "@/components/toast-provider";
import Spinner from "@/components/spinner";
import { useCartContext } from "@/contexts/CartContext";

import PP from "../assets/images/pp.svg"; // adjust path if needed

export default function PayWithPayPalButton({
    ticketId,
    quantity = 1,
    useCart = false,
    className = "",
    children,
}: {
    ticketId?: string;
    quantity?: number;
    useCart?: boolean;
    className?: string;
    children?: React.ReactNode;
}) {
    const toast = useToast();
    const router = useRouter();
    const { data: session } = useSession();
    const { cart, clearCart, updateQuantity } = useCartContext();

    const [loading, setLoading] = useState(false);

    type CartItem = {
        ticketName: string;
        ticketPrice: number;
        ticketCurrency: string;
        ticketId: string;
        quantity: number;
    };

    const cartSummary = useMemo(() => {
        if (!cart || cart.length === 0) return null;
        const currency = cart[0].ticketCurrency ?? "USD";
        const total = cart.reduce((acc, it) => acc + (it.ticketPrice ?? 0) * (it.quantity ?? 1), 0);
        return { currency, total, items: cart as CartItem[] };
    }, [cart]);

    // const openSafe = (url?: string | null) => {
    //     if (!url) {
    //         toast.push({ title: "No link", message: "No approval link available", level: "error" });
    //         return;
    //     }
    //     // open about:blank to avoid popup blocker, then navigate
    //     const win = window.open("about:blank", "_blank");
    //     if (!win) {
    //         toast.push({
    //             title: "Popup blocked",
    //             message: "Popup blocked — please copy the link from the dialog.",
    //             level: "warning",
    //         });
    //         return;
    //     }
    //     try {
    //         // best-effort sever opener relationship
    //         // @ts-ignore
    //         win.opener = null;
    //     } catch { }
    //     win.location.href = url;
    // };

    const buildPayload = () => {
        if (useCart) {
            if (!cartSummary || cartSummary.items.length === 0) return null;
            const items = cartSummary.items.map((it) => ({ ticketId: it.ticketId, quantity: it.quantity }));
            return { items };
        }

        if (!ticketId) return null;
        return { ticketId, quantity };
    };

    // Try to extract an available quantity integer from a human message.
    // Returns integer or null.
    const extractAvailableQuantity = (text?: string): number | null => {
        if (!text) return null;
        // common patterns: "Only 3 left", "Only 3 ticket(s) left", "3 left"
        const re = /Only\s+(\d+)\s+left|Only\s+(\d+)|(\d+)\s+left|available\s*[:=]\s*(\d+)/i;
        const m = text.match(re);
        if (m) {
            for (let i = 1; i < m.length; i++) {
                const val = m[i];
                if (val) {
                    const n = parseInt(val, 10);
                    if (!Number.isNaN(n)) return n;
                }
            }
        }
        // fallback: any integer in string
        const anyInt = text.match(/(\d+)/);
        if (anyInt) {
            const n = parseInt(anyInt[1], 10);
            if (!Number.isNaN(n)) return n;
        }
        return null;
    };

    const handleClick = async () => {
        if (!session?.user?.email) {
            toast.push({ title: "Sign in required", message: "Please sign in to proceed to payment.", level: "info" });
            router.push("/api/auth/signin");
            return;
        }

        const payload = buildPayload();
        if (!payload) {
            toast.push({ title: "Nothing to pay", message: "No items selected.", level: "warning" });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                // Attempt to gracefully handle insufficient-stock style responses
                // Server ideally returns structured error, but we defensively parse human messages.
                const errorText = typeof json === "object" ? (json.error ?? json.message ?? JSON.stringify(json)) : String(json);
                const available = extractAvailableQuantity(String(errorText));
                if (available !== null && useCart) {
                    // best-effort: reduce any cart items whose qty > available to `available`
                    // This is a naive strategy because server message may refer to just one ticket.
                    // But it's a useful fallback to avoid user confusion.
                    try {
                        for (const it of cart) {
                            if (it.quantity > available) {
                                await updateQuantity(it.ticketId, available);
                            }
                        }
                        toast.push({
                            title: "Cart adjusted",
                            message: `Some items exceeded availability and were reduced to ${available}. Please review your cart.`,
                            level: "warning",
                        });
                        // redirect user to tickets page to review items (you can change path)
                        router.push("/tickets");
                        return;
                    } catch (uErr) {
                        console.error("Failed to auto-adjust cart:", uErr);
                        // fallthrough to showing error toast
                    }
                }

                // generic fallback error toast
                toast.push({ title: "Create order failed", message: String(errorText || "Unable to create order"), level: "error" });
                setLoading(false);
                return;
            }

            // expected response: { orderId, paypalOrderId, approveUrl }
            const approveUrl: string | undefined = (json.approveUrl as string) ?? (json.approveUrl as string);
            const orderId: string | undefined = (json.orderId as string) ?? (json.id as string);

            if (!approveUrl) {
                toast.push({ title: "No approval link", message: "PayPal did not return an approval link.", level: "error" });
                setLoading(false);
                return;
            }

            // If this was a cart checkout, clear the cart (server/local) now.
            if (useCart) {
                try {
                    await clearCart(); // context will sync state
                } catch (err) {
                    console.error("Failed to clear cart after order creation:", err);
                    // not fatal — continue
                }
            }

            // Open PayPal in popup-safe way
            // openSafe(approveUrl);

            router.push(approveUrl);

            toast.push({
                title: "Order created",
                message: orderId ? `Order ${orderId} created. Complete payment on PayPal.` : "Order created. Complete payment on PayPal.",
                level: "info",
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("PayPal create-order error:", err);
            toast.push({ title: "Error", message: msg, level: "error" });
        } finally {
            setLoading(false);
        }
    };

    const disabled = loading || (useCart && (!cartSummary || cartSummary.items.length === 0)) || (!useCart && !ticketId);

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded cta cta-solid ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            aria-disabled={disabled}
            type="button"
        >
            {loading ? (
                <>
                    <Spinner />
                    <span>Preparing…</span>
                </>
            ) : (
                <>
                    {children ?? (useCart ? "Checkout" : (
                        <>
                            Buy with
                            <Image src={PP} alt="PayPal" width={20} height={20} />
                            PayPal
                        </>
                    ))}
                </>
            )}
        </button>
    );
}
