"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/confirm-modal";
import { useToast } from "@/components/toast-provider";
import Spinner from "@/components/spinner";
import { trpc } from "@/trpc/react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { LoadMoreSentinel } from "@/components/admin/load-more-sentinel";

type OrderItem = {
    name: string;
    quantity: number;
};

type Order = {
    _id: string;
    userId?: string;
    totalAmount: number;
    currency: string;
    status: string;
    items: OrderItem[];
    createdAt: string;
};

export default function OrdersAdmin() {
    const toast = useToast();
    const utils = trpc.useUtils();

    const [actionPending, setActionPending] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{
        open: boolean;
        order?: Order | null;
        action?: string | null;
    }>({ open: false, order: null, action: null });

    const listQuery = trpc.admin.orders.list.useInfiniteQuery(
        { limit: 20 },
        { getNextPageParam: (last) => last.nextCursor }
    );

    const orders = useMemo(() => {
        const raw = listQuery.data?.pages.flatMap((p) => p.items) ?? [];
        return raw.map((o) => ({
            _id: String(o._id),
            userId: o.userId as string | undefined,
            totalAmount: o.totalAmount as number,
            currency: o.currency as string,
            status: o.status as string,
            items: (o.items ?? []) as OrderItem[],
            createdAt:
                o.createdAt instanceof Date
                    ? o.createdAt.toISOString()
                    : String(o.createdAt ?? ""),
        }));
    }, [listQuery.data]);

    const sentinelRef = useInfiniteScroll({
        hasNextPage: listQuery.hasNextPage,
        isFetchingNextPage: listQuery.isFetchingNextPage,
        fetchNextPage: () => listQuery.fetchNextPage(),
    });

    const openConfirm = (order: Order, action: string) => {
        setConfirm({ open: true, order, action });
    };

    const closeConfirm = () => setConfirm({ open: false, order: null, action: null });

    const performUpdate = async (orderId: string, status: string) => {
        setActionPending(orderId);
        try {
            const res = await fetch("/api/admin/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.error || data?.message || "Failed to update order";
                throw new Error(msg);
            }

            await utils.admin.orders.list.invalidate();
            toast.push({ title: "Updated", message: `Order ${orderId} set to "${status}"`, level: "success" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.push({ title: "Error", message, level: "error" });
        } finally {
            setActionPending(null);
            closeConfirm();
        }
    };

    const handleConfirm = async () => {
        if (!confirm.order || !confirm.action) return closeConfirm();
        await performUpdate(confirm.order._id, confirm.action);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Orders</h3>
                <div className="flex gap-2">
                    <button onClick={() => listQuery.refetch()} className="px-3 py-1 bg-blue-600 text-white rounded">Refresh</button>
                </div>
            </div>

            {listQuery.isLoading ? (
                <span className="flex items-center gap-3">
                    <Spinner />
                    <p className="ml-2 text-gray-400">Loading orders...</p>
                </span>
            ) : listQuery.isError ? (
                <div className="text-sm text-red-400">Failed to load orders.</div>
            ) : orders.length === 0 ? (
                <div className="text-sm text-gray-400">No orders found.</div>
            ) : (
                <div className="space-y-4">
                    {orders.map((o) => (
                        <div key={o._id} className="p-3 border rounded">
                            <div>
                                <Link href={`/orders/${o._id}`} className="flex flex-col md:flex-row md:justify-between">
                                    <div>
                                        <div className="font-semibold">Order {o._id}</div>
                                        <div className="text-sm text-gray-300">{o.userId}</div>
                                        <div className="text-sm">
                                            {(typeof o.totalAmount === "number" ? o.totalAmount.toFixed(2) : String(o.totalAmount))}{" "}
                                            {o.currency}
                                        </div>
                                    </div>
                                    <div className="mt-3 md:mt-0 text-sm text-right">
                                        <div>
                                            Status: <strong>{o.status}</strong>
                                        </div>
                                        <div>{new Date(o.createdAt).toLocaleString()}</div>
                                    </div>
                                </Link>
                            </div>

                            <div className="mt-3">
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => openConfirm(o, "paid")}
                                        className="px-2 py-1 bg-blue-600 text-white rounded"
                                        disabled={actionPending !== null}
                                    >
                                        {actionPending === o._id ? "Processing..." : "Mark paid"}
                                    </button>
                                    <button
                                        onClick={() => openConfirm(o, "fulfilled")}
                                        className="px-2 py-1 bg-green-600 text-white rounded"
                                        disabled={actionPending !== null}
                                    >
                                        {actionPending === o._id ? "Processing..." : "Fulfill"}
                                    </button>
                                    <button
                                        onClick={() => openConfirm(o, "cancelled")}
                                        className="px-2 py-1 bg-gray-300 rounded"
                                        disabled={actionPending !== null}
                                    >
                                        {actionPending === o._id ? "Processing..." : "Cancel"}
                                    </button>
                                </div>

                                <div className="mt-3 text-sm">
                                    {o.items.map((it, idx) => (
                                        <div key={idx} className="flex justify-between border-b py-1">
                                            <div>{it.name}</div>
                                            <div>x{it.quantity}</div>
                                        </div>
                                    ))}
                                </div>
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

            <ConfirmModal
                open={confirm.open}
                title={
                    confirm.action === "paid"
                        ? "Mark order as paid?"
                        : confirm.action === "fulfilled"
                          ? "Mark order fulfilled?"
                          : "Change order status?"
                }
                description={
                    confirm.order
                        ? `Order ${confirm.order._id} — change status to "${confirm.action}". Are you sure you want to proceed?`
                        : undefined
                }
                confirmLabel={
                    confirm.action === "paid" ? "Mark paid" : confirm.action === "fulfilled" ? "Fulfill" : "Confirm"
                }
                cancelLabel="Cancel"
                onConfirm={handleConfirm}
                onCancel={closeConfirm}
            />
        </div>
    );
}
