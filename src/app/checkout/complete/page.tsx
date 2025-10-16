// app/checkout/complete/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function CheckoutCompletePage() {
    const params = useSearchParams();
    const router = useRouter();

    const [status, setStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const token = params.get("token"); // PayPal order id
        const orderId = params.get("orderId"); // our internal order id we passed in return_url
        if (!token || !orderId) {
            setMessage("Missing parameters.");
            setStatus("failed");
            return;
        }

        (async () => {
            setStatus("processing");
            try {
                const res = await fetch("/api/paypal/capture-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId, paypalOrderId: token }),
                });
                const payload = await res.json();
                if (!res.ok) throw new Error(payload?.error || "Capture failed");
                setStatus("success");
                setMessage("Payment captured. Thank you!");
            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error("capture error", err);
                setStatus("failed");
                setMessage(err?.message ?? "Capture failed");
            }
        })();
    }, [params]);

    return (
        <div className="min-h-dvh grid bg-black text-white place-items-center p-6">
            <div className="max-w-xl w-full bg-white/5 border-1 border-white p-6 rounded">
                {status === "processing" && <div>Processing payment…</div>}
                {status === "success" && <div className="text-green-600">{message}</div>}
                {status === "failed" && <div className="text-red-600">{message}</div>}
                <div className="mt-4">
                    <button onClick={() => router.push("/user")} className="px-4 py-2 bg-blue-600 text-white rounded">View Orders</button>
                </div>
            </div>
        </div>
    );
}
