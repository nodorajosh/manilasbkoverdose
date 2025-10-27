// components/paypal/PayWithPayPalButton.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useToast } from "@/components/toast-provider";
import Spinner from "@/components/spinner";
import { useCartContext } from "@/contexts/CartContext";

import PP from "../assets/images/pp.svg";

export default function PayWithPayPalButton({
    ticketId,
    quantity = 1,
    useCart = false,
    className = "",
    children,
    discountCode,
}: {
    ticketId?: string;
    quantity?: number;
    useCart?: boolean;
    className?: string;
    children?: React.ReactNode;
    discountCode?: string | null; // optional for single-ticket flow
}) {
    const toast = useToast();
    const router = useRouter();
    const { data: session } = useSession();
    const { cart, clearCart } = useCartContext();
    const [loading, setLoading] = useState(false);

    type CartItem = {
        ticketName: string;
        ticketPrice: number;
        ticketCurrency: string;
        ticketId: string;
        quantity: number;
        discountCode?: string | null;
        discountedPrice?: number | null;
    };

    const cartSummary = useMemo(() => {
        if (!cart || cart.length === 0) return null;
        const currency = cart[0].ticketCurrency ?? "USD";
        const total = cart.reduce((acc, it) => acc + (it.discountedPrice ?? it.ticketPrice ?? 0) * (it.quantity ?? 1), 0);
        return { currency, total, items: cart as CartItem[] };
    }, [cart]);

    const buildPayload = () => {
        if (useCart) {
            if (!cartSummary || cartSummary.items.length === 0) return null;
            const items = cartSummary.items.map((it) => ({
                ticketId: it.ticketId,
                quantity: it.quantity,
                discountCode: it.discountCode ?? null,
            }));
            return { items };
        }

        if (!ticketId) return null;
        return {
            ticketId,
            quantity,
            discountCode: discountCode ?? null,
        };
    };

    const handleClick = async () => {
        if (!session?.user?.email) {
            toast.push({ title: "Sign in required", message: "Please sign in to proceed to payment.", level: "info" });
            router.push("/api/auth/signin");
            return;
        }

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
                // if server indicated stock mismatch, server returns message like "Only X left for Y"
                const message = json?.error ?? json?.message ?? JSON.stringify(json);
                // If cart checkout, attempt to refresh cart & redirect to tickets if quantity mismatch
                if (useCart && typeof message === "string") {
                    // heuristic if server included "Only N left" — server will enforce new quantity on create-order
                    const m = String(message).match(/Only\s+(\d+)\s+left/);
                    if (m) {
                        try {
                            // refresh cart (server should be authoritative) by fetching /api/cart
                            const cartRes = await fetch("/api/cart");
                            if (cartRes.ok) {
                                await cartRes.json();
                                // update local cart context (clearCart + re-set not available from here if no setter)
                                // For simplicity: inform user and redirect to tickets page to re-add
                                toast.push({ title: "Cart updated", message: "Some items changed availability — please review your cart.", level: "warning" });
                                router.push("/tickets");
                                return;
                            }
                        } catch (e) {
                            // fallback to showing error
                            console.log(e)
                        }
                    }
                }
                toast.push({ title: "Create order failed", message: String(message ?? "Unable to create order"), level: "error" });
                setLoading(false);
                return;
            }

            const approveUrl: string | undefined = json.approveUrl ?? json.approveUrl;
            const orderId: string | undefined = json.orderId ?? json.id;

            if (!approveUrl) {
                toast.push({ title: "No approval link", message: "PayPal did not return an approval link.", level: "error" });
                setLoading(false);
                return;
            }

            // If cart checkout, clear cart now
            if (useCart) {
                try {
                    await clearCart();
                } catch (err) {
                    console.warn("clearCart failed after order creation:", err);
                }
            }

            // navigate to approveUrl (opening in same tab avoids popup blocking).
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
