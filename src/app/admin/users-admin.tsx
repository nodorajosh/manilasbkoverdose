// components/admin/UsersAdmin.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast-provider";
import Image from "next/image";

export type UserListItem = {
    _id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: "user" | "admin" | "vendor";
    profileComplete?: boolean;
    createdAt?: string | null;
};

export default function UsersAdmin() {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState<string>("");

    const toast = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/users");
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || "Failed to load users");
            setUsers(payload.users ?? []);
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("fetchUsers error:", err);
            setError(err?.message ?? String(err));
            toast.push({ title: "Error", message: "Failed to load users", level: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = users.filter((u) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Users</h3>
                    <div className="text-sm text-gray-400">({users.length})</div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        placeholder="Search by name, email, role"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border px-2 py-1 rounded"
                    />
                    <button onClick={fetchUsers} className="px-3 py-1 bg-blue-600 text-white rounded">Refresh</button>
                </div>
            </div>

            {loading ? (
                <div>Loading users…</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="text-sm text-gray-400">No users found.</div>
            ) : (
                <div className="grid gap-2">
                    {filtered.map((u) => (
                        <div key={u._id} className="p-3 border rounded flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden grid place-items-center text-sm">
                                    {u.image ? <Image src={u.image} alt={u.name ?? u.email} width={500} height={500} className="w-full h-full object-cover" /> : (u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase())}
                                </div>
                                <div>
                                    <div className="font-semibold">{u.name ?? u.email}</div>
                                    <div className="text-sm text-gray-500">{u.email}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-500">{u.role}</div>
                                <Link href={`/user/${u.email}`}>
                                    <button className="px-3 py-1 bg-white text-black rounded">Open</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
