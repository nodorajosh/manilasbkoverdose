// app/user/page.tsx — auth enforced by middleware
import React from "react";
import AccountTabs from "./account-tabs";

export default function AccountPage() {
    return (
        <main className="min-h-dvh px-6 pt-36 pb-12 bg-black text-white">
            <h1 className="text-3xl text-center mb-8">My Account</h1>
            <AccountTabs />
        </main>
    );
}
