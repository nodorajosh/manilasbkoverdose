"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useCartContext } from "@/contexts/CartContext";

export default function Main() {
    const params = useSearchParams();
    const { clearCart } = useCartContext();
    const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
    const [message, setMessage] = useState("Confirming your payment...");
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const token = params.get("token");
        const internalOrderId = params.get("orderId");
        if (!token || !internalOrderId) {
            setStatus("failed");
            setMessage("Payment details are incomplete. Your order was not changed.");
            return;
        }
        setOrderId(internalOrderId);
        let active = true;
        fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: internalOrderId, paypalOrderId: token }),
        })
            .then(async (response) => {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                if (!response.ok) throw new Error(payload?.error ?? "Payment capture failed");
                await clearCart();
                if (active) {
                    setStatus("success");
                    setMessage("Payment confirmed. Your place is secured.");
                }
            })
            .catch((reason: unknown) => {
                if (active) {
                    setStatus("failed");
                    setMessage(reason instanceof Error ? reason.message : "Payment capture failed");
                }
            });
        return () => {
            active = false;
        };
    }, [clearCart, params]);

    return (
        <main className="grid min-h-dvh place-items-center bg-[#09070d] px-5 py-28 text-white">
            <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[.04] p-7 shadow-2xl shadow-black/40 sm:p-10">
                <div className={`grid h-16 w-16 place-items-center rounded-full border text-2xl ${status === "success" ? "border-[#bff4df]/40 bg-[#bff4df]/10 text-[#bff4df]" : status === "failed" ? "border-[#f08b9a]/40 bg-[#f08b9a]/10 text-[#f08b9a]" : "border-[#f3d78a]/40 bg-[#f3d78a]/10 text-[#f3d78a]"}`}>{status === "success" ? "✓" : status === "failed" ? "!" : "..."}</div>
                <p className="eyebrow mt-8 text-[#f3d78a]">{status === "processing" ? "Final step" : status === "success" ? "You are in" : "Payment update"}</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em]">{status === "success" ? "The room is yours." : status === "failed" ? "We need another pass." : "Confirming your place."}</h1>
                <p className="mt-4 leading-7 text-white/60">{message}</p>
                {orderId && <p className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">Order reference <strong className="ml-2 text-white">{orderId}</strong></p>}
                <div className="mt-8 flex flex-wrap gap-3"><Link href="/user" className="cta cta-solid px-5 py-3 text-sm uppercase tracking-[.12em]">View orders</Link><Link href="/tickets" className="cta cta-outline px-5 py-3 text-sm uppercase tracking-[.12em]">Browse more</Link></div>
            </section>
        </main>
    );
}
