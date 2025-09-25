// components/user/OrdersList.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { useToast } from "@/components/toast-provider";
import ConfirmModal from "@/components/confirm-modal";
import Spinner from "@/components/spinner";

type OrderItem = { name: string; quantity: number; price?: number };
type Order = {
    _id: string;
    status: string;
    totalAmount: number;
    currency: string;
    items: OrderItem[];
    createdAt: string;
};

export default function OrdersList() {
    const toast = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // confirmation modal state
    const [confirm, setConfirm] = useState<{ open: boolean; order?: Order | null; action?: string | null }>({
        open: false,
        order: null,
        action: null,
    });

    // id of order currently being acted on
    const [actionPending, setActionPending] = useState<string | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user/orders");
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to fetch orders");
            }
            const data = await res.json();
            setOrders(data.orders ?? []);
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCancelConfirm = (order: Order) => {
        setConfirm({ open: true, order, action: "cancelled" });
    };

    const closeConfirm = () => setConfirm({ open: false, order: null, action: null });

    // perform status update (for users, cancel their own order)
    const performUpdate = async (orderId: string, status: string) => {
        setActionPending(orderId);
        try {
            const res = await fetch("/api/user/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = payload?.error || payload?.message || "Failed to update order";
                throw new Error(msg);
            }

            // update local list
            setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));

            toast.push({ title: "Updated", message: `Order ${orderId} set to "${status}"`, level: "success" });
        } catch (err: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("performUpdate error:", err);
            toast.push({ title: "Error", message: String(err?.message ?? err), level: "error" });
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
        <>
            {loading && (
                <span className="flex items-center gap-3">
                    <Spinner />
                    <p className="ml-2 text-gray-400">Loading orders...</p>
                </span>
            )}
            {!loading && orders.length === 0 && <div className="text-sm text-gray-400">No orders yet.</div>}
            {!loading && orders.length > 0 && (
                <>
                    <div className="space-y-4">
                        {orders.map((o) => (
                            <div key={o._id}>
                                <Link
                                    href={`/orders/${o._id}`}
                                >
                                    <div className="p-3 border rounded bg-white/5">
                                        <div className="flex justify-between">
                                            <div>
                                                <div className="font-semibold">Order {o._id}</div>
                                                <div className="text-sm text-gray-400">{new Date(o.createdAt).toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm">Status: <strong>{o.status}</strong></div>
                                                <div className="text-sm">${(o.totalAmount).toFixed(2)} {o.currency}</div>
                                            </div>
                                        </div>

                                        <div className="mt-2 text-sm">
                                            {o.items.map((it, idx) => (
                                                <div key={idx} className="flex justify-between border-b py-1">
                                                    <div>{it.name}</div>
                                                    <div>x{it.quantity}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            {o.status === "pending" ? (
                                                <button
                                                    onClick={() => openCancelConfirm(o)}
                                                    className="px-3 py-1 bg-red-600 text-white rounded"
                                                    disabled={actionPending !== null}
                                                    aria-disabled={actionPending !== null}
                                                    title="Cancel this order"
                                                >
                                                    {actionPending === o._id ? "Cancelling..." : "Cancel order"}
                                                </button>
                                            ) : (
                                                <button className="px-3 py-1 bg-gray-700 text-white rounded opacity-60 cursor-not-allowed" disabled>
                                                    Cancel not available
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>

                    <ConfirmModal
                        open={confirm.open}
                        title={confirm.action === "cancelled" ? "Cancel this order?" : "Confirm"}
                        description={
                            confirm.order
                                ? `Order ${confirm.order._id} — are you sure you want to ${confirm.action === "cancelled" ? "cancel" : "change this order"}?`
                                : undefined
                        }
                        confirmLabel={confirm.action === "cancelled" ? "Yes, cancel order" : "Confirm"}
                        cancelLabel="Keep order"
                        onConfirm={handleConfirm}
                        onCancel={closeConfirm}
                    />
                </>
            )}
        </>
    );
}
