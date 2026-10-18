"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useToast } from "@/components/toast-provider";
import Spinner from "@/components/spinner";
import { useCartContext } from "@/contexts/CartContext";

import PP from "../assets/images/pp.svg";

type CartItem = {
    ticketName: string;
    ticketPrice: number;
    ticketCurrency: string;
    ticketId: string;
    quantity: number;
    discountCode?: string | null;
    discountedPrice?: number | null;
};

type Props = {
    ticketId?: string;
    quantity?: number;
    useCart?: boolean;
    className?: string;
    children?: React.ReactNode;
    discountCode?: string | null;
};

export default function PayWithPayPalButton({
    ticketId,
    quantity = 1,
    useCart = false,
    className = "",
    children,
    discountCode,
}: Props) {
    const toast = useToast();
    const router = useRouter();
    const { data: session } = useSession();
    const { cart } = useCartContext();
    const [loading, setLoading] = useState(false);

    const cartSummary = useMemo(() => {
        if (cart.length === 0) return null;
        const currency = cart[0]?.ticketCurrency ?? "USD";
        const total = cart.reduce((sum, item) => sum + (item.discountedPrice ?? item.ticketPrice) * item.quantity, 0);
        return { currency, total, items: cart as CartItem[] };
    }, [cart]);

    const buildPayload = () => {
        if (useCart) {
            if (!cartSummary) return null;
            return {
                items: cartSummary.items.map((item) => ({
                    ticketId: item.ticketId,
                    quantity: item.quantity,
                    discountCode: item.discountCode ?? null,
                })),
            };
        }
        if (!ticketId) return null;
        return {
            ticketId,
            quantity: Math.max(1, Math.floor(quantity)),
            discountCode: discountCode ?? null,
        };
    };

    const handleClick = async () => {
        if (!session?.user) {
            toast.push({ title: "Sign in required", message: "Sign in before payment.", level: "info" });
            router.push("/api/auth/signin");
            return;
        }
        if (!session.user.profileComplete) {
            toast.push({ title: "Complete your profile", message: "Finish your profile before payment.", level: "info" });
            router.push("/user");
            return;
        }

        const payload = buildPayload();
        if (!payload) {
            toast.push({ title: "Nothing to pay", message: "No tickets selected.", level: "warning" });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json().catch(() => null) as { approveUrl?: string; orderId?: string; error?: string; message?: string } | null;
            if (!response.ok) {
                throw new Error(data?.error ?? data?.message ?? "Unable to create PayPal order");
            }
            if (!data?.approveUrl || !/^https?:\/\//i.test(data.approveUrl)) {
                throw new Error("PayPal did not return a valid approval link");
            }
            window.location.assign(data.approveUrl);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unable to start PayPal checkout";
            toast.push({ title: "Payment unavailable", message, level: "error" });
            setLoading(false);
        }
    };

    const disabled = loading || (useCart && !cartSummary) || (!useCart && !ticketId);

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full cta cta-solid ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            aria-disabled={disabled}
            type="button"
        >
            {loading ? (
                <>
                    <Spinner />
                    <span>Preparing…</span>
                </>
            ) : (
                children ?? (useCart ? "Checkout with PayPal" : (
                    <>
                        <span>Pay with</span>
                        <Image src={PP} alt="PayPal" width={20} height={20} />
                        <span>PayPal</span>
                    </>
                ))
            )}
        </button>
    );
}
