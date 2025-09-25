// app/account/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/getServerAuth";
import AccountTabs from "./account-tabs";

export default async function AccountPage() {
    const session = await getServerAuth();
    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    // render client component that will fetch data
    return (
        <main className="min-h-dvh px-6 pt-36 pb-12 bg-black text-white">
            <h1 className="text-3xl text-center mb-8">My Account</h1>
            <AccountTabs />
        </main>
    );
}
