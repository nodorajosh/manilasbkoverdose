// app/admin/page.tsx
import { redirect } from "next/navigation";
import React from "react";
import { getServerAuth } from "@/lib/getServerAuth";
import AdminTabs from "./admin-tabs";

export default async function AdminPage() {
    const session = await getServerAuth();
    if (!session?.user || (session.user as any).role !== "admin") { // eslint-disable-line @typescript-eslint/no-explicit-any
        redirect("/auth/signin"); // or a 403 page
    }

    return (
        <main className="relative min-h-dvh w-full flex flex-col items-center px-6 pt-36 pb-12 bg-black text-white">
            <div className="w-full max-w-6xl">
                <h1 className="text-3xl text-center mb-8">Admin Dashboard</h1>
            </div>
            {/* AdminTabs is a client component that renders the tabbed UI */}
            <AdminTabs />
        </main>
    );
}
