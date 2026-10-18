"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Main() {
    const params = useSearchParams();
    const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
    const [message, setMessage] = useState("Releasing your unfinished order...");

    useEffect(() => {
        const orderId = params.get("orderId");
        if (!orderId) {
            setStatus("failed");
            setMessage("No order reference was provided. Your cart is still safe.");
            return;
        }
        let active = true;
        fetch("/api/paypal/cancel-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
        })
            .then(async (response) => {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                if (!response.ok) throw new Error(payload?.error ?? "Unable to cancel order");
                if (active) {
                    setStatus("success");
                    setMessage("No payment was taken. Your selections are still in your cart when you are ready.");
                }
            })
            .catch((reason: unknown) => {
                if (active) {
                    setStatus("failed");
                    setMessage(reason instanceof Error ? reason.message : "Unable to update order");
                }
            });
        return () => {
            active = false;
        };
    }, [params]);

    return (
        <main className="grid min-h-dvh place-items-center bg-[#09070d] px-5 py-28 text-white">
            <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[.04] p-7 shadow-2xl shadow-black/40 sm:p-10">
                <div className={`grid h-16 w-16 place-items-center rounded-full border text-2xl ${status === "success" ? "border-[#f3d78a]/40 bg-[#f3d78a]/10 text-[#f3d78a]" : "border-[#f08b9a]/40 bg-[#f08b9a]/10 text-[#f08b9a]"}`}>{status === "processing" ? "..." : status === "success" ? "↺" : "!"}</div>
                <p className="eyebrow mt-8 text-[#f3d78a]">{status === "processing" ? "One moment" : "Checkout paused"}</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em]">No rush. The night stays on.</h1>
                <p className="mt-4 leading-7 text-white/60">{message}</p>
                <div className="mt-8 flex flex-wrap gap-3"><Link href="/tickets" className="cta cta-solid px-5 py-3 text-sm uppercase tracking-[.12em]">Return to tickets</Link><Link href="/user" className="cta cta-outline px-5 py-3 text-sm uppercase tracking-[.12em]">View orders</Link></div>
            </section>
        </main>
    );
}
