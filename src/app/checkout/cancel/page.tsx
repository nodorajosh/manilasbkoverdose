// app/checkout/complete/page.tsx
"use client";

import { Suspense } from "react";

import Main from "./main";

export default function CheckoutCancelPage() {

    return (
        <Suspense fallback={<div className="min-h-dvh grid bg-black text-white place-items-center p-6">Loading…</div>}>
            <Main />
        </Suspense>
    );
}
