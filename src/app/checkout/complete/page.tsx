// app/checkout/complete/page.tsx

import { Suspense } from "react";

import Main from "./main";

export default function CheckoutCompletePage() {

    return (
        <Suspense fallback={<div className="min-h-dvh grid bg-black text-white place-items-center p-6">Loading…</div>}>
            <Main />
        </Suspense>
    );
}
