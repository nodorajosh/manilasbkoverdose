// app/orders/[id]/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/getServerAuth";
import OrderDetails from "./order-details";

type PageParams = Promise<{ id: string }>; // Example for a single 'id' parameter

interface Props {
    params: PageParams; // Using the Promise type for params
}

export default async function OrderPage({ params }: Props) {
    const { id } = await params

    const session = await getServerAuth();
    if (!session?.user) {
        // require login for any order page
        redirect("/api/auth/signin");
    }

    // pass down minimal session info to client component
    const role = (session.user as any).role ?? "user"; //eslint-disable-line @typescript-eslint/no-explicit-any
    const email = session.user?.email ?? "";

    // render client component which will fetch order using the appropriate API
    return (
        <main className="min-h-dvh p-6 pt-36 bg-black text-white">
            <h1 className="text-3xl mb-6 text-center">Order Details</h1>
            <OrderDetails orderId={id} role={role} currentEmail={email} />
        </main>
    );
}
