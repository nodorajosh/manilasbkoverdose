// app/admin/page.tsx — auth enforced by middleware
import React from "react";
import AdminTabs from "./admin-tabs";
import DashboardStats from "./dashboard-stats";

export default function AdminPage() {
    return (
        <main className="relative min-h-dvh w-full flex flex-col items-center px-6 pt-36 pb-12 bg-black text-white">
            <div className="w-full max-w-6xl">
                <h1 className="text-3xl text-center mb-8">Admin Dashboard</h1>
                <div className="pb-8">
                    <DashboardStats />
                </div>
                <AdminTabs />
            </div>
        </main>
    );
}
