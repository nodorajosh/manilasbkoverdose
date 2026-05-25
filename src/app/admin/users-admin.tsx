"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { trpc } from "@/trpc/react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { LoadMoreSentinel } from "@/components/admin/load-more-sentinel";
import Spinner from "@/components/spinner";

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
    const [query, setQuery] = useState<string>("");

    const listQuery = trpc.admin.users.list.useInfiniteQuery(
        { limit: 20 },
        { getNextPageParam: (last) => last.nextCursor }
    );

    const users = useMemo(
        () => (listQuery.data?.pages.flatMap((p) => p.items) ?? []) as UserListItem[],
        [listQuery.data]
    );

    const filtered = users.filter((u) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
            (u.name ?? "").toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        );
    });

    const sentinelRef = useInfiniteScroll({
        hasNextPage: listQuery.hasNextPage,
        isFetchingNextPage: listQuery.isFetchingNextPage,
        fetchNextPage: () => listQuery.fetchNextPage(),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Users</h3>
                    <div className="text-sm text-gray-400">({users.length}{listQuery.hasNextPage ? "+" : ""})</div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        placeholder="Search by name, email, role"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="border px-2 py-1 rounded"
                    />
                    <button onClick={() => listQuery.refetch()} className="px-3 py-1 bg-blue-600 text-white rounded">Refresh</button>
                </div>
            </div>

            {listQuery.isLoading ? (
                <span className="flex items-center gap-3">
                    <Spinner />
                    <p className="text-gray-400">Loading users…</p>
                </span>
            ) : listQuery.isError ? (
                <div className="text-red-500">Failed to load users.</div>
            ) : filtered.length === 0 ? (
                <div className="text-sm text-gray-400">No users found.</div>
            ) : (
                <div className="grid gap-2">
                    {filtered.map((u) => (
                        <div key={u._id} className="p-3 border rounded flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden grid place-items-center text-sm">
                                    {u.image ? (
                                        <Image
                                            src={u.image}
                                            alt={u.name ?? u.email}
                                            width={500}
                                            height={500}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : u.name ? (
                                        u.name.charAt(0).toUpperCase()
                                    ) : (
                                        u.email.charAt(0).toUpperCase()
                                    )}
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
                    <LoadMoreSentinel
                        sentinelRef={sentinelRef}
                        isFetchingNextPage={listQuery.isFetchingNextPage}
                        hasNextPage={listQuery.hasNextPage}
                    />
                </div>
            )}
        </div>
    );
}
